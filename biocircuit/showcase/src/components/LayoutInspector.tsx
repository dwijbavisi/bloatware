import React, { useState, useEffect, useMemo } from 'react';
import {
    createLayoutEngine,
    DEFAULT_LAYOUT_CONFIG,
    LAYOUT_CONSTANTS,
    LAYOUT_BOUNDS,
    LayoutTier,
    LayoutMetrics
} from '@dist';

export const LayoutInspector: React.FC<{
    onToast: (msg: string) => void;
}> = ({ onToast }) => {
    const engine = useMemo(() => createLayoutEngine(DEFAULT_LAYOUT_CONFIG), []);

    // Interactive controls state
    const [useSimulatedWidth, setUseSimulatedWidth] = useState(true);
    const [simulatedWidthCh, setSimulatedWidthCh] = useState(85);
    const [selectedDpr, setSelectedDpr] = useState<number>(window.devicePixelRatio || 1);
    const [displayMode, setDisplayMode] = useState<'fit' | 'physical'>('fit');
    
    // Live measured window dimensions
    const [measuredWidthPx, setMeasuredWidthPx] = useState(window.innerWidth);
    const [chInPx, setChInPx] = useState(9.6);

    useEffect(() => {
        const measureElem = document.createElement('span');
        measureElem.style.font = 'inherit';
        measureElem.style.position = 'absolute';
        measureElem.style.visibility = 'hidden';
        measureElem.style.whiteSpace = 'nowrap';
        measureElem.textContent = '0';
        document.body.appendChild(measureElem);
        const rect = measureElem.getBoundingClientRect();
        if (rect.width > 0) {
            setChInPx(rect.width);
        }
        document.body.removeChild(measureElem);

        const handleResize = () => {
            setMeasuredWidthPx(window.innerWidth);
            setSelectedDpr(window.devicePixelRatio || 1);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Current active width in pixels
    const activeWidthPx = useSimulatedWidth
        ? simulatedWidthCh * chInPx
        : measuredWidthPx;

    const activeWidthCh = activeWidthPx / chInPx;

    // Resolve metrics from biocircuit dist engine
    const activeTier: LayoutTier = useMemo(() => {
        return engine.resolveTierByCh(activeWidthCh);
    }, [engine, activeWidthCh]);

    const metrics: LayoutMetrics = useMemo(() => {
        return engine.resolveLayoutMetrics(activeWidthPx, chInPx, selectedDpr);
    }, [engine, activeWidthPx, chInPx, selectedDpr]);

    // Clearance and gap percentages relative to Harmonic Divisor D
    const clearancePct = (activeTier.k / activeTier.divisor) * 100;
    const gapPct = (1 / activeTier.divisor) * 100;

    return (
        <section className="showcase-section" id="layout-inspector">
            <div className="section-head">
                <div className="section-title-wrap">
                    <span className="section-tag">Subsystem Primitives</span>
                    <h2 className="section-title">PCB Layout Engine &amp; Harmonic Grid</h2>
                    <p className="section-desc">
                        Models the viewport as a physical Printed Circuit Board. Computes deterministic Harmonic Divisors (D)
                        to ensure that 1fr columns equal exactly 5 &times; Keepout (G) with zero rounding error.
                    </p>
                </div>
            </div>

            {/* Interactive Control Deck */}
            <div className="surface-card surface-die" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={useSimulatedWidth}
                                onChange={(e) => setUseSimulatedWidth(e.target.checked)}
                                style={{ accentColor: 'var(--cwbwbc-biocircuit-color-electric-cyan-500)' }}
                            />
                            Simulate Custom Board Width
                        </label>
                        {useSimulatedWidth && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <input
                                    type="range"
                                    min={LAYOUT_BOUNDS.minWidthCh}
                                    max={LAYOUT_BOUNDS.maxWidthCh}
                                    step={1}
                                    value={simulatedWidthCh}
                                    onChange={(e) => setSimulatedWidthCh(Number(e.target.value))}
                                    style={{ width: '180px', accentColor: 'var(--cwbwbc-biocircuit-color-electric-cyan-500)' }}
                                />
                                <span style={{ color: 'var(--cwbwbc-biocircuit-color-electric-cyan-400)', fontWeight: 700, fontSize: '0.85rem' }}>
                                    {simulatedWidthCh}ch ({Math.round(simulatedWidthCh * chInPx)}px)
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {/* Simulation View Mode (Fit vs 1:1) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--cwbwbc-biocircuit-color-titanium-white-400)' }}>View Scale:</span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                    onClick={() => setDisplayMode('fit')}
                                    style={{
                                        background: displayMode === 'fit' ? 'var(--cwbwbc-biocircuit-channel-signal-substrate-panel)' : 'transparent',
                                        color: displayMode === 'fit' ? 'var(--cwbwbc-biocircuit-channel-signal-text-on-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)',
                                        border: `1px solid ${displayMode === 'fit' ? 'var(--cwbwbc-biocircuit-channel-signal-glow-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-glow-die)'}`,
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        fontWeight: displayMode === 'fit' ? 700 : 400
                                    }}
                                >
                                    Fit to View
                                </button>
                                <button
                                    onClick={() => setDisplayMode('physical')}
                                    style={{
                                        background: displayMode === 'physical' ? 'var(--cwbwbc-biocircuit-channel-signal-substrate-panel)' : 'transparent',
                                        color: displayMode === 'physical' ? 'var(--cwbwbc-biocircuit-channel-signal-text-on-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)',
                                        border: `1px solid ${displayMode === 'physical' ? 'var(--cwbwbc-biocircuit-channel-signal-glow-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-glow-die)'}`,
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem',
                                        fontWeight: displayMode === 'physical' ? 700 : 400
                                    }}
                                >
                                    1:1 Physical
                                </button>
                            </div>
                        </div>

                        {/* DPR Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>DPR:</span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {LAYOUT_CONSTANTS.STANDARD_DPR_PROFILES.map((dpr) => (
                                    <button
                                        key={dpr}
                                        onClick={() => setSelectedDpr(dpr)}
                                        style={{
                                            background: selectedDpr === dpr ? 'var(--cwbwbc-biocircuit-channel-signal-substrate-panel)' : 'transparent',
                                            color: selectedDpr === dpr ? 'var(--cwbwbc-biocircuit-channel-signal-text-on-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)',
                                            border: `1px solid ${selectedDpr === dpr ? 'var(--cwbwbc-biocircuit-channel-signal-glow-panel)' : 'var(--cwbwbc-biocircuit-channel-passive-glow-die)'}`,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {dpr}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="surface-card surface-panel">
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                        Active Tier
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-signal)', marginTop: '0.25rem' }}>
                        {activeTier.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Index {activeTier.tierIndex} &bull; min {activeTier.minWidthCh}ch
                    </div>
                </div>

                <div className="surface-card surface-panel">
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                        Conductive Lanes (N)
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-clock)', marginTop: '0.25rem' }}>
                        {activeTier.lanes} Channels
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Clearance Multiplier k = {activeTier.k}
                    </div>
                </div>

                <div className="surface-card surface-panel">
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                        Harmonic Divisor (D)
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-power)', marginTop: '0.25rem' }}>
                        D = {activeTier.divisor}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        6N + 2k - 1 = {6 * activeTier.lanes + 2 * activeTier.k - 1}
                    </div>
                </div>

                <div className="surface-card surface-panel">
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                        Keepout Unit (G = W / D)
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-alarm)', marginTop: '0.25rem' }}>
                        {metrics.keepoutPx.toFixed(2)}px
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Trace Cw (5G) = {metrics.tracePx.toFixed(2)}px
                    </div>
                </div>

                <div className="surface-card surface-panel">
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
                        Clearance (M = k &times; G)
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-signal)', marginTop: '0.25rem' }}>
                        {metrics.clearancePx.toFixed(2)}px
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        W_active = {metrics.activeWidthPx.toFixed(2)}px
                    </div>
                </div>
            </div>

            {/* Live PCB Board Simulator Visualizer */}
            <div className="pcb-board-sim">
                {/* Synchronized Board Wrapper matching exact canvas width */}
                <div
                    style={{
                        width: displayMode === 'physical' ? `${Math.round(activeWidthPx)}px` : '100%',
                        minWidth: displayMode === 'physical' ? `${Math.round(activeWidthPx)}px` : undefined,
                        margin: '0 auto',
                        transition: 'width 0.2s ease'
                    }}
                >
                    {/* Aligned 3-Zone Ruler */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: displayMode === 'physical'
                                ? `${metrics.clearancePx}px 1fr ${metrics.clearancePx}px`
                                : `${clearancePct}% 1fr ${clearancePct}%`,
                            gap: 0,
                            marginBottom: '0.75rem',
                            fontSize: '0.65rem'
                        }}
                    >
                        <div style={{
                            textAlign: 'left',
                            color: 'var(--cwbwbc-biocircuit-color-blaze-vermilion-400)',
                            borderBottom: '1px solid var(--cwbwbc-biocircuit-color-blaze-vermilion-500)',
                            paddingBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            &larr; M ({metrics.clearancePx.toFixed(1)}px)
                        </div>
                        <div style={{
                            textAlign: 'center',
                            color: 'var(--cwbwbc-biocircuit-color-electric-cyan-400)',
                            borderBottom: '1px dashed var(--cwbwbc-biocircuit-channel-signal-glow-cavity)',
                            paddingBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: 600
                        }}>
                            Board W: {Math.round(activeWidthPx)}px ({activeWidthCh.toFixed(1)}ch) &bull; Active: {metrics.activeWidthPx.toFixed(1)}px ({activeTier.lanes} Lanes)
                        </div>
                        <div style={{
                            textAlign: 'right',
                            color: 'var(--cwbwbc-biocircuit-color-blaze-vermilion-400)',
                            borderBottom: '1px solid var(--cwbwbc-biocircuit-color-blaze-vermilion-500)',
                            paddingBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            ({metrics.clearancePx.toFixed(1)}px) M &rarr;
                        </div>
                    </div>

                    {/* Board Canvas with Native Harmonic Invariants */}
                    <div
                        className="pcb-board-canvas"
                        style={{
                            width: '100%',
                            paddingInline: displayMode === 'physical'
                                ? `${metrics.clearancePx}px`
                                : `${clearancePct}%`,
                            position: 'relative',
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* Visual Perimeter Clearance Hatched Bands */}
                        <div
                            className="pcb-clearance-bar"
                            style={{
                                left: 0,
                                width: displayMode === 'physical' ? `${metrics.clearancePx}px` : `${clearancePct}%`
                            }}
                            title={`Left Perimeter Clearance M = ${metrics.clearancePx.toFixed(1)}px (${activeTier.k}G)`}
                        />
                        <div
                            className="pcb-clearance-bar"
                            style={{
                                right: 0,
                                width: displayMode === 'physical' ? `${metrics.clearancePx}px` : `${clearancePct}%`
                            }}
                            title={`Right Perimeter Clearance M = ${metrics.clearancePx.toFixed(1)}px (${activeTier.k}G)`}
                        />

                        {/* Conductive Channel Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${activeTier.lanes}, minmax(0, 1fr))`,
                                gap: displayMode === 'physical' ? `${metrics.keepoutPx}px` : `${gapPct}%`,
                                position: 'relative',
                                paddingBlock: '1rem',
                                width: '100%',
                                boxSizing: 'border-box',
                                zIndex: 2
                            }}
                        >
                            {Array.from({ length: activeTier.lanes }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="pcb-track-column"
                                    title={`Lane #${idx + 1}: Width = ${metrics.tracePx.toFixed(2)}px (5G)`}
                                >
                                    {activeTier.lanes <= 12 && (
                                        <span style={{ opacity: 0.6, fontSize: '0.55rem', lineHeight: 1 }}>LANE</span>
                                    )}
                                    <span style={{ fontSize: activeTier.lanes > 18 ? '0.65rem' : '0.75rem', lineHeight: 1.1 }}>
                                        #{idx + 1}
                                    </span>
                                    <span style={{
                                        fontSize: '0.5rem',
                                        opacity: 0.8,
                                        marginTop: '3px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%'
                                    }}>
                                        {metrics.tracePx.toFixed(0)}px
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', fontSize: '0.7rem', color: 'var(--text-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span>
                        Physical Metaphor: Gutter Keepout G = W / {activeTier.divisor} &bull; Column Trace = 5G &bull; Clearance M = {activeTier.k}G
                    </span>
                    <span>
                        Mode: {displayMode === 'fit' ? 'Responsive Proportional Fit (100% Contained)' : '1:1 Physical Scale (Scrollable)'} &bull; DPR: {selectedDpr}x
                    </span>
                </div>
            </div>

            {/* Tier Invariant Progression Table */}
            <div className="surface-card surface-die" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                    Deterministic Tier Invariant Progression (Delta D = 38)
                </h3>
                <div className="matrix-table-wrap">
                    <table className="matrix-table">
                        <thead>
                            <tr>
                                <th>Tier ID</th>
                                <th>Tier Name</th>
                                <th>Lanes (N)</th>
                                <th>Clearance Multiplier (k)</th>
                                <th>Divisor (D = 6N + 2k - 1)</th>
                                <th>Delta D</th>
                                <th>Typographic Threshold</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {engine.tiers.map((tier) => {
                                const isCurrent = tier.id === activeTier.id;
                                return (
                                    <tr
                                        key={tier.id}
                                        style={{
                                            background: isCurrent ? 'var(--cwbwbc-biocircuit-channel-signal-substrate-cavity)' : 'transparent',
                                            fontWeight: isCurrent ? 700 : 400
                                        }}
                                    >
                                        <td><code>{tier.id}</code></td>
                                        <td style={{ color: isCurrent ? 'var(--accent-signal)' : 'inherit' }}>
                                            {tier.name}
                                        </td>
                                        <td>{tier.lanes} lanes</td>
                                        <td>k = {tier.k} ({tier.k}G)</td>
                                        <td style={{ color: 'var(--accent-power)', fontWeight: 700 }}>
                                            {tier.divisor}
                                        </td>
                                        <td>+38</td>
                                        <td>&ge; {tier.minWidthCh}ch</td>
                                        <td>
                                            {isCurrent ? (
                                                <span style={{ color: 'var(--accent-clock)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <span className="telemetry-dot" /> ACTIVE
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-subtle)' }}>STANDBY</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Native CSS Grid Integration Demo */}
            <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-canvas)' }}>
                    Live Native CSS Grid Integration (<code>.cwbwbc-board</code> &amp; <code>.cwbwbc-grid</code>)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Rendered directly through the master stylesheet layers exported by <code>dist/index.css</code>.
                </p>

                <div className="cwbwbc-board" style={{ padding: 0 }}>
                    <div className="cwbwbc-grid">
                        <div
                            className="surface-card surface-package channel-signal"
                            style={{ gridColumn: 'span 3', minHeight: '100px' }}
                        >
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--accent-signal)' }}>
                                Signal Card (span 3)
                            </span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                Bus Transceiver
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                Span 3 columns with native 1fr and keepout gutter.
                            </div>
                        </div>

                        <div
                            className="surface-card surface-panel channel-power"
                            style={{ gridColumn: 'span 3', minHeight: '100px' }}
                        >
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--accent-power)' }}>
                                Power Card (span 3)
                            </span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                Voltage Regulator
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                Dedicated +3.3V / +5.0V power rail delivery.
                            </div>
                        </div>

                        <div
                            className="surface-card surface-die channel-clock"
                            style={{ gridColumn: 'span 3', minHeight: '100px' }}
                        >
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--accent-clock)' }}>
                                Clock Card (span 3)
                            </span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                Crystal Oscillator
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                144MHz synchronous telemetry clock trace.
                            </div>
                        </div>

                        <div
                            className="surface-card surface-cavity channel-alarm"
                            style={{ gridColumn: 'span 3', minHeight: '100px' }}
                        >
                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--accent-alarm)' }}>
                                Alarm Card (span 3)
                            </span>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                Interrupt Watchdog
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                Critical hardware fault supervisor.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
