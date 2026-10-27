import React, { useState, useMemo } from 'react';
import colorPaletteJson from '@dist/tokens/primitives/color.palette.json';
import layoutTokensJson from '@dist/tokens/primitives/layout.tokens.json';
import themeDarkJson from '@dist/tokens/semantics/color/theme-dark.json';
import themeLightJson from '@dist/tokens/semantics/color/theme-light.json';

type TokenFileKey = 'color-palette' | 'layout' | 'theme-dark' | 'theme-light';

const TOKEN_FILES: { key: TokenFileKey; label: string; path: string; data: unknown }[] = [
    { key: 'color-palette', label: 'Color Primitives', path: 'dist/tokens/primitives/color.palette.json', data: colorPaletteJson },
    { key: 'layout', label: 'Layout Primitives', path: 'dist/tokens/primitives/layout.tokens.json', data: layoutTokensJson },
    { key: 'theme-dark', label: 'Theme Dark (DTCG)', path: 'dist/tokens/semantics/color/theme-dark.json', data: themeDarkJson },
    { key: 'theme-light', label: 'Theme Light (DTCG)', path: 'dist/tokens/semantics/color/theme-light.json', data: themeLightJson }
];

export const TokenInspector: React.FC<{
    onToast: (msg: string) => void;
}> = ({ onToast }) => {
    const [selectedFileKey, setSelectedFileKey] = useState<TokenFileKey>('theme-dark');
    const [searchQuery, setSearchQuery] = useState('');

    const activeFile = useMemo(() => {
        return TOKEN_FILES.find(f => f.key === selectedFileKey) || TOKEN_FILES[0];
    }, [selectedFileKey]);

    const formattedJson = useMemo(() => {
        return JSON.stringify(activeFile.data, null, 2);
    }, [activeFile]);

    const filteredLines = useMemo(() => {
        if (!searchQuery.trim()) {
            return formattedJson.split('\n');
        }
        const lines = formattedJson.split('\n');
        const q = searchQuery.toLowerCase();
        return lines.filter(line => line.toLowerCase().includes(q));
    }, [formattedJson, searchQuery]);

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedJson);
        onToast(`Copied ${activeFile.label} to clipboard`);
    };

    return (
        <section className="showcase-section" id="token-inspector">
            <div className="section-head">
                <div className="section-title-wrap">
                    <span className="section-tag">W3C DTCG Format</span>
                    <h2 className="section-title">Design Token Schema &amp; Raw Artifacts</h2>
                    <p className="section-desc">
                        Inspection viewer for the machine-readable W3C Design Tokens Community Group specifications
                        compiled directly into the <code>dist/tokens/</code> output.
                    </p>
                </div>
            </div>

            <div className="surface-card surface-die">
                {/* File Tabs & Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {TOKEN_FILES.map((tf) => (
                            <button
                                key={tf.key}
                                onClick={() => {
                                    setSelectedFileKey(tf.key);
                                    setSearchQuery('');
                                }}
                                style={{
                                    background: selectedFileKey === tf.key ? 'var(--cwbwbc-biocircuit-channel-signal-substrate-panel)' : 'transparent',
                                    color: selectedFileKey === tf.key ? 'var(--cwbwbc-biocircuit-channel-signal-text-on-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)',
                                    border: `1px solid ${selectedFileKey === tf.key ? 'var(--cwbwbc-biocircuit-channel-signal-glow-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-glow-die)'}`,
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    fontWeight: selectedFileKey === tf.key ? 700 : 500
                                }}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                            type="text"
                            placeholder="Filter tokens (e.g. #06b6d4, cavity, lanes)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: 'var(--cwbwbc-biocircuit-channel-passive-substrate-panel)',
                                border: '1px solid var(--cwbwbc-biocircuit-channel-passive-glow-panel)',
                                borderRadius: '4px',
                                color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-panel)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.75rem',
                                padding: '0.35rem 0.75rem',
                                width: '250px'
                            }}
                        />
                        <button
                            onClick={handleCopy}
                            style={{
                                background: 'var(--cwbwbc-biocircuit-channel-signal-substrate-package)',
                                color: 'var(--cwbwbc-biocircuit-channel-signal-text-on-package)',
                                border: '1px solid var(--cwbwbc-biocircuit-channel-signal-glow-package)',
                                borderRadius: '4px',
                                padding: '0.35rem 0.75rem',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}
                        >
                            Copy JSON
                        </button>
                    </div>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginBottom: '0.75rem' }}>
                    Source file: <code>{activeFile.path}</code> &bull; Showing {filteredLines.length} lines
                </div>

                {/* JSON Display Area */}
                <div style={{
                    background: '#040507',
                    border: '1px solid var(--cwbwbc-biocircuit-channel-passive-glow-cavity)',
                    borderRadius: '6px',
                    padding: '1rem',
                    maxHeight: '450px',
                    overflowY: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                    color: 'var(--cwbwbc-biocircuit-color-titanium-white-200)',
                    whiteSpace: 'pre'
                }}>
                    {filteredLines.map((line, idx) => {
                        let highlighted = line;
                        // Light highlighting of keys and hex codes
                        const isKey = line.includes('":');
                        const isHex = /#[0-9a-fA-F]{3,8}/.test(line);

                        return (
                            <div key={idx} style={{ display: 'flex' }}>
                                <span style={{
                                    width: '45px',
                                    color: 'var(--cwbwbc-biocircuit-color-titanium-white-600)',
                                    userSelect: 'none',
                                    textAlign: 'right',
                                    paddingRight: '12px'
                                }}>
                                    {idx + 1}
                                </span>
                                <span style={{
                                    color: isHex ? 'var(--cwbwbc-biocircuit-color-electric-cyan-300)' : isKey ? 'var(--cwbwbc-biocircuit-color-laser-emerald-300)' : 'inherit'
                                }}>
                                    {line}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
