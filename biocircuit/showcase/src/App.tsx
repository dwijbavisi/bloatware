import React, { useState, useEffect } from 'react';
import { LayoutInspector } from './components/LayoutInspector';
import { ColorEngineInspector } from './components/ColorEngineInspector';
import { SemanticMatrix } from './components/SemanticMatrix';
import { ComponentGallery } from './components/ComponentGallery';
import { TokenInspector } from './components/TokenInspector';
import { MathematicalProofs } from './components/MathematicalProofs';
import { createLayoutEngine, DEFAULT_LAYOUT_CONFIG } from '@dist';

type ActiveSection = 'all' | 'layout' | 'color' | 'semantics' | 'components' | 'tokens' | 'proofs';
type ThemeMode = 'dark' | 'light' | 'system';

export const App: React.FC = () => {
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
    const [activeSection, setActiveSection] = useState<ActiveSection>('all');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Live layout telemetry
    const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
    const layoutEngine = React.useMemo(() => createLayoutEngine(DEFAULT_LAYOUT_CONFIG), []);

    useEffect(() => {
        const root = document.documentElement;
        if (themeMode === 'system') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', themeMode);
        }
    }, [themeMode]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    // Current active tier from window width
    // Estimated 1ch approx 9.6px
    const currentTier = layoutEngine.resolveTierByCh(windowWidth / 9.6);

    const scrollTo = (id: string, sectionKey: ActiveSection) => {
        setActiveSection(sectionKey);
        if (sectionKey !== 'all') {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="showcase-root">
            {/* Master Header */}
            <header className="showcase-header">
                <div className="cwbwbc-board">
                    <div className="showcase-header-inner">
                        <a href="#" className="brand-badge" onClick={(e) => { e.preventDefault(); setActiveSection('all'); }}>
                            <div className="brand-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <path d="M6 12h3l2-5 3 10 2-5h2" />
                                </svg>
                            </div>
                            <div>
                                <div className="brand-title">
                                    BIOCIRCUIT
                                    <span className="brand-version">v0.1.0</span>
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', letterSpacing: '0.02em' }}>
                                    @crabwire/bloatware-biocircuit
                                </div>
                            </div>
                        </a>

                        {/* Navigation Tabs */}
                        <nav className="nav-tabs">
                            <button
                                className={`nav-tab-btn ${activeSection === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveSection('all')}
                            >
                                Overview
                            </button>
                            <button
                                className={`nav-tab-btn ${activeSection === 'layout' ? 'active' : ''}`}
                                onClick={() => scrollTo('layout-inspector', 'layout')}
                            >
                                Layout
                            </button>
                            <button
                                className={`nav-tab-btn ${activeSection === 'color' ? 'active' : ''}`}
                                onClick={() => scrollTo('color-engine', 'color')}
                            >
                                Colors
                            </button>
                            <button
                                className={`nav-tab-btn ${activeSection === 'semantics' ? 'active' : ''}`}
                                onClick={() => scrollTo('semantic-matrix', 'semantics')}
                            >
                                Semantics
                            </button>
                            <button
                                className={`nav-tab-btn ${activeSection === 'components' ? 'active' : ''}`}
                                onClick={() => scrollTo('component-gallery', 'components')}
                            >
                                Components
                            </button>
                            <button
                                className={`nav-tab-btn ${activeSection === 'tokens' ? 'active' : ''}`}
                                onClick={() => scrollTo('token-inspector', 'tokens')}
                            >
                                DTCG Tokens
                            </button>
                            <button
                                className={`nav-tab-btn ${activeSection === 'proofs' ? 'active' : ''}`}
                                onClick={() => scrollTo('mathematical-proofs', 'proofs')}
                            >
                                Proofs
                            </button>
                        </nav>

                        {/* Theme Switcher */}
                        <div className="theme-switch-group">
                            <button
                                className={`theme-btn ${themeMode === 'dark' ? 'active' : ''}`}
                                onClick={() => setThemeMode('dark')}
                                title="Enforce dark theme"
                            >
                                Dark
                            </button>
                            <button
                                className={`theme-btn ${themeMode === 'light' ? 'active' : ''}`}
                                onClick={() => setThemeMode('light')}
                                title="Enforce light theme"
                            >
                                Light
                            </button>
                            <button
                                className={`theme-btn ${themeMode === 'system' ? 'active' : ''}`}
                                onClick={() => setThemeMode('system')}
                                title="Follow OS theme"
                            >
                                Sys
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Live Hardware Telemetry Banner */}
            <div className="telemetry-banner">
                <div className="cwbwbc-board">
                    <div className="telemetry-items">
                        <div className="telemetry-pill">
                            <span className="telemetry-dot" />
                            <span className="telemetry-label">SYSTEM STATE:</span>
                            <span className="telemetry-value">ONLINE &bull; SYNCHRONIZED</span>
                        </div>
                        <div className="telemetry-pill">
                            <span className="telemetry-label">ACTIVE TIER:</span>
                            <span className="telemetry-value">{currentTier.name} (Tier {currentTier.tierIndex})</span>
                        </div>
                        <div className="telemetry-pill">
                            <span className="telemetry-label">CHANNELS:</span>
                            <span className="telemetry-value">{currentTier.lanes} Lanes</span>
                        </div>
                        <div className="telemetry-pill">
                            <span className="telemetry-label">HARMONIC DIVISOR:</span>
                            <span className="telemetry-value">D = {currentTier.divisor}</span>
                        </div>
                        <div className="telemetry-pill">
                            <span className="telemetry-label">VIEWPORT W:</span>
                            <span className="telemetry-value">{windowWidth}px ({(windowWidth / 9.6).toFixed(1)}ch)</span>
                        </div>
                        <div className="telemetry-pill">
                            <span className="telemetry-label">DPR:</span>
                            <span className="telemetry-value">{window.devicePixelRatio || 1}x</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Board Content */}
            <main className="cwbwbc-board">
                {/* Hero Box */}
                {(activeSection === 'all' || activeSection === 'layout') && (
                    <div className="hero-box">
                        <h1 className="hero-title">
                            The <span>Biocircuit</span> Design System
                        </h1>
                        <p className="hero-subtitle">
                            An over-engineered Web UI library and mathematical design system. Replaces arbitrary screen breakpoints with continuous
                            Printed Circuit Board (PCB) physical metaphors, deterministic Harmonic Divisors (D), OKLCH perceptual color space uniformity,
                            and rigorous topological surface hierarchies.
                        </p>
                        <div className="hero-tags">
                            <span className="hero-tag">Physical PCB Metaphor</span>
                            <span className="hero-tag">W = (6N + 2k - 1) &times; G</span>
                            <span className="hero-tag">Native 1fr = 5G Trace</span>
                            <span className="hero-tag">OKLCH Perceptual Curves</span>
                            <span className="hero-tag">W3C DTCG Token Spec</span>
                            <span className="hero-tag">Hardware DPR Snapping</span>
                        </div>
                    </div>
                )}

                {/* Section Displays */}
                {(activeSection === 'all' || activeSection === 'layout') && (
                    <LayoutInspector onToast={triggerToast} />
                )}

                {(activeSection === 'all' || activeSection === 'color') && (
                    <ColorEngineInspector onToast={triggerToast} />
                )}

                {(activeSection === 'all' || activeSection === 'semantics') && (
                    <SemanticMatrix onToast={triggerToast} />
                )}

                {(activeSection === 'all' || activeSection === 'components') && (
                    <ComponentGallery onToast={triggerToast} />
                )}

                {(activeSection === 'all' || activeSection === 'tokens') && (
                    <TokenInspector onToast={triggerToast} />
                )}

                {(activeSection === 'all' || activeSection === 'proofs') && (
                    <MathematicalProofs />
                )}
            </main>

            {/* Showcase Footer */}
            <footer style={{
                borderTop: '1px solid var(--cwbwbc-biocircuit-channel-passive-glow-cavity)',
                paddingBlock: '3rem 2rem',
                marginTop: '4rem',
                background: 'var(--cwbwbc-biocircuit-channel-passive-substrate-cavity)',
                fontSize: '0.75rem',
                color: 'var(--text-subtle)'
            }}>
                <div className="cwbwbc-board">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-canvas)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                @crabwire/bloatware-biocircuit
                            </div>
                            <div>An over-engineered Web UI library by Dwij Bavisi &lt;dwij.bavisi@crabwire.net&gt;</div>
                            <div style={{ marginTop: '0.25rem' }}>Licensed under GPL-3.0-or-later. Built using the <code>dist/</code> distribution artifacts.</div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span className="telemetry-pill">
                                <span className="telemetry-dot" />
                                <span>DIST ENGINE ACTIVE</span>
                            </span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Floating Toast Notification */}
            {toastMessage && (
                <div className="toast-notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
};
