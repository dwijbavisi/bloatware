/**
 * @fileoverview biocircuit primitive color tokens generator.
 *
 * Deterministically computes 9-step (100-900) perceptual color scales for the 6 core
 * biocircuit hardware primitives using the OKLCH color space via Culori.
 *
 * Palette Anchors
 * ---------------
 * 1. silicon-black   : #07080a (Anchor Step 900 -> flows lighter to Step 100)
 * 2. titanium-white  : #f8fafc (Anchor Step 100 -> flows darker to Step 900)
 * 3. blaze-vermilion : #ef4444 (Anchor Step 500 -> 100 highlight tint to 900 cavity shadow)
 * 4. solar-amber     : #f59e0b (Anchor Step 500 -> 100 highlight tint to 900 cavity shadow)
 * 5. laser-emerald   : #22c55e (Anchor Step 500 -> 100 highlight tint to 900 cavity shadow)
 * 6. electric-cyan   : #06b6d4 (Anchor Step 500 -> 100 highlight tint to 900 cavity shadow)
 *
 * @module scripts/generate-primitives
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import { interpolate, formatHex, oklch, type Oklch } from 'culori';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'tokens', 'primitives', 'colors.json');

/**
 * Standard 9-step scale indices in clean 100 increments (100 to 900).
 */
export const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
export type StepNumber = (typeof STEPS)[number];

export type PaletteType = 'accent' | 'black-anchor' | 'white-anchor';

export interface PaletteConfig {
    name: string;
    description: string;
    anchorStep: StepNumber;
    anchorHex: string;
    type: PaletteType;
}

export interface ColorTokenNode {
    $value: string;
    $type: 'color';
}

export interface ColorScaleOutput {
    $description: string;
    [step: number]: ColorTokenNode;
}

export interface ColorTokenDocument {
    color: Record<string, ColorScaleOutput>;
}

export const PALETTES: readonly PaletteConfig[] = [
    {
        name: 'silicon-black',
        description: 'Deep semiconductor substrate and die package tones for dark-mode surfaces, background canvas, and recessed component cavities',
        anchorStep: 900,
        anchorHex: '#07080a',
        type: 'black-anchor'
    },
    {
        name: 'titanium-white',
        description: 'Structural monoline frame and high-contrast silkscreen scale for borders, technical typography, and optical alignment markers',
        anchorStep: 100,
        anchorHex: '#f8fafc',
        type: 'white-anchor'
    },
    {
        name: 'blaze-vermilion',
        description: 'High-frequency signal, clock rail, and critical interrupt channel for high-priority alerts, active buses, and critical states',
        anchorStep: 500,
        anchorHex: '#ef4444',
        type: 'accent'
    },
    {
        name: 'solar-amber',
        description: 'Primary power rail, voltage delivery, and caution channel for power bus routing, energy telemetry, and warning indicators',
        anchorStep: 500,
        anchorHex: '#f59e0b',
        type: 'accent'
    },
    {
        name: 'laser-emerald',
        description: 'Sensory telemetry, peripheral I/O, and nominal status channel for sensor bus routing, active telemetry, and operational states',
        anchorStep: 500,
        anchorHex: '#22c55e',
        type: 'accent'
    },
    {
        name: 'electric-cyan',
        description: 'Cold ground reference plane, persistent data memory, and digital bus channel for state indicators, routing, and grounding',
        anchorStep: 500,
        anchorHex: '#06b6d4',
        type: 'accent'
    }
] as const;

export function getT(index: number): number {
    return index / (STEPS.length - 1);
}

export function generateScale(config: PaletteConfig): ColorScaleOutput {
    const result: ColorScaleOutput = {
        $description: config.description
    };

    const anchorColor = oklch(config.anchorHex);
    if (!anchorColor) {
        throw new Error(`Failed to parse anchor color '${config.anchorHex}' for palette '${config.name}'.`);
    }

    const anchorHue: number = anchorColor.h ?? 0;
    let interpolator: (t: number) => Oklch;

    if (config.type === 'accent') {
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
        interpolator = interpolate([lightEnd, anchorColor, darkEnd], 'oklch');
    } else if (config.type === 'black-anchor') {
        const lightEnd: Oklch = {
            mode: 'oklch',
            l: 0.38,
            c: 0.035,
            h: anchorHue
        };
        interpolator = interpolate([lightEnd, anchorColor], 'oklch');
    } else {
        const darkEnd: Oklch = {
            mode: 'oklch',
            l: 0.20,
            c: 0.03,
            h: anchorHue
        };
        interpolator = interpolate([anchorColor, darkEnd], 'oklch');
    }

    STEPS.forEach((step: StepNumber, idx: number) => {
        let hexValue: string;

        if (step === config.anchorStep) {
            hexValue = config.anchorHex.toLowerCase();
        } else {
            const t: number = getT(idx);
            const interpolatedColor: Oklch = interpolator(t);
            const formatted = formatHex(interpolatedColor);

            if (!formatted) {
                throw new Error(
                    `Failed to format color at step ${step} (t=${t}, idx=${idx}) for palette '${config.name}'.`
                );
            }
            hexValue = formatted;
        }

        result[step] = {
            $value: hexValue,
            $type: 'color'
        };
    });

    return result;
}

export function main(): void {
    const tokenStructure: ColorTokenDocument = {
        color: {}
    };

    for (const palette of PALETTES) {
        tokenStructure.color[palette.name] = generateScale(palette);
    }

    const targetDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(tokenStructure, null, 2), 'utf-8');
    console.log(`Successfully generated primitive color tokens at: ${OUTPUT_FILE}`);
}

main();
