import type { BlockNode } from '../md-parser';
import { inlineToText } from '../md-parser';
import type { ContentRecord } from '../router/types';
import { toCanonicalFullPath } from '../link-resolver';

/**
 * Representation of an indexed document for full-text search.
 */
export interface SearchEntry {
    id: string;
    title: string;
    route: string;
    kind: 'article' | 'page' | 'zettel';
    date?: string;
    summary?: string;
    headings: string[];
    content: string;
}

/**
 * Traverses an AST block structure to extract plain text headings and content.
 *
 * @param ast - The markdown BlockNode AST array.
 * @returns Object containing headings and flattened content string.
 */
export function extractHeadingsAndContent(ast: BlockNode[]): { headings: string[]; content: string } {
    const headings: string[] = [];
    const textParts: string[] = [];

    function walk(nodes: BlockNode[]): void {
        for (const node of nodes) {
            switch (node.kind) {
                case 'block-heading': {
                    const text = inlineToText(node.children).trim();
                    if (text) {
                        headings.push(text);
                        textParts.push(text);
                    }
                    break;
                }
                case 'block-paragraph': {
                    const text = inlineToText(node.children).trim();
                    if (text) textParts.push(text);
                    break;
                }
                case 'block-quote': {
                    walk(node.children);
                    break;
                }
                case 'block-list': {
                    for (const item of node.items) {
                        const text = inlineToText(item.children).trim();
                        if (text) textParts.push(text);
                    }
                    break;
                }
                case 'block-code':
                case 'block-math': {
                    if (node.value) textParts.push(node.value);
                    break;
                }
                default:
                    break;
            }
        }
    }

    walk(ast);

    return {
        headings,
        content: textParts.join(' ').replace(/\s+/g, ' ').trim()
    };
}

/**
 * Compiles all ContentRecords into a searchable index.
 *
 * @param records - List of routed ContentRecords.
 * @returns Array of SearchEntry items.
 */
export function buildSearchIndex(records: ContentRecord[]): SearchEntry[] {
    return records.map((record) => {
        const { headings, content } = extractHeadingsAndContent(record.ast);
        return {
            id: record.id,
            title: record.title,
            route: toCanonicalFullPath(record.route),
            kind: record.kind,
            date: record.metadata.sortDate ?? record.date,
            summary: (record.metadata.description as string | undefined) || record.metadata.summary || record.summary,
            headings,
            content
        };
    });
}
