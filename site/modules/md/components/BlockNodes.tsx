import React from "react";

import { MDNodeType, MDListOrderingType } from "../types";
import type {
    HeadingNode,
    ParagraphNode,
    BlockquoteNode,
    ListNode,
    ListItemNode,
    BlockCodeNode,
    BlockMathNode,
    // HrNode,
    InlineNode,
    BlockNode,
} from "../types";

import { MDMarker } from "./MDMarker"

import { RenderInline, renderInlineNode } from "./InlineNodes";
import { slugify, inlineToText } from "../utils";

function isOrderedList(ordering: MDListOrderingType): boolean {
    return ordering !== MDListOrderingType.hyphen
        && ordering !== MDListOrderingType.plus
        && ordering !== MDListOrderingType.asterisk;
}

function listMarker(ordering: MDListOrderingType, index: number): string {
    return isOrderedList(ordering) ? `${index + 1}. ` : "- ";
}

function renderBlockquoteLines(nodes: InlineNode[]): React.ReactNode {
    const segments: InlineNode[][] = [];
    let current: InlineNode[] = [];

    for (const node of nodes) {
        if (node.type === MDNodeType.lineBreak) {
            segments.push(current);
            current = [];
        } else {
            current.push(node);
        }
    }

    if (current.length > 0) {
        segments.push(current);
    }

    return segments.map((segment, index) => (
        <span key={index} className="md-blockquote-line">
            <MDMarker>{">"}&nbsp;</MDMarker>
            {segment.map((child, childIndex) => renderInlineNode(child, childIndex))}
        </span>
    ));
}

function renderBlockquoteChild(node: BlockNode, key: number): React.ReactNode {
    if (node.type === MDNodeType.paragraph) {
        return <p key={key}>{renderBlockquoteLines((node as ParagraphNode).children)}</p>;
    }

    return (
        <React.Fragment key={key}>
            <MDMarker>{">"}&nbsp;</MDMarker>
            {renderBlockNode(node, key)}
        </React.Fragment>
    );
}

function HeadingNodeComponent({ node, key }: { node: HeadingNode; key: string | number }): React.ReactNode {
    const marker = "#".repeat(node.level) + " ";
    const id = slugify(inlineToText(node.children));
    const anchor = <a href={`#${id}`} className="md-heading-anchor" aria-label="Link to section">§</a>;
    const content = (
        <>
            <MDMarker>{marker}</MDMarker>
            <RenderInline nodes={node.children} />
            {anchor}
        </>
    );

    const clsName = `${node.type}.${node.level}`;

    switch (node.level) {
        case 1: return <h1 key={key} id={id} className={clsName}>{content}</h1>;
        case 2: return <h2 key={key} id={id} className={clsName}>{content}</h2>;
        case 3: return <h3 key={key} id={id} className={clsName}>{content}</h3>;
        case 4: return <h4 key={key} id={id} className={clsName}>{content}</h4>;
        case 5: return <h5 key={key} id={id} className={clsName}>{content}</h5>;
        case 6: return <h6 key={key} id={id} className={clsName}>{content}</h6>;
        default: return <h2 key={key} id={id} className={clsName}>{content}</h2>;
    }
}

function ParagraphNodeComponent({ node, key }: { node: ParagraphNode; key: string | number }): React.ReactNode {
    return (
        <p key={key} className={node.type}>
            <RenderInline nodes={node.children} />
        </p>
    );
}

function BlockquoteNodeComponent({ node, key }: { node: BlockquoteNode; key: string | number }): React.ReactNode {
    return (
        <blockquote key={key} className={`${node.type}.${node.severity}`}>
            {node.children.map((child, index) => renderBlockquoteChild(child, index))}
        </blockquote>
    );
}

function ListNodeComponent({ node, key }: { node: ListNode; key: string | number }): React.ReactNode {
    const listItems = node.children.map((item: ListItemNode, index) => (
        <li key={index} className={item.type}>
            <MDMarker>{listMarker(node.ordering, index)}</MDMarker>
            <RenderInline nodes={item.contents} />
        </li>
    ));

    return isOrderedList(node.ordering)
        ? <ol key={key} className={node.type}>{listItems}</ol>
        : <ul key={key}>{listItems}</ul>;
}

function BlockCodeNodeComponent({ node, key }: { node: BlockCodeNode; key: string | number }): React.ReactNode {
    return (
        <pre key={key} className={node.type}>
            <MDMarker>```{node.lang || ''}</MDMarker>
            <code className={node.lang ? `language-${node.lang}` : 'language-pseudo'}>{node.content}</code>
            <MDMarker>```</MDMarker>
        </pre>
    )
}

function BlockMathNodeComponent({ node, key }: { node: BlockMathNode; key: string | number }): React.ReactNode {
    return (
        <pre key={key} className={node.type}>
            <MDMarker>$$</MDMarker>
            <code>{node.content}</code>
            <MDMarker>$$</MDMarker>
        </pre>
    )
}

function HorizontalRuleNodeComponent({ key }: { key: string | number }): React.ReactNode {
    return <hr key={key} />;
}

export function renderBlockNode(node: BlockNode, key: string | number): React.ReactNode {
    switch (node.type) {
        case MDNodeType.heading:
            return HeadingNodeComponent({ node: node as HeadingNode, key });
        case MDNodeType.paragraph:
            return ParagraphNodeComponent({ node: node as ParagraphNode, key });
        case MDNodeType.blockquote:
            return BlockquoteNodeComponent({ node: node as BlockquoteNode, key });
        case MDNodeType.list:
            return ListNodeComponent({ node: node as ListNode, key });
        case MDNodeType.blockCode:
            return BlockCodeNodeComponent({ node: node as BlockCodeNode, key });
        case MDNodeType.blockMath:
            return BlockMathNodeComponent({ node: node as BlockMathNode, key });
        case MDNodeType.horizontalRule:
            HorizontalRuleNodeComponent({ key });
        default: {
            // const _: never = node;
            return null;
        }
    }
}
