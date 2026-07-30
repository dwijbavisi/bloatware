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
 * Renders the global site header and navigation.
 * 
 * @param props - Component props.
 * @returns The `<header>` element.
 * @example
 * <Header currentRoute="/articles/my-post/" toc={items} />
 */
export function Header({ currentRoute, toc }: HeaderProps): JSX.Element {
    return (
        <header className="site-header">
            <div className="inner">
                <a className="brand" href={relativeRouteHref(currentRoute, "/")}>
                    bloatware-site
                </a>
                <nav>
                    <TableOfContents toc={toc} />
                    <a className="nav-link" href={relativeRouteHref(currentRoute, "/articles/")}>Articles</a>
                    <a className="nav-link" href={relativeRouteHref(currentRoute, "/pages/")}>Pages</a>
                </nav>
            </div>
        </header>
    );
}
