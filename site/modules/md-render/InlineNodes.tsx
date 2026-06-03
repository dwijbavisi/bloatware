import React from "react";
import { MDNodeType } from "../md-parser";
import type {
    TextNode,
    BoldNode,
    ItalicNode,
    LinkNode,
    InlineCodeNode,
    InlineMathNode,
    SuperScriptNode,
    SubScriptNode,
    BrNode,
    InlineNode,
} from "../md-parser";
import { MDMarker } from "./MDMarker";

/**
 * Renders a literal text node.
 */
function TextNodeComponent({ node }: { node: TextNode }): React.ReactNode {
    return <>{node.content}</>;
}

/**
 * Renders bold-formatted elements.
 */
function BoldNodeComponent({ node, key }: { node: BoldNode; key: string | number }): React.ReactNode {
    return (
        <strong key={key} className={node.type}>
            <MDMarker>**</MDMarker>
            <RenderInline nodes={node.contents} />
            <MDMarker>**</MDMarker>
        </strong>
    );
}

/**
 * Renders italic-formatted elements.
 */
function ItalicNodeComponent({ node, key }: { node: ItalicNode; key: string | number }): React.ReactNode {
    return (
        <em key={key} className={node.type}>
            <MDMarker>*</MDMarker>
            <RenderInline nodes={node.contents} />
            <MDMarker>*</MDMarker>
        </em>
    );
}

/**
 * Renders inline hyperlinks.
 */
function LinkNodeComponent({ node, key }: { node: LinkNode; key: string | number }): React.ReactNode {
    return (
        <a key={key} href={node.href} className={node.type}>
            <MDMarker>[</MDMarker>
            <RenderInline nodes={node.contents} />
            <MDMarker>]</MDMarker>
            <MDMarker>(</MDMarker>
            {node.href}
            <MDMarker>)</MDMarker>
        </a>
    );
}

/**
 * Renders inline monospace code segments.
 */
function InlineCodeNodeComponent({ node, key }: { node: InlineCodeNode; key: string | number }): React.ReactNode {
    return (
        <code key={key} className={node.type}>
            <MDMarker>`</MDMarker>
            {node.content}
            <MDMarker>`</MDMarker>
        </code>
    );
}

/**
 * Renders inline equations.
 */
function InlineMathNodeComponent({ node, key }: { node: InlineMathNode; key: string | number }): React.ReactNode {
    return (
        <span key={key} className={node.type}>
            <MDMarker>$</MDMarker>
            {node.content}
            <MDMarker>$</MDMarker>
        </span>
    );
}

/**
 * Renders superscript elements.
 */
function SuperScriptNodeComponent({ node, key }: { node: SuperScriptNode; key: string | number }): React.ReactNode {
    return (
        <sup key={key} className={node.type}>
            <MDMarker>^</MDMarker>
            <RenderInline nodes={node.contents} />
            <MDMarker>^</MDMarker>
        </sup>
    );
}

/**
 * Renders subscript elements.
 */
function SubScriptNodeComponent({ node, key }: { node: SubScriptNode; key: string | number }): React.ReactNode {
    return (
        <sub key={key} className={node.type}>
            <MDMarker>~</MDMarker>
            <RenderInline nodes={node.contents} />
            <MDMarker>~</MDMarker>
        </sub>
    );
}

/**
 * Renders a line break.
 */
function BrNodeComponent({ node, key }: { node: BrNode; key: string | number }): React.ReactNode {
    return <br key={key} className={node.type} />;
}

/**
 * Helper to dispatch rendering of a single inline AST node.
 *
 * @param node - The inline node to render.
 * @param key - A unique key for list rendering.
 */
export function renderInlineNode(node: InlineNode, key: string | number): React.ReactNode {
    switch (node.type) {
        case MDNodeType.text:
            return TextNodeComponent({ node: node as TextNode });
        case MDNodeType.bold:
            return BoldNodeComponent({ node: node as BoldNode, key });
        case MDNodeType.italic:
            return ItalicNodeComponent({ node: node as ItalicNode, key });
        case MDNodeType.link:
            return LinkNodeComponent({ node: node as LinkNode, key });
        case MDNodeType.inlineCode:
            return InlineCodeNodeComponent({ node: node as InlineCodeNode, key });
        case MDNodeType.inlineMath:
            return InlineMathNodeComponent({ node: node as InlineMathNode, key });
        case MDNodeType.superScript:
            return SuperScriptNodeComponent({ node: node as SuperScriptNode, key });
        case MDNodeType.subScript:
            return SubScriptNodeComponent({ node: node as SubScriptNode, key });
        case MDNodeType.lineBreak:
            return BrNodeComponent({ node: node as BrNode, key });
        default: {
            const _: never = node;
            return null;
        }
    }
}

/**
 * Renders an array of inline nodes sequentially.
 *
 * @param props - Component properties.
 */
export function RenderInline({ nodes }: { nodes: InlineNode[] }): JSX.Element {
    return <>{nodes.map((node, index) => renderInlineNode(node, index))}</>;
}
