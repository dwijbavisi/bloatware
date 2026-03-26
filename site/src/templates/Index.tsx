import React from "react";
import { ContentItem } from "../lib/types";
import { relativeRouteHref } from "../lib/paths";
import { Layout } from "./Layout";

interface IndexTemplateProps {
    latestArticles: ContentItem[];
    keyPages: ContentItem[];
}

export function IndexTemplate({ latestArticles, keyPages }: IndexTemplateProps): JSX.Element {
    return (
        <Layout title="bloatware-site" pageTitle="Index" currentRoute="/">
            <p className="lede">
                Static-first blog generated from markdown in content/articles and content/pages.
            </p>

            <section>
                <h2>Latest Articles</h2>
                <ul>
                    {latestArticles.map((item) => (
                        <li key={item.route}>
                            <a href={relativeRouteHref("/", item.route)}>{item.title}</a>
                            {item.date ? <span className="meta"> {item.date}</span> : null}
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
