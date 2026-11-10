import React from 'react';
import { relativeAssetHref } from '../../modules/link-resolver';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import type { TocItem } from '../lib/toc';

/**
 * Props for the CoreLayout template.
 *
 * @property title - The HTML `<title>` tag string.
 * @property pageTitle - The `<h1>` title string rendered on the page.
 * @property currentRoute - The current absolute route for link resolution.
 * @property showPageTitle - Optional flag to hide the `<h1>` (defaults to true).
 * @property isNotFound - Optional flag indicating this is a 404 page requiring dynamic base resolution.
 * @property toc - Optional Table of Contents array.
 * @property children - React nodes to render inside the main body.
 */
export interface CoreLayoutProps {
    title: string;
    pageTitle: string;
    currentRoute: string;
    description?: string;
    showPageTitle?: boolean;
    isNotFound?: boolean;
    toc?: TocItem[];
    children: React.ReactNode;
}

/**
 * Renders the top-level HTML document shell, including the `<head>`,
 * global Header component, and `<main>` content wrapper configured
 * with Biocircuit layout and theme systems.
 *
 * @param props - Component props.
 * @returns The `<html>` document.
 * @example
 * <CoreLayout title="My Page" pageTitle="Welcome" currentRoute="/my-page/">
 *     <p>Content</p>
 * </CoreLayout>
 */
export function CoreLayout({ title, pageTitle, currentRoute, description, showPageTitle = true, isNotFound = false, toc, children }: CoreLayoutProps): React.JSX.Element {
    const siteOrigin = 'https://bloatware.crabwire.net';
    const canonicalPath = currentRoute === '/' ? '/' : currentRoute.replace(/\/+$/, '') + '/';
    const canonicalUrl = `${siteOrigin}${canonicalPath}`;
    const defaultDescription = 'Project bloatware - Just a spot for my thoughts on the world and the ideas I follow.';
    const metaDescription = (description || defaultDescription).replace(/\s+/g, ' ').trim();
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
                <meta name="description" content={metaDescription} />
                {!isNotFound && <link rel="canonical" href={canonicalUrl} />}
                {isNotFound && <meta name="robots" content="noindex, nofollow" />}
                <meta property="og:title" content={title} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={metaDescription} />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var t=localStorage.getItem('biocircuit-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`
                    }}
                />
                {isNotFound && (
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `(function(){if(window.location.protocol!=='file:'){var p=window.location.pathname.indexOf('/bloatware')===0?'/bloatware/':'/';document.write('<base href="'+window.location.origin+p+'">');}})();`
                        }}
                    />
                )}
                <link rel="stylesheet" href={relativeAssetHref(currentRoute, "assets/styles.css")} />
                <script defer src={relativeAssetHref(currentRoute, "assets/interaction.js")}></script>
            </head>
            <body>
                <Header currentRoute={currentRoute} toc={toc} />
                <main className="inner cwbwbc-board">
                    {showPageTitle && <h1>{pageTitle}</h1>}
                    {children}
                </main>
                <Footer currentRoute={currentRoute} />
            </body>
        </html>
    );
}
