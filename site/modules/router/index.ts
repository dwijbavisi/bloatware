import path from 'node:path';
import type { RawContentRecord } from '../discovery/types';
import type { ContentRecord, ChildRecord } from './types';
import type { HeadingBlockNode, ParagraphBlockNode, BlockNode } from '../md-parser';
import { inlineToText } from '../md-parser';
import { Logger } from '../logger';

const log = new Logger('module:router');

/**
 * Normalizes a slug to its canonical path by removing redundant trailing segments
 * (like /readme or duplicate folder names).
 *
 * @param slug - The raw slug string.
 * @returns The normalized canonical path.
 * @example
 * const path = toCanonicalPath('pages/about/team/team');
 * // Returns: "pages/about/team"
 */
function toCanonicalPath(slug: string): string {
    const parts = slug.split('/');
    const last = parts[parts.length - 1];

    if (
        last.toLowerCase() === 'readme' ||
        (parts.length >= 2 && last === parts[parts.length - 2])
    ) {
        return parts.slice(0, -1).join('/');
    }
    return slug;
}

/**
 * Infers the page title by extracting plain text from the first H1 tag,
 * or falling back to the filename if no H1 is found.
 *
 * @param ast - The parsed markdown AST.
 * @param fallbackFilename - The filename to use if no H1 exists.
 * @returns The pure text string of the title.
 * @example
 * const title = inferTitle(ast, 'about.md');
 * // Returns: "About Us"
 */
function inferTitle(ast: BlockNode[], fallbackFilename: string): string {
    const h1 = ast.find(n => n.kind === 'block-heading' && n.level === 1) as HeadingBlockNode | undefined;
    if (h1) {
        return inlineToText(h1.children).trim();
    }
    return path.parse(fallbackFilename).name;
}

/**
 * Derives a short summary from the first paragraph of the AST.
 *
 * @param ast - The parsed markdown AST.
 * @returns The first 180 characters of the first paragraph, or undefined.
 * @example
 * const summary = deriveSummary(ast);
 * // Returns: "This is the first sentence of the article..."
 */
function deriveSummary(ast: BlockNode[]): string | undefined {
    const p = ast.find(n => n.kind === 'block-paragraph') as ParagraphBlockNode | undefined;
    if (p) {
        const text = inlineToText(p.children).trim();
        return text ? text.slice(0, 180) : undefined;
    }
    return undefined;
}

/**
 * Infers a standard YYYY-MM-DD date from frontmatter metadata or the file path slug.
 *
 * @param published - The raw published string from metadata (e.g. "March 26, 2026").
 * @param slug - The article slug (e.g. "2026/03/my-post").
 * @returns Formatted YYYY-MM-DD date string, or undefined.
 * @example
 * const date = inferDate("March 26, 2026", "2026/03/my-post");
 * // Returns: "2026-03-26"
 */
function inferDate(published: string | undefined, slug: string): string | undefined {
    if (published) {
        const MONTH_MAP: Record<string, string> = {
            january: '01',
            february: '02',
            march: '03',
            april: '04',
            may: '05',
            june: '06',
            july: '07',
            august: '08',
            september: '09',
            october: '10',
            november: '11',
            december: '12',
        };
        const m = published.match(
            /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i
        );
        if (m) {
            return `${m[3]}-${MONTH_MAP[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}`;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(published.trim())) {
            return published.trim();
        }
    }

    const match = slug.match(/(\d{4})\/(\d{2})\//);
    if (match) return `${match[1]}-${match[2]}`;

    return undefined;
}

/**
 * Intercepts the raw content stream, computes routes, extracts metadata,
 * builds hierarchy via a lightweight map, and yields fully routed ContentRecords.
 *
 * @param stream - The async generator yielding RawContentRecords (deepest first).
 * @returns An AsyncGenerator yielding ContentRecord objects.
 * @example
 * const routedStream = buildRouteHierarchy(discoveryStream);
 * for await (const record of routedStream) {
 *     console.log(record.route); // "/articles/my-post/"
 * }
 */
export async function* buildRouteHierarchy(
    stream: AsyncGenerator<RawContentRecord>
): AsyncGenerator<ContentRecord> {
    log.info('Starting route generation stream...');

    // Lightweight cache mapping a parent's canonical path to its children's footprints
    const childCache = new Map<string, ChildRecord[]>();

    for await (const raw of stream) {
        const slug = raw.sourcePath.replace(/\.md$/i, '');
        const canonicalPath = toCanonicalPath(slug);

        // Define route strings
        const kindSegment = raw.kind === 'article' ? 'articles' : 'pages';
        const route = `/${kindSegment}/${slug}/`;
        const outputPath = `${kindSegment}/${slug}/index.html`;

        const title = inferTitle(raw.ast, raw.sourcePath);
        const summary = deriveSummary(raw.ast);
        const date = inferDate(raw.metadata.published, slug);

        // Fetch children from cache if we are a parent (they were processed before us!)
        const children = childCache.get(canonicalPath) || [];

        // Sort children by date descending, or alphabetically by title
        children.sort((a, b) => {
            if (a.date && b.date) {
                return a.date < b.date ? 1 : -1;
            }
            return a.title.localeCompare(b.title);
        });

        const record: ContentRecord = {
            id: `${raw.kind}:${slug}`,
            kind: raw.kind,
            sourcePath: raw.sourcePath,
            slug,
            canonicalPath,
            route,
            outputPath,
            title,
            summary,
            metadata: raw.metadata,
            ast: raw.ast,
            children
        };

        // Cache our own lightweight footprint for our parent
        const parentCanonical = canonicalPath.split('/').slice(0, -1).join('/');
        if (parentCanonical) {
            if (!childCache.has(parentCanonical)) {
                childCache.set(parentCanonical, []);
            }
            childCache.get(parentCanonical)!.push({
                id: record.id,
                title,
                route,
                summary,
                date
            });
        }

        yield record;
    }

    log.info('Route generation stream completed.');
}
