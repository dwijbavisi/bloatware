import React from "react";
import type {
    BlockNode,
    HeadingNode,
    ParagraphNode,
    BlockquoteNode,
    ListNode,
    MathBlockNode,
    CodeBlockNode,
} from "../types";
import { RenderInline } from "./InlineNodes";

export function renderBlockNode(node: BlockNode, key: string | number): React.ReactNode {
    switch (node.type) {
        case "heading": {
            const n = node as HeadingNode;
            const inner = <RenderInline nodes={n.children} />;
            switch (n.level) {
                case 1: return <h1 key={key}>{inner}</h1>;
                case 2: return <h2 key={key}>{inner}</h2>;
                case 3: return <h3 key={key}>{inner}</h3>;
                case 4: return <h4 key={key}>{inner}</h4>;
                case 5: return <h5 key={key}>{inner}</h5>;
                case 6: return <h6 key={key}>{inner}</h6>;
            }
            break;
        }

        case "paragraph":
            return (
                <p key={key}>
                    <RenderInline nodes={(node as ParagraphNode).children} />
                </p>
            );

        case "blockquote":
            return (
                <blockquote key={key}>
                    {(node as BlockquoteNode).children.map((c, i) => renderBlockNode(c, i))}
                </blockquote>
            );

        case "list": {
            const n = node as ListNode;
            const items = n.items.map((item, i) => (
                <li key={i}>
                    <RenderInline nodes={item.children} />
                </li>
            ));
            return n.ordered
                ? <ol key={key}>{items}</ol>
                : <ul key={key}>{items}</ul>;
        }

        case "hr":
            return <hr key={key} />;

        case "math-block":
            return (
                <div key={key} className="math-block">
                    {(node as MathBlockNode).source}
                </div>
            );

        case "code-block": {
            const n = node as CodeBlockNode;
            return (
                <pre key={key}>
                    <code className={n.lang ? `language-${n.lang}` : undefined}>{n.code}</code>
                </pre>
            );
        }

        default: {
            const _: never = node;
            return null;
        }
    }
}
