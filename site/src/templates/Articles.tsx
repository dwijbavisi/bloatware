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
    // Group by year (date is YYYY-MM-DD or YYYY-MM)
    const byYear = new Map<string, ContentItem[]>();
    for (const item of items) {
        const year = item.date ? item.date.slice(0, 4) : "Undated";
        if (!byYear.has(year)) byYear.set(year, []);
        byYear.get(year)!.push(item);
    }
    const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

    return (
        <Layout title="Articles | bloatware-site" pageTitle="Articles" currentRoute="/articles/">
            {years.map((year) => (
                <section key={year} className="year-group">
                    <h2 className="year-label">{year}</h2>
                    <ul className="article-list">
                        {byYear.get(year)!.map((item) => (
                            <li key={item.route}>
                                <a href={relativeRouteHref("/articles/", item.route)}>{item.title}</a>
                                {item.date ? <span className="meta"> {formatDate(item.date)}</span> : null}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </Layout>
    );
}

interface ArticleDetailTemplateProps {
    item: ContentItem;
}

export function ArticleDetailTemplate({ item }: ArticleDetailTemplateProps): JSX.Element {
    return (
        <Layout title={`${item.title} | bloatware-site`} pageTitle={item.title} currentRoute={item.route} showPageTitle={false} toc={item.toc}>
            <article className="prose"><MarkdownRenderer nodes={item.nodes} /></article>
        </Layout>
    );
}
