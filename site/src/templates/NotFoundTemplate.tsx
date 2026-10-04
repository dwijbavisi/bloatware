import React from 'react';
import { relativeRouteHref } from '../../modules/link-resolver';
import { CoreLayout } from './CoreLayout';

/**
 * Renders the 404 error page.
 *
 * @returns The rendered JSX element.
 * @example
 * <NotFoundTemplate />
 */
export function NotFoundTemplate(): React.JSX.Element {
    return (
        <CoreLayout
            title="404: Signal Lost | bloatware-site"
            pageTitle="404: Signal Lost"
            currentRoute="/"
            isNotFound={true}
        >
            <div className="prose error-page">
                <p className="error-lead">
                    The requested coordinates do not correspond to any known node in this topology.
                </p>
                <p>
                    Whatever was once here may have decayed into noise, migrated to another substrate, or was never conceived in the first place.
                </p>
                <div className="error-actions">
                    <a href={relativeRouteHref("/", "/")} className="error-btn error-btn-primary">
                        Return Home
                    </a>
                    <a href={relativeRouteHref("/", "/articles/")} className="error-btn">
                        Browse Articles
                    </a>
                    <a href={relativeRouteHref("/", "/pages/")} className="error-btn">
                        Explore Pages
                    </a>
                </div>
            </div>
        </CoreLayout>
    );
}
