import React from 'react';
import type { SeriesInfo } from '../../modules/router/types';
import { relativeRouteHref } from '../../modules/link-resolver';
import { formatPartNumber } from '../lib/series';

export interface SeriesProps {
    series: SeriesInfo;
    currentRoute: string;
}

/**
 * Top-of-article banner displaying series membership and part index.
 * Example: "Part 01 / 03 of series Sign of Life"
 */
export function SeriesBanner({ series }: SeriesProps): React.JSX.Element {
    const partStr = formatPartNumber(series.part);
    const totalStr = formatPartNumber(series.total);

    return (
        <div className="series-banner" role="region" aria-label="Series information">
            <span className="series-badge">Series</span>
            <span className="series-banner-text">
                Part {partStr} / {totalStr} of series <strong>{series.name}</strong>
            </span>
        </div>
    );
}

/**
 * Bottom-of-article navigation offering previous and next options for series articles,
 * along with a quick overview of all parts.
 */
export function SeriesNav({ series, currentRoute }: SeriesProps): React.JSX.Element {
    const partStr = formatPartNumber(series.part);
    const totalStr = formatPartNumber(series.total);

    return (
        <nav className="series-nav" aria-label="Series navigation">
            <div className="series-nav-header">
                <div className="series-nav-meta">
                    <span className="series-badge">Series</span>
                    <span className="series-nav-name">{series.name}</span>
                </div>
                <span className="series-nav-progress">Part {partStr} of {totalStr}</span>
            </div>

            <div className="series-nav-links">
                {series.prev ? (
                    <a
                        href={relativeRouteHref(currentRoute, series.prev.route)}
                        className="series-nav-card series-nav-prev"
                        rel="prev"
                    >
                        <span className="series-nav-direction">← Previous Part</span>
                        <span className="series-nav-card-title">{series.prev.partTitle}</span>
                    </a>
                ) : (
                    <div className="series-nav-card-empty" />
                )}

                {series.next ? (
                    <a
                        href={relativeRouteHref(currentRoute, series.next.route)}
                        className="series-nav-card series-nav-next"
                        rel="next"
                    >
                        <span className="series-nav-direction">Next Part →</span>
                        <span className="series-nav-card-title">{series.next.partTitle}</span>
                    </a>
                ) : (
                    <div className="series-nav-card-empty" />
                )}
            </div>

            <details className="series-nav-all" data-interaction="dismiss-outside">
                <summary className="series-nav-all-summary">
                    <span>View all {totalStr} parts</span>
                    <span className="series-chevron">▾</span>
                </summary>
                <ol className="series-parts-list">
                    {series.allParts.map((item) => (
                        <li key={item.route} className={item.part === series.part ? 'current-part' : ''}>
                            {item.part === series.part ? (
                                <span className="series-part-current">
                                    Part {formatPartNumber(item.part)}: {item.partTitle} (Current)
                                </span>
                            ) : (
                                <a href={relativeRouteHref(currentRoute, item.route)}>
                                    Part {formatPartNumber(item.part)}: {item.partTitle}
                                </a>
                            )}
                        </li>
                    ))}
                </ol>
            </details>
        </nav>
    );
}
