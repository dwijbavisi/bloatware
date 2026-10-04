import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';

/**
 * Props for the Footer component.
 *
 * @property currentRoute - The current absolute route to resolve relative links against.
 */
export interface FooterProps {
    currentRoute: string;
}

/**
 * Renders the global site footer across all pages.
 *
 * @param props - Component props.
 * @returns The `<footer>` element.
 * @example
 * <Footer currentRoute="/" />
 */
export function Footer({ currentRoute }: FooterProps): React.JSX.Element {
    return (
        <footer className="site-footer">
            <div className="inner">
                <div className="footer-content">
                    <div className="footer-brand">bloatware-site</div>
                    <div className="footer-links">
                        <a className="footer-link" href={relativeRouteHref(currentRoute, "/articles/")}>Articles</a>
                        <a className="footer-link" href={relativeRouteHref(currentRoute, "/pages/")}>Pages</a>
                        <a
                            className="footer-link"
                            href="https://github.com/dwijbavisi/bloatware"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
