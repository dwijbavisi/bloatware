import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { TableOfContents } from './TableOfContents';
import type { TocItem } from '../lib/toc';

/**
 * Props for the Header component.
 *
 * @property currentRoute - The current absolute route to resolve relative links against.
 * @property toc - Optional Table of Contents array.
 */
export interface HeaderProps {
    currentRoute: string;
    toc?: TocItem[];
}

/**
 * Renders the global site header and navigation mapped with Biocircuit layout,
 * cybernetic tokens, and modern responsive mobile navigation.
 *
 * @param props - Component props.
 * @returns The `<header>` element.
 * @example
 * <Header currentRoute="/articles/my-post/" toc={items} />
 */
export function Header({ currentRoute, toc }: HeaderProps): React.JSX.Element {
    return (
        <header className="site-header cwbwbc-board">
            <div className="inner header-container">
                <a className="brand" href={relativeRouteHref(currentRoute, "/")}>
                    bloatware-site
                </a>
                <div className="header-actions">
                    <TableOfContents toc={toc} />
                    <button
                        type="button"
                        className="theme-toggle"
                        data-interaction="theme-toggle"
                        aria-label="Toggle color theme"
                    >
                        ◑
                    </button>
                    <button
                        type="button"
                        className="mobile-nav-toggle"
                        data-interaction="mobile-menu-toggle"
                        aria-label="Toggle navigation menu"
                        aria-expanded="false"
                    >
                        <svg className="hamburger-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line className="line-top" x1="3" y1="6" x2="21" y2="6"></line>
                            <line className="line-mid" x1="3" y1="12" x2="21" y2="12"></line>
                            <line className="line-bot" x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <nav className="header-nav" id="site-navigation" aria-label="Main navigation">
                    <a className="nav-link" href={relativeRouteHref(currentRoute, "/articles/")}>Articles</a>
                    <a className="nav-link" href={relativeRouteHref(currentRoute, "/pages/")}>Pages</a>
                    <a className="nav-link" href={relativeRouteHref(currentRoute, "/zettelkasten/")}>Zettelkasten</a>
                </nav>
            </div>
        </header>
    );
}
