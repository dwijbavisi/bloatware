import React from "react";
import type { BlockNode } from "../md-parser";
import { renderBlockNode } from "./BlockNodes";

interface MarkdownRendererProps {
    nodes: BlockNode[];
}

/**
 * Main component to recursively render parsed Markdown AST BlockNodes as React components.
 */
export function MarkdownRenderer({ nodes }: MarkdownRendererProps): JSX.Element {
    return <>{nodes.map((node, i) => renderBlockNode(node, i))}</>;
}
