import type { BlockNode } from "../../modules/md/types";
import type { TocItem } from "./toc";

export type ContentKind = "article" | "page";

export interface ContentItem {
    kind: ContentKind;
    title: string;
    slug: string;
    canonicalPath: string;
    route: string;
    sourcePath: string;
    summary?: string;
    date?: string;
    author?: string;
    conceivedDate?: string;
    nodes: BlockNode[];
    toc: TocItem[];
    children: ContentItem[];
}


export interface SiteData {
    articles: ContentItem[];
    pages: ContentItem[];
}
