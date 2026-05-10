import React from "react";
import type {
    BlockNode,
    HeadingNode,
    ParagraphNode,
    BlockquoteNode,
    ListNode,
    MathBlockNode,
    CodeBlockNode,
    InlineNode,
} from "../types";
import { RenderInline, renderInlineNode } from "./InlineNodes";
import { slugify, inlineToText } from "../utils";

const Marker = ({ children }: { children: React.ReactNode }) => (
    <span className="md-marker">{children}</span>
);

// Split inline nodes on <br> boundaries and render each segment as a > prefixed line.
function renderBlockquoteLines(nodes: InlineNode[]): React.ReactNode {
    const segments: InlineNode[][] = [];
    let current: InlineNode[] = [];
    for (const node of nodes) {
        if (node.type === "br") {
            segments.push(current);
            current = [];
        } else {
            current.push(node);
        }
    }
    segments.push(current);
    return segments.map((seg, i) => (
        <span key={i} className="bq-line">
            <Marker>{">"}&#32;</Marker>
            {seg.map((n, j) => renderInlineNode(n, j))}
        </span>
    ));
}

function renderBlockquoteChild(node: BlockNode, key: number): React.ReactNode {
    if (node.type === "paragraph") {
        return <p key={key}>{renderBlockquoteLines((node as ParagraphNode).children)}</p>;
    }
    // Non-paragraph blocks (headings, nested blockquotes, etc.) get a single > prefix
    return (
        <React.Fragment key={key}>
            <Marker>{">"}&#32;</Marker>
            {renderBlockNode(node, key)}
        </React.Fragment>
    );
}

export function renderBlockNode(node: BlockNode, key: string | number): React.ReactNode {
    switch (node.type) {
        case "heading": {
            const n = node as HeadingNode;
            const marker = "#".repeat(n.level) + " ";
            const inner = <RenderInline nodes={n.children} />;
            const id = slugify(inlineToText(n.children));
            const anchor = <a href={`#${id}`} className="heading-anchor" aria-label="Link to section">§</a>;
            switch (n.level) {
                case 1: return <h1 key={key} id={id}><Marker>{marker}</Marker>{inner}{anchor}</h1>;
                case 2: return <h2 key={key} id={id}><Marker>{marker}</Marker>{inner}{anchor}</h2>;
                case 3: return <h3 key={key} id={id}><Marker>{marker}</Marker>{inner}{anchor}</h3>;
                case 4: return <h4 key={key} id={id}><Marker>{marker}</Marker>{inner}{anchor}</h4>;
                case 5: return <h5 key={key} id={id}><Marker>{marker}</Marker>{inner}{anchor}</h5>;
                case 6: return <h6 key={key} id={id}><Marker>{marker}</Marker>{inner}{anchor}</h6>;
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
                    {(node as BlockquoteNode).children.map((c, i) => renderBlockquoteChild(c, i))}
                </blockquote>
            );

        case "list": {
            const n = node as ListNode;
            const items = n.items.map((item, i) => (
                <li key={i}>
                    <span className="md-marker">{n.ordered ? `${i + 1}. ` : "- "}</span>
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
