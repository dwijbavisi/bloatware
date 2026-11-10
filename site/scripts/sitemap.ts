/**
 * Types and utilities for generating sitemap.xml and robots.txt.
 */

export interface SitemapRouteEntry {
    route: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: string;
}

export const DEFAULT_SITE_ORIGIN = 'https://bloatware.crabwire.net';

/**
 * Normalizes an arbitrary date string into a W3C-compliant YYYY-MM-DD string.
 *
 * @param dateStr - The raw date string (e.g. "2026-03", "2026-03-15", or full timestamp).
 * @returns Normalized YYYY-MM-DD or undefined if invalid.
 */
export function normalizeLastmod(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;
    const trimmed = dateStr.trim();

    // Already valid YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    // YYYY-MM -> default to first day of month
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
        return `${trimmed}-01`;
    }

    // Try parsing as Date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return undefined;
}

/**
 * Generates an XML string conforming to the sitemaps.org protocol 0.9.
 *
 * @param entries - List of sitemap route entries.
 * @param origin - Base URL of the website.
 * @returns The XML document string.
 */
export function generateSitemapXml(
    entries: SitemapRouteEntry[],
    origin: string = DEFAULT_SITE_ORIGIN
): string {
    const cleanOrigin = origin.replace(/\/+$/, '');
    const urls = entries
        .filter(entry => entry.route !== '/404.html' && entry.route !== '/404')
        .map(entry => {
            const path = entry.route.startsWith('/') ? entry.route : `/${entry.route}`;
            const loc = `${cleanOrigin}${path}`;
            const tags: string[] = [
                `    <loc>${loc}</loc>`
            ];

            const lastmod = normalizeLastmod(entry.lastmod);
            if (lastmod) {
                tags.push(`    <lastmod>${lastmod}</lastmod>`);
            }
            if (entry.changefreq) {
                tags.push(`    <changefreq>${entry.changefreq}</changefreq>`);
            }
            if (entry.priority) {
                tags.push(`    <priority>${entry.priority}</priority>`);
            }

            return `  <url>\n${tags.join('\n')}\n  </url>`;
        })
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Generates robots.txt content referencing the canonical sitemap location.
 *
 * @param origin - Base URL of the website.
 * @returns robots.txt file string.
 */
export function generateRobotsTxt(origin: string = DEFAULT_SITE_ORIGIN): string {
    const cleanOrigin = origin.replace(/\/+$/, '');
    return [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${cleanOrigin}/sitemap.xml`,
        ''
    ].join('\n');
}
