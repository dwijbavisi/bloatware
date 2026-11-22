import type { SearchEntry } from '../../modules/search-index';

export interface SearchMatch {
    item: SearchEntry;
    score: number;
    snippet: string;
}

/**
 * Escapes characters for safe inclusion in regular expressions.
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapes HTML characters in a string to avoid injection.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Generates an excerpt snippet with matched words highlighted using <mark>.
 */
function generateSnippet(text: string, tokens: string[], maxLen = 130): string {
    if (!text) return '';
    if (tokens.length === 0) {
        return escapeHtml(text.slice(0, maxLen)) + (text.length > maxLen ? '…' : '');
    }

    const lower = text.toLowerCase();
    let bestIdx = -1;
    for (const t of tokens) {
        const idx = lower.indexOf(t);
        if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
            bestIdx = idx;
        }
    }

    if (bestIdx === -1) {
        return escapeHtml(text.slice(0, maxLen)) + (text.length > maxLen ? '…' : '');
    }

    const start = Math.max(0, bestIdx - 40);
    const end = Math.min(text.length, start + maxLen);
    let excerpt = text.slice(start, end);

    if (start > 0) excerpt = '…' + excerpt;
    if (end < text.length) excerpt = excerpt + '…';

    let escaped = escapeHtml(excerpt);

    // Highlight all token matches in the snippet
    for (const t of tokens) {
        if (!t) continue;
        const re = new RegExp(`(${escapeRegex(escapeHtml(t))})`, 'gi');
        escaped = escaped.replace(re, '<mark class="search-highlight">$1</mark>');
    }

    return escaped;
}

/**
 * Client-side search engine providing fast, multi-tier ranking and snippet highlighting.
 */
export class SearchEngine {
    private entries: SearchEntry[] = [];
    private loaded = false;

    /**
     * Initializes the engine with pre-indexed search records.
     */
    public setIndex(entries: SearchEntry[]): void {
        this.entries = entries;
        this.loaded = true;
    }

    public isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * Queries the index and returns scored, sorted results with snippet highlights.
     *
     * @param rawQuery - User input search query.
     * @param limit - Maximum number of results to return (default 8).
     */
    public query(rawQuery: string, limit = 8): SearchMatch[] {
        const q = rawQuery.trim().toLowerCase();
        if (!this.loaded || this.entries.length === 0) {
            return [];
        }

        // Empty query: Return most recent documents as default recommendations
        if (!q) {
            const sorted = [...this.entries].sort((a, b) => {
                if (a.date && b.date) return a.date < b.date ? 1 : -1;
                return a.title.localeCompare(b.title);
            });
            return sorted.slice(0, limit).map((item) => ({
                item,
                score: 1,
                snippet: generateSnippet(item.summary || item.content, [])
            }));
        }

        const tokens = q.split(/\s+/).filter(Boolean);
        const matches: SearchMatch[] = [];

        for (const item of this.entries) {
            const titleLower = item.title.toLowerCase();
            const summaryLower = (item.summary || '').toLowerCase();
            const contentLower = item.content.toLowerCase();
            const headingsLower = item.headings.map(h => h.toLowerCase());

            let score = 0;
            let matchedTokens = 0;

            // Check how many tokens match anywhere in this document
            for (const t of tokens) {
                const inTitle = titleLower.includes(t);
                const inHeading = headingsLower.some(h => h.includes(t));
                const inSummary = summaryLower.includes(t);
                const inContent = contentLower.includes(t);

                if (inTitle || inHeading || inSummary || inContent) {
                    matchedTokens++;
                }

                if (inTitle) score += 30;
                if (inHeading) score += 20;
                if (inSummary) score += 12;
                if (inContent) score += 6;
            }

            // If not all tokens match, discard (unless single-token search)
            if (matchedTokens < tokens.length) {
                continue;
            }

            // Phrase match bonuses
            if (titleLower === q) {
                score += 150;
            } else if (titleLower.startsWith(q)) {
                score += 80;
            } else if (titleLower.includes(q)) {
                score += 50;
            }

            if (headingsLower.some(h => h.includes(q))) {
                score += 35;
            }

            if (summaryLower.includes(q)) {
                score += 25;
            }

            if (contentLower.includes(q)) {
                score += 20;
            }

            // Recency tiebreaker bonus
            if (item.date) {
                const year = parseInt(item.date.slice(0, 4), 10);
                if (!isNaN(year)) {
                    score += Math.min(5, Math.max(0, year - 2020));
                }
            }

            const snippet = generateSnippet(item.content || item.summary || '', tokens);

            matches.push({
                item,
                score,
                snippet
            });
        }

        matches.sort((a, b) => b.score - a.score);
        return matches.slice(0, limit);
    }
}
