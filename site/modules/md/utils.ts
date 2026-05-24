import type { InlineNode } from "./types";

/**
 * Convert a heading's plain text into a URL-safe id.
 * e.g. "## The Fuel of Intent" --> "the-fuel-of-intent"
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

/**
 * Recursively extract plain text from an array of InlineNodes.
 */
export function inlineToText(nodes: InlineNode[]): string {
    return nodes
        .map((n) => {
            if ('content' in n) return n.content;
            if ('contents' in n && Array.isArray(n.contents)) {
                return inlineToText(n.contents);
            }
            return "";
        })
        .join("");
}
