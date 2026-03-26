import React from "react";
import { relativeRouteHref } from "../lib/paths";
import { ContentItem } from "../lib/types";
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
                        {item.date ? <span className="meta"> {item.date}</span> : null}
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
        <Layout title={`${item.title} | bloatware-site`} pageTitle={item.title} currentRoute={item.route}>
            <article className="prose" dangerouslySetInnerHTML={{ __html: item.html }} />
        </Layout>
    );
}
