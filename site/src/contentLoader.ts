import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "../modules/md/index";
import type { BlockNode, BlockquoteNode, HeadingNode, InlineNode, LinkNode, ListNode, ParagraphNode, TextNode, BoldNode, ItalicNode, SupNode, SubNode } from "../modules/md/types";
import { ContentItem, ContentKind, SiteData } from "./lib/types";
import { relativeRouteHref } from "./lib/paths";
import { extractToc } from "./lib/toc";

const ARTICLE_ROOT = path.resolve(process.cwd(), "../content/articles");
const PAGE_ROOT = path.resolve(process.cwd(), "../content/pages");

function log(msg: string): void {
    console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function findMarkdownFiles(rootDir: string): Promise<string[]> {
    const results: string[] = [];

    async function walk(dir: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await walk(fullPath);
                continue;
            }

            if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
                results.push(fullPath);
            }
        }
    }

    await walk(rootDir);
    return results;
}

function inlineText(nodes: InlineNode[]): string {
    return nodes
        .map((n) => {
            if (n.type === "text") return (n as TextNode).value;
            if (n.type === "inline-code") return n.value;
            if ("children" in n && Array.isArray((n as BoldNode | ItalicNode).children)) {
                return inlineText((n as BoldNode).children);
            }
            return "";
        })
        .join("");
}

function inferTitle(nodes: HeadingNode[], filePath: string): string {
    const h1 = nodes.find((n) => n.level === 1);
    if (h1) return inlineText(h1.children);
    return path.parse(filePath).name;
}

function inferDate(published: string | undefined, relativePath: string): string | undefined {
    if (published) {
        const MONTH_MAP: Record<string, string> = {
            january: "01", february: "02", march: "03", april: "04",
            may: "05", june: "06", july: "07", august: "08",
            september: "09", october: "10", november: "11", december: "12",
        };
        const m = published.match(
            /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i
        );
        if (m) {
            return `${m[3]}-${MONTH_MAP[m[1].toLowerCase()]}-${m[2].padStart(2, "0")}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(published.trim())) {
            return published.trim();
        }
    }

    const normalized = relativePath.replace(/\\/g, "/");
    const match = normalized.match(/(\d{4})\/(\d{2})\//);
    if (match) return `${match[1]}-${match[2]}`;

    return undefined;
}

function deriveSummary(nodes: ParagraphNode[]): string | undefined {
    const para = nodes.find((n) => n.type === "paragraph") as ParagraphNode | undefined;
    if (!para) return undefined;
    const text = inlineText(para.children).trim();
    return text ? text.slice(0, 180) : undefined;
}

function toRoute(kind: ContentKind, slug: string): string {
    return `/${kind === "article" ? "articles" : "pages"}/${slug}/`;
}

function toCanonicalPath(slug: string): string {
    const parts = slug.split("/");
    const last = parts[parts.length - 1];
    if (
        last.toLowerCase() === "readme" ||
        (parts.length >= 2 && last === parts[parts.length - 2])
    ) {
        return parts.slice(0, -1).join("/");
    }
    return slug;
}

// ─── Link Resolution ──────────────────────────────────────────────────────────

/**
 * Rewrite a relative .md href to a static-site-relative HTML path.
 * e.g. "./who-picked-this-life-for-me.md" from "/articles/2026/03/the-fuel-of-intent/"
 *   →  "../who-picked-this-life-for-me/index.html"
 * External links, anchors, and non-.md hrefs are returned unchanged.
 */
function resolveMdLinkHref(href: string, fromRoute: string): string {
    if (/^(https?:|mailto:|#|\/)/.test(href)) return href;
    if (!href.toLowerCase().endsWith(".md")) return href;

    // Parent directory of this item's route (strip trailing slug segment)
    const fromDir = fromRoute.replace(/\/$/, "").split("/").slice(0, -1).join("/") + "/";

    // Resolve the href relative to that directory, strip .md, add trailing slash
    const resolved = path.posix.resolve(fromDir, href.replace(/\.md$/i, ""));
    const targetRoute = resolved + "/";

    const result = relativeRouteHref(fromRoute, targetRoute);
    log(`    link: "${href}" → "${result}"`);
    return result;
}

function resolveLinksInInline(node: InlineNode, fromRoute: string): InlineNode {
    switch (node.type) {
        case "link": {
            const n = node as LinkNode;
            return { ...n, href: resolveMdLinkHref(n.href, fromRoute), children: n.children.map((c) => resolveLinksInInline(c, fromRoute)) };
        }
        case "bold":
        case "italic":
        case "sup":
        case "sub": {
            const n = node as BoldNode | ItalicNode | SupNode | SubNode;
            return { ...n, children: n.children.map((c) => resolveLinksInInline(c, fromRoute)) };
        }
        default:
            return node;
    }
}

function resolveLinksInBlock(node: BlockNode, fromRoute: string): BlockNode {
    switch (node.type) {
        case "paragraph":
        case "heading": {
            const n = node as ParagraphNode | HeadingNode;
            return { ...n, children: n.children.map((c) => resolveLinksInInline(c, fromRoute)) };
        }
        case "blockquote": {
            const n = node as BlockquoteNode;
            return { ...n, children: n.children.map((c) => resolveLinksInBlock(c, fromRoute)) };
        }
        case "list": {
            const n = node as ListNode;
            return { ...n, items: n.items.map((item) => ({ children: item.children.map((c) => resolveLinksInInline(c, fromRoute)) })) };
        }
        default:
            return node;
    }
}

async function loadKind(kind: ContentKind, rootDir: string): Promise<ContentItem[]> {
    log(`Scanning ${kind}s in ${rootDir}...`);
    const files = await findMarkdownFiles(rootDir);
    log(`Found ${files.length} file(s) for kind "${kind}".`);
    const items: ContentItem[] = [];

    for (const filePath of files) {
        const relativePath = path.relative(rootDir, filePath);
        log(`  parsing: ${relativePath.replace(/\\/g, "/")}`);
        const fileText = await fs.readFile(filePath, "utf8");
        const { nodes, metadata } = parse(fileText);
        const slug = relativePath.replace(/\\/g, "/").replace(/\.md$/i, "");
        const canonicalPath = toCanonicalPath(slug);

        const headings = nodes.filter((n) => n.type === "heading") as HeadingNode[];
        const title = inferTitle(headings, filePath);
        const route = toRoute(kind, slug);
        const resolvedNodes = nodes.map((n) => resolveLinksInBlock(n, route));

        items.push({
            kind,
            title,
            slug,
            canonicalPath,
            route,
            sourcePath: relativePath.replace(/\\/g, "/"),
            summary: deriveSummary(nodes as ParagraphNode[]),
            date: inferDate(metadata.published, relativePath),
            author: metadata.author,
            conceivedDate: metadata.conceived,
            nodes: resolvedNodes,
            toc: extractToc(resolvedNodes),
            children: [],
        });
    }

    items.sort((a, b) => {
        if (a.date && b.date) {
            return a.date < b.date ? 1 : -1;
        }
        return a.title.localeCompare(b.title);
    });

    // Wire up direct children based on canonicalPath hierarchy
    for (const item of items) {
        item.children = items.filter((other) => {
            if (other === item) return false;
            if (!other.canonicalPath.startsWith(item.canonicalPath + "/")) return false;
            const remainder = other.canonicalPath.slice(item.canonicalPath.length + 1);
            return !remainder.includes("/");
        });
    }

    log(`Finished loading ${items.length} ${kind}(s).`);
    return items;
}

export async function loadSiteData(): Promise<SiteData> {
    const [articles, pages] = await Promise.all([
        loadKind("article", ARTICLE_ROOT),
        loadKind("page", PAGE_ROOT)
    ]);

    return { articles, pages };
}
