import React from 'react';
import { MDMarker } from './MDMarker';
import type {
    BlockNode,
    InlineNode,
    ListBlockNode,
    HeadingBlockNode
} from '../md-parser';
import { slugify, inlineToText } from '../md-parser';

/**
 * Maps an array of InlineNode AST elements into React elements.
 *
 * @param nodes - Array of InlineNode objects.
 * @returns React Node containing the rendered inline elements.
 * @example
 * const reactNodes = renderInlineNodes(paragraph.children);
 */
export function renderInlineNodes(nodes: InlineNode[]): React.ReactNode {
    return nodes.map((node, i) => renderInlineNode(node, i));
}

/**
 * Maps a strict AST inline node to its corresponding stylized React component.
 *
 * @param node - The InlineNode AST element.
 * @param key - The React loop key.
 * @returns React node.
 * @example
 * renderInlineNode({ kind: 'inline-strong', children: [...] }, 0)
 */
export function renderInlineNode(node: InlineNode, key: number | string): React.ReactNode {
    switch (node.kind) {
        case 'inline-text':
            return <React.Fragment key={key}>{node.value}</React.Fragment>;
        case 'inline-strong':
            return (
                <strong key={key}>
                    <MDMarker>**</MDMarker>
                    {renderInlineNodes(node.children)}
                    <MDMarker>**</MDMarker>
                </strong>
            );
        case 'inline-emphasis':
            return (
                <em key={key}>
                    <MDMarker>*</MDMarker>
                    {renderInlineNodes(node.children)}
                    <MDMarker>*</MDMarker>
                </em>
            );
        case 'inline-code':
            return (
                <code key={key}>
                    <MDMarker>`</MDMarker>
                    {node.value}
                    <MDMarker>`</MDMarker>
                </code>
            );
        case 'inline-math':
            return (
                <code key={key} className={node.kind}>
                    <MDMarker>$</MDMarker>
                    {node.value}
                    <MDMarker>$</MDMarker>
                </code>
            );
        case 'inline-super':
            return (
                <sup key={key}>
                    <MDMarker>^</MDMarker>
                    {renderInlineNodes(node.children)}
                    <MDMarker>^</MDMarker>
                </sup>
            );
        case 'inline-sub':
            return (
                <sub key={key}>
                    <MDMarker>~</MDMarker>
                    {renderInlineNodes(node.children)}
                    <MDMarker>~</MDMarker>
                </sub>
            );
        case 'inline-link':
            return (
                <a key={key} href={node.target}>
                    <MDMarker>[</MDMarker>
                    {renderInlineNodes(node.children)}
                    <MDMarker>]({node.target})</MDMarker>
                </a>
            );
        case 'inline-break':
            return (
                <React.Fragment key={key}>
                    <MDMarker>{'\\'}</MDMarker>
                    <br />
                </React.Fragment>
            );
        default:
            return null;
    }
}

/**
 * Transforms a stream of inline nodes inside a blockquote paragraph into lines.
 * It intercepts line breaks (`inline-break`) and chunks the inline content,
 * prepending each chunk with the `> ` markdown marker.
 *
 * @param nodes - The paragraph's inline children.
 * @returns React nodes chunked into spans.
 * @example
 * renderBlockquoteLines([{ kind: 'inline-text', value: 'Hello' }])
 */
function renderBlockquoteLines(nodes: InlineNode[]): React.ReactNode {
    const segments: InlineNode[][] = [];
    let current: InlineNode[] = [];

    for (const node of nodes) {
        if (node.kind === 'inline-break') {
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
            <MDMarker>{'> '}</MDMarker>
            {renderInlineNodes(segment)}
            {index < segments.length - 1 && <MDMarker>{'\\'}</MDMarker>}
        </span>
    ));
}

/**
 * Maps a strict AST block node to its corresponding stylized React component.
 *
 * @param node - The BlockNode AST element.
 * @param key - The React loop key.
 * @returns React node.
 * @example
 * renderBlockNode({ kind: 'block-hr' }, 0)
 */
export function renderBlockNode(node: BlockNode, key: number | string): React.ReactNode {
    switch (node.kind) {
        case 'block-paragraph':
            return (
                <p key={key}>
                    {renderInlineNodes(node.children)}
                </p>
            );

        case 'block-heading': {
            const marker = '#'.repeat(node.level) + ' ';
            const id = slugify(inlineToText(node.children));
            const content = (
                <>
                    <MDMarker>{marker}</MDMarker>
                    {renderInlineNodes(node.children)}
                    <a href={`#${id}`} className="md-heading-anchor" aria-label="Link to section">§</a>
                </>
            );

            const cls = `${node.kind} heading-${node.level}`;
            switch (node.level) {
                case 1: return <h1 key={key} id={id} className={cls}>{content}</h1>;
                case 2: return <h2 key={key} id={id} className={cls}>{content}</h2>;
                case 3: return <h3 key={key} id={id} className={cls}>{content}</h3>;
                case 4: return <h4 key={key} id={id} className={cls}>{content}</h4>;
                default: return <h2 key={key} id={id} className={cls}>{content}</h2>;
            }
        }

        case 'block-quote':
            return (
                <blockquote key={key} className={node.kind}>
                    {node.children.map((child, index) => {
                        if (child.kind === 'block-paragraph') {
                            return <p key={index}>{renderBlockquoteLines(child.children)}</p>;
                        }
                        return (
                            <React.Fragment key={index}>
                                <MDMarker>{'> '}</MDMarker>
                                {renderBlockNode(child, index)}
                            </React.Fragment>
                        );
                    })}
                </blockquote>
            );

        case 'block-list': {
            const isOrdered = node.ordered;
            const items = node.items.map((item, idx) => {
                const marker = isOrdered ? `${idx + 1}. ` : '- ';
                return (
                    <li key={idx}>
                        <MDMarker>{marker}</MDMarker>
                        {renderInlineNodes(item.children)}
                    </li>
                );
            });

            return isOrdered ? (
                <ol key={key} className={node.kind}>{items}</ol>
            ) : (
                <ul key={key} className={node.kind}>{items}</ul>
            );
        }

        case 'block-code':
            return (
                <pre key={key} className={node.kind}>
                    <MDMarker>```{node.language || ''}</MDMarker>
                    <br />
                    <code className={node.language ? `language-${node.language}` : 'language-pseudo'}>
                        {node.value}
                    </code>
                    <br />
                    <MDMarker>```</MDMarker>
                </pre>
            );

        case 'block-math':
            return (
                <pre key={key} className={node.kind}>
                    <MDMarker>$$</MDMarker>
                    <code>{node.value}</code>
                    <MDMarker>$$</MDMarker>
                </pre>
            );

        case 'block-hr':
            return (
                <div key={key} className={node.kind}>
                    <MDMarker>---</MDMarker>
                    <hr />
                </div>
            );

        default:
            return null;
    }
}

/**
 * The main component to safely and reliably render a strict markdown AST
 * into a stylized React element tree. Preserves MDMarker syntax for theme.
 *
 * @param props - Component props.
 * @param props.nodes - The array of AST BlockNodes.
 * @returns The React Fragment containing the rendered elements.
 * @example
 * <MarkdownRenderer nodes={record.ast} />
 */
export function MarkdownRenderer({ nodes }: { nodes: BlockNode[] }): React.JSX.Element {
    return <>{nodes.map((node, i) => renderBlockNode(node, i))}</>;
}
