import React from "react";
import { relativeRouteHref } from "../lib/paths";
import { ContentItem } from "../lib/types";
import { MarkdownRenderer } from "../../modules/md/components/Renderer";
import { Layout } from "./Layout";

// ─── Page tree ────────────────────────────────────────────────────────────────

interface PageTreeNode {
    label: string;
    item?: ContentItem;
    children: PageTreeNode[];
}

function insertIntoTree(nodes: PageTreeNode[], parts: string[], item: ContentItem): void {
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

function buildPageTree(items: ContentItem[]): PageTreeNode[] {
    const roots: PageTreeNode[] = [];
    for (const item of items) {
        insertIntoTree(roots, item.canonicalPath.split("/"), item);
    }
    return roots;
}

function renderTree(nodes: PageTreeNode[], fromRoute: string, depth = 0): JSX.Element {
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

// ─── Templates ────────────────────────────────────────────────────────────────

interface PagesTemplateProps {
    items: ContentItem[];
}

export function PagesTemplate({ items }: PagesTemplateProps): JSX.Element {
    const tree = buildPageTree(items);
    return (
        <Layout title="Pages | bloatware-site" pageTitle="Pages" currentRoute="/pages/">
            {renderTree(tree, "/pages/")}
        </Layout>
    );
}

interface PageDetailTemplateProps {
    item: ContentItem;
}

export function PageDetailTemplate({ item }: PageDetailTemplateProps): JSX.Element {
    return (
        <Layout title={`${item.title} | bloatware-site`} pageTitle={item.title} currentRoute={item.route} showPageTitle={false} toc={item.toc}>
            <article className="prose"><MarkdownRenderer nodes={item.nodes} /></article>
            {item.children.length > 0 && (
                <section className="subpages">
                    <hr />
                    <h2>Subpages</h2>
                    <ul className="page-tree">
                        {item.children.map((child) => (
                            <li key={child.route}>
                                <a href={relativeRouteHref(item.route, child.route)}>{child.title}</a>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </Layout>
    );
}
