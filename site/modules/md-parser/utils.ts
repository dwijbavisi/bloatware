import type { InlineNode } from "./types";

/**
 * Converts a heading's plain text into a URL-safe lowercase slug identifier.
 * e.g., "## The Fuel of Intent" -> "the-fuel-of-intent"
 *
 * @param text - The raw text content to convert.
 * @returns A formatted URL-friendly string.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

/**
 * Recursively extracts plain text content from an array of inline AST nodes.
 *
 * @param nodes - Array of InlineNode AST elements.
 * @returns The flattened plain text representation.
 */
export function inlineToText(nodes: InlineNode[]): string {
    return nodes
        .map((n) => {
            if ("content" in n) {
                return n.content;
            }
            if ("contents" in n && Array.isArray(n.contents)) {
                return inlineToText(n.contents);
            }
            return "";
        })
        .join("");
}
