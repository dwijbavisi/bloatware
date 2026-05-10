import React from "react";
import { relativeRouteHref } from "../lib/paths";
import { ContentItem } from "../lib/types";
import { MarkdownRenderer } from "../../modules/md/components/Renderer";
import { Layout } from "./Layout";

interface PagesTemplateProps {
    items: ContentItem[];
}

export function PagesTemplate({ items }: PagesTemplateProps): JSX.Element {
    return (
        <Layout title="Pages | bloatware-site" pageTitle="Pages" currentRoute="/pages/">
            <ul>
                {items.map((item) => (
                    <li key={item.route}>
                        <a href={relativeRouteHref("/pages/", item.route)}>{item.title}</a>
                    </li>
                ))}
            </ul>
        </Layout>
    );
}

interface PageDetailTemplateProps {
    item: ContentItem;
}

export function PageDetailTemplate({ item }: PageDetailTemplateProps): JSX.Element {
    return (
        <Layout title={`${item.title} | bloatware-site`} pageTitle={item.title} currentRoute={item.route} showPageTitle={false}>
            <article className="prose"><MarkdownRenderer nodes={item.nodes} /></article>
        </Layout>
    );
}
