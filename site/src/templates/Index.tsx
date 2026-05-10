import React from "react";
import { ContentItem } from "../lib/types";
import { relativeRouteHref } from "../lib/paths";
import { formatDate } from "../lib/formatDate";
import { MarkdownRenderer } from "../../modules/md/components/Renderer";
import type { BlockNode } from "../../modules/md/types";
import { Layout } from "./Layout";

interface IndexTemplateProps {
    latestArticles: ContentItem[];
    keyPages: ContentItem[];
    introNodes: BlockNode[];
}

export function IndexTemplate({ latestArticles, keyPages, introNodes }: IndexTemplateProps): JSX.Element {
    return (
        <Layout title="bloatware-site" pageTitle="Index" currentRoute="/" showPageTitle={false}>
            {introNodes.length > 0 && (
                <section className="intro">
                    <MarkdownRenderer nodes={introNodes} />
                </section>
            )}

            <section>
                <h2>Latest Articles</h2>
                <ul>
                    {latestArticles.map((item) => (
                        <li key={item.route}>
                            <a href={relativeRouteHref("/", item.route)}>{item.title}</a>
                            {item.date ? <span className="meta"> {formatDate(item.date)}</span> : null}
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h2>Key Pages</h2>
                <ul>
                    {keyPages.map((item) => (
                        <li key={item.route}>
                            <a href={relativeRouteHref("/", item.route)}>{item.title}</a>
                        </li>
                    ))}
                </ul>
            </section>
        </Layout>
    );
}
