"use strict";

/**
 * @fileoverview Style Dictionary Themes Emitter for Biocircuit.
 *
 * Compiles intermediate theme tokens, CSS custom properties, and JavaScript/TypeScript
 * definitions for theme-dark and theme-light using Style Dictionary tooling, strictly
 * mirroring the source tokens hierarchy.
 *
 * Hierarchy Mapping
 * =================
 * - Tokens:  build/tokens/semantics/color/theme-{dark,light}.json
 * - Styles:  build/styles/semantics/color/theme-{dark,light}.css
 * - Scripts: build/scripts/semantics/color/theme-{dark,light}.{js,d.ts}
 * - Primitives: build/styles/primitives/color.css & build/tokens/primitives/layout.tokens.json
 *
 * @module scripts/emitters/themes
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BUILD_DIR = path.join(ROOT_DIR, 'build');

/**
 * Normalizes Windows file system paths to POSIX format for globbing and Style Dictionary filters.
 *
 * @param {string} p - File system path.
 * @returns {string} POSIX-normalized path string.
 */
function toPosix(p: string): string {
    return p.replace(/\\/g, '/');
}

/**
 * Cleans Style Dictionary AST nodes into pure W3C DTCG-compliant JSON structure.
 *
 * @param {Record<string, unknown>} tokens - Style Dictionary resolved tokens.
 * @returns {Record<string, unknown>} Clean DTCG token tree.
 */
function cleanDtcgTokens(tokens: Record<string, unknown>): Record<string, unknown> {
    function walk(node: any): any {
        if (!node || typeof node !== 'object') {
            return node;
        }

        if ('$value' in node || 'value' in node) {
            const token: Record<string, unknown> = {
                $value: node.$value ?? node.value
            };
            const type = node.$type ?? node.type;
            if (type) {
                token.$type = type;
            }
            const desc = node.$description ?? node.description;
            if (desc) {
                token.$description = desc;
            }
            return token;
        }

        const res: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(node)) {
            if (['filePath', 'isSource', 'original', 'name', 'attributes', 'path', 'key'].includes(key)) {
                continue;
            }
            res[key] = walk(val);
        }
        return res;
    }

    return {
        $schema: 'https://design-tokens.github.io/community-group/format/',
        ...walk(tokens)
    };
}

// Register custom clean DTCG format
StyleDictionary.registerFormat({
    name: 'biocircuit/dtcg-clean',
    format: ({ dictionary }) => {
        return JSON.stringify(cleanDtcgTokens(dictionary.tokens as Record<string, unknown>), null, 4) + '\n';
    }
});

/**
 * Copies source primitive layout tokens to build/tokens/primitives/layout.tokens.json.
 */
export function copyPrimitiveLayoutTokens(): void {
    const src = path.join(ROOT_DIR, 'tokens', 'primitives', 'layout.tokens.json');
    const dest = path.join(BUILD_DIR, 'tokens', 'primitives', 'layout.tokens.json');
    const destDir = path.dirname(dest);

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`[emit] Copied: ${path.relative(ROOT_DIR, dest)}`);
    }
}

/**
 * Compiles primitive 54-color scale into CSS custom properties under build/styles/primitives/color.css.
 */
export async function buildPrimitiveColorCss(): Promise<void> {
    const palettePath = toPosix(path.join(BUILD_DIR, 'tokens', 'primitives', 'color.palette.json'));

    const sd = new StyleDictionary({
        source: [palettePath],
        platforms: {
            css: {
                transformGroup: 'css',
                prefix: 'cwbwbc',
                buildPath: toPosix(BUILD_DIR) + '/',
                files: [
                    {
                        destination: 'styles/primitives/color.css',
                        format: 'css/variables',
                        options: {
                            outputReferences: false,
                            selector: ':root'
                        }
                    }
                ]
            }
        }
    });

    await sd.buildAllPlatforms();
    console.log('[emit] Generated: build/styles/primitives/color.css via Style Dictionary');
}

/**
 * Builds intermediate tokens, CSS, and JS for dark and light semantic themes using Style Dictionary.
 */
export async function buildSemanticThemes(): Promise<void> {
    const palettePath = toPosix(path.join(BUILD_DIR, 'tokens', 'primitives', 'color.palette.json'));
    const darkThemePath = toPosix(path.join(ROOT_DIR, 'tokens', 'semantics', 'color', 'theme-dark.json'));
    const lightThemePath = toPosix(path.join(ROOT_DIR, 'tokens', 'semantics', 'color', 'theme-light.json'));

    const filterSemantics = (token: any): boolean => {
        return toPosix(token.filePath ?? '').includes('semantics');
    };

    // 1. Build Dark Theme
    console.log('    Compiling theme-dark (tokens, CSS, JS)...');
    const sdDark = new StyleDictionary({
        source: [palettePath, darkThemePath],
        platforms: {
            css: {
                transformGroup: 'css',
                prefix: 'cwbwbc',
                buildPath: toPosix(BUILD_DIR) + '/',
                files: [
                    {
                        destination: 'styles/semantics/color/theme-dark.css',
                        format: 'css/variables',
                        filter: filterSemantics,
                        options: {
                            outputReferences: true,
                            selector: '[data-theme="dark"]'
                        }
                    }
                ]
            },
            js: {
                transformGroup: 'js',
                buildPath: toPosix(BUILD_DIR) + '/',
                files: [
                    {
                        destination: 'scripts/semantics/color/theme-dark.js',
                        format: 'javascript/es6',
                        filter: filterSemantics
                    },
                    {
                        destination: 'scripts/semantics/color/theme-dark.d.ts',
                        format: 'typescript/es6-declarations',
                        filter: filterSemantics
                    }
                ]
            },
            tokens: {
                transformGroup: 'js',
                buildPath: toPosix(BUILD_DIR) + '/',
                files: [
                    {
                        destination: 'tokens/semantics/color/theme-dark.json',
                        format: 'biocircuit/dtcg-clean',
                        filter: filterSemantics
                    }
                ]
            }
        }
    });
    await sdDark.buildAllPlatforms();

    // 2. Build Light Theme
    console.log('    Compiling theme-light (tokens, CSS, JS)...');
    const sdLight = new StyleDictionary({
        source: [palettePath, lightThemePath],
        platforms: {
            css: {
                transformGroup: 'css',
                prefix: 'cwbwbc',
                buildPath: toPosix(BUILD_DIR) + '/',
                files: [
                    {
                        destination: 'styles/semantics/color/theme-light.css',
                        format: 'css/variables',
                        filter: filterSemantics,
                        options: {
                            outputReferences: true,
                            selector: ':root, [data-theme="light"]'
                        }
                    }
                ]
            },
            js: {
                transformGroup: 'js',
                buildPath: toPosix(BUILD_DIR) + '/',
                files: [
                    {
                        destination: 'scripts/semantics/color/theme-light.js',
                        format: 'javascript/es6',
                        filter: filterSemantics
                    },
                    {
                        destination: 'scripts/semantics/color/theme-light.d.ts',
                        format: 'typescript/es6-declarations',
                        filter: filterSemantics
                    }
                ]
            },
            tokens: {
                transformGroup: 'js',
                buildPath: toPosix(BUILD_DIR) + '/',
                files: [
                    {
                        destination: 'tokens/semantics/color/theme-light.json',
                        format: 'biocircuit/dtcg-clean',
                        filter: filterSemantics
                    }
                ]
            }
        }
    });
    await sdLight.buildAllPlatforms();
}

/**
 * Main execution entry point for intermediate theme build step.
 */
export async function writeThemes(): Promise<void> {
    copyPrimitiveLayoutTokens();
    await buildPrimitiveColorCss();
    await buildSemanticThemes();
}

// Direct execution guard
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    writeThemes().catch(err => {
        console.error('[themes] Theme compilation failed:', err);
        process.exit(1);
    });
}
