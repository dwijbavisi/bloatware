import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { formatDate } from '../lib/formatDate';
import type { ChildRecord } from '../../modules/router/types';
import { CoreLayout } from './CoreLayout';

/**
 * Props for the ArticleIndexTemplate component.
 *
 * @property items - Array of article records to display chronologically.
 */
export interface ArticleIndexTemplateProps {
    items: ChildRecord[];
}

/**
 * Renders the article index view, grouping articles by year of publication.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 * @example
 * <ArticleIndexTemplate items={articleRecords} />
 */
export function ArticleIndexTemplate({ items }: ArticleIndexTemplateProps): React.JSX.Element {
    // Group by year (date is YYYY-MM-DD or YYYY-MM)
    const byYear = new Map<string, ChildRecord[]>();
    for (const item of items) {
        const year = item.date ? item.date.slice(0, 4) : "Undated";
        if (!byYear.has(year)) byYear.set(year, []);
        byYear.get(year)!.push(item);
    }
    const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));

    return (
        <CoreLayout title="Articles | bloatware-site" pageTitle="Articles" currentRoute="/articles/">
            {years.map((year) => (
                <section key={year} className="year-group">
                    <h2 className="year-label">{year}</h2>
                    <ul className="article-list">
                        {byYear.get(year)!.map((item) => (
                            <li key={item.route}>
                                <a href={relativeRouteHref("/articles/", item.route)}>{item.title}</a>
                                {item.date && (
                                    <span className="meta"> {formatDate(item.date)}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </CoreLayout>
    );
}
