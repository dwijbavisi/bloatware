import React from "react";
import type { BlockNode } from "../types";
import { renderBlockNode } from "./BlockNodes";

interface MarkdownRendererProps {
    nodes: BlockNode[];
}

export function MarkdownRenderer({ nodes }: MarkdownRendererProps): JSX.Element {
    return <>{nodes.map((node, i) => renderBlockNode(node, i))}</>;
}
