import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Logger } from '../logger';
import profiler from '../profiler';
import { buildRouteHierarchy } from '../router';
import type { ContentRecord, ChildRecord } from '../router/types';
import { resolveLinks, toCanonicalFullPath } from '../link-resolver';
import { enrichSeries } from '../../src/lib/series';
import { generateSitemapXml, generateRobotsTxt, type SitemapRouteEntry } from '../../scripts/sitemap';
import type { SearchEntry } from '../search-index';

import { IndexTemplate } from '../../src/templates/IndexTemplate';
import { ArticleIndexTemplate } from '../../src/templates/ArticleIndexTemplate';
import { ArticleDetailTemplate } from '../../src/templates/ArticleDetailTemplate';
import { PageIndexTemplate } from '../../src/templates/PageIndexTemplate';
import { PageDetailTemplate } from '../../src/templates/PageDetailTemplate';
import { ZettelkastenIndexTemplate } from '../../src/templates/ZettelkastenIndexTemplate';
import { ZettelDetailTemplate } from '../../src/templates/ZettelDetailTemplate';
import { NotFoundTemplate } from '../../src/templates/NotFoundTemplate';

import { sha256, hashFile, computeProjectCodeHash, diffCodeHashes } from './hasher';
import { syncContentCache, contentCacheToRawRecords } from './content-cache';
import type {
    BuildManifest,
    ContentCacheItem,
    RouteCacheItem,
    IncrementalBuildOptions,
    IncrementalBuildResult,
    IncrementalBuildStats
} from './types';

const log = new Logger('incremental:engine');
const CACHE_VERSION = 1;

function documentFromElement(element: React.ReactElement): string {
    return `<!doctype html>\n${renderToStaticMarkup(element)}`;
}

async function* arrayToGenerator<T>(items: T[]): AsyncGenerator<T> {
    for (const item of items) {
        yield item;
    }
}

/**
 * Loads cached manifest from disk if it exists.
 */
export async function loadBuildManifest(cacheFilePath: string): Promise<BuildManifest | null> {
    try {
        const text = await fs.readFile(cacheFilePath, 'utf8');
        try {
            const parsed = JSON.parse(text) as BuildManifest;
            if (parsed.version === CACHE_VERSION) {
                log.info(
                    `Loaded build cache from ${cacheFilePath} (${Object.keys(parsed.routeItems || {}).length} routes, ${Object.keys(parsed.contentItems || {}).length} content items, timestamp: ${parsed.timestamp}).`
                );
                return parsed;
            } else {
                log.warn(
                    `Cache invalidated: Manifest version mismatch at ${cacheFilePath} (found version ${parsed.version}, expected ${CACHE_VERSION}). Performing full rebuild.`
                );
                return null;
            }
        } catch (jsonErr: any) {
            log.warn(
                `Cache corrupted: Failed to parse manifest JSON at ${cacheFilePath} (${jsonErr?.message || jsonErr}). Discarding cache.`
            );
            return null;
        }
    } catch (err: any) {
        if (err?.code === 'ENOENT') {
            log.info(`Cache miss: No existing build cache found at ${cacheFilePath}. Performing full build.`);
        } else {
            log.warn(`Cache read error at ${cacheFilePath} (${err?.message || err}). Performing full rebuild.`);
        }
        return null;
    }
}

/**
 * Persists build manifest to disk.
 */
export async function saveBuildManifest(cacheFilePath: string, manifest: BuildManifest): Promise<void> {
    try {
        const startTime = Date.now();
        await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
        const jsonStr = JSON.stringify(manifest);
        await fs.writeFile(cacheFilePath, jsonStr, 'utf8');
        const duration = Date.now() - startTime;
        log.info(
            `Build manifest saved to ${cacheFilePath} (${(Buffer.byteLength(jsonStr) / 1024).toFixed(1)} KB, ${Object.keys(manifest.routeItems).length} routes) in ${duration}ms.`
        );
    } catch (err: any) {
        log.error(`Failed to save build manifest to disk at ${cacheFilePath}:`, {
            message: err?.message || String(err),
            stack: err?.stack
        });
    }
}

/**
 * Computes a hash representing a route's dependencies for change detection.
 */
function computeRecordDependencyHash(record: ContentRecord, contentHash: string = ''): string {
    const seriesKey = record.series
        ? `${record.series.name}:${record.series.part}:${record.series.total}:${record.series.prev?.route ?? ''}:${record.series.next?.route ?? ''}`
        : '';
    const childrenKey = record.children
        .map(c => `${c.id}:${c.title}:${c.date ?? ''}`)
        .join('|');
    return sha256(`${record.id}|${contentHash}|${record.title}|${record.summary ?? ''}|${record.date ?? ''}|${seriesKey}|${childrenKey}`);
}

/**
 * Core Incremental Build Orchestrator:
 * Compares codebase hashes, content hashes, and route dependencies.
 * Returns the complete route map, identifying exactly which routes changed or were removed.
 */
export async function executeIncrementalBuild(
    options: IncrementalBuildOptions = {}
): Promise<IncrementalBuildResult> {
    profiler.time('incremental-build');
    const siteRoot = options.rootDir || path.resolve(process.cwd());
    const cacheDir = options.cacheDir || path.resolve(siteRoot, '.cache');
    const cacheFilePath = path.join(cacheDir, 'build-cache.json');

    log.info(`Evaluating incremental build state (siteRoot: ${siteRoot}, clean: ${Boolean(options.forceClean)})...`);

    let prevManifest: BuildManifest | null = null;
    if (options.forceClean) {
        log.info('Clean build requested: bypassing existing manifest cache.');
    } else {
        prevManifest = await loadBuildManifest(cacheFilePath);
    }

    // 1. Compute Code & Asset Hashes
    const codeResult = await computeProjectCodeHash(siteRoot);
    const codeHash = codeResult.hash;
    const stylesPath = path.resolve(siteRoot, 'src/assets/styles.css');
    const interactionPath = path.resolve(siteRoot, 'src/assets/interaction.ts');
    const [stylesHash, interactionHash] = await Promise.all([
        hashFile(stylesPath),
        hashFile(interactionPath)
    ]);
    const assetHashes = {
        styles: stylesHash,
        interaction: interactionHash
    };

    const codeChanged = !prevManifest || prevManifest.codeHash !== codeHash;
    const stylesChanged = !prevManifest || prevManifest.assetHashes.styles !== stylesHash;
    const interactionChanged = !prevManifest || prevManifest.assetHashes.interaction !== interactionHash;
    const assetsChanged = stylesChanged || interactionChanged;

    if (codeChanged) {
        if (prevManifest?.codeFileHashes) {
            const diff = diffCodeHashes(prevManifest.codeFileHashes, codeResult.fileHashes);
            const totalChanges = diff.modified.length + diff.added.length + diff.deleted.length;
            log.info(
                `Source code or template changes detected (${totalChanges} files: ${diff.modified.length} modified, ${diff.added.length} added, ${diff.deleted.length} deleted). Invalidating cached route renders.`
            );
            if (diff.modified.length > 0) {
                log.info(`Modified source files: ${diff.modified.slice(0, 10).join(', ')}${diff.modified.length > 10 ? '...' : ''}`);
            }
            if (diff.added.length > 0) {
                log.info(`Added source files: ${diff.added.slice(0, 10).join(', ')}${diff.added.length > 10 ? '...' : ''}`);
            }
            if (diff.deleted.length > 0) {
                log.info(`Deleted source files: ${diff.deleted.slice(0, 10).join(', ')}${diff.deleted.length > 10 ? '...' : ''}`);
            }
        } else {
            log.info('Source code modified: invalidating route renders.');
        }
    } else {
        log.info('Source code unchanged (code hash matched).');
    }

    if (assetsChanged) {
        if (stylesChanged) log.info(`Styles asset modified (${stylesPath}).`);
        if (interactionChanged) log.info(`Interaction script asset modified (${interactionPath}).`);
    }

    // 2. Sync Content Cache (ASTs and metadata)
    const scanResult = await syncContentCache(siteRoot, prevManifest?.contentItems || {});
    const contentChangedFiles = scanResult.addedPaths.length + scanResult.modifiedPaths.length + scanResult.deletedPaths.length;

    log.info(
        `Content scan completed: ${scanResult.unchangedPaths.length} unchanged, ${scanResult.modifiedPaths.length} modified, ${scanResult.addedPaths.length} added, ${scanResult.deletedPaths.length} deleted.`
    );
    if (scanResult.modifiedPaths.length > 0) {
        log.info(`Modified content files: ${scanResult.modifiedPaths.slice(0, 10).join(', ')}${scanResult.modifiedPaths.length > 10 ? '...' : ''}`);
    }
    if (scanResult.addedPaths.length > 0) {
        log.info(`Added content files: ${scanResult.addedPaths.slice(0, 10).join(', ')}${scanResult.addedPaths.length > 10 ? '...' : ''}`);
    }
    if (scanResult.deletedPaths.length > 0) {
        log.info(`Deleted content files: ${scanResult.deletedPaths.slice(0, 10).join(', ')}${scanResult.deletedPaths.length > 10 ? '...' : ''}`);
    }

    // 3. Reconstruct Route Hierarchy from Content
    const rawRecords = contentCacheToRawRecords(scanResult.contentMap);
    const routedStream = buildRouteHierarchy(arrayToGenerator(rawRecords));

    const allRecords: ContentRecord[] = [];
    for await (const record of routedStream) {
        allRecords.push(record);
    }

    // Enrich series
    const articleRecords = allRecords.filter(r => r.kind === 'article');
    enrichSeries(articleRecords);

    // 4. Differential Route Rendering
    const routeMap = new Map<string, string>();
    const changedRoutes = new Set<string>();
    const deletedRoutes = new Set<string>();
    const newRouteItems: Record<string, RouteCacheItem> = {};
    const sitemapEntries: SitemapRouteEntry[] = [];
    const searchEntries: SearchEntry[] = [];

    const prevRouteItems = prevManifest?.routeItems || {};

    const allArticles: ChildRecord[] = [];
    const allPages: ChildRecord[] = [];
    const allZettels: ChildRecord[] = [];

    // Process all detail content records
    for (const record of allRecords) {
        const footprint: ChildRecord = {
            id: record.id,
            title: record.title,
            route: record.route,
            canonicalPath: record.canonicalPath,
            summary: record.summary,
            date: record.metadata.sortDate ?? record.date
        };

        if (record.kind === 'article') {
            allArticles.push(footprint);
        } else if (record.kind === 'zettel') {
            allZettels.push(footprint);
        } else {
            allPages.push(footprint);
        }

        const contentKey = `${record.kind}:${record.sourcePath}`;
        const cachedContentItem = scanResult.contentMap.get(contentKey);
        const depHash = computeRecordDependencyHash(record, cachedContentItem?.contentHash);
        const cachedRoute = prevRouteItems[record.route];

        let html: string;
        let htmlHash: string;

        let rebuildReason = '';
        if (codeChanged) {
            rebuildReason = 'code_or_template_changed';
        } else if (!cachedRoute) {
            rebuildReason = 'new_route';
        } else if (!cachedRoute.html) {
            rebuildReason = 'cached_html_missing';
        } else if (cachedRoute.dependencyHash !== depHash) {
            rebuildReason = 'content_or_dependency_changed';
        }

        // Check if we can reuse cached HTML
        if (!rebuildReason && cachedRoute) {
            html = cachedRoute.html;
            htmlHash = cachedRoute.htmlHash;
            log.debug(`[route:cached] ${record.route}`);
        } else {
            // Needs rendering
            try {
                const resolvedAst = resolveLinks(record.ast, record.route);
                const resolvedRecord: ContentRecord = { ...record, ast: resolvedAst };

                const template = record.kind === 'article'
                    ? React.createElement(ArticleDetailTemplate, { item: resolvedRecord })
                    : record.kind === 'zettel'
                        ? React.createElement(ZettelDetailTemplate, { item: resolvedRecord })
                        : React.createElement(PageDetailTemplate, { item: resolvedRecord });

                html = documentFromElement(template);
                htmlHash = sha256(html);
                changedRoutes.add(record.route);
                log.debug(`[route:rebuilt] ${record.route} (reason: ${rebuildReason})`);
            } catch (err: any) {
                const errorObj = err instanceof Error ? err : new Error(String(err));
                log.error(
                    `Fatal error rendering route "${record.route}" for content "${record.sourcePath}" (${record.id}):`,
                    { message: errorObj.message, stack: errorObj.stack }
                );
                throw errorObj;
            }
        }

        routeMap.set(record.route, html);

        const lastmod = record.metadata.sortDate ?? record.date;
        const priority = record.kind === 'article' ? '0.8' : record.kind === 'page' ? '0.7' : '0.6';
        const sitemapEntry: SitemapRouteEntry = {
            route: record.route,
            lastmod,
            priority,
            changefreq: 'monthly'
        };
        sitemapEntries.push(sitemapEntry);

        newRouteItems[record.route] = {
            route: record.route,
            outputPath: record.outputPath,
            html,
            htmlHash,
            contentId: record.id,
            dependencyHash: depHash,
            sitemapEntry
        };

        // Search entry compilation
        if (cachedContentItem?.searchData) {
            searchEntries.push({
                id: record.id,
                title: record.title,
                route: toCanonicalFullPath(record.route),
                kind: record.kind,
                date: record.metadata.sortDate ?? record.date,
                summary: (record.metadata.description as string | undefined) || record.metadata.summary || record.summary,
                headings: cachedContentItem.searchData.headings,
                content: cachedContentItem.searchData.content
            });
        }
    }

    // Sort collections
    allArticles.sort((a, b) => {
        if (a.date && b.date) return a.date < b.date ? 1 : -1;
        return a.title.localeCompare(b.title);
    });

    allPages.sort((a, b) => {
        if (a.date && b.date) return a.date < b.date ? 1 : -1;
        return a.title.localeCompare(b.title);
    });

    allZettels.sort((a, b) => {
        if (a.date && b.date) return a.date < b.date ? 1 : -1;
        return a.title.localeCompare(b.title);
    });

    // 5. Collection Routes
    const readmeItem = scanResult.contentMap.get('readme:readMe.md');
    const introNodes = readmeItem ? readmeItem.ast : [];

    // Helper to evaluate and cache collection routes
    function evaluateCollectionRoute(
        route: string,
        outputPath: string,
        element: React.ReactElement,
        depString: string
    ) {
        const depHash = sha256(depString);
        const cached = prevRouteItems[route];

        let rebuildReason = '';
        if (codeChanged) {
            rebuildReason = 'code_or_template_changed';
        } else if (!cached) {
            rebuildReason = 'new_collection_route';
        } else if (!cached.html) {
            rebuildReason = 'cached_html_missing';
        } else if (cached.dependencyHash !== depHash) {
            rebuildReason = 'collection_items_changed';
        }

        let html: string;
        let htmlHash: string;

        if (!rebuildReason && cached) {
            html = cached.html;
            htmlHash = cached.htmlHash;
            log.debug(`[collection:cached] ${route}`);
        } else {
            try {
                html = documentFromElement(element);
                htmlHash = sha256(html);
                changedRoutes.add(route);
                log.debug(`[collection:rebuilt] ${route} (reason: ${rebuildReason})`);
            } catch (err: any) {
                const errorObj = err instanceof Error ? err : new Error(String(err));
                log.error(`Fatal error rendering collection route "${route}":`, {
                    message: errorObj.message,
                    stack: errorObj.stack
                });
                throw errorObj;
            }
        }

        routeMap.set(route, html);
        newRouteItems[route] = {
            route,
            outputPath,
            html,
            htmlHash,
            contentId: `collection:${route}`,
            dependencyHash: depHash
        };
    }

    // Home
    const recentArticles = allArticles.slice(0, 6);
    const recentPages = allPages.slice(0, 6);
    const homeDep = `${readmeItem?.contentHash || ''}|${recentArticles.map(a => a.id).join(',')}|${recentPages.map(p => p.id).join(',')}`;
    evaluateCollectionRoute(
        '/',
        'index.html',
        React.createElement(IndexTemplate, { recentArticles, pages: recentPages, introNodes }),
        homeDep
    );

    // Articles Index
    evaluateCollectionRoute(
        '/articles/',
        'articles/index.html',
        React.createElement(ArticleIndexTemplate, { items: allArticles }),
        allArticles.map(a => `${a.id}:${a.title}:${a.date}`).join('|')
    );

    // Pages Index
    evaluateCollectionRoute(
        '/pages/',
        'pages/index.html',
        React.createElement(PageIndexTemplate, { items: allPages }),
        allPages.map(p => `${p.id}:${p.title}:${p.date}`).join('|')
    );

    // Zettelkasten Index
    evaluateCollectionRoute(
        '/zettelkasten/',
        'zettelkasten/index.html',
        React.createElement(ZettelkastenIndexTemplate, { items: allZettels }),
        allZettels.map(z => `${z.id}:${z.title}:${z.date}`).join('|')
    );

    // 404
    evaluateCollectionRoute(
        '/404.html',
        '404.html',
        React.createElement(NotFoundTemplate),
        '404'
    );

    sitemapEntries.unshift(
        { route: '/', priority: '1.0', changefreq: 'weekly' },
        { route: '/articles/', priority: '0.8', changefreq: 'weekly' },
        { route: '/pages/', priority: '0.8', changefreq: 'weekly' },
        { route: '/zettelkasten/', priority: '0.7', changefreq: 'weekly' }
    );

    // 6. Detect Deleted Routes
    if (prevManifest) {
        for (const oldRoute of Object.keys(prevManifest.routeItems)) {
            if (!newRouteItems[oldRoute]) {
                deletedRoutes.add(oldRoute);
            }
        }
    }
    if (deletedRoutes.size > 0) {
        log.info(`Detected ${deletedRoutes.size} deleted routes: ${Array.from(deletedRoutes).join(', ')}`);
    }

    const durationMs = profiler.timeEnd('incremental-build', 'Incremental build evaluation') ?? 0;

    const stats: IncrementalBuildStats = {
        totalRoutes: routeMap.size,
        rebuiltRoutes: changedRoutes.size,
        cachedRoutes: routeMap.size - changedRoutes.size,
        deletedRoutes: deletedRoutes.size,
        durationMs,
        codeChanged,
        assetsChanged,
        contentChangedFiles
    };

    log.info(
        `Incremental build evaluation finished in ${durationMs.toFixed(1)}ms (${routeMap.size} total routes: ${changedRoutes.size} rebuilt, ${stats.cachedRoutes} cached, ${deletedRoutes.size} deleted).`
    );

    // Save updated manifest
    const updatedContentItems: Record<string, ContentCacheItem> = {};
    for (const [k, v] of scanResult.contentMap.entries()) {
        updatedContentItems[k] = v;
    }

    const newManifest: BuildManifest = {
        version: CACHE_VERSION,
        codeHash,
        codeFileHashes: codeResult.fileHashes,
        assetHashes,
        contentItems: updatedContentItems,
        routeItems: newRouteItems,
        searchEntries,
        sitemapEntries,
        timestamp: new Date().toISOString()
    };

    await saveBuildManifest(cacheFilePath, newManifest);

    return {
        routeMap,
        changedRoutes,
        deletedRoutes,
        sitemapEntries,
        searchEntries,
        stats
    };
}
