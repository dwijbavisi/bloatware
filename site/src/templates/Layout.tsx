import React from "react";
import { relativeAssetHref, relativeRouteHref } from "../lib/paths";

interface LayoutProps {
    title: string;
    pageTitle: string;
    currentRoute: string;
    children: React.ReactNode;
}

export function Layout({ title, pageTitle, currentRoute, children }: LayoutProps): JSX.Element {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                <link rel="stylesheet" href={relativeAssetHref(currentRoute, "styles.css")} />
            </head>
            <body>
                <header className="site-header">
                    <div className="inner">
                        <a className="brand" href={relativeRouteHref(currentRoute, "/")}>
                            bloatware-site
                        </a>
                        <nav>
                            <a href={relativeRouteHref(currentRoute, "/articles/")}>Articles</a>
                            <a href={relativeRouteHref(currentRoute, "/pages/")}>Pages</a>
                        </nav>
                    </div>
                </header>
                <main className="inner">
                    <h1>{pageTitle}</h1>
                    {children}
                </main>
            </body>
        </html>
    );
}
