import type { ContentRecord, SeriesInfo, SeriesPart } from '../../modules/router/types';

/**
 * Parses an article title to extract series prefix and part title.
 * A series title follows the pattern: `<SeriesName>: <PartTitle>`
 *
 * @param title - The raw article title.
 * @returns Object with seriesName and partTitle if title contains ':', otherwise null.
 * @example
 * parseSeriesTitle("Sign of Life: From Signal to Symbol")
 * // Returns: { seriesName: "Sign of Life", partTitle: "From Signal to Symbol" }
 */
export function parseSeriesTitle(title: string): { seriesName: string; partTitle: string } | null {
    const match = title.match(/^([^:]+):\s*(.+)$/);
    if (!match) return null;
    return {
        seriesName: match[1].trim(),
        partTitle: match[2].trim()
    };
}

/**
 * Formats a part number with leading zero (e.g. 1 -> "01", 3 -> "03").
 *
 * @param part - The part number.
 * @returns 2-digit zero-padded string.
 */
export function formatPartNumber(part: number): string {
    return String(part).padStart(2, '0');
}

/**
 * Scans all article records, identifies multi-part series by common title prefix,
 * orders them chronologically by publication date, and assigns complete
 * series metadata (part index, total count, previous/next links) directly to each record.
 *
 * @param articles - Array of ContentRecord objects for articles.
 */
export function enrichSeries(articles: ContentRecord[]): void {
    const groups = new Map<string, ContentRecord[]>();

    for (const article of articles) {
        const parsed = parseSeriesTitle(article.title);
        if (!parsed) continue;

        const key = parsed.seriesName.toLowerCase();
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(article);
    }

    for (const group of groups.values()) {
        // Only classify as a series if at least 2 articles share the prefix
        if (group.length <= 1) continue;

        // Sort chronologically ascending (earliest published is Part 01)
        group.sort((a, b) => {
            const dateA = a.date || a.slug;
            const dateB = b.date || b.slug;
            return dateA.localeCompare(dateB);
        });

        const total = group.length;
        const canonicalSeriesName = parseSeriesTitle(group[0].title)!.seriesName;

        const allParts: SeriesPart[] = group.map((item, idx) => {
            const parsed = parseSeriesTitle(item.title)!;
            return {
                title: item.title,
                partTitle: parsed.partTitle,
                route: item.route,
                part: idx + 1,
                date: item.date
            };
        });

        group.forEach((item, idx) => {
            const parsed = parseSeriesTitle(item.title)!;
            const part = idx + 1;
            const prev = idx > 0 ? allParts[idx - 1] : undefined;
            const next = idx < total - 1 ? allParts[idx + 1] : undefined;

            item.series = {
                name: canonicalSeriesName,
                part,
                total,
                partTitle: parsed.partTitle,
                prev,
                next,
                allParts
            };
        });
    }
}
