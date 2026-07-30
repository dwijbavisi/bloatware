import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { MarkdownRenderer } from '../../modules/md-render';
import type { ContentRecord, ChildRecord } from '../../modules/router/types';
import { extractToc } from '../lib/toc';
import { CoreLayout } from './CoreLayout';

/**
 * Props for the PageDetailTemplate component.
 *
 * @property item - The specific page record to render.
 */
export interface PageDetailTemplateProps {
    item: ContentRecord;
}

/**
 * Renders the detail view for a specific page, including its markdown content
 * and a list of any subpages.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 * @example
 * <PageDetailTemplate item={record} />
 */
export function PageDetailTemplate({ item }: PageDetailTemplateProps): React.JSX.Element {
    const toc = extractToc(item.ast);
    const subpages = item.children;

    return (
        <CoreLayout
            title={`${item.title} | bloatware-site`}
            pageTitle={item.title}
            currentRoute={item.route}
            showPageTitle={false}
            toc={toc}
        >
            <article className="prose">
                <MarkdownRenderer nodes={item.ast} />
            </article>

            {subpages && subpages.length > 0 && (
                <section className="subpages">
                    <hr />
                    <h2>Subpages</h2>
                    <ul className="page-tree">
                        {subpages.map((child) => (
                            <li key={child.route}>
                                <a href={relativeRouteHref(item.route, child.route)}>{child.title}</a>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </CoreLayout>
    );
}
