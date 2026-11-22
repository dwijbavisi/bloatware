import React from 'react';

/**
 * Renders the Command Palette dialog markup for fast, full-content search.
 */
export function SearchModal(): React.JSX.Element {
    return (
        <dialog id="command-palette" className="command-palette" aria-label="Search and Navigation" data-interaction="command-palette">
            <div className="command-palette-card">
                <div className="command-palette-header">
                    <svg
                        className="command-palette-search-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="search"
                        className="command-palette-input"
                        placeholder="Search articles, pages, full content..."
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        aria-autocomplete="list"
                        aria-controls="command-palette-results"
                        aria-activedescendant=""
                    />
                    <button type="button" className="command-palette-close-btn" data-action="close-search" aria-label="Close search">
                        <span className="close-text-desktop">Esc</span>
                        <svg className="close-icon-mobile" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div className="command-palette-body">
                    <div className="command-palette-status" aria-live="polite"></div>
                    <ul id="command-palette-results" className="command-palette-results" role="listbox"></ul>
                </div>
                <div className="command-palette-footer">
                    <div className="command-palette-hints">
                        <span className="command-palette-hint"><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
                        <span className="command-palette-hint"><kbd>↵</kbd> select</span>
                        <span className="command-palette-hint"><kbd>esc</kbd> close</span>
                    </div>
                    <span className="command-palette-brand">bloatware search</span>
                </div>
            </div>
        </dialog>
    );
}
