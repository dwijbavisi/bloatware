import React from 'react';

export const MathematicalProofs: React.FC = () => {
    return (
        <section className="showcase-section" id="mathematical-proofs">
            <div className="section-head">
                <div className="section-title-wrap">
                    <span className="section-tag">Formal Theory</span>
                    <h2 className="section-title">Mathematical Derivations &amp; Architecture</h2>
                    <p className="section-desc">
                        Formal algebraic proofs establishing the deterministic spatial harmony and perceptual uniformity
                        underpinning the Biocircuit design system.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {/* Proof 1: Spatial Equilibrium (Signal Channel) */}
                <div className="surface-card surface-die">
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-signal)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Theorem 1
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.35rem 0 0.75rem 0', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                        Harmonic Divisor Equilibrium Equation
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)', opacity: 0.85, lineHeight: 1.6, marginBottom: '0.75rem' }}>
                        For any Board Width W, let N be the channel count, G the Keepout distance,
                        Trace = 5G, and perimeter setback Clearance = k &times; G where k = N / 6:
                    </p>
                    <div style={{
                        background: 'var(--cwbwbc-biocircuit-channel-signal-substrate-cavity)',
                        border: '1px solid var(--cwbwbc-biocircuit-channel-signal-glow-cavity)',
                        borderRadius: '6px',
                        padding: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        lineHeight: 1.6,
                        color: 'var(--cwbwbc-biocircuit-channel-signal-text-on-cavity)'
                    }}>
                        W = 2 &times; Clearance + N &times; Trace + (N - 1) &times; Keepout<br />
                        W = 2(k &times; G) + N(5G) + (N - 1)G<br />
                        W = 2kG + 5NG + NG - G<br />
                        W = (6N + 2k - 1) &times; G<br />
                        <strong>G = W / D, &nbsp; where D = 6N + 2k - 1</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Invariant Step: &Delta;D = 6(&Delta;N) + 2(&Delta;k) = 6(6) + 2(1) = <strong>38</strong>.
                    </div>
                </div>

                {/* Proof 2: Native 1fr Equivalence (Clock Channel) */}
                <div className="surface-card surface-die">
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-clock)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Theorem 2
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.35rem 0 0.75rem 0', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                        Native CSS Grid 1fr Equivalence
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)', opacity: 0.85, lineHeight: 1.6, marginBottom: '0.75rem' }}>
                        When outer board clearance is applied via <code>padding-inline: k &times; G</code>, the active inner track space
                        distributes with zero rounding slack:
                    </p>
                    <div style={{
                        background: 'var(--cwbwbc-biocircuit-channel-clock-substrate-cavity)',
                        border: '1px solid var(--cwbwbc-biocircuit-channel-clock-glow-cavity)',
                        borderRadius: '6px',
                        padding: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        lineHeight: 1.6,
                        color: 'var(--cwbwbc-biocircuit-channel-clock-text-on-cavity)'
                    }}>
                        W_active = W - 2M = (6N + 2k - 1)G - 2kG<br />
                        W_active = (6N - 1)G<br /><br />
                        In CSS Grid: N &times; (1fr) + (N - 1)G = (6N - 1)G<br />
                        N &times; (1fr) = (6N - 1)G - (N - 1)G = 5NG<br />
                        <strong>1fr = 5G = Trace (Cw)</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Guarantees <code>grid-template-columns: repeat(N, 1fr)</code> with <code>gap: G</code> exactly equals 5G per track.
                    </div>
                </div>

                {/* Proof 3: Continuous Capacity Function (Power Channel) */}
                <div className="surface-card surface-die">
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-power)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Theorem 3
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.35rem 0 0.75rem 0', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                        Continuous Slope &amp; Half-Step Transitions
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)', opacity: 0.85, lineHeight: 1.6, marginBottom: '0.75rem' }}>
                        Derived from reading ergonomics between W_min = 40ch (single reading column)
                        and W_max = 240ch (multi-pane workstation):
                    </p>
                    <div style={{
                        background: 'var(--cwbwbc-biocircuit-channel-power-substrate-cavity)',
                        border: '1px solid var(--cwbwbc-biocircuit-channel-power-glow-cavity)',
                        borderRadius: '6px',
                        padding: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        lineHeight: 1.6,
                        color: 'var(--cwbwbc-biocircuit-channel-power-text-on-cavity)'
                    }}>
                        Slope S = (N_max - N_min) / (W_max - W_min)<br />
                        S = (30 - 6) / (240 - 40) = 24 / 200 = <strong>0.12 lanes/ch</strong><br /><br />
                        Transitions trigger at half-step capacities C in [9, 15, 21, 27]:<br />
                        W_trigger = (C - 6) / 0.12 + 40<br />
                        <strong>Breakpoints: 65ch, 115ch, 165ch, 215ch</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Prevents boundary jitter or hysteresis when resizing near integer channel capacities.
                    </div>
                </div>

                {/* Proof 4: DPR Snapping (Alarm Channel) */}
                <div className="surface-card surface-die">
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-alarm)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Theorem 4
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.35rem 0 0.75rem 0', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                        Hardware Device Pixel Ratio (DPR) Quantization
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)', opacity: 0.85, lineHeight: 1.6, marginBottom: '0.75rem' }}>
                        Under non-integer Windows or mobile display scaling (e.g. 125%, 150%), fractional CSS subpixels cause blur.
                        Biocircuit snaps coordinates to physical display pixels:
                    </p>
                    <div style={{
                        background: 'var(--cwbwbc-biocircuit-channel-alarm-substrate-cavity)',
                        border: '1px solid var(--cwbwbc-biocircuit-channel-alarm-glow-cavity)',
                        borderRadius: '6px',
                        padding: '0.85rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        lineHeight: 1.6,
                        color: 'var(--cwbwbc-biocircuit-channel-alarm-text-on-cavity)'
                    }}>
                        X_snapped = floor(X_ideal &times; DPR + 0.5) / DPR<br />
                        <strong>X_snapped = round(X_ideal &times; DPR) / DPR</strong><br /><br />
                        Example @ DPR = 1.25x:<br />
                        X_ideal = 10.1587px &rarr; 10.4px (10.4 &times; 1.25 = 13 exact physical pixels)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                        Eliminates subpixel anti-aliasing fuzz on borders, traces, and canvas renderings.
                    </div>
                </div>
            </div>
        </section>
    );
};
