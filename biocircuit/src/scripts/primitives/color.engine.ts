"use strict";

/**
 * @fileoverview Host-Agnostic Biocircuit Color Engine.
 *
 * Implements the mathematical OKLCH perceptual color space interpolation engine
 * for the @crabwire/bloatware-biocircuit design system.
 *
 * Mathematical Derivation of the Color Subsystem Pipeline
 * ========================================================
 *
 * 1. Perceptual Uniformity via OKLCH
 * ----------------------------------
 * Standard sRGB and HSL color models suffer from non-uniform perceived brightness.
 * For example, pure HSL yellow (L=50%) appears significantly brighter than pure
 * HSL blue (L=50%). OKLCH solves this by modeling colors in a cylindrical transformation
 * of the Oklab color space, isolating:
 *
 *   - L (Perceptual Lightness) : Range [0, 1], representing human brightness perception.
 *   - C (Chroma)               : Distance from the neutral gray axis (color saturation).
 *   - H (Hue Angle)            : Angle in degrees [0, 360) on the chromatic circle.
 *
 * 2. Normalized Progress Coordinate (t)
 * -------------------------------------
 * For an ordered set of S discrete steps (e.g. S = [100, 200, ..., 900], length M = 9),
 * the normalized interpolation progress parameter t_i for step index i in [0, M - 1] is:
 *
 *   t_i = i / (M - 1)
 *
 * Yielding uniform steps: t in {0.0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0}.
 *
 * 3. Topological Interpolation Profiles
 * -------------------------------------
 * Biocircuit primitives adhere to one of three topological interpolation curves:
 *
 * A. Accent Channel Profile (bi-directional anchor at Step 500, t = 0.5):
 *    - Anchor color: (L_anchor, C_anchor, h_anchor)
 *    - Highlight end (t = 0.0, Step 100):
 *        L_light = 0.96, C_light = max(C_anchor * 0.28, 0.04), h = h_anchor
 *    - Shadow end (t = 1.0, Step 900):
 *        L_dark = 0.16, C_dark = max(C_anchor * 0.45, 0.05), h = h_anchor
 *    - Interpolation: Piecewise continuous spline across [LightEnd, Anchor, DarkEnd].
 *
 * B. Semiconductor Substrate Profile (black-anchor at Step 900, t = 1.0):
 *    - Anchor color: (L_anchor, C_anchor, h_anchor) at Step 900 (#07080a)
 *    - Surface light end (t = 0.0, Step 100):
 *        L_light = 0.38, C_light = 0.035, h = h_anchor
 *    - Interpolation: Monotonic perceptual transition across [LightEnd, Anchor].
 *
 * C. Structural Silkscreen Profile (white-anchor at Step 100, t = 0.0):
 *    - Anchor color: (L_anchor, C_anchor, h_anchor) at Step 100 (#f8fafc)
 *    - Recessed dark end (t = 1.0, Step 900):
 *        L_dark = 0.20, C_dark = 0.03, h = h_anchor
 *    - Interpolation: Monotonic perceptual transition across [Anchor, DarkEnd].
 *
 * 4. Anchor Preservation
 * ----------------------
 * To prevent floating-point color gamut drift or rounding error at the hardware
 * anchor step, the anchor step strictly returns the lowercased canonical anchorHex.
 * All intermediate steps are formatted to standard hexadecimal notation (#rrggbb).
 *
 * @module src/scripts/color.engine
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import { interpolate, formatHex, oklch, type Oklch } from 'culori';
import {
    COLOR_STEPS,
    type ColorStep,
    type PaletteConfig,
    type ColorConfig,
    type ColorTokenNode,
    type ColorScaleOutput,
    type ColorTokenDocument
} from './color.tokens.js';

/**
 * Public interface of an instantiated host-agnostic color engine.
 *
 * Attributes
 * ----------
 * @property {ColorConfig} config
 *   Injected configuration contract containing palettes and steps.
 * @property {ColorTokenDocument} tokenDocument
 *   Solved 54-color W3C DTCG token document structured under biocircuit.color.
 */
export interface ColorEngineInstance {
    /** Injected configuration contract containing palettes and steps. */
    readonly config: ColorConfig;
    /** Solved 54-color W3C DTCG token document structured under biocircuit.color. */
    readonly tokenDocument: ColorTokenDocument;

    /**
     * Solves and interpolates the 9-step scale for an individual palette configuration.
     *
     * Parameters
     * ----------
     * @param {PaletteConfig} palette
     *   Palette specification containing anchor color and profile type.
     *
     * Returns
     * -------
     * @returns {ColorScaleOutput}
     *   Solved 9-step scale mapping steps 100-900 to hex color tokens.
     */
    generateScale(palette: PaletteConfig): ColorScaleOutput;

    /**
     * Resolves the complete 54-color token tree for all configured palettes.
     *
     * Returns
     * -------
     * @returns {ColorTokenDocument}
     *   Complete W3C DTCG color token document with biocircuit.color hierarchy.
     */
    solveColorAST(): ColorTokenDocument;
}

/**
 * Computes the normalized linear interpolation coordinate t in [0, 1].
 *
 * Parameters
 * ----------
 * @param {number} index
 *   0-based step index.
 * @param {number} totalSteps
 *   Total count of steps in the scale progression (typically 9).
 *
 * Returns
 * -------
 * @returns {number}
 *   Normalized scalar t in range [0, 1].
 *
 * Examples
 * --------
 * ```ts
 * getNormalizedProgress(0, 9); // 0.0
 * getNormalizedProgress(4, 9); // 0.5
 * getNormalizedProgress(8, 9); // 1.0
 * ```
 */
export function getNormalizedProgress(index: number, totalSteps: number): number {
    if (totalSteps <= 1) return 0;
    return index / (totalSteps - 1);
}

/**
 * Generates an OKLCH interpolator function tailored to the palette profile.
 *
 * Parameters
 * ----------
 * @param {PaletteConfig} palette
 *   Palette configuration containing anchor hex and profile type.
 *
 * Returns
 * -------
 * @returns {(t: number) => Oklch}
 *   Continuous interpolation function returning OKLCH color at progress t.
 *
 * Throws
 * ------
 * @throws {Error}
 *   If the anchor hex cannot be parsed into a valid OKLCH color.
 */
export function createInterpolator(palette: PaletteConfig): (t: number) => Oklch {
    const anchorColor = oklch(palette.anchorHex);
    if (!anchorColor) {
        throw new Error(`Failed to parse anchor color '${palette.anchorHex}' for palette '${palette.name}'.`);
    }

    const anchorHue = anchorColor.h ?? 0;

    if (palette.type === 'accent') {
        const lightEnd: Oklch = {
            mode: 'oklch',
            l: 0.96,
            c: Math.max(anchorColor.c * 0.28, 0.04),
            h: anchorHue
        };
        const darkEnd: Oklch = {
            mode: 'oklch',
            l: 0.16,
            c: Math.max(anchorColor.c * 0.45, 0.05),
            h: anchorHue
        };
        return interpolate([lightEnd, anchorColor, darkEnd], 'oklch');
    }

    if (palette.type === 'black-anchor') {
        const lightEnd: Oklch = {
            mode: 'oklch',
            l: 0.38,
            c: 0.035,
            h: anchorHue
        };
        return interpolate([lightEnd, anchorColor], 'oklch');
    }

    // white-anchor
    const darkEnd: Oklch = {
        mode: 'oklch',
        l: 0.20,
        c: 0.03,
        h: anchorHue
    };
    return interpolate([anchorColor, darkEnd], 'oklch');
}

/**
 * Deterministically generates a 9-step perceptual color scale from an anchor.
 *
 * Parameters
 * ----------
 * @param {PaletteConfig} palette
 *   Palette specification with anchor hex, anchor step, and interpolation type.
 * @param {readonly ColorStep[]} [steps=COLOR_STEPS]
 *   Ordered step indices (defaults to standard [100, 200, ..., 900]).
 *
 * Returns
 * -------
 * @returns {ColorScaleOutput}
 *   Dictionary mapping each step to a W3C DTCG color token node.
 *
 * Examples
 * --------
 * ```ts
 * const scale = generateScale({
 *   name: 'laser-emerald',
 *   description: 'Sensory telemetry',
 *   anchorStep: 500,
 *   anchorHex: '#22c55e',
 *   type: 'accent'
 * });
 * console.log(scale[500].$value); // '#22c55e'
 * ```
 */
export function generateScale(
    palette: PaletteConfig,
    steps: readonly ColorStep[] = COLOR_STEPS
): ColorScaleOutput {
    const scaleMap: Record<number, ColorTokenNode> = {};
    const interpolator = createInterpolator(palette);

    steps.forEach((step: ColorStep, idx: number) => {
        let hexValue: string;

        if (step === palette.anchorStep) {
            hexValue = palette.anchorHex.toLowerCase();
        } else {
            const t = getNormalizedProgress(idx, steps.length);
            const interpolatedColor = interpolator(t);
            const formatted = formatHex(interpolatedColor);

            if (!formatted) {
                throw new Error(
                    `Failed to format color at step ${step} (t=${t}) for palette '${palette.name}'.`
                );
            }
            hexValue = formatted.toLowerCase();
        }

        scaleMap[step] = Object.freeze({
            $value: hexValue,
            $type: 'color'
        });
    });

    const result: ColorScaleOutput = {
        $description: palette.description,
        ...scaleMap
    };

    return Object.freeze(result);
}

/**
 * Solves all configured palettes and compiles the full W3C DTCG token document.
 *
 * Parameters
 * ----------
 * @param {ColorConfig} config
 *   Caller-provided color configuration containing palettes and step list.
 *
 * Returns
 * -------
 * @returns {ColorTokenDocument}
 *   Complete DTCG document structured under root biocircuit.color namespace.
 *
 * Examples
 * --------
 * ```ts
 * import { DEFAULT_COLOR_CONFIG } from './color.tokens.js';
 * const doc = solveColorAST(DEFAULT_COLOR_CONFIG);
 * console.log(Object.keys(doc.biocircuit.color)); // ['silicon-black', 'titanium-white', ...]
 * ```
 */
export function solveColorAST(config: ColorConfig): ColorTokenDocument {
    const steps = config.steps ?? COLOR_STEPS;
    const colorOutput: Record<string, ColorScaleOutput> = {};

    for (const palette of config.palettes) {
        colorOutput[palette.name] = generateScale(palette, steps);
    }

    return Object.freeze({
        biocircuit: Object.freeze({
            color: Object.freeze(colorOutput)
        })
    });
}

/**
 * Factory function creating an instantiated, state-contained Biocircuit Color Engine.
 *
 * Parameters
 * ----------
 * @param {ColorConfig} config
 *   Configuration injecting palette specifications and step constants.
 *
 * Returns
 * -------
 * @returns {ColorEngineInstance}
 *   Instantiated color engine instance with bound resolution methods.
 *
 * Notes
 * -----
 * Adheres to Dependency Inversion: all palette anchors, types, and step lists
 * are caller-injected, allowing custom theme extensions or alternate palettes.
 *
 * Examples
 * --------
 * ```ts
 * import { DEFAULT_COLOR_CONFIG } from './color.tokens.js';
 * const engine = createColorEngine(DEFAULT_COLOR_CONFIG);
 * const tokens = engine.solveColorAST();
 * ```
 */
export function createColorEngine(config: ColorConfig): ColorEngineInstance {
    const steps = config.steps ?? COLOR_STEPS;
    const tokenDocument = solveColorAST(config);

    return Object.freeze({
        config: Object.freeze({ ...config }),
        tokenDocument,
        generateScale: (palette: PaletteConfig) => generateScale(palette, steps),
        solveColorAST: () => solveColorAST(config)
    });
}
