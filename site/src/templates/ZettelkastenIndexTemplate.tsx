import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { formatDate } from '../lib/formatDate';
import type { ChildRecord } from '../../modules/router/types';
import { CoreLayout } from './CoreLayout';

/**
 * Props for the ZettelkastenIndexTemplate component.
 *
 * @property items - Array of zettel note records.
 */
export interface ZettelkastenIndexTemplateProps {
    items: ChildRecord[];
}

/**
 * Renders the Zettelkasten index view, presenting an unorganized slip-box of cards/notes.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 */
export function ZettelkastenIndexTemplate({ items }: ZettelkastenIndexTemplateProps): React.JSX.Element {
    return (
        <CoreLayout
            title="Zettelkasten | bloatware-site"
            pageTitle="Zettelkasten"
            currentRoute="/zettelkasten/"
        >
            <div className="zettelkasten-header prose">
                <p className="zettelkasten-desc">
                    An unorganized slip-box of short notes, reading excerpts, working models, and fragments.
                </p>
                <div className="zettelkasten-count">
                    <span>{items.length} {items.length === 1 ? 'slip' : 'slips'} in box</span>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="prose">
                    <p className="meta">No notes yet. Add markdown cards in <code>content/zettelkasten/</code>.</p>
                </div>
            ) : (
                <div className="zettel-grid">
                    {items.map((item) => (
                        <a
                            key={item.route}
                            href={relativeRouteHref("/zettelkasten/", item.route)}
                            className="zettel-card"
                        >
                            <h3 className="zettel-card-title">{item.title}</h3>
                            {item.summary && (
                                <p className="zettel-card-summary">{item.summary}</p>
                            )}
                            {item.date && (
                                <span className="zettel-card-meta">{formatDate(item.date)}</span>
                            )}
                        </a>
                    ))}
                </div>
            )}
        </CoreLayout>
    );
}
