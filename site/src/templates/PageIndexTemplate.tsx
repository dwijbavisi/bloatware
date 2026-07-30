import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import type { ChildRecord } from '../../modules/router/types';
import { CoreLayout } from './CoreLayout';

/**
 * Represents a node in the hierarchical page tree.
 *
 * @property label - The display label for the directory or page.
 * @property item - The optional child record if this node represents an actual page.
 * @property children - The array of nested child nodes.
 */
interface PageTreeNode {
    label: string;
    item?: ChildRecord;
    children: PageTreeNode[];
}

/**
 * Recursively inserts a page record into the hierarchical tree based on its route segments.
 *
 * @param nodes - The array of current tree nodes to mutate.
 * @param parts - The remaining path segments to resolve.
 * @param item - The page record to insert at the terminal node.
 * @returns void
 * @example
 * insertIntoTree(roots, ["ideas", "qualia"], record);
 */
function insertIntoTree(nodes: PageTreeNode[], parts: string[], item: ChildRecord): void {
    if (parts.length === 0) return;
    const [head, ...rest] = parts;
    let node = nodes.find((n) => n.label === head);
    if (!node) {
        node = { label: head, children: [] };
        nodes.push(node);
    }
    if (rest.length === 0) {
        node.item = item;
    } else {
        insertIntoTree(node.children, rest, item);
    }
}

/**
 * Builds a hierarchical tree structure from a flat array of page records.
 *
 * @param items - The flat array of page records to process.
 * @returns The root nodes of the constructed page tree.
 * @example
 * const tree = buildPageTree(pageRecords);
 */
function buildPageTree(items: ChildRecord[]): PageTreeNode[] {
    const roots: PageTreeNode[] = [];
    for (const item of items) {
        const cleanPath = item.route.replace(/^\/pages\//, '').replace(/\/$/, '');
        if (cleanPath) {
            insertIntoTree(roots, cleanPath.split('/'), item);
        }
    }
    return roots;
}

/**
 * Recursively renders the page tree structure into HTML lists.
 *
 * @param nodes - The array of tree nodes to render.
 * @param fromRoute - The current absolute route to resolve relative links against.
 * @param depth - The current nesting depth (defaults to 0).
 * @returns The rendered JSX element.
 * @example
 * const jsx = renderTree(tree, "/pages/");
 */
function renderTree(nodes: PageTreeNode[], fromRoute: string, depth = 0): React.JSX.Element {
    return (
        <ul className={depth === 0 ? "page-tree" : "page-tree-children"}>
            {nodes.map((node) => {
                const label = node.item?.title ?? node.label;
                return (
                    <li key={node.label}>
                        {node.item
                            ? <a href={relativeRouteHref(fromRoute, node.item.route)}>{label}</a>
                            : <span className="page-tree-group">{label}</span>
                        }
                        {node.children.length > 0 && renderTree(node.children, fromRoute, depth + 1)}
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * Props for the PageIndexTemplate component.
 *
 * @property items - Array of page records to render as a hierarchical tree.
 */
export interface PageIndexTemplateProps {
    items: ChildRecord[];
}

/**
 * Renders the page index view, displaying a hierarchical tree of all pages.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 * @example
 * <PageIndexTemplate items={pageRecords} />
 */
export function PageIndexTemplate({ items }: PageIndexTemplateProps): React.JSX.Element {
    const tree = buildPageTree(items);
    return (
        <CoreLayout title="Pages | bloatware-site" pageTitle="Pages" currentRoute="/pages/">
            {renderTree(tree, "/pages/")}
        </CoreLayout>
    );
}
