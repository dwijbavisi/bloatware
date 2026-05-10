import React from "react";
import type {
    TextNode,
    BoldNode,
    ItalicNode,
    LinkNode,
    InlineCodeNode,
    MathInlineNode,
    SupNode,
    SubNode,
    BrNode,
    InlineNode,
} from "../types";

export function renderInlineNode(node: InlineNode, key: string | number): React.ReactNode {
    switch (node.type) {
        case "text":
            return (node as TextNode).value;

        case "bold":
            return (
                <strong key={key}>
                    {(node as BoldNode).children.map((c, i) => renderInlineNode(c, i))}
                </strong>
            );

        case "italic":
            return (
                <em key={key}>
                    {(node as ItalicNode).children.map((c, i) => renderInlineNode(c, i))}
                </em>
            );

        case "link": {
            const n = node as LinkNode;
            return (
                <a key={key} href={n.href}>
                    {n.children.map((c, i) => renderInlineNode(c, i))}
                </a>
            );
        }

        case "inline-code":
            return <code key={key}>{(node as InlineCodeNode).value}</code>;

        case "math-inline":
            return (
                <span key={key} className="math-inline">
                    {(node as MathInlineNode).source}
                </span>
            );

        case "sup":
            return (
                <sup key={key}>
                    {(node as SupNode).children.map((c, i) => renderInlineNode(c, i))}
                </sup>
            );

        case "sub":
            return (
                <sub key={key}>
                    {(node as SubNode).children.map((c, i) => renderInlineNode(c, i))}
                </sub>
            );

        case "br":
            return <br key={key} />;

        default: {
            const _: never = node;
            return null;
        }
    }
}

export function RenderInline({ nodes }: { nodes: InlineNode[] }): JSX.Element {
    return <>{nodes.map((n, i) => renderInlineNode(n, i))}</>;
}
