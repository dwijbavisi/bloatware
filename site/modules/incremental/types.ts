import type { RawContentRecord, ContentKind } from '../discovery/types';
import type { ContentRecord } from '../router/types';
import type { SitemapRouteEntry } from '../../scripts/sitemap';
import type { SearchEntry } from '../search-index';
import type { BlockNode } from '../md-parser';

export interface ContentCacheItem {
    kind: ContentKind | 'readme';
    sourcePath: string;
    absolutePath: string;
    contentHash: string;
    mtimeMs: number;
    ast: BlockNode[];
    metadata: Record<string, any>;
    searchData?: {
        headings: string[];
        content: string;
    };
}

export interface RouteCacheItem {
    route: string;
    outputPath: string;
    html: string;
    htmlHash: string;
    contentId: string;
    dependencyHash: string;
    sitemapEntry?: SitemapRouteEntry;
}

export interface BuildManifest {
    version: number;
    codeHash: string;
    assetHashes: Record<string, string>;
    contentItems: Record<string, ContentCacheItem>;
    routeItems: Record<string, RouteCacheItem>;
    searchEntries: SearchEntry[];
    sitemapEntries: SitemapRouteEntry[];
    timestamp: string;
}

export interface IncrementalBuildOptions {
    forceClean?: boolean;
    rootDir?: string;
    cacheDir?: string;
    distDir?: string;
}

export interface IncrementalBuildStats {
    totalRoutes: number;
    rebuiltRoutes: number;
    cachedRoutes: number;
    deletedRoutes: number;
    durationMs: number;
    codeChanged: boolean;
    assetsChanged: boolean;
    contentChangedFiles: number;
}

export interface IncrementalBuildResult {
    routeMap: Map<string, string>;
    changedRoutes: Set<string>;
    deletedRoutes: Set<string>;
    sitemapEntries: SitemapRouteEntry[];
    searchEntries: SearchEntry[];
    stats: IncrementalBuildStats;
}
