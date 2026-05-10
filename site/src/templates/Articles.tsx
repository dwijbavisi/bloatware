import React from "react";
import { relativeRouteHref } from "../lib/paths";
import { formatDate } from "../lib/formatDate";
import { ContentItem } from "../lib/types";
import { MarkdownRenderer } from "../../modules/md/components/Renderer";
import { Layout } from "./Layout";

interface ArticlesTemplateProps {
    items: ContentItem[];
}

export function ArticlesTemplate({ items }: ArticlesTemplateProps): JSX.Element {
    return (
        <Layout title="Articles | bloatware-site" pageTitle="Articles" currentRoute="/articles/">
            <ul>
                {items.map((item) => (
                    <li key={item.route}>
                        <a href={relativeRouteHref("/articles/", item.route)}>{item.title}</a>
                        {item.date ? <span className="meta"> {formatDate(item.date)}</span> : null}
                    </li>
                ))}
            </ul>
        </Layout>
    );
}

interface ArticleDetailTemplateProps {
    item: ContentItem;
}

export function ArticleDetailTemplate({ item }: ArticleDetailTemplateProps): JSX.Element {
    return (
        <Layout title={`${item.title} | bloatware-site`} pageTitle={item.title} currentRoute={item.route} showPageTitle={false}>
            <article className="prose"><MarkdownRenderer nodes={item.nodes} /></article>
        </Layout>
    );
}
