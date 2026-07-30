import React from 'react';
import { MarkdownRenderer } from '../../modules/md-render';
import type { ContentRecord } from '../../modules/router/types';
import { extractToc } from '../lib/toc';
import { CoreLayout } from './CoreLayout';

/**
 * Props for the ArticleDetailTemplate component.
 *
 * @property item - The specific article record to render.
 */
export interface ArticleDetailTemplateProps {
    item: ContentRecord;
}

/**
 * Renders the detail view for a specific article, including its markdown content.
 *
 * @param props - Component props.
 * @returns The rendered JSX element.
 * @example
 * <ArticleDetailTemplate item={record} />
 */
export function ArticleDetailTemplate({ item }: ArticleDetailTemplateProps): JSX.Element {
    const toc = extractToc(item.ast);

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
        </CoreLayout>
    );
}
