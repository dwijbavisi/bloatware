import type { BlockNode, DocumentMetadata } from '../md-parser';

/**
 * Defines the semantic category of the discovered content.
 * 
 * @example
 * const type: ContentKind = 'article';
 */
export type ContentKind = 'article' | 'page';

/**
 * Represents a purely discovered markdown file, before any routing, 
 * link resolution, or hierarchy generation.
 * 
 * @example
 * const record: RawContentRecord = {
 *     kind: 'article',
 *     sourcePath: '2026/03/the-fuel-of-intent.md',
 *     absolutePath: 'd:/projects/bloatware/content/articles/2026/03/the-fuel-of-intent.md',
 *     ast: [],
 *     metadata: { author: 'Dwij Bavisi' }
 * };
 */
export interface RawContentRecord {
    kind: ContentKind;
    sourcePath: string; // The relative path from the content root
    absolutePath: string; // The absolute OS file path
    ast: BlockNode[];
    metadata: DocumentMetadata;
}
