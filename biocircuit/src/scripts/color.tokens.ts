"use strict";

/**
 * @fileoverview Color Design Tokens & Architectural Constants.
 *
 * Defines the core hardware primitive color anchors, scale steps, and palette
 * definitions for the @crabwire/bloatware-biocircuit design system.
 *
 * Palette Anchors & Hardware Roles
 * =================================
 * 1. silicon-black   (#07080a) : Semiconductor substrate anchor (Step 900)
 * 2. titanium-white  (#f8fafc) : Structural frame & silkscreen anchor (Step 100)
 * 3. blaze-vermilion (#ef4444) : Clock rail & critical interrupt channel (Step 500)
 * 4. solar-amber     (#f59e0b) : Power delivery & warning channel (Step 500)
 * 5. laser-emerald   (#22c55e) : Sensory telemetry & nominal status channel (Step 500)
 * 6. electric-cyan   (#06b6d4) : Ground plane & digital bus channel (Step 500)
 *
 * @module src/scripts/color.tokens
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

/**
 * Standard 9-step scale indices in clean 100 increments (100 to 900).
 *
 * @type {readonly [100, 200, 300, 400, 500, 600, 700, 800, 900]}
 */
export const COLOR_STEPS = Object.freeze([100, 200, 300, 400, 500, 600, 700, 800, 900] as const);

/**
 * Literal union of valid 9-step perceptual color scale increments.
 */
export type ColorStep = (typeof COLOR_STEPS)[number];

/**
 * Topological category defining perceptual lightness progression rules.
 *
 * Values
 * ------
 * - 'black-anchor' : Anchor at step 900, interpolates lighter toward step 100.
 * - 'white-anchor' : Anchor at step 100, interpolates darker toward step 900.
 * - 'accent'       : Anchor at step 500, bi-directionally interpolates to 100 highlight and 900 shadow.
 */
export type PaletteType = 'accent' | 'black-anchor' | 'white-anchor';

/**
 * Architectural specification for an individual primitive color scale.
 *
 * Attributes
 * ----------
 * @property {string} name
 *   Canonical kebab-case identifier of the palette (e.g. 'silicon-black').
 * @property {string} description
 *   Functional hardware role and domain description of the color channel.
 * @property {ColorStep} anchorStep
 *   The step index where the anchor hex value resides (100, 500, or 900).
 * @property {string} anchorHex
 *   Hexadecimal color string anchored at anchorStep (e.g. '#07080a').
 * @property {PaletteType} type
 *   Perceptual interpolation profile ('black-anchor', 'white-anchor', 'accent').
 */
export interface PaletteConfig {
    /** Canonical kebab-case identifier of the palette. */
    readonly name: string;
    /** Functional hardware role and domain description. */
    readonly description: string;
    /** Step index where anchorHex resides (100, 500, or 900). */
    readonly anchorStep: ColorStep;
    /** Hexadecimal color string anchored at anchorStep. */
    readonly anchorHex: string;
    /** Perceptual interpolation profile. */
    readonly type: PaletteType;
}

/**
 * W3C DTCG-compliant single color token leaf node.
 *
 * Attributes
 * ----------
 * @property {string} $value
 *   Hexadecimal color string value (e.g. '#22c55e').
 * @property {'color'} $type
 *   W3C DTCG token type identifier ('color').
 */
export interface ColorTokenNode {
    /** Hexadecimal color string value. */
    readonly $value: string;
    /** W3C DTCG token type identifier. */
    readonly $type: 'color';
}

/**
 * W3C DTCG token scale group containing step nodes and metadata.
 *
 * Attributes
 * ----------
 * @property {string} $description
 *   Domain description explaining the hardware role of the color channel.
 * @property {Record<number, ColorTokenNode>} [step: number]
 *   Map of step indices (100-900) to individual color token nodes.
 */
export interface ColorScaleOutput {
    /** Domain description explaining the hardware role of the color channel. */
    readonly $description: string;
    /** Map of step indices (100-900) to individual color token nodes. */
    [step: number]: ColorTokenNode;
}

/**
 * Top-level W3C DTCG token document structure for primitives.
 *
 * Attributes
 * ----------
 * @property {Object} biocircuit
 *   Root design system namespace wrapper.
 * @property {Record<string, ColorScaleOutput>} biocircuit.color
 *   Dictionary mapping palette names to their 9-step scale definitions.
 */
export interface ColorTokenDocument {
    /** Root design system namespace wrapper. */
    readonly biocircuit: {
        /** Dictionary mapping palette names to their 9-step scale definitions. */
        readonly color: Record<string, ColorScaleOutput>;
    };
    /** Generic index signature for schema validation and serialization compatibility. */
    readonly [key: string]: unknown;
}

/**
 * Configuration contract injected into the Biocircuit Color Engine.
 *
 * Attributes
 * ----------
 * @property {readonly PaletteConfig[]} palettes
 *   Array of palette specifications to solve and interpolate.
 * @property {readonly ColorStep[]} [steps]
 *   Optional custom step indices (defaults to standard 100-900).
 */
export interface ColorConfig {
    /** Array of palette specifications to solve and interpolate. */
    readonly palettes: readonly PaletteConfig[];
    /** Optional custom step indices (defaults to standard 100-900). */
    readonly steps?: readonly ColorStep[];
}

/**
 * Canonical palette anchor definitions for the 6 core Biocircuit hardware primitives.
 *
 * @type {readonly PaletteConfig[]}
 */
export const PALETTES: readonly PaletteConfig[] = Object.freeze([
    Object.freeze({
        name: 'silicon-black',
        description: 'Deep semiconductor substrate and die package tones for dark-mode surfaces, background canvas, and recessed component cavities',
        anchorStep: 900,
        anchorHex: '#07080a',
        type: 'black-anchor'
    }),
    Object.freeze({
        name: 'titanium-white',
        description: 'Structural monoline frame and high-contrast silkscreen scale for borders, technical typography, and optical alignment markers',
        anchorStep: 100,
        anchorHex: '#f8fafc',
        type: 'white-anchor'
    }),
    Object.freeze({
        name: 'blaze-vermilion',
        description: 'High-frequency signal, clock rail, and critical interrupt channel for high-priority alerts, active buses, and critical states',
        anchorStep: 500,
        anchorHex: '#ef4444',
        type: 'accent'
    }),
    Object.freeze({
        name: 'solar-amber',
        description: 'Primary power rail, voltage delivery, and caution channel for power bus routing, energy telemetry, and warning indicators',
        anchorStep: 500,
        anchorHex: '#f59e0b',
        type: 'accent'
    }),
    Object.freeze({
        name: 'laser-emerald',
        description: 'Sensory telemetry, peripheral I/O, and nominal status channel for sensor bus routing, active telemetry, and operational states',
        anchorStep: 500,
        anchorHex: '#22c55e',
        type: 'accent'
    }),
    Object.freeze({
        name: 'electric-cyan',
        description: 'Cold ground reference plane, persistent data memory, and digital bus channel for state indicators, routing, and grounding',
        anchorStep: 500,
        anchorHex: '#06b6d4',
        type: 'accent'
    })
]);

/**
 * Default color configuration for the Biocircuit design system.
 *
 * @type {ColorConfig}
 */
export const DEFAULT_COLOR_CONFIG: ColorConfig = Object.freeze({
    palettes: PALETTES,
    steps: COLOR_STEPS
});
