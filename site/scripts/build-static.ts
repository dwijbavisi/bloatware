import fs from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { loadContentGenerator } from '../modules/discovery';
import { buildRouteHierarchy } from '../modules/router';
import type { ChildRecord, ContentRecord } from '../modules/router/types';
import { resolveLinks } from '../modules/link-resolver';
import { parseMarkdown, type BlockNode } from '../modules/md-parser';
import { Logger } from '../modules/logger';
import profiler from '../modules/profiler';

import { IndexTemplate } from '../src/templates/IndexTemplate';
import { ArticleIndexTemplate } from '../src/templates/ArticleIndexTemplate';
import { ArticleDetailTemplate } from '../src/templates/ArticleDetailTemplate';
import { PageIndexTemplate } from '../src/templates/PageIndexTemplate';
import { PageDetailTemplate } from '../src/templates/PageDetailTemplate';

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, 'dist');
const ASSETS_DIR = path.resolve(DIST, 'assets');
const log = new Logger('build-static');

/**
 * Wraps a React element in a standard HTML document doctype declaration.
 *
 * @param element - The React root element.
 * @returns The raw HTML string.
 */
function documentFromElement(element: React.ReactElement): string {
    return `<!doctype html>\n${renderToStaticMarkup(element)}`;
}

/**
 * Writes an HTML string to disk, resolving its canonical path to an index.html file.
 *
 * @param route - The canonical route (e.g., "/articles/my-post/").
 * @param html - The fully rendered HTML string.
 * @returns Promise that resolves when writing is complete.
 */
async function writeRoute(route: string, html: string): Promise<void> {
    const routePath = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
    const outputDir = path.join(DIST, routePath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

/**
 * Creates a combined asynchronous generator that sequentially yields raw content
 * records from both the articles and pages directories.
 *
 * @returns An AsyncGenerator yielding RawContentRecord objects.
 */
async function* combinedContentStream() {
    const articlesDir = path.resolve(ROOT, '../content/articles');
    const pagesDir = path.resolve(ROOT, '../content/pages');
    yield* loadContentGenerator('article', articlesDir);
    yield* loadContentGenerator('page', pagesDir);
}

/**
 * Executes the entire static build pipeline deterministically.
 *
 * @returns A Promise that resolves when the build is successful.
 */
async function run(): Promise<void> {
    profiler.time('build');
    log.info('Starting build orchestrator...');

    // 1. Initialization and Cleanup
    log.info('Clearing workspace...');
    await fs.rm(DIST, { recursive: true, force: true });
    await fs.mkdir(ASSETS_DIR, { recursive: true });

    log.info('Bundling static assets...');
    await fs.copyFile(path.resolve(ROOT, 'src/assets/styles.css'), path.resolve(ASSETS_DIR, 'styles.css'));

    await esbuild.build({
        entryPoints: [path.resolve(ROOT, 'src/assets/interaction.ts')],
        outfile: path.resolve(ASSETS_DIR, 'interaction.js'),
        bundle: true,
        format: 'iife',
        platform: 'browser',
        minify: true,
    });

    log.info('Parsing homepage intro (readMe.md)...');
    const readMePath = path.resolve(ROOT, '../readMe.md');
    let introNodes: BlockNode[] = [];
    try {
        const readMeText = await fs.readFile(readMePath, 'utf8');
        const parsed = parseMarkdown(readMeText);
        introNodes = parsed.ast;
    } catch (err) {
        log.warn('Could not read or parse readMe.md for homepage.', err);
    }

    // 2. Stream Processing (Memory Safe)
    const allArticles: ChildRecord[] = [];
    const allPages: ChildRecord[] = [];
    let pageCount = 0;

    log.info('Initializing router stream...');
    const routedStream = buildRouteHierarchy(combinedContentStream());

    for await (const record of routedStream) {
        log.info(`Rendering route: ${record.route}`);

        // Cache lightweight footprint for global index pages
        const footprint: ChildRecord = {
            id: record.id,
            title: record.title,
            route: record.route,
            summary: record.summary,
            date: record.metadata.sortDate
        };

        if (record.kind === 'article') {
            allArticles.push(footprint);
        } else {
            allPages.push(footprint);
        }

        // Apply LinkResolver to update relative markdown paths in the AST
        const resolvedAst = resolveLinks(record.ast, record.route);
        const resolvedRecord: ContentRecord = { ...record, ast: resolvedAst };

        // Render React template
        const template = record.kind === 'article'
            ? React.createElement(ArticleDetailTemplate, { item: resolvedRecord })
            : React.createElement(PageDetailTemplate, { item: resolvedRecord });

        // Write directly to disk and allow AST to garbage collect
        const html = documentFromElement(template);
        await writeRoute(record.route, html);

        pageCount++;
    }

    // 3. Global Index Generation
    log.info('Generating global index pages...');

    allArticles.sort((a, b) => {
        if (a.date && b.date) return a.date < b.date ? 1 : -1;
        return a.title.localeCompare(b.title);
    });

    const homeHtml = documentFromElement(
        React.createElement(IndexTemplate, {
            recentArticles: allArticles.slice(0, 6),
            introNodes
        })
    );
    await writeRoute('/', homeHtml);

    const articlesHtml = documentFromElement(
        React.createElement(ArticleIndexTemplate, { items: allArticles })
    );
    await writeRoute('/articles/', articlesHtml);

    const pagesHtml = documentFromElement(
        React.createElement(PageIndexTemplate, { items: allPages })
    );
    await writeRoute('/pages/', pagesHtml);

    pageCount += 3;

    // 4. Manifest
    log.info('Writing route-manifest.json...');
    const durationMs = profiler.timeEnd('build', 'Total build execution time') ?? 0;

    const routeManifest = {
        generatedAt: new Date().toISOString(),
        totalGenerated: pageCount,
        durationMs,
        routes: [
            '/',
            '/articles/',
            '/pages/',
            ...allArticles.map(a => a.route),
            ...allPages.map(p => p.route)
        ]
    };

    await fs.writeFile(path.join(DIST, 'route-manifest.json'), JSON.stringify(routeManifest, null, 2), 'utf8');

    log.info(`Build successful. Generated ${pageCount} routes in ${routeManifest.durationMs}ms.`);
}

run().catch((error: unknown) => {
    log.error(`Build failed critically.`, error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
});
