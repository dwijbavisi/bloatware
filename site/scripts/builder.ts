import fs from 'node:fs/promises';
import path from 'node:path';
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
const log = new Logger('builder');

function documentFromElement(element: React.ReactElement): string {
    return `<!doctype html>\n${renderToStaticMarkup(element)}`;
}

async function* combinedContentStream() {
    const articlesDir = path.resolve(ROOT, '../content/articles');
    const pagesDir = path.resolve(ROOT, '../content/pages');
    yield* loadContentGenerator('article', articlesDir);
    yield* loadContentGenerator('page', pagesDir);
}

export async function generateAllRoutes(): Promise<Map<string, string>> {
    profiler.time('generate-routes');
    log.info('Generating all routes in memory...');

    const routeMap = new Map<string, string>();

    const readMePath = path.resolve(ROOT, '../readMe.md');
    let introNodes: BlockNode[] = [];
    try {
        const readMeText = await fs.readFile(readMePath, 'utf8');
        const parsed = parseMarkdown(readMeText);
        introNodes = parsed.ast;
    } catch (err) {
        log.warn('Could not read or parse readMe.md for homepage.', err);
    }

    const allArticles: ChildRecord[] = [];
    const allPages: ChildRecord[] = [];
    let pageCount = 0;

    const routedStream = buildRouteHierarchy(combinedContentStream());

    for await (const record of routedStream) {
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

        const resolvedAst = resolveLinks(record.ast, record.route);
        const resolvedRecord: ContentRecord = { ...record, ast: resolvedAst };

        const template = record.kind === 'article'
            ? React.createElement(ArticleDetailTemplate, { item: resolvedRecord })
            : React.createElement(PageDetailTemplate, { item: resolvedRecord });

        const html = documentFromElement(template);
        routeMap.set(record.route, html);
        pageCount++;
    }

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
    routeMap.set('/', homeHtml);

    const articlesHtml = documentFromElement(
        React.createElement(ArticleIndexTemplate, { items: allArticles })
    );
    routeMap.set('/articles/', articlesHtml);

    const pagesHtml = documentFromElement(
        React.createElement(PageIndexTemplate, { items: allPages })
    );
    routeMap.set('/pages/', pagesHtml);

    pageCount += 3;

    const durationMs = profiler.timeEnd('generate-routes', 'Memory generation time') ?? 0;
    log.info(`Generated ${pageCount} routes in memory in ${durationMs}ms.`);

    return routeMap;
}
