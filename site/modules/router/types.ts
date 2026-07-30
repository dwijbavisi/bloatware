import type { BlockNode, DocumentMetadata } from '../md-parser';
import type { ContentKind } from '../discovery/types';

/**
 * A lightweight footprint of a child page, used to build the hierarchy
 * without keeping heavy ASTs in memory.
 *
 * @example
 * const child: ChildRecord = {
 *     id: 'page:about/team',
 *     title: 'Our Team',
 *     route: '/pages/about/team/',
 *     summary: 'Meet the incredible bloatware team.'
 * };
 */
export interface ChildRecord {
    id: string;
    title: string;
    route: string;
    summary?: string;
    date?: string;
}

/**
 * A fully routed and compiled content record. This is yielded by the router
 * directly to the rendering engine.
 *
 * @example
 * const record: ContentRecord = {
 *     id: 'article:2026/03/the-fuel',
 *     kind: 'article',
 *     sourcePath: '2026/03/the-fuel.md',
 *     slug: '2026/03/the-fuel',
 *     canonicalPath: '2026/03/the-fuel',
 *     route: '/articles/2026/03/the-fuel/',
 *     outputPath: 'articles/2026/03/the-fuel/index.html',
 *     title: 'The Fuel of Intent',
 *     summary: 'Intent is what drives...',
 *     metadata: { author: 'Dwij' },
 *     ast: [...],
 *     children: [] // Will contain ChildRecords if this page is a parent
 * };
 */
export interface ContentRecord {
    id: string;
    kind: ContentKind;
    sourcePath: string;
    slug: string;
    canonicalPath: string;
    route: string;
    outputPath: string;
    title: string;
    summary?: string;
    metadata: DocumentMetadata;
    ast: BlockNode[];
    children: ChildRecord[];
}
