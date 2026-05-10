import React from "react";
import { relativeAssetHref, relativeRouteHref } from "../lib/paths";
import type { TocItem } from "../lib/toc";

interface LayoutProps {
    title: string;
    pageTitle: string;
    currentRoute: string;
    showPageTitle?: boolean;
    toc?: TocItem[];
    children: React.ReactNode;
}

export function Layout({ title, pageTitle, currentRoute, showPageTitle = true, toc, children }: LayoutProps): JSX.Element {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                <link rel="stylesheet" href={relativeAssetHref(currentRoute, "styles.css")} />
                <script defer src={relativeAssetHref(currentRoute, "interaction.js")}></script>
            </head>
            <body>
                <header className="site-header">
                    <div className="inner">
                        <a className="brand" href={relativeRouteHref(currentRoute, "/")}>
                            bloatware-site
                        </a>
                        <nav>
                            {toc && toc.length > 0 && (
                                <details className="toc-dropdown" data-interaction="dismiss-outside">
                                    <summary>TOC <span className="toc-chevron">&#8964;</span></summary>
                                    <div className="toc-menu">
                                        {toc.map((item) => (
                                            <a
                                                key={item.id}
                                                href={`#${item.id}`}
                                                className={`toc-item toc-h${item.level}`}
                                            >
                                                {item.text}
                                            </a>
                                        ))}
                                    </div>
                                </details>
                            )}
                            <a className="nav-link" href={relativeRouteHref(currentRoute, "/articles/")}>Articles</a>
                            <a className="nav-link" href={relativeRouteHref(currentRoute, "/pages/")}>Pages</a>
                        </nav>
                    </div>
                </header>
                <main className="inner">
                    {showPageTitle && <h1>{pageTitle}</h1>}
                    {children}
                </main>
            </body>
        </html>
    );
}
