import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { formatDate } from '../lib/formatDate';
import type { ChildRecord } from '../../modules/router/types';
import type { BlockNode } from '../../modules/md-parser';
import { MarkdownRenderer } from '../../modules/md-render';
import { ArticleTitle } from '../components/ArticleTitle';
import { CoreLayout } from './CoreLayout';

/**
 * Props for the IndexTemplate component.
 *
 * @property recentArticles - Array of recently published article records to display.
 * @property pages - Optional array of page records to display.
 * @property introNodes - Array of AST nodes parsed from the project's readMe.md to display at the top.
 */
export interface IndexTemplateProps {
    recentArticles: ChildRecord[];
    pages?: ChildRecord[];
    introNodes: BlockNode[];
}

/**
 * Renders the homepage view, displaying an introduction, recent articles, and pages.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 * @example
 * <IndexTemplate recentArticles={records} pages={pageRecords} introNodes={ast} />
 */
export function IndexTemplate({ recentArticles, pages = [], introNodes }: IndexTemplateProps): React.JSX.Element {
    return (
        <CoreLayout title="bloatware-site" pageTitle="Index" currentRoute="/" showPageTitle={false}>
            {introNodes && introNodes.length > 0 && (
                <section className="intro prose">
                    <MarkdownRenderer nodes={introNodes} />
                </section>
            )}
            <div className="prose">
                <hr />
                <div className="section-header">
                    <h2>Recent Articles</h2>
                    <a href={relativeRouteHref("/", "/articles/")} className="section-more">
                        All articles →
                    </a>
                </div>
                <ul className="article-list">
                    {recentArticles.map((item) => (
                        <li key={item.route}>
                            <a href={relativeRouteHref("/", item.route)}>
                                <ArticleTitle title={item.title} />
                            </a>
                            {item.date && (
                                <span className="meta"> {formatDate(item.date)}</span>
                            )}
                        </li>
                    ))}
                </ul>

                {pages && pages.length > 0 && (
                    <>
                        <hr />
                        <div className="section-header">
                            <h2>Pages</h2>
                            <a href={relativeRouteHref("/", "/pages/")} className="section-more">
                                All pages →
                            </a>
                        </div>
                        <ul className="article-list">
                            {pages.map((item) => (
                                <li key={item.route}>
                                    <a href={relativeRouteHref("/", item.route)}>
                                        {item.title}
                                    </a>
                                    {item.date ? (
                                        <span className="meta"> {formatDate(item.date)}</span>
                                    ) : item.canonicalPath ? (
                                        <span className="meta">{item.canonicalPath}</span>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </CoreLayout>
    );
}
