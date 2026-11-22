/**
 * Normalizes and resolves a relative POSIX path against a base directory.
 */
function posixResolve(baseDir: string, relativePath: string): string {
    const stack = baseDir.split('/').filter(Boolean);
    const parts = relativePath.split('/').filter(Boolean);
    for (const p of parts) {
        if (p === '.') continue;
        if (p === '..') {
            if (stack.length > 0) stack.pop();
        } else {
            stack.push(p);
        }
    }
    return '/' + stack.join('/');
}
import type {
    BlockNode,
    InlineNode
} from './md-parser/index.js';

/**
 * Splits a standard web route into directory segments and optional filename,
 * ignoring empty parts and root slash.
 *
 * @param route - The canonical route (e.g., "/articles/2026/03/the-fuel-of-intent/" or "/404.html")
 * @returns Object containing segments array and optional filename.
 * @example
 * splitRoute("/articles/my-post/index.html")
 * // Returns: { segments: ["articles", "my-post"], filename: "index.html" }
 */
function splitRoute(route: string): { segments: string[]; filename?: string } {
    let clean = route.replace(/^\/+|\/+$/g, '');
    let filename: string | undefined = undefined;

    if (clean.toLowerCase().endsWith('.html')) {
        const lastSlash = clean.lastIndexOf('/');
        if (lastSlash === -1) {
            filename = clean;
            clean = '';
        } else {
            filename = clean.slice(lastSlash + 1);
            clean = clean.slice(0, lastSlash);
        }
    }

    const segments = clean ? clean.split('/').filter(Boolean) : [];
    return { segments, filename };
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
    const from = splitRoute(fromRoute).segments;
    const { segments: to, filename } = splitRoute(toRoute);

    let common = 0;
    while (common < from.length && common < to.length && from[common] === to[common]) {
        common += 1;
    }

    const upCount = from.length - common;
    const down = to.slice(common);
    const targetFile = filename || 'index.html';

    if (upCount === 0 && down.length === 0) {
        return `./${targetFile}`;
    }

    const upPart = upCount > 0 ? '../'.repeat(upCount) : '';
    const downPart = down.length > 0 ? `${down.join('/')}/` : '';
    const base = `${upPart}${downPart}` || './';

    return `${base}${targetFile}`;
}

/**
 * Rewrites a relative .md file href to a static-site HTML path.
 * Ignores absolute URLs and anchor hashes. Preserves target heading fragments.
 *
 * @param href - The raw href found in the markdown link.
 * @param fromRoute - The canonical route of the document containing the link.
 * @returns The rewritten href string.
 * @example
 * resolveMdLinkHref('./another.md#heading', '/articles/my-post/')
 * // Returns: "../another/index.html#heading"
 */
function resolveMdLinkHref(href: string, fromRoute: string): string {
    // Ignore external URLs, mailto links, anchor hashes, and root absolute paths
    if (/^(https?:|mailto:|#|\/)/.test(href)) {
        return href;
    }

    const hashIndex = href.indexOf('#');
    const pathPart = hashIndex !== -1 ? href.slice(0, hashIndex) : href;
    const fragment = hashIndex !== -1 ? href.slice(hashIndex) : '';

    // Ignore links that do not point to markdown files (e.g. static assets)
    if (!pathPart.toLowerCase().endsWith('.md')) {
        return href;
    }

    // Isolate the parent directory of this item's route (strip trailing slug segment)
    const fromDir = fromRoute.replace(/\/$/, '').split('/').slice(0, -1).join('/') + '/';

    // Resolve the raw href relative to that directory, strip .md, and append slash
    const resolved = posixResolve(fromDir, pathPart.replace(/\.md$/i, ''));
    const targetRoute = resolved + '/';

    return `${relativeRouteHref(fromRoute, targetRoute)}${fragment}`;
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
    const from = splitRoute(fromRoute).segments;
    const upPart = from.length > 0 ? '../'.repeat(from.length) : '';
    return `${upPart}${assetName}`;
}

/**
 * Resolves a route or path to its full canonical path including index.html.
 *
 * @param route - The site route (e.g. "/", "/articles/", "/articles/my-post/")
 * @returns The full canonical path (e.g. "/index.html", "/articles/index.html", "/articles/my-post/index.html")
 * @example
 * toCanonicalFullPath("/")
 * // Returns: "/index.html"
 * toCanonicalFullPath("/articles/")
 * // Returns: "/articles/index.html"
 */
export function toCanonicalFullPath(route: string): string {
    const clean = route.startsWith('/') ? route : `/${route}`;
    if (clean === '/' || clean === '') {
        return '/index.html';
    }
    if (clean.endsWith('/index.html')) {
        return clean;
    }
    if (clean.endsWith('.html')) {
        return clean;
    }
    const normalized = clean.endsWith('/') ? clean : `${clean}/`;
    return `${normalized}index.html`;
}

