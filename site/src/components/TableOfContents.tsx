import React from 'react';
import type { TocItem } from '../lib/toc';

/**
 * Props for the TableOfContents component.
 * 
 * @property toc - Optional Table of Contents array.
 */
export interface TableOfContentsProps {
    toc?: TocItem[];
}

/**
 * Renders a dropdown Table of Contents menu for the current page.
 * 
 * @param props - Component props.
 * @returns The `<details>` element, or null if no TOC exists.
 * @example
 * <TableOfContents toc={items} />
 */
export function TableOfContents({ toc }: TableOfContentsProps): JSX.Element | null {
    if (!toc || toc.length === 0) {
        return null;
    }

    return (
        <details className="toc-dropdown" data-interaction="dismiss-outside">
            <summary>TOC <span className="toc-chevron">&#8964;</span></summary>
            <div className="toc-menu">
                {toc.map((item) => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`toc-item toc-h${item.level}`}
                    >
                        {item.text}
                    </a>
                ))}
            </div>
        </details>
    );
}
