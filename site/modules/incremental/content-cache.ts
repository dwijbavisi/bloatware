import fs from 'node:fs/promises';
import path from 'node:path';
import { parseMarkdown } from '../md-parser';
import { extractHeadingsAndContent } from '../search-index';
import { hashFile, sha256 } from './hasher';
import type { ContentCacheItem } from './types';
import type { ContentKind, RawContentRecord } from '../discovery/types';
import { Logger } from '../logger';

const log = new Logger('incremental:content-cache');

/**
 * Gathers all markdown files in a directory recursively.
 */
async function gatherMarkdownFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err: any) {
        if (err?.code !== 'ENOENT') {
            log.warn(`Failed reading content directory ${dir}:`, err);
        }
        return results;
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const nested = await gatherMarkdownFiles(fullPath);
            results.push(...nested);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
            results.push(fullPath);
        }
    }

    return results;
}

export interface ContentScanResult {
    contentMap: Map<string, ContentCacheItem>;
    addedPaths: string[];
    modifiedPaths: string[];
    deletedPaths: string[];
    unchangedPaths: string[];
}

/**
 * Scans content directories and readMe.md, incrementally updating parsed ASTs
 * and search data for modified and added files while reusing unchanged ones.
 */
export async function syncContentCache(
    siteRoot: string,
    existingItems: Record<string, ContentCacheItem> = {}
): Promise<ContentScanResult> {
    const contentMap = new Map<string, ContentCacheItem>();
    const addedPaths: string[] = [];
    const modifiedPaths: string[] = [];
    const deletedPaths: string[] = [];
    const unchangedPaths: string[] = [];

    const contentDirs: Array<{ kind: ContentKind; dir: string }> = [
        { kind: 'article', dir: path.resolve(siteRoot, '../content/articles') },
        { kind: 'page', dir: path.resolve(siteRoot, '../content/pages') },
        { kind: 'zettel', dir: path.resolve(siteRoot, '../content/zettelkasten') }
    ];

    const currentFiles = new Map<string, { kind: ContentKind | 'readme'; absolutePath: string; sourcePath: string }>();

    log.debug(`Scanning content directories for changes (existing cached items: ${Object.keys(existingItems).length})...`);

    // 1. Gather all content files
    for (const { kind, dir } of contentDirs) {
        const files = await gatherMarkdownFiles(dir);
        for (const absPath of files) {
            const relPath = path.relative(dir, absPath).replace(/\\/g, '/');
            const key = `${kind}:${relPath}`;
            currentFiles.set(key, { kind, absolutePath: absPath, sourcePath: relPath });
        }
    }

    // 2. Readme.md for homepage
    const readMePath = path.resolve(siteRoot, '../readMe.md');
    try {
        const stat = await fs.stat(readMePath);
        if (stat.isFile()) {
            currentFiles.set('readme:readMe.md', {
                kind: 'readme',
                absolutePath: readMePath,
                sourcePath: 'readMe.md'
            });
        }
    } catch (err: any) {
        if (err?.code !== 'ENOENT') {
            log.warn(`Failed reading root readMe.md at ${readMePath}:`, err);
        }
    }

    log.debug(`Discovered ${currentFiles.size} content files on disk.`);

    // 3. Detect deleted files
    for (const key of Object.keys(existingItems)) {
        if (!currentFiles.has(key)) {
            deletedPaths.push(key);
            log.debug(`[content:deleted] ${key}`);
        }
    }

    // 4. Compare current files against cached entries
    for (const [key, info] of currentFiles.entries()) {
        const cached = existingItems[key];
        let fileStat;
        try {
            fileStat = await fs.stat(info.absolutePath);
        } catch (err: any) {
            log.warn(`Cannot stat content file "${info.sourcePath}" (${info.absolutePath}):`, err);
            continue;
        }

        const mtimeMs = fileStat.mtimeMs;

        // Fast mtime pre-check
        if (cached && cached.mtimeMs === mtimeMs) {
            contentMap.set(key, cached);
            unchangedPaths.push(key);
            log.debug(`[content:unchanged] ${key} (mtime matched)`);
            continue;
        }

        // Compute hash if mtime differs or no cache
        const contentHash = await hashFile(info.absolutePath);
        if (!contentHash) {
            log.warn(`Empty content hash computed for "${info.sourcePath}" (${info.absolutePath}). File may be empty or unreadable.`);
        }

        if (cached && cached.contentHash === contentHash) {
            // Content didn't change despite mtime touch
            const updated = { ...cached, mtimeMs };
            contentMap.set(key, updated);
            unchangedPaths.push(key);
            log.debug(`[content:unchanged] ${key} (content hash matched: ${contentHash.slice(0, 8)})`);
            continue;
        }

        // File is added or modified: read and parse markdown
        try {
            const fileText = await fs.readFile(info.absolutePath, 'utf8');
            const { ast, metadata, diagnostics } = parseMarkdown(fileText);

            if (diagnostics.length > 0) {
                log.warn(
                    `[${info.sourcePath}] Parsed with ${diagnostics.length} diagnostic warnings:\n  - ${diagnostics.map(d => `${d.message} (line ${d.line ?? '?'})`).join('\n  - ')}`
                );
            }

            const searchData = info.kind !== 'readme' ? extractHeadingsAndContent(ast) : undefined;

            const newItem: ContentCacheItem = {
                kind: info.kind,
                sourcePath: info.sourcePath,
                absolutePath: info.absolutePath,
                contentHash,
                mtimeMs,
                ast,
                metadata: metadata || {},
                searchData
            };

            contentMap.set(key, newItem);

            if (cached) {
                modifiedPaths.push(key);
                log.debug(`[content:modified] ${key} (hash: ${cached.contentHash.slice(0, 8)} -> ${contentHash.slice(0, 8)})`);
            } else {
                addedPaths.push(key);
                log.debug(`[content:added] ${key} (hash: ${contentHash.slice(0, 8)})`);
            }
        } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            log.error(`Failed to read or parse markdown for "${info.sourcePath}" (${info.absolutePath}):`, {
                message: errorObj.message,
                stack: errorObj.stack
            });
        }
    }

    return {
        contentMap,
        addedPaths,
        modifiedPaths,
        deletedPaths,
        unchangedPaths
    };
}

/**
 * Transforms cached ContentCacheItems into RawContentRecord array for the router,
 * sorted deepest-first.
 */
export function contentCacheToRawRecords(contentMap: Map<string, ContentCacheItem>): RawContentRecord[] {
    const rawRecords: RawContentRecord[] = [];

    for (const item of contentMap.values()) {
        if (item.kind === 'readme') continue;

        rawRecords.push({
            kind: item.kind,
            sourcePath: item.sourcePath,
            absolutePath: item.absolutePath,
            ast: item.ast,
            metadata: item.metadata
        });
    }

    rawRecords.sort((a, b) => {
        const depthA = a.absolutePath.split(path.sep).length;
        const depthB = b.absolutePath.split(path.sep).length;
        return depthB - depthA;
    });

    return rawRecords;
}
