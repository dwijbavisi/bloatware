"use strict";

/**
 * @fileoverview Layout Design Tokens & Architectural Constants.
 *
 * Defines the operational boundaries derived from layout.tokens.json
 * alongside core JS runtime constants for the src/scripts/layout.engine.ts.
 *
 * @module src/scripts/layout.tokens
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

/**
 * Operational board width and channel boundaries from layout.tokens.json.
 *
 * Attributes
 * ----------
 * @property {number} minWidthCh
 *   Minimum operational board width in character units (W_min = 40ch).
 * @property {number} maxWidthCh
 *   Maximum operational board width in character units (W_max = 240ch).
 * @property {number} minLanes
 *   Baseline conductive channel count (N_min = 6).
 * @property {number} maxLanes
 *   Maximum conductive channel count (N_max = 30).
 */
export interface LayoutBounds {
    /** Minimum operational board width in character units (W_min). */
    readonly minWidthCh: number;
    /** Maximum operational board width in character units (W_max). */
    readonly maxWidthCh: number;
    /** Baseline conductive channel count (N_min). */
    readonly minLanes: number;
    /** Maximum conductive channel count (N_max). */
    readonly maxLanes: number;
}

/**
 * Core mathematical invariants of the Biocircuit PCB layout metaphor.
 *
 * Attributes
 * ----------
 * @property {number} TRACE_TO_KEEPOUT_RATIO
 *   Strict 5:1 ratio between column trace width (Cw) and isolation gutter (G).
 * @property {number} LANE_STEP
 *   Channel count increment per tier step (6 lanes per tier).
 * @property {readonly number[]} STANDARD_DPR_PROFILES
 *   Hardware display pixel ratio targets for subpixel snapping (1x, 1.25x, 1.5x, 2x, 3x).
 * @property {readonly string[]} TIER_NAMES
 *   Ergonomic names corresponding to tiers 1 through 5.
 */
export interface LayoutConstants {
    /** Strict 5:1 ratio between column trace width and isolation gutter. */
    readonly TRACE_TO_KEEPOUT_RATIO: number;
    /** Channel count increment per tier step. */
    readonly LANE_STEP: number;
    /** Hardware display pixel ratio targets for subpixel snapping. */
    readonly STANDARD_DPR_PROFILES: readonly number[];
    /** Ergonomic names corresponding to tiers 1 through 5. */
    readonly TIER_NAMES: readonly string[];
}

/**
 * Injected configuration contract for the Biocircuit Layout Engine.
 *
 * Attributes
 * ----------
 * @property {number} minWidthCh
 *   Minimum operational board width in character units.
 * @property {number} maxWidthCh
 *   Maximum operational board width in character units.
 * @property {number} minLanes
 *   Minimum conductive channels.
 * @property {number} maxLanes
 *   Maximum conductive channels.
 * @property {number} traceToKeepoutRatio
 *   Ratio of trace width to keepout gutter.
 * @property {number} laneStep
 *   Step increment between discrete tiers.
 * @property {readonly number[]} [dprProfiles]
 *   Optional display pixel ratio targets.
 * @property {readonly string[]} [tierNames]
 *   Optional list of custom tier names.
 */
export interface LayoutConfig extends LayoutBounds {
    /** Ratio of trace width to keepout gutter. */
    readonly traceToKeepoutRatio: number;
    /** Step increment between discrete tiers. */
    readonly laneStep: number;
    /** Optional display pixel ratio targets. */
    readonly dprProfiles?: readonly number[];
    /** Optional list of custom tier names. */
    readonly tierNames?: readonly string[];
}

/**
 * Operational board width and channel boundaries (derived from layout.tokens.json).
 *
 * Notes
 * -----
 * Defines the typographic bounds between 40ch (single reading column) and
 * 240ch (multi-pane ultra-wide display).
 *
 * @type {LayoutBounds}
 */
export const LAYOUT_BOUNDS: LayoutBounds = Object.freeze({
    minWidthCh: 40,
    maxWidthCh: 240,
    minLanes: 6,
    maxLanes: 30
});

/**
 * Core mathematical invariants of the Biocircuit layout metaphor.
 *
 * Notes
 * -----
 * Locks the fundamental 5:1 Trace-to-Keepout ratio and tier step delta of 6 lanes.
 *
 * @type {LayoutConstants}
 */
export const LAYOUT_CONSTANTS: LayoutConstants = Object.freeze({
    TRACE_TO_KEEPOUT_RATIO: 5,
    LANE_STEP: 6,
    STANDARD_DPR_PROFILES: Object.freeze([1, 1.25, 1.5, 2, 3]),
    TIER_NAMES: Object.freeze(['Micro', 'Compact', 'Regular', 'Expanded', 'Ultra'])
});

/**
 * Default layout configuration combining bounds and engine constants.
 *
 * Notes
 * -----
 * Passed to createLayoutEngine() to produce the canonical Biocircuit layout instance.
 *
 * @type {LayoutConfig}
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = Object.freeze({
    ...LAYOUT_BOUNDS,
    traceToKeepoutRatio: LAYOUT_CONSTANTS.TRACE_TO_KEEPOUT_RATIO,
    laneStep: LAYOUT_CONSTANTS.LANE_STEP,
    dprProfiles: LAYOUT_CONSTANTS.STANDARD_DPR_PROFILES,
    tierNames: LAYOUT_CONSTANTS.TIER_NAMES
});
