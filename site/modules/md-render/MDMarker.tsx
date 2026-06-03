import React from "react";

/**
 * A simple visual decorator component for Markdown syntax markers (e.g. asterisks, hashes).
 */
export const MDMarker = ({ children }: { children: React.ReactNode }): JSX.Element => (
    <span className="md-marker">{children}</span>
);
