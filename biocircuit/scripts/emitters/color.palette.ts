"use strict";

/**
 * @fileoverview Color Palette Design Tokens Emitter.
 *
 * Uses the decoupled Biocircuit Color Engine and the common reusable
 * JsonDocumentBuilder utility to compute 54-step primitive color scales
 * from the 6 base colors and emit build/tokens/color.palette.json.
 *
 * @module scripts/emitters/color.palette
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createColorEngine } from '../../src/scripts/color.engine.js';
import { DEFAULT_COLOR_CONFIG, type ColorTokenDocument } from '../../src/scripts/color.tokens.js';
import { JsonDocumentBuilder } from '../common/emitters.json.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'build', 'tokens', 'color.palette.json');

/**
 * Builds the complete 54-token W3C DTCG color palette document using the pure Color Engine.
 *
 * Notes
 * -----
 * Instantiates the pure color engine using DEFAULT_COLOR_CONFIG, derives the
 * 9-step OKLCH scales for all 6 hardware primitives, and wraps the document
 * in a configured JsonDocumentBuilder.
 *
 * Returns
 * -------
 * @returns {JsonDocumentBuilder<ColorTokenDocument>}
 *   Configured JSON builder ready for serialization or disk emission.
 *
 * Examples
 * --------
 * ```ts
 * const builder = buildColorPaletteDocument();
 * const json = builder.serialize();
 * ```
 */
export function buildColorPaletteDocument(): JsonDocumentBuilder<ColorTokenDocument> {
    const engine = createColorEngine(DEFAULT_COLOR_CONFIG);
    const tokenDoc = engine.solveColorAST();

    return new JsonDocumentBuilder(tokenDoc);
}

/**
 * Writes the 54-color palette token document to build/tokens/color.palette.json.
 *
 * Notes
 * -----
 * Emits the intermediate token file using JsonDocumentBuilder.writeBuildOutput,
 *
 * Returns
 * -------
 * @returns {void}
 */
export function writeColorPalette(): void {
    const builder = buildColorPaletteDocument();
    builder.writeBuildOutput(OUTPUT_FILE, ROOT_DIR);
}

// Direct execution guard
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    writeColorPalette();
}
