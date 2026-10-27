"use strict";

/**
 * @fileoverview Biocircuit Emitters Build Orchestrator.
 *
 * Coordinates the execution of all emitter scripts in scripts/emitters/
 * to compile intermediate primitive and semantic design tokens, stylesheets, and
 * theme scripts into build/ following the source tokens taxonomy.
 *
 * Scope Invariants
 * ================
 * - Executes emitter modules located in scripts/emitters/.
 * - Populates build/ with primitives and semantic theme artifacts.
 *
 * @module scripts/build-orchestrator
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { writeColorPalette } from './emitters/color.palette.js';
import { writeLayoutCss } from './emitters/layout.css.js';
import { writeThemes } from './emitters/themes.js';

/**
 * Execution report summarizing orchestrator results.
 *
 * Attributes
 * ----------
 * @property {number} durationMs
 *   Total execution time in milliseconds.
 * @property {readonly string[]} executedEmitters
 *   List of emitter scripts executed during the run.
 */
export interface OrchestratorReport {
    /** Total execution time in milliseconds. */
    readonly durationMs: number;
    /** List of emitter scripts executed during the run. */
    readonly executedEmitters: readonly string[];
}

/**
 * Runs all registered emitter modules in sequence.
 *
 * Returns
 * -------
 * @returns {Promise<OrchestratorReport>}
 *   Structured execution report.
 *
 * Examples
 * --------
 * ```ts
 * const report = await runEmitters();
 * console.log(`Executed ${report.executedEmitters.length} emitters in ${report.durationMs}ms`);
 * ```
 */
export async function runEmitters(): Promise<OrchestratorReport> {
    const startTime = performance.now();
    console.log('[build] Biocircuit Emitters Orchestrator starting...');

    const executed: string[] = [];

    // 1. Color Palette Emitter
    console.log('  [1/3] Running color palette emitter...');
    writeColorPalette();
    executed.push('scripts/emitters/color.palette.ts');

    // 2. Layout Stylesheet Emitter
    console.log('  [2/3] Running layout stylesheet emitter...');
    writeLayoutCss();
    executed.push('scripts/emitters/layout.css.ts');

    // 3. Style Dictionary Themes Emitter (theme-dark & theme-light)
    console.log('  [3/3] Running Style Dictionary themes emitter...');
    await writeThemes();
    executed.push('scripts/emitters/themes.ts');

    const durationMs = Math.round(performance.now() - startTime);
    console.log(`[build] All emitters executed successfully in ${durationMs}ms!`);

    return {
        durationMs,
        executedEmitters: Object.freeze(executed)
    };
}

// Direct execution guard
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    runEmitters().catch(err => {
        console.error('[build] Emitter orchestration failed:', err);
        process.exit(1);
    });
}
