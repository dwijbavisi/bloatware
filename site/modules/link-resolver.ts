import path from 'node:path';
import type {
    BlockNode,
    InlineNode
} from './md-parser';

/**
 * Splits a standard web route into segments, ignoring empty parts and root slash.
 *
 * @param route - The canonical route (e.g., "/articles/2026/03/the-fuel-of-intent/")
 * @returns Array of non-empty route segments.
 * @example
 * splitRoute("/articles/my-post/")
 * // Returns: ["articles", "my-post"]
 */
function splitRoute(route: string): string[] {
    if (route === '/') {
        return [];
    }
    return route.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
}

/**
 * Computes a relative HTML href from one site route to another.
 * Safely handles static generation logic where every route is a directory
 * containing an index.html file.
 *
 * @param fromRoute - The canonical route of the originating page.
 * @param toRoute - The canonical route of the target page.
 * @returns The resolved relative path to index.html.
 * @example
 * relativeRouteHref('/articles/a/', '/articles/b/')
 * // Returns: "../b/index.html"
 */
export function relativeRouteHref(fromRoute: string, toRoute: string): string {
    const from = splitRoute(fromRoute);
    const to = splitRoute(toRoute);

    let common = 0;
    while (common < from.length && common < to.length && from[common] === to[common]) {
        common += 1;
    }

    const upCount = from.length - common;
    const down = to.slice(common);

    if (upCount === 0 && down.length === 0) {
        return './index.html';
    }

    const upPart = upCount > 0 ? '../'.repeat(upCount) : '';
    const downPart = down.length > 0 ? `${down.join('/')}/` : '';
    const base = `${upPart}${downPart}` || './';

    return `${base}index.html`;
}

/**
 * Rewrites a relative .md file href to a static-site HTML path.
 * Ignores absolute URLs and anchor hashes.
 *
 * @param href - The raw href found in the markdown link.
 * @param fromRoute - The canonical route of the document containing the link.
 * @returns The rewritten href string.
 * @example
 * resolveMdLinkHref('./another.md', '/articles/my-post/')
 * // Returns: "../another/index.html"
 */
function resolveMdLinkHref(href: string, fromRoute: string): string {
    // Ignore external URLs, mailto links, anchor hashes, and root absolute paths
    if (/^(https?:|mailto:|#|\/)/.test(href)) {
        return href;
    }

    // Ignore links that do not point to markdown files (e.g. static assets)
    if (!href.toLowerCase().endsWith('.md')) {
        return href;
    }

    // Isolate the parent directory of this item's route (strip trailing slug segment)
    const fromDir = fromRoute.replace(/\/$/, '').split('/').slice(0, -1).join('/') + '/';

    // Resolve the raw href relative to that directory, strip .md, and append slash
    const resolved = path.posix.resolve(fromDir, href.replace(/\.md$/i, ''));
    const targetRoute = resolved + '/';

    return relativeRouteHref(fromRoute, targetRoute);
}

/**
 * Recursively scans inline nodes to resolve markdown file links.
 *
 * @param nodes - Array of InlineNode AST elements.
 * @param fromRoute - The canonical route string of the current document.
 * @returns A new array of InlineNode elements with updated link targets.
 */
function resolveInlineLinks(nodes: InlineNode[], fromRoute: string): InlineNode[] {
    return nodes.map(node => {
        if (node.kind === 'inline-link') {
            return {
                ...node,
                target: resolveMdLinkHref(node.target, fromRoute),
                children: resolveInlineLinks(node.children, fromRoute)
            };
        }

        if (
            node.kind === 'inline-strong' ||
            node.kind === 'inline-emphasis' ||
            node.kind === 'inline-super' ||
            node.kind === 'inline-sub'
        ) {
            return {
                ...node,
                children: resolveInlineLinks(node.children, fromRoute)
            };
        }

        return node;
    });
}

/**
 * Scans the entire AST tree to resolve relative markdown file links to static
 * HTML paths, leaving the original AST immutable.
 *
 * @param ast - The root markdown AST array.
 * @param route - The canonical route of the document being processed.
 * @returns A functionally pure copy of the AST tree with rewritten link targets.
 * @example
 * const safeAst = resolveLinks(rawAst, record.route);
 */
export function resolveLinks(ast: BlockNode[], route: string): BlockNode[] {
    return ast.map(node => {
        if (node.kind === 'block-paragraph' || node.kind === 'block-heading') {
            return {
                ...node,
                children: resolveInlineLinks(node.children, route)
            };
        }

        if (node.kind === 'block-quote') {
            return {
                ...node,
                children: resolveLinks(node.children, route)
            };
        }

        if (node.kind === 'block-list') {
            return {
                ...node,
                items: node.items.map(item => ({
                    ...item,
                    children: resolveInlineLinks(item.children, route)
                }))
            };
        }

        return node;
    });
}

/**
 * Computes a relative HTML href for an asset (e.g. style.css) from the current route.
 *
 * @param fromRoute - The canonical route of the originating page.
 * @param assetName - The filename of the asset.
 * @returns The resolved relative path to the asset.
 * @example
 * relativeAssetHref('/articles/2026/03/the-fuel-of-intent/', 'style.css')
 * // Returns: "../../../../style.css"
 */
export function relativeAssetHref(fromRoute: string, assetName: string): string {
    const from = splitRoute(fromRoute);
    const upPart = from.length > 0 ? '../'.repeat(from.length) : '';
    return `${upPart}${assetName}`;
}
