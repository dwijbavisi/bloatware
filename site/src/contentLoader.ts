import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { ContentItem, ContentKind, SiteData } from "./lib/types";

const ARTICLE_ROOT = path.resolve(process.cwd(), "../content/articles");
const PAGE_ROOT = path.resolve(process.cwd(), "../content/pages");

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

function inferTitle(filePath: string, content: string): string {
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch?.[1]) {
        return headingMatch[1].trim();
    }

    const parsed = path.parse(filePath);
    return parsed.name;
}

function inferDate(input: Record<string, unknown>, relativePath: string): string | undefined {
    const fromFrontmatter = input.date;
    if (typeof fromFrontmatter === "string" && fromFrontmatter.trim()) {
        return fromFrontmatter.trim();
    }

    const normalized = relativePath.replace(/\\/g, "/");
    const match = normalized.match(/(\d{4})\/(\d{2})\//);
    if (!match) {
        return undefined;
    }

    return `${match[1]}-${match[2]}`;
}

function deriveSummary(markdown: string): string | undefined {
    const lines = markdown
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith("#"));

    if (!lines.length) {
        return undefined;
    }

    return lines[0].slice(0, 180);
}

function toRoute(kind: ContentKind, slug: string): string {
    return `/${kind === "article" ? "articles" : "pages"}/${slug}/`;
}

async function loadKind(kind: ContentKind, rootDir: string): Promise<ContentItem[]> {
    const files = await findMarkdownFiles(rootDir);
    const items: ContentItem[] = [];

    for (const filePath of files) {
        const fileText = await fs.readFile(filePath, "utf8");
        const parsed = matter(fileText);
        const relativePath = path.relative(rootDir, filePath);
        const slug = relativePath.replace(/\\/g, "/").replace(/\.md$/i, "");
        const title =
            typeof parsed.data.title === "string" && parsed.data.title.trim()
                ? parsed.data.title.trim()
                : inferTitle(filePath, parsed.content);

        items.push({
            kind,
            title,
            slug,
            route: toRoute(kind, slug),
            sourcePath: relativePath.replace(/\\/g, "/"),
            summary: deriveSummary(parsed.content),
            date: inferDate(parsed.data, relativePath),
            html: marked.parse(parsed.content) as string
        });
    }

    items.sort((a, b) => {
        if (a.date && b.date) {
            return a.date < b.date ? 1 : -1;
        }
        return a.title.localeCompare(b.title);
    });

    return items;
}

export async function loadSiteData(): Promise<SiteData> {
    const [articles, pages] = await Promise.all([
        loadKind("article", ARTICLE_ROOT),
        loadKind("page", PAGE_ROOT)
    ]);

    return { articles, pages };
}
