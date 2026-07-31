import React from 'react';
import { relativeAssetHref } from '../../modules/link-resolver';
import { Header } from '../components/Header';
import type { TocItem } from '../lib/toc';

/**
 * Props for the CoreLayout template.
 *
 * @property title - The HTML `<title>` tag string.
 * @property pageTitle - The `<h1>` title string rendered on the page.
 * @property currentRoute - The current absolute route for link resolution.
 * @property showPageTitle - Optional flag to hide the `<h1>` (defaults to true).
 * @property toc - Optional Table of Contents array.
 * @property children - React nodes to render inside the main body.
 */
export interface CoreLayoutProps {
    title: string;
    pageTitle: string;
    currentRoute: string;
    showPageTitle?: boolean;
    toc?: TocItem[];
    children: React.ReactNode;
}

/**
 * Renders the top-level HTML document shell, including the `<head>`,
 * global Header component, and `<main>` content wrapper.
 *
 * @param props - Component props.
 * @returns The `<html>` document.
 * @example
 * <CoreLayout title="My Page" pageTitle="Welcome" currentRoute="/my-page/">
 *     <p>Content</p>
 * </CoreLayout>
 */
export function CoreLayout({ title, pageTitle, currentRoute, showPageTitle = true, toc, children }: CoreLayoutProps): React.JSX.Element {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                <link rel="stylesheet" href={relativeAssetHref(currentRoute, "assets/styles.css")} />
                <script defer src={relativeAssetHref(currentRoute, "assets/interaction.js")}></script>
            </head>
            <body>
                <Header currentRoute={currentRoute} toc={toc} />
                <main className="inner">
                    {showPageTitle && <h1>{pageTitle}</h1>}
                    {children}
                </main>
            </body>
        </html>
    );
}
