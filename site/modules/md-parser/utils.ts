import type { InlineNode } from './types';

/**
 * Converts a plain text string into a URL-safe lowercase slug identifier.
 * Useful for generating anchor link IDs for headings.
 *
 * @param text - The raw text content to convert.
 * @returns A formatted URL-friendly string containing only letters, numbers and dashes.
 * @example
 * const slug = slugify("The Fuel of Intent!");
 * // Returns: "the-fuel-of-intent"
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Recursively extracts plain text content from an array of inline AST nodes.
 * Useful for stripping formatting to generate raw string titles from HeadingBlockNodes.
 *
 * @param nodes - Array of InlineNode AST elements.
 * @returns The flattened plain text representation.
 * @example
 * const nodes: InlineNode[] = [
 *     { kind: 'inline-text', value: 'Hello ' },
 *     { kind: 'inline-strong', children: [{ kind: 'inline-text', value: 'world' }] }
 * ];
 * const text = inlineToText(nodes);
 * // Returns: "Hello world"
 */
export function inlineToText(nodes: InlineNode[]): string {
    return nodes
        .map((n) => {
            if ('value' in n) {
                return n.value;
            }
            if ('children' in n && Array.isArray(n.children)) {
                return inlineToText(n.children);
            }
            return '';
        })
        .join('');
}

/**
 * Escapes HTML characters in a string to prevent raw HTML execution.
 * Replaces reserved HTML characters with their HTML entity equivalents.
 *
 * @param text - The raw string containing potential HTML tags.
 * @returns The escaped, safe HTML string.
 * @example
 * const safe = escapeHtml('<script>alert("hi")</script>');
 * // Returns: "&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;"
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
