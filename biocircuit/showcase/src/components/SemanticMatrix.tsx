import React, { useState } from 'react';
import { themeDark, themeLight } from '@dist';

type Channel = 'passive' | 'alarm' | 'power' | 'clock' | 'signal';
type Surface = 'cavity' | 'canvas' | 'die' | 'panel' | 'package';

const CHANNELS: { key: Channel; label: string; role: string; color: string }[] = [
    { key: 'passive', label: 'Passive', role: 'Semiconductor ground & structural substrate', color: '#959ca3' },
    { key: 'alarm', label: 'Alarm', role: 'Critical interrupts & fault supervisor', color: '#ef4444' },
    { key: 'power', label: 'Power', role: 'Power rail delivery & battery telemetry', color: '#f59e0b' },
    { key: 'clock', label: 'Clock', role: 'Synchronous pulse & nominal state clock', color: '#22c55e' },
    { key: 'signal', label: 'Signal', role: 'Digital bus logic & communication channels', color: '#06b6d4' }
];

const SURFACES: { key: Surface; label: string; elevation: string; depth: string }[] = [
    { key: 'cavity', label: 'Cavity', elevation: 'Depth -1', depth: 'Recessed component slot' },
    { key: 'canvas', label: 'Canvas', elevation: 'Depth 0', depth: 'Baseline board ground plane' },
    { key: 'die', label: 'Die', elevation: 'Depth 1', depth: 'Raw silicon chip surface' },
    { key: 'panel', label: 'Panel', elevation: 'Depth 2', depth: 'Surface-mounted instrument' },
    { key: 'package', label: 'Package', elevation: 'Depth 3', depth: 'Exterior protective IC casing' }
];

export const SemanticMatrix: React.FC<{
    onToast: (msg: string) => void;
}> = ({ onToast }) => {
    const [selectedChannel, setSelectedChannel] = useState<Channel>('signal');
    const [inspectTheme, setInspectTheme] = useState<'dark' | 'light'>('dark');

    const copyVar = (varName: string) => {
        navigator.clipboard.writeText(varName);
        onToast(`Copied token: ${varName}`);
    };

    return (
        <section className="showcase-section" id="semantic-matrix">
            <div className="section-head">
                <div className="section-title-wrap">
                    <span className="section-tag">Semantics Subsystem</span>
                    <h2 className="section-title">Channel &times; Surface Semantic Matrix</h2>
                    <p className="section-desc">
                        A two-dimensional orthogonal taxonomy pairing 5 functional signal channels with 5 topological surface depths.
                        Provides coherent contrast ratios and boundary glow accents across both dark and light modes.
                    </p>
                </div>
            </div>

            {/* Matrix Filter & Theme Mode Selector */}
            <div className="surface-card surface-die" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Focus Channel:
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {CHANNELS.map((ch) => (
                                <button
                                    key={ch.key}
                                    onClick={() => setSelectedChannel(ch.key)}
                                    style={{
                                        background: selectedChannel === ch.key ? 'var(--cwbwbc-biocircuit-channel-passive-substrate-package)' : 'transparent',
                                        color: selectedChannel === ch.key ? ch.color : 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)',
                                        border: `1px solid ${selectedChannel === ch.key ? ch.color : 'var(--cwbwbc-biocircuit-channel-passive-glow-die)'}`,
                                        padding: '0.3rem 0.7rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        fontWeight: selectedChannel === ch.key ? 700 : 500
                                    }}
                                >
                                    {ch.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Preview Theme:</span>
                        <div className="theme-switch-group">
                            <button
                                className={`theme-btn ${inspectTheme === 'dark' ? 'active' : ''}`}
                                onClick={() => setInspectTheme('dark')}
                            >
                                Dark
                            </button>
                            <button
                                className={`theme-btn ${inspectTheme === 'light' ? 'active' : ''}`}
                                onClick={() => setInspectTheme('light')}
                            >
                                Light
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Surface Depth Visual Stack for Selected Channel */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-canvas)' }}>
                    Topological Elevation Stack ({selectedChannel.toUpperCase()} Channel)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {SURFACES.map((surf) => {
                        const substrateVar = `--cwbwbc-biocircuit-channel-${selectedChannel}-substrate-${surf.key}`;
                        const textVar = `--cwbwbc-biocircuit-channel-${selectedChannel}-text-on-${surf.key}`;
                        const glowVar = `--cwbwbc-biocircuit-channel-${selectedChannel}-glow-${surf.key}`;

                        return (
                            <div
                                key={surf.key}
                                onClick={() => copyVar(substrateVar)}
                                style={{
                                    backgroundColor: `var(${substrateVar})`,
                                    color: `var(${textVar})`,
                                    border: `1.5px solid var(${glowVar})`,
                                    boxShadow: surf.key === 'cavity' ? 'inset 0 2px 8px rgba(0,0,0,0.5)' : `0 4px 16px var(${glowVar}33)`,
                                    borderRadius: '8px',
                                    padding: '1.25rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                title={`Click to copy: var(${substrateVar})`}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>{surf.label}</span>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{surf.elevation}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.85, marginBottom: '0.75rem' }}>
                                    {surf.depth}
                                </div>
                                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', opacity: 0.75 }}>
                                    <div>bg: {substrateVar}</div>
                                    <div>tx: {textVar}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Complete Channel x Surface 2D Cross Matrix Table */}
            <div className="surface-card surface-die">
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                    Complete 25-Cell Token Binding Grid ({inspectTheme.toUpperCase()} Mode)
                </h3>
                <div className="matrix-table-wrap" data-theme={inspectTheme}>
                    <table className="matrix-table">
                        <thead>
                            <tr>
                                <th>Channel</th>
                                {SURFACES.map((s) => (
                                    <th key={s.key}>{s.label} ({s.depth})</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {CHANNELS.map((ch) => (
                                <tr key={ch.key}>
                                    <td style={{ fontWeight: 700, color: ch.color, width: '120px' }}>
                                        {ch.label}
                                    </td>
                                    {SURFACES.map((surf) => {
                                        const substrateVar = `--cwbwbc-biocircuit-channel-${ch.key}-substrate-${surf.key}`;
                                        const textVar = `--cwbwbc-biocircuit-channel-${ch.key}-text-on-${surf.key}`;
                                        const glowVar = `--cwbwbc-biocircuit-channel-${ch.key}-glow-${surf.key}`;

                                        return (
                                            <td key={surf.key} style={{ padding: '0.5rem' }}>
                                                <div
                                                    onClick={() => copyVar(substrateVar)}
                                                    style={{
                                                        backgroundColor: `var(${substrateVar})`,
                                                        color: `var(${textVar})`,
                                                        border: `1px solid var(${glowVar})`,
                                                        borderRadius: '6px',
                                                        padding: '0.6rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    title={`Copy var(${substrateVar})`}
                                                >
                                                    <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                                        Aa {surf.label}
                                                    </div>
                                                    <div style={{ fontSize: '0.6rem', opacity: 0.8, marginTop: '2px' }}>
                                                        {ch.key}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
