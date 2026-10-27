"use strict";

/**
 * @fileoverview Host-Agnostic Biocircuit Layout Engine.
 *
 * Implements the mathematical layout subsystem for @crabwire/bloatware-biocircuit.
 *
 * Mathematical Derivation of the Biocircuit Layout Pipeline
 * ==========================================================
 *
 * 1. The PCB Physical Metaphor
 * ----------------------------
 * Traditional responsive web grid systems partition space into arbitrary columns
 * and disconnected gutter paddings. Biocircuit models the viewport surface as
 * a conductive Printed Circuit Board ("Board"), containing active signal channels
 * ("Traces"), physical isolation gutters ("Keepouts"), and edge perimeter setbacks
 * ("Clearances").
 *
 * - Board Width (W) : Total inline dimension of the layout surface (e.g. 100vw).
 * - Lanes (N)       : Count of active parallel conductive channels, N in {6, 12, 18, 24, 30}.
 * - Keepout (G)     : Fundamental physical unit of isolation distance between traces.
 * - Trace (Cw)      : Physical width of an individual column, locked to 5 * Keepout (5G).
 * - Clearance (M)   : Boundary margin setback from board edge to outer traces,
 *                     defined as M = k * G, where k = N / laneStep (k in {1, 2, 3, 4, 5}).
 *
 * 2. The Spatial Layout Equation & Harmonic Divisor (D)
 * -----------------------------------------------------
 * For any Board Width W, the total inline geometry is the sum of boundary clearances,
 * active column traces, and inter-trace keepouts:
 *
 *   W = 2 * Clearance + N * Trace + (N - 1) * Keepout
 *
 * Substituting Trace = 5G and Clearance = k * G:
 *
 *   W = 2(k * G) + N(5 * G) + (N - 1) * G
 *   W = 2kG + 5NG + NG - G
 *   W = (6N + 2k - 1) * G
 *
 * Solving for the fundamental Keepout unit (G):
 *
 *   G = W / (6N + 2k - 1) = W / D
 *
 * The denominator D = (6N + 2k - 1) is designated the Harmonic Divisor. Because lane
 * count N advances in discrete steps of 6 and multiplier k = N / 6, D is a deterministic
 * integer invariant for each layout tier:
 *
 *   - Tier 1 (Micro)   : N=6,  k=1 => D = 6(6)  + 2(1) - 1 = 37   (Margin = 1G)
 *   - Tier 2 (Compact) : N=12, k=2 => D = 6(12) + 2(2) - 1 = 75   (Margin = 2G)
 *   - Tier 3 (Regular) : N=18, k=3 => D = 6(18) + 2(3) - 1 = 113  (Margin = 3G)
 *   - Tier 4 (Expanded): N=24, k=4 => D = 6(24) + 2(4) - 1 = 151  (Margin = 4G)
 *   - Tier 5 (Ultra)   : N=30, k=5 => D = 6(30) + 2(5) - 1 = 189  (Margin = 5G = 1 Trace!)
 *
 * Harmonic Divisor Invariant:
 * The difference between successive divisors is constant:
 *   Delta D = 6 * (Delta N) + 2 * (Delta k) = 6(6) + 2(1) = 38.
 *
 * 3. Continuous Capacity Function & Typographic Midpoint Quantization
 * -------------------------------------------------------------------
 * Breakpoints are derived continuously from reading typography rather than arbitrary
 * viewport widths. Given minimum operational width W_min = 40ch (N_min = 6) and
 * maximum operational width W_max = 240ch (N_max = 30):
 *
 *   Slope S = (N_max - N_min) / (W_max - W_min) = (30 - 6) / (240 - 40) = 0.12 lanes/ch
 *
 * The continuous lane capacity function is:
 *
 *   C(W) = S * (W - W_min) + N_min = 0.12 * (W - 40) + 6
 *
 * To avoid layout instability at exact integer boundaries, discrete tier transitions
 * trigger at the half-step midpoints C in {9, 15, 21, 27}:
 *
 *   W_trigger = (C - N_min) / S + W_min
 *
 *   - C = 9.0  => W_trigger = (9 - 6) / 0.12 + 40  = 25 + 40  = 65ch
 *   - C = 15.0 => W_trigger = (15 - 6) / 0.12 + 40 = 75 + 40  = 115ch
 *   - C = 21.0 => W_trigger = (21 - 6) / 0.12 + 40 = 125 + 40 = 165ch
 *   - C = 27.0 => W_trigger = (27 - 6) / 0.12 + 40 = 175 + 40 = 215ch
 *
 * 4. Native CSS Grid 1fr Equivalence
 * ----------------------------------
 * When the outer board clearance is applied via padding-inline: M = k * G, the
 * active inner width available for track distribution is:
 *
 *   W_active = W - 2M = (6N + 2k - 1)G - 2kG = (6N - 1)G
 *
 * In CSS Grid with N columns of 1fr and (N - 1) gaps of Keepout G:
 *
 *   N * (1fr) + (N - 1)G = W_active = (6N - 1)G
 *   N * (1fr) = (6N - 1)G - (N - 1)G = 5NG
 *   1fr = 5G = Trace (Cw)
 *
 * Therefore, CSS grid-template-columns: repeat(N, 1fr) with gap: G guarantees
 * that each 1fr column track naturally expands to exactly 5 * Keepout with zero
 * rounding error or layout slack.
 *
 * 5. Device Pixel Ratio (DPR) Quantization
 * ----------------------------------------
 * Continuous fluid divisions (e.g. W / 189) produce fractional CSS subpixels.
 * For hardware display rendering (canvas, circuit overlays, crisp border edges),
 * coordinates are snapped to physical device pixel grids:
 *
 *   X_snapped = round(X_ideal * DPR) / DPR
 *
 * Across DPR profiles {1, 1.25, 1.5, 2, 3}, this guarantees physical integer alignment.
 *
 * @module src/scripts/layout.engine
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import type { LayoutBounds, LayoutConfig } from './layout.tokens.js';

/**
 * Structural specification of a discrete layout tier.
 *
 * Attributes
 * ----------
 * @property {string} id
 *   Unique alphanumeric identifier of the tier (e.g. 'tier-1').
 * @property {number} tierIndex
 *   1-based sequential tier index (1 to 5).
 * @property {string} name
 *   Human-readable ergonomic name of the tier (Micro, Compact, Regular, Expanded, Ultra).
 * @property {number} lanes
 *   Total count of active conductive tracks / channels (N in {6, 12, 18, 24, 30}).
 * @property {number} k
 *   Boundary setback clearance multiplier (k = N / laneStep).
 * @property {number} divisor
 *   Deterministic Harmonic Divisor D = 6N + 2k - 1.
 * @property {number} minWidthCh
 *   Typographic inline breakpoint threshold in character units (ch).
 * @property {number} edgeClearanceMultiplier
 *   Edge boundary clearance expressed as a multiple of Keepout G (equals k).
 */
export interface LayoutTier {
    /** Unique alphanumeric identifier of the tier (e.g. 'tier-1'). */
    readonly id: string;
    /** 1-based sequential tier index (1 to 5). */
    readonly tierIndex: number;
    /** Human-readable ergonomic name of the tier (Micro, Compact, Regular, Expanded, Ultra). */
    readonly name: string;
    /** Total count of active conductive tracks / channels (N in {6, 12, 18, 24, 30}). */
    readonly lanes: number;
    /** Boundary setback clearance multiplier (k = N / laneStep). */
    readonly k: number;
    /** Deterministic Harmonic Divisor D = 6N + 2k - 1. */
    readonly divisor: number;
    /** Typographic inline breakpoint threshold in character units (ch). */
    readonly minWidthCh: number;
    /** Edge boundary clearance expressed as a multiple of Keepout G (equals k). */
    readonly edgeClearanceMultiplier: number;
}

/**
 * Intermediate Abstract Syntax Tree (AST) representing the solved layout subsystem.
 *
 * Attributes
 * ----------
 * @property {LayoutBounds} bounds
 *   Operational boundaries in typographic and channel dimensions.
 * @property {Object} constants
 *   Solved scalar invariants of the PCB layout engine.
 * @property {number} constants.traceToKeepoutRatio
 *   Ratio of column trace width to gutter keepout width (locked to 5).
 * @property {number} constants.laneStep
 *   Channel step increment between successive tiers (locked to 6).
 * @property {number} constants.slope
 *   Continuous lane capacity slope: S = (N_max - N_min) / (W_max - W_min).
 * @property {readonly LayoutTier[]} tiers
 *   Immutable array of solved discrete layout tiers.
 * @property {readonly number[]} dprProfiles
 *   Supported display device pixel ratio profiles for subpixel snapping.
 */
export interface LayoutAST {
    /** Operational boundaries in typographic and channel dimensions. */
    readonly bounds: LayoutBounds;
    /** Solved scalar invariants of the PCB layout engine. */
    readonly constants: {
        /** Ratio of column trace width to gutter keepout width (locked to 5). */
        readonly traceToKeepoutRatio: number;
        /** Channel step increment between successive tiers (locked to 6). */
        readonly laneStep: number;
        /** Continuous lane capacity slope: S = (N_max - N_min) / (W_max - W_min). */
        readonly slope: number;
    };
    /** Immutable array of solved discrete layout tiers. */
    readonly tiers: readonly LayoutTier[];
    /** Supported display device pixel ratio profiles for subpixel snapping. */
    readonly dprProfiles: readonly number[];
}

/**
 * Concrete layout geometry solved and snapped for a specific viewport dimension.
 *
 * Attributes
 * ----------
 * @property {LayoutTier} tier
 *   The active tier resolved for the given width.
 * @property {number} widthCh
 *   Viewport or container inline width expressed in character units (ch).
 * @property {number} totalWidthPx
 *   Total inline layout width in CSS pixels (W).
 * @property {number} keepoutPx
 *   Hardware-snapped gutter keepout width in CSS pixels (G = W / D).
 * @property {number} tracePx
 *   Hardware-snapped column trace width in CSS pixels (Cw = 5 * G).
 * @property {number} clearancePx
 *   Hardware-snapped edge perimeter clearance in CSS pixels (M = k * G).
 * @property {number} activeWidthPx
 *   Hardware-snapped active board width in CSS pixels (W_active = W - 2M).
 * @property {number} dpr
 *   Active device pixel ratio applied during hardware snapping.
 */
export interface LayoutMetrics {
    /** The active tier resolved for the given width. */
    readonly tier: LayoutTier;
    /** Viewport or container inline width expressed in character units (ch). */
    readonly widthCh: number;
    /** Total inline layout width in CSS pixels (W). */
    readonly totalWidthPx: number;
    /** Hardware-snapped gutter keepout width in CSS pixels (G = W / D). */
    readonly keepoutPx: number;
    /** Hardware-snapped column trace width in CSS pixels (Cw = 5 * G). */
    readonly tracePx: number;
    /** Hardware-snapped edge perimeter clearance in CSS pixels (M = k * G). */
    readonly clearancePx: number;
    /** Hardware-snapped active board width in CSS pixels (W_active = W - 2M). */
    readonly activeWidthPx: number;
    /** Active device pixel ratio applied during hardware snapping. */
    readonly dpr: number;
}

/**
 * Public interface of an instantiated host-agnostic layout engine.
 *
 * Attributes
 * ----------
 * @property {LayoutConfig} config
 *   Configuration parameters injected during engine construction.
 * @property {number} slope
 *   Computed continuous slope S = (N_max - N_min) / (W_max - W_min).
 * @property {readonly LayoutTier[]} tiers
 *   Immutable array of all discrete tiers supported by this engine instance.
 * @property {LayoutAST} ast
 *   Solved Intermediate AST of the layout subsystem.
 */
export interface LayoutEngineInstance {
    /** Configuration parameters injected during engine construction. */
    readonly config: LayoutConfig;
    /** Computed continuous slope S = (N_max - N_min) / (W_max - W_min). */
    readonly slope: number;
    /** Immutable array of all discrete tiers supported by this engine instance. */
    readonly tiers: readonly LayoutTier[];
    /** Solved Intermediate AST of the layout subsystem. */
    readonly ast: LayoutAST;

    /**
     * Quantizes an ideal physical pixel coordinate to active display pixel boundaries.
     *
     * Parameters
     * ----------
     * @param {number} px
     *   Ideal coordinate or dimension in CSS pixels.
     * @param {number} [dpr=1]
     *   Target device pixel ratio. Defaults to 1.
     *
     * Returns
     * -------
     * @returns {number}
     *   Dimension snapped to physical hardware pixel boundaries.
     */
    snapToDpr(px: number, dpr?: number): number;

    /**
     * Resolves the active layout tier for an inline width given in character units (ch).
     *
     * Parameters
     * ----------
     * @param {number} widthCh
     *   Inline surface width in character units (ch).
     *
     * Returns
     * -------
     * @returns {LayoutTier}
     *   The matching active layout tier.
     */
    resolveTierByCh(widthCh: number): LayoutTier;

    /**
     * Computes fully quantized, hardware-snapped layout dimensions for a pixel width.
     *
     * Parameters
     * ----------
     * @param {number} widthPx
     *   Total inline width in CSS pixels.
     * @param {number} chInPx
     *   Measured width of 1ch glyph in CSS pixels.
     * @param {number} [dpr=1]
     *   Target device pixel ratio for hardware snapping.
     *
     * Returns
     * -------
     * @returns {LayoutMetrics}
     *   Snapped layout geometry object.
     */
    resolveLayoutMetrics(widthPx: number, chInPx: number, dpr?: number): LayoutMetrics;
}

/**
 * Quantizes an ideal physical pixel coordinate to physical hardware device pixel boundaries.
 *
 * Mathematical Formalism
 * ----------------------
 * Under device pixel ratio R, a CSS pixel maps to R hardware pixels:
 *
 *   X_snapped = floor(X_ideal * R + 0.5) / R = round(X_ideal * R) / R
 *
 * This prevents anti-aliased subpixel blurring across non-integer display scales
 * (e.g. 125% and 150% Windows display scaling).
 *
 * Parameters
 * ----------
 * @param {number} px
 *   Ideal floating-point pixel coordinate or dimension.
 * @param {number} [dpr=1]
 *   Target device pixel ratio (e.g., window.devicePixelRatio). Defaults to 1.
 *
 * Returns
 * -------
 * @returns {number}
 *   Quantized dimension snapped to exact hardware device pixel boundaries.
 *
 * Examples
 * --------
 * ```ts
 * snapToDpr(10.1587, 1);    // 10
 * snapToDpr(10.1587, 1.25); // 10.4 (10.4 * 1.25 = 13 exact physical pixels)
 * snapToDpr(10.1587, 2);    // 10.5 (10.5 * 2 = 21 exact physical pixels)
 * ```
 */
export function snapToDpr(px: number, dpr: number = 1): number {
    if (!Number.isFinite(px)) return 0;
    const safeDpr = dpr > 0 ? dpr : 1;
    return Math.round(px * safeDpr) / safeDpr;
}

/**
 * Computes the continuous lane capacity slope between typographic bounds.
 *
 * Mathematical Formalism
 * ----------------------
 * Given domain boundaries [W_min, W_max] in character units and lane bounds [N_min, N_max]:
 *
 *   Slope S = (N_max - N_min) / (W_max - W_min)
 *
 * For standard Biocircuit bounds (W in [40ch, 240ch], N in [6, 30]):
 *
 *   S = (30 - 6) / (240 - 40) = 24 / 200 = 0.12 lanes / ch
 *
 * Parameters
 * ----------
 * @param {number} minW
 *   Minimum operational board width in character units (W_min).
 * @param {number} maxW
 *   Maximum operational board width in character units (W_max).
 * @param {number} minN
 *   Baseline lane channel capacity (N_min).
 * @param {number} maxN
 *   Maximum lane channel capacity (N_max).
 *
 * Returns
 * -------
 * @returns {number}
 *   Continuous lane capacity rate of change (lanes per character unit).
 *
 * Throws
 * ------
 * @throws {Error}
 *   If maxW <= minW (non-positive typographic operational range).
 *
 * Examples
 * --------
 * ```ts
 * const slope = calculateSlope(40, 240, 6, 30); // 0.12
 * ```
 */
export function calculateSlope(minW: number, maxW: number, minN: number, maxN: number): number {
    if (maxW <= minW) {
        throw new Error(`Invalid bounds: maxWidth (${maxW}) must be strictly greater than minWidth (${minW}).`);
    }
    return (maxN - minN) / (maxW - minW);
}

/**
 * Computes the Harmonic Divisor (D) for a discrete layout tier.
 *
 * Mathematical Formalism
 * ----------------------
 * Derived from the spatial layout equilibrium equation:
 *
 *   W = 2 * Clearance + N * Trace + (N - 1) * Keepout
 *   W = 2(k * G) + N(5G) + (N - 1)G = (6N + 2k - 1) * G
 *   D = 6N + 2k - 1
 *
 * Parameters
 * ----------
 * @param {number} lanes
 *   Total active conductive channels (N in {6, 12, 18, 24, 30}).
 * @param {number} k
 *   Edge clearance multiplier factor (k = N / laneStep).
 *
 * Returns
 * -------
 * @returns {number}
 *   Deterministic integer Harmonic Divisor D such that Keepout G = BoardWidth / D.
 *
 * Notes
 * -----
 * For every tier step (Delta N = 6, Delta k = 1), Delta D = 38 (deterministic invariant).
 *
 * Examples
 * --------
 * ```ts
 * calculateHarmonicDivisor(6, 1);  // 37
 * calculateHarmonicDivisor(12, 2); // 75
 * calculateHarmonicDivisor(18, 3); // 113
 * calculateHarmonicDivisor(24, 4); // 151
 * calculateHarmonicDivisor(30, 5); // 189
 * ```
 */
export function calculateHarmonicDivisor(lanes: number, k: number): number {
    return 6 * lanes + 2 * k - 1;
}

/**
 * Computes the typographic activation trigger width for a half-step lane midpoint.
 *
 * Mathematical Formalism
 * ----------------------
 * To avoid visual hysteresis or layout thrashing at exact integer lane counts,
 * tier transitions trigger at half-step capacity midpoints:
 *
 *   C_mid = targetLane - (laneStep / 2)
 *   W_trigger = (C_mid - minLanes) / slope + minWidthCh
 *
 * Parameters
 * ----------
 * @param {number} targetLane
 *   Target lane count of the tier being entered (e.g. 12, 18, 24, 30).
 * @param {number} minLanes
 *   Baseline lane count of the system (e.g. 6).
 * @param {number} minWidthCh
 *   Minimum operational reading width in ch units (e.g. 40).
 * @param {number} slope
 *   Continuous capacity slope S (e.g. 0.12 lanes/ch).
 * @param {number} laneStep
 *   Step size between successive tiers (e.g. 6).
 *
 * Returns
 * -------
 * @returns {number}
 *   Typographic inline trigger width in character units (ch).
 *
 * Examples
 * --------
 * ```ts
 * // Compact tier (12 lanes, midpoint C = 9.0):
 * calculateQuantizedMidpoint(12, 6, 40, 0.12, 6); // 65 (ch)
 * ```
 */
export function calculateQuantizedMidpoint(
    targetLane: number,
    minLanes: number,
    minWidthCh: number,
    slope: number,
    laneStep: number
): number {
    const midLane = targetLane - (laneStep / 2);
    return (midLane - minLanes) / slope + minWidthCh;
}

/**
 * Derives the complete discrete tier progression from caller-provided configuration.
 *
 * Mathematical Derivation
 * -----------------------
 * Generates an immutable progression of tiers iterating from minLanes to maxLanes
 * with step increment laneStep. For each tier:
 *   - k = lanes / laneStep
 *   - D = 6 * lanes + 2 * k - 1
 *   - minWidthCh = 0 for Tier 1, else quantized midpoint threshold.
 *
 * Parameters
 * ----------
 * @param {LayoutConfig} config
 *   Configuration object specifying typographic bounds, lane range, and step constants.
 *
 * Returns
 * -------
 * @returns {readonly LayoutTier[]}
 *   Immutable list of fully calibrated layout tiers.
 *
 * Examples
 * --------
 * ```ts
 * import { DEFAULT_LAYOUT_CONFIG } from './layout.tokens.js';
 * const tiers = deriveLayoutTiers(DEFAULT_LAYOUT_CONFIG);
 * console.log(tiers.length); // 5 tiers: Micro, Compact, Regular, Expanded, Ultra
 * ```
 */
export function deriveLayoutTiers(config: LayoutConfig): readonly LayoutTier[] {
    const { minWidthCh, maxWidthCh, minLanes, maxLanes, laneStep } = config;
    const slope = calculateSlope(minWidthCh, maxWidthCh, minLanes, maxLanes);
    const tierCount = Math.floor((maxLanes - minLanes) / laneStep) + 1;
    const tierNames = config.tierNames ?? ['Micro', 'Compact', 'Regular', 'Expanded', 'Ultra'];

    const tiers: LayoutTier[] = [];

    for (let i = 0; i < tierCount; i++) {
        const lanes = minLanes + i * laneStep;
        const k = lanes / laneStep;
        const divisor = calculateHarmonicDivisor(lanes, k);
        const minWidth = i === 0 ? 0 : calculateQuantizedMidpoint(lanes, minLanes, minWidthCh, slope, laneStep);

        tiers.push(Object.freeze({
            id: `tier-${i + 1}`,
            tierIndex: i + 1,
            name: tierNames[i] ?? `Tier-${i + 1}`,
            lanes,
            k,
            divisor,
            minWidthCh: minWidth,
            edgeClearanceMultiplier: k
        }));
    }

    return Object.freeze(tiers);
}

/**
 * Compiles the complete Intermediate Layout AST from caller configuration.
 *
 * Parameters
 * ----------
 * @param {LayoutConfig} config
 *   Operational configuration injecting bounds, ratios, and tier options.
 *
 * Returns
 * -------
 * @returns {LayoutAST}
 *   Structured intermediate AST representing the solved system.
 *
 * Notes
 * -----
 * The returned AST is an immutable, normalized representation ready for
 * serialization by downstream CSS or token code generators.
 *
 * Examples
 * --------
 * ```ts
 * import { DEFAULT_LAYOUT_CONFIG } from './layout.tokens.js';
 * const ast = createLayoutAST(DEFAULT_LAYOUT_CONFIG);
 * console.log(ast.constants.slope); // 0.12
 * ```
 */
export function createLayoutAST(config: LayoutConfig): LayoutAST {
    const slope = calculateSlope(config.minWidthCh, config.maxWidthCh, config.minLanes, config.maxLanes);
    const tiers = deriveLayoutTiers(config);

    return Object.freeze({
        bounds: Object.freeze({
            minWidthCh: config.minWidthCh,
            maxWidthCh: config.maxWidthCh,
            minLanes: config.minLanes,
            maxLanes: config.maxLanes
        }),
        constants: Object.freeze({
            traceToKeepoutRatio: config.traceToKeepoutRatio,
            laneStep: config.laneStep,
            slope
        }),
        tiers,
        dprProfiles: Object.freeze([...(config.dprProfiles ?? [1, 1.25, 1.5, 2, 3])])
    });
}

/**
 * Resolves the active layout tier for a given inline width in character (ch) units.
 *
 * Parameters
 * ----------
 * @param {number} widthCh
 *   Inline container or viewport width in character units (ch).
 * @param {readonly LayoutTier[]} tiers
 *   Immutable list of operational tiers (ordered from lowest to highest).
 *
 * Returns
 * -------
 * @returns {LayoutTier}
 *   The highest active tier whose minWidthCh threshold is satisfied.
 *
 * Examples
 * --------
 * ```ts
 * resolveTierByCh(50, tiers);  // Micro (< 65ch)
 * resolveTierByCh(70, tiers);  // Compact (>= 65ch)
 * resolveTierByCh(190, tiers); // Expanded (>= 165ch)
 * ```
 */
export function resolveTierByCh(widthCh: number, tiers: readonly LayoutTier[]): LayoutTier {
    for (let i = tiers.length - 1; i >= 0; i--) {
        if (widthCh >= tiers[i].minWidthCh) {
            return tiers[i];
        }
    }
    return tiers[0];
}

/**
 * Solves and quantizes all physical layout geometry for given pixel dimensions.
 *
 * Mathematical Formalism
 * ----------------------
 * 1. Converts pixel width to typographic width: widthCh = widthPx / chInPx
 * 2. Resolves active tier matching widthCh.
 * 3. Solves fundamental keepout gutter: G_raw = widthPx / tier.divisor
 * 4. Snaps all dimensions to active display DPR:
 *      keepoutPx   = snapToDpr(G_raw, dpr)
 *      tracePx     = snapToDpr(G_raw * traceRatio, dpr)
 *      clearancePx = snapToDpr(G_raw * tier.k, dpr)
 *      activeWidth = snapToDpr(widthPx - 2 * clearancePx, dpr)
 *
 * Parameters
 * ----------
 * @param {number} widthPx
 *   Total inline layout surface width in CSS pixels (W).
 * @param {number} chInPx
 *   Measured width of 1ch glyph in CSS pixels for the active font.
 * @param {number} [dpr=1]
 *   Target device pixel ratio for hardware snapping. Defaults to 1.
 * @param {readonly LayoutTier[]} tiers
 *   Array of layout tiers to evaluate.
 * @param {number} [traceToKeepoutRatio=5]
 *   Trace-to-keepout ratio constant (defaults to 5).
 *
 * Returns
 * -------
 * @returns {LayoutMetrics}
 *   Complete solved layout geometry with physical hardware alignment.
 *
 * Examples
 * --------
 * ```ts
 * const metrics = resolveLayoutMetrics(1920, 10, 1.25, tiers, 5);
 * console.log(metrics.tier.name);    // 'Expanded' (24 lanes)
 * console.log(metrics.keepoutPx);    // 12.8 px (16 physical device px)
 * console.log(metrics.clearancePx);  // 51.2 px (64 physical device px)
 * ```
 */
export function resolveLayoutMetrics(
    widthPx: number,
    chInPx: number,
    dpr: number = 1,
    tiers: readonly LayoutTier[],
    traceToKeepoutRatio: number = 5
): LayoutMetrics {
    const safeWidth = Math.max(0, widthPx);
    const safeCh = chInPx > 0 ? chInPx : 8;
    const widthCh = safeWidth / safeCh;

    const tier = resolveTierByCh(widthCh, tiers);
    const rawKeepout = safeWidth / tier.divisor;
    const keepoutPx = snapToDpr(rawKeepout, dpr);
    const tracePx = snapToDpr(rawKeepout * traceToKeepoutRatio, dpr);
    const clearancePx = snapToDpr(rawKeepout * tier.k, dpr);
    const activeWidthPx = snapToDpr(safeWidth - (2 * clearancePx), dpr);

    return Object.freeze({
        tier,
        widthCh,
        totalWidthPx: safeWidth,
        keepoutPx,
        tracePx,
        clearancePx,
        activeWidthPx,
        dpr: dpr > 0 ? dpr : 1
    });
}

/**
 * Factory function creating a fully instantiated, state-contained layout engine.
 *
 * Parameters
 * ----------
 * @param {LayoutConfig} config
 *   Caller-provided configuration injecting operational boundaries and constants.
 *
 * Returns
 * -------
 * @returns {LayoutEngineInstance}
 *   Instantiated layout engine with bound resolution methods.
 *
 * Notes
 * -----
 * Adheres to Dependency Inversion: the engine contains zero hardcoded assumptions
 * regarding typographic bounds or channel step size, making it fully reconfigurable.
 *
 * Examples
 * --------
 * ```ts
 * import { DEFAULT_LAYOUT_CONFIG } from './layout.tokens.js';
 * const engine = createLayoutEngine(DEFAULT_LAYOUT_CONFIG);
 * const metrics = engine.resolveLayoutMetrics(1440, 10, window.devicePixelRatio);
 * ```
 */
export function createLayoutEngine(config: LayoutConfig): LayoutEngineInstance {
    const slope = calculateSlope(config.minWidthCh, config.maxWidthCh, config.minLanes, config.maxLanes);
    const tiers = deriveLayoutTiers(config);
    const ast = createLayoutAST(config);

    return Object.freeze({
        config: Object.freeze({ ...config }),
        slope,
        tiers,
        ast,
        snapToDpr,
        resolveTierByCh: (widthCh: number) => resolveTierByCh(widthCh, tiers),
        resolveLayoutMetrics: (widthPx: number, chInPx: number, dpr: number = 1) =>
            resolveLayoutMetrics(widthPx, chInPx, dpr, tiers, config.traceToKeepoutRatio)
    });
}
