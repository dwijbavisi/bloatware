import React from 'react';

/**
 * A simple visual decorator component that wraps raw Markdown syntax markers
 * (e.g., asterisks, hashes, hyphens) to style them distinctly in the UI.
 *
 * @param props.children - The raw ASCII markdown string to wrap.
 * @returns A stylized React span element containing the marker.
 * @example
 * <MDMarker>### </MDMarker>
 */
export const MDMarker = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <span className="md-marker">{children}</span>
);
