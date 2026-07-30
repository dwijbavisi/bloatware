import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { formatDate } from '../lib/formatDate';
import type { ChildRecord } from '../../modules/router/types';
import type { BlockNode } from '../../modules/md-parser';
import { MarkdownRenderer } from '../../modules/md-render';
import { CoreLayout } from './CoreLayout';

/**
 * Props for the IndexTemplate component.
 *
 * @property recentArticles - Array of recently published article records to display.
 * @property introNodes - Array of AST nodes parsed from the project's readMe.md to display at the top.
 */
export interface IndexTemplateProps {
    recentArticles: ChildRecord[];
    introNodes: BlockNode[];
}

/**
 * Renders the homepage view, displaying an introduction and a list of recent articles.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 * @example
 * <IndexTemplate recentArticles={records} introNodes={ast} />
 */
export function IndexTemplate({ recentArticles, introNodes }: IndexTemplateProps): JSX.Element {
    return (
        <CoreLayout title="bloatware-site" pageTitle="Index" currentRoute="/" showPageTitle={false}>
            {introNodes && introNodes.length > 0 && (
                <section className="intro prose">
                    <MarkdownRenderer nodes={introNodes} />
                </section>
            )}
            <div className="prose">
                <hr />
                <h2>Recent Articles</h2>
                <ul className="article-list">
                    {recentArticles.map((item) => (
                        <li key={item.route}>
                            <a href={relativeRouteHref("/", item.route)}>{item.title}</a>
                            {item.date && (
                                <span className="meta"> {formatDate(item.date)}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </CoreLayout>
    );
}
