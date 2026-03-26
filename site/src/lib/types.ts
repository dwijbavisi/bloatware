export type ContentKind = "article" | "page";

export interface ContentItem {
    kind: ContentKind;
    title: string;
    slug: string;
    route: string;
    sourcePath: string;
    summary?: string;
    date?: string;
    html: string;
}

export interface SiteData {
    articles: ContentItem[];
    pages: ContentItem[];
}
