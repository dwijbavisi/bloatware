import React from 'react';
import { parseSeriesTitle } from '../lib/series';

export interface ArticleTitleProps {
    title: string;
}

/**
 * Renders an article title. If the title is part of a series (format: "Series Name: Part Title"),
 * the series prefix is rendered with the `.series-title-prefix` CSS class for inline visual highlight.
 *
 * @param props - Component props containing the raw title.
 * @returns JSX Element.
 * @example
 * <ArticleTitle title="Sign of Life: From Signal to Symbol" />
 */
export function ArticleTitle({ title }: ArticleTitleProps): React.JSX.Element {
    const parsed = parseSeriesTitle(title);
    if (!parsed) {
        return <>{title}</>;
    }

    return (
        <>
            <span className="series-title-prefix">{parsed.seriesName}: </span>
            <span className="series-title-rest">{parsed.partTitle}</span>
        </>
    );
}
