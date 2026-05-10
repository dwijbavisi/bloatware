import type { BlockNode } from "../../modules/md/types";

export type ContentKind = "article" | "page";

export interface ContentItem {
    kind: ContentKind;
    title: string;
    slug: string;
    route: string;
    sourcePath: string;
    summary?: string;
    date?: string;
    author?: string;
    conceivedDate?: string;
    nodes: BlockNode[];
}


export interface SiteData {
    articles: ContentItem[];
    pages: ContentItem[];
}
