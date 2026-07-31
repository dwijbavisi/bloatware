import { slugify, inlineToText } from "../../modules/md-parser";
import type { BlockNode, HeadingBlockNode } from "../../modules/md-parser";

/**
 * Represents a single Table of Contents entry.
 *
 * @property id - The slugified text used for the anchor link (e.g., "my-heading").
 * @property level - The semantic heading level (1 through 4).
 * @property text - The raw, unformatted text content of the heading.
 */
export interface TocItem {
    id: string;
    level: 1 | 2 | 3 | 4;
    text: string;
}

export { slugify };

/**
 * Extracts a hierarchical list of headings (up to level 3) from an AST array.
 * Returns an empty array if there are fewer than 2 headings.
 *
 * @param nodes - The array of AST BlockNodes to parse.
 * @returns An array of Table of Contents items.
 * @example
 * const toc = extractToc(record.ast);
 */
export function extractToc(nodes: BlockNode[]): TocItem[] {
    const items: TocItem[] = [];

    for (const node of nodes) {
        if (node.kind === 'block-heading') {
            if (node.level <= 3) {
                const text = inlineToText(node.children);
                items.push({
                    id: slugify(text),
                    level: node.level,
                    text
                });
            }
        }
    }

    return items.length >= 2 ? items : [];
}
