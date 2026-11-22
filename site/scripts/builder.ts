import type { SitemapRouteEntry } from './sitemap';
import type { SearchEntry } from '../modules/search-index';
import {
    executeIncrementalBuild,
    type IncrementalBuildOptions,
    type IncrementalBuildResult
} from '../modules/incremental';

export { executeIncrementalBuild, type IncrementalBuildOptions, type IncrementalBuildResult };

/**
 * Builds or incrementally updates all routes in memory, populating optional
 * sitemap and search index collectors.
 */
export async function generateAllRoutes(
    sitemapCollector?: SitemapRouteEntry[],
    searchCollector?: SearchEntry[],
    options?: IncrementalBuildOptions
): Promise<Map<string, string>> {
    const result = await executeIncrementalBuild(options);

    if (sitemapCollector) {
        sitemapCollector.push(...result.sitemapEntries);
    }

    if (searchCollector) {
        searchCollector.push(...result.searchEntries);
    }

    return result.routeMap;
}
