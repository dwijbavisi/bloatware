import React, { useState, useMemo } from 'react';
import {
    createColorEngine,
    DEFAULT_COLOR_CONFIG,
    PALETTES,
    COLOR_STEPS,
    generateScale,
    PaletteConfig,
    PaletteType,
    ColorStep
} from '@dist';

export const ColorEngineInspector: React.FC<{
    onToast: (msg: string) => void;
}> = ({ onToast }) => {
    const engine = useMemo(() => createColorEngine(DEFAULT_COLOR_CONFIG), []);
    const tokenDoc = useMemo(() => engine.solveColorAST(), [engine]);

    // Custom OKLCH Scale Generator State
    const [customHex, setCustomHex] = useState('#8b5cf6');
    const [customType, setCustomType] = useState<PaletteType>('accent');
    const [customAnchorStep, setCustomAnchorStep] = useState<ColorStep>(500);

    const customScale = useMemo(() => {
        try {
            const config: PaletteConfig = {
                name: 'custom-scale',
                description: 'User generated OKLCH perceptual scale',
                anchorStep: customAnchorStep,
                anchorHex: customHex,
                type: customType
            };
            return generateScale(config);
        } catch {
            return null;
        }
    }, [customHex, customType, customAnchorStep]);

    const copyToClipboard = (hex: string, label: string) => {
        navigator.clipboard.writeText(hex);
        onToast(`Copied ${label}: ${hex}`);
    };

    return (
        <section className="showcase-section" id="color-engine">
            <div className="section-head">
                <div className="section-title-wrap">
                    <span className="section-tag">Perceptual Subsystem</span>
                    <h2 className="section-title">Color Engine &amp; Hardware Primitives</h2>
                    <p className="section-desc">
                        Interpolates mathematically uniform scales in the OKLCH color space. Guarantees perceptual lightness uniformity,
                        preserves exact hardware anchors, and adheres to W3C Design Tokens Community Group (DTCG) specifications.
                    </p>
                </div>
            </div>

            {/* Primitive Palettes Grid */}
            <div className="palette-swatches-grid">
                {PALETTES.map((palette) => {
                    const scale = tokenDoc.biocircuit.color[palette.name];
                    return (
                        <div key={palette.name} className="palette-card">
                            <div className="palette-header">
                                <span className="palette-name">{palette.name}</span>
                                <span className="palette-badge" style={{ color: 'var(--accent-signal)' }}>
                                    {palette.type}
                                </span>
                            </div>
                            <div className="palette-desc">{palette.description}</div>

                            {/* 9-step Swatch Strip */}
                            <div className="swatch-steps-row">
                                {COLOR_STEPS.map((step) => {
                                    const node = scale?.[step];
                                    const hex = node?.$value || '#000000';
                                    const isAnchor = step === palette.anchorStep;
                                    return (
                                        <div
                                            key={step}
                                            className="swatch-step-cell"
                                            style={{ backgroundColor: hex }}
                                            onClick={() => copyToClipboard(hex, `${palette.name}-${step}`)}
                                            title={`${palette.name}-${step}: ${hex}${isAnchor ? ' (Anchor)' : ''} - Click to copy`}
                                        >
                                            {isAnchor && <div className="swatch-anchor-indicator" />}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Scale Values Detail */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.65rem' }}>
                                {[100, 500, 900].map((step) => {
                                    const node = scale?.[step as ColorStep];
                                    const hex = node?.$value || '';
                                    return (
                                        <div
                                            key={step}
                                            onClick={() => copyToClipboard(hex, `${palette.name}-${step}`)}
                                            style={{
                                                padding: '0.25rem 0.4rem',
                                                background: 'var(--cwbwbc-biocircuit-channel-passive-substrate-panel)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                border: step === palette.anchorStep ? '1px solid var(--cwbwbc-biocircuit-color-electric-cyan-500)' : '1px solid transparent'
                                            }}
                                        >
                                            <span style={{ color: 'var(--text-subtle)' }}>{step}:</span>
                                            <span style={{ fontWeight: 600 }}>{hex}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Interactive OKLCH Scale Generator Playground */}
            <div className="surface-card surface-die" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)', marginBottom: '0.2rem' }}>
                            Interactive OKLCH Scale Interpolation Playground
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            Instantiate the color engine dynamically to generate arbitrary perceptual scales across topological curves.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Anchor Color:
                        </label>
                        <input
                            type="color"
                            value={customHex}
                            onChange={(e) => setCustomHex(e.target.value)}
                            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                        />
                        <input
                            type="text"
                            value={customHex}
                            onChange={(e) => setCustomHex(e.target.value)}
                            style={{
                                background: 'var(--cwbwbc-biocircuit-channel-passive-substrate-panel)',
                                border: '1px solid var(--cwbwbc-biocircuit-channel-passive-glow-panel)',
                                borderRadius: '4px',
                                color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-panel)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                padding: '0.3rem 0.6rem',
                                width: '100px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--cwbwbc-biocircuit-color-titanium-white-400)' }}>
                            Profile:
                        </label>
                        <select
                            value={customType}
                            onChange={(e) => {
                                const newType = e.target.value as PaletteType;
                                setCustomType(newType);
                                if (newType === 'black-anchor') setCustomAnchorStep(900);
                                else if (newType === 'white-anchor') setCustomAnchorStep(100);
                                else setCustomAnchorStep(500);
                            }}
                            style={{
                                background: 'var(--cwbwbc-biocircuit-channel-passive-substrate-panel)',
                                border: '1px solid var(--cwbwbc-biocircuit-channel-passive-glow-panel)',
                                borderRadius: '4px',
                                color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-panel)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                padding: '0.3rem 0.6rem'
                            }}
                        >
                            <option value="accent">accent (anchor @ 500)</option>
                            <option value="black-anchor">black-anchor (anchor @ 900)</option>
                            <option value="white-anchor">white-anchor (anchor @ 100)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--cwbwbc-biocircuit-color-titanium-white-400)' }}>
                            Anchor Step:
                        </label>
                        <select
                            value={customAnchorStep}
                            onChange={(e) => setCustomAnchorStep(Number(e.target.value) as ColorStep)}
                            style={{
                                background: 'var(--cwbwbc-biocircuit-channel-passive-substrate-panel)',
                                border: '1px solid var(--cwbwbc-biocircuit-channel-passive-glow-panel)',
                                borderRadius: '4px',
                                color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-panel)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                padding: '0.3rem 0.6rem'
                            }}
                        >
                            {COLOR_STEPS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Generated Custom Scale Result */}
                {customScale ? (
                    <div>
                        <div className="swatch-steps-row" style={{ height: '64px' }}>
                            {COLOR_STEPS.map((step) => {
                                const hex = customScale[step]?.$value || '#000000';
                                const isAnchor = step === customAnchorStep;
                                return (
                                    <div
                                        key={step}
                                        className="swatch-step-cell"
                                        style={{ backgroundColor: hex, height: '64px' }}
                                        onClick={() => copyToClipboard(hex, `custom-${step}`)}
                                        title={`Step ${step}: ${hex}${isAnchor ? ' (Anchor)' : ''}`}
                                    >
                                        <div style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 4px',
                                            borderRadius: '3px',
                                            background: 'rgba(0,0,0,0.6)',
                                            color: '#fff',
                                            marginBottom: '4px'
                                        }}>
                                            {step}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                            {COLOR_STEPS.map((step) => {
                                const hex = customScale[step]?.$value || '';
                                return (
                                    <div
                                        key={step}
                                        onClick={() => copyToClipboard(hex, `custom-${step}`)}
                                        style={{
                                            background: 'var(--cwbwbc-biocircuit-channel-passive-substrate-cavity)',
                                            padding: '0.4rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            border: step === customAnchorStep ? '1px solid var(--cwbwbc-biocircuit-color-electric-cyan-400)' : '1px solid transparent'
                                        }}
                                    >
                                        <div style={{ color: 'var(--text-subtle)', fontSize: '0.65rem' }}>
                                            {step}{step === customAnchorStep ? ' [anchor]' : ''}
                                        </div>
                                        <div style={{ fontWeight: 700, marginTop: '2px' }}>{hex}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{ color: 'var(--cwbwbc-biocircuit-color-blaze-vermilion-400)', fontSize: '0.8rem' }}>
                        Invalid color hex input.
                    </div>
                )}
            </div>
        </section>
    );
};
