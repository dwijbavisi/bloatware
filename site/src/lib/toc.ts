import { MDNodeType } from "../../modules/md-parser";
import type { BlockNode, HeadingNode } from "../../modules/md-parser";
import { slugify, inlineToText } from "../../modules/md-parser";

export interface TocItem {
    id: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
}

export { slugify };

/**
 * Extract all headings from a parsed block list, up to level 3.
 * Returns an empty array if there are fewer than 2 headings (not worth a ToC).
 */
export function extractToc(nodes: BlockNode[]): TocItem[] {
    const items = nodes
        .filter((n) => n.type === MDNodeType.heading && (n as HeadingNode).level <= 3)
        .map((n) => {
            const h = n as HeadingNode;
            const text = inlineToText(h.children);
            return { id: slugify(text), level: h.level, text };
        });

    return items.length >= 2 ? items : [];
}
