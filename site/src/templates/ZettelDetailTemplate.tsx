import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { MarkdownRenderer } from '../../modules/md-render';
import type { ContentRecord } from '../../modules/router/types';
import { extractToc } from '../lib/toc';
import { CoreLayout } from './CoreLayout';

/**
 * Props for the ZettelDetailTemplate component.
 *
 * @property item - The specific zettel note record to render.
 */
export interface ZettelDetailTemplateProps {
    item: ContentRecord;
}

/**
 * Renders the detail view for an individual zettel note/card.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 */
export function ZettelDetailTemplate({ item }: ZettelDetailTemplateProps): React.JSX.Element {
    const toc = extractToc(item.ast);

    return (
        <CoreLayout
            title={`${item.title} | Zettelkasten | bloatware-site`}
            pageTitle={item.title}
            currentRoute={item.route}
            showPageTitle={false}
            toc={toc}
        >
            <div className="zettel-detail-nav">
                <a className="back-link" href={relativeRouteHref(item.route, "/zettelkasten/")}>
                    ← All Notes
                </a>
            </div>
            <article className="prose">
                <MarkdownRenderer nodes={item.ast} />
            </article>
        </CoreLayout>
    );
}
