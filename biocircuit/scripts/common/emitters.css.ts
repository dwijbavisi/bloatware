"use strict";

/**
 * @fileoverview Common Reusable CSS AST & Serialization Utility.
 *
 * Provides a structured, strongly-typed AST builder and serializer for
 * constructing, formatting, and emitting modern CSS stylesheets across all
 * Biocircuit design system subsystems (layout, primitives, typography, components).
 *
 * Architectural Features
 * ======================
 * - Cascade Layers (@layer layer1, layer2; and @layer name { ... })
 * - Deeply nested At-Rules (@layer, @media, @container)
 * - Strongly-typed rule blocks with property-value pairs and optional inline comments
 * - Clean, deterministic 4-space or customizable indentation formatting
 * - Built-in disk emission helper with automatic recursive directory creation
 *
 * @module scripts/common/emitters.css
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Single CSS property-value declaration pair.
 *
 * Attributes
 * ----------
 * @property {string} property
 *   CSS property identifier (e.g. 'box-sizing', '--cwbwbc-layout-lanes').
 * @property {string | number} value
 *   Target CSS property value (e.g. 'border-box', 12, '100vw').
 * @property {string} [comment]
 *   Optional inline comment annotated alongside the declaration.
 */
export interface CssDeclaration {
    /** CSS property identifier (e.g. 'box-sizing', '--cwbwbc-layout-lanes'). */
    readonly property: string;
    /** Target CSS property value (e.g. 'border-box', 12, '100vw'). */
    readonly value: string | number;
    /** Optional inline comment annotated alongside the declaration. */
    readonly comment?: string;
}

/**
 * Standard CSS ruleset binding a selector to declaration blocks.
 *
 * Attributes
 * ----------
 * @property {'rule'} kind
 *   Discriminant tag identifying this node as a standard CSS rule.
 * @property {string} selector
 *   CSS selector string (e.g. ':root', '.cwbwbc-board', '.cwbwbc-grid').
 * @property {readonly CssDeclaration[]} declarations
 *   Immutable list of property-value declarations belonging to this ruleset.
 * @property {string} [comment]
 *   Optional descriptive comment preceding the ruleset header.
 */
export interface CssRule {
    /** Discriminant tag identifying this node as a standard CSS rule. */
    readonly kind: 'rule';
    /** CSS selector string (e.g. ':root', '.cwbwbc-board', '.cwbwbc-grid'). */
    readonly selector: string;
    /** Immutable list of property-value declarations belonging to this ruleset. */
    readonly declarations: readonly CssDeclaration[];
    /** Optional descriptive comment preceding the ruleset header. */
    readonly comment?: string;
}

/**
 * Generalized CSS At-Rule block container (e.g. @layer, @media, @container).
 *
 * Attributes
 * ----------
 * @property {'at-rule'} kind
 *   Discriminant tag identifying this node as an at-rule container.
 * @property {string} name
 *   At-rule identifier without the leading '@' (e.g. 'layer', 'media', 'container').
 * @property {string} [params]
 *   Conditional queries or layer names (e.g. '(min-width: 65ch)', 'biocircuit.tokens').
 * @property {readonly (CssRule | CssAtRule)[]} body
 *   Nested rules or child at-rules enclosed within this at-rule block.
 * @property {string} [comment]
 *   Optional descriptive comment preceding the at-rule block.
 */
export interface CssAtRule {
    /** Discriminant tag identifying this node as an at-rule container. */
    readonly kind: 'at-rule';
    /** At-rule identifier without leading '@' (e.g. 'layer', 'media', 'container'). */
    readonly name: string;
    /** Conditional queries or layer names (e.g. '(min-width: 65ch)', 'biocircuit.tokens'). */
    readonly params?: string;
    /** Nested rules or child at-rules enclosed within this at-rule block. */
    readonly body: readonly (CssRule | CssAtRule)[];
    /** Optional descriptive comment preceding the at-rule block. */
    readonly comment?: string;
}

/**
 * Polymorphic union representing any valid top-level or nested CSS document node.
 *
 * @type {CssRule | CssAtRule}
 */
export type CssNode = CssRule | CssAtRule;

/**
 * Formatting and serialization configuration options for CssDocumentBuilder.
 *
 * Attributes
 * ----------
 * @property {number} [indentSize=4]
 *   Number of space characters per indentation level (defaults to 4).
 */
export interface CssDocumentOptions {
    /** Number of space characters per indentation level (defaults to 4). */
    readonly indentSize?: number;
}

/**
 * Fluent builder for programmatic construction and deterministic serialization of modern CSS.
 *
 * Notes
 * -----
 * Provides a structured object model for composing cascade layers, media queries,
 * and rule blocks without ad-hoc string concatenation or indentation drift.
 *
 * Examples
 * --------
 * ```ts
 * const builder = new CssDocumentBuilder();
 * builder
 *   .setHeader('Design System Tokens')
 *   .setLayerOrder(['biocircuit.tokens', 'biocircuit.layout'])
 *   .addRule(':root', { '--brand-color': '#06b6d4' })
 *   .writeBuildOutput('build/styles/tokens.css');
 * ```
 */
export class CssDocumentBuilder {
    private header: string | null = null;
    private layerOrder: string[] = [];
    private nodes: CssNode[] = [];
    private readonly indentSize: number;

    /**
     * Initializes a new CSS document builder.
     *
     * Parameters
     * ----------
     * @param {CssDocumentOptions} [options={}]
     *   Optional formatting configuration (indentation size).
     */
    constructor(options: CssDocumentOptions = {}) {
        this.indentSize = options.indentSize ?? 4;
    }

    /**
     * Sets the top-level block comment header for the stylesheet.
     *
     * Parameters
     * ----------
     * @param {string} header
     *   Header comment text (auto-wrapped in JSDoc/CSS block comment markers).
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     */
    setHeader(header: string): this {
        this.header = header.trim();
        return this;
    }

    /**
     * Declares the top-level cascade layer evaluation order (@layer layer1, layer2;).
     *
     * Parameters
     * ----------
     * @param {readonly string[]} layers
     *   Ordered array of cascade layer identifiers.
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     *
     * Examples
     * --------
     * ```ts
     * builder.setLayerOrder(['biocircuit.tokens', 'biocircuit.layout']);
     * // Emits: @layer biocircuit.tokens, biocircuit.layout;
     * ```
     */
    setLayerOrder(layers: readonly string[]): this {
        this.layerOrder = [...layers];
        return this;
    }

    /**
     * Creates and appends a CSS ruleset node to the document root.
     *
     * Parameters
     * ----------
     * @param {string} selector
     *   CSS selector string.
     * @param {Record<string, string | number> | readonly CssDeclaration[]} declarations
     *   Key-value dictionary or declaration list.
     * @param {string} [comment]
     *   Optional comment preceding the rule.
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     */
    addRule(
        selector: string,
        declarations: Record<string, string | number> | readonly CssDeclaration[],
        comment?: string
    ): this {
        const declList: CssDeclaration[] = Array.isArray(declarations)
            ? declarations
            : Object.entries(declarations).map(([property, value]) => ({ property, value }));

        this.nodes.push(Object.freeze({
            kind: 'rule',
            selector: selector.trim(),
            declarations: Object.freeze(declList),
            comment
        }));
        return this;
    }

    /**
     * Creates and appends a generic at-rule container block (e.g. @media, @layer).
     *
     * Parameters
     * ----------
     * @param {string} name
     *   At-rule identifier (e.g. 'media', 'layer', 'container').
     * @param {string | undefined} params
     *   Condition or parameter string (e.g. '(min-width: 65ch)').
     * @param {readonly (CssRule | CssAtRule)[]} body
     *   Child rules or nested at-rules.
     * @param {string} [comment]
     *   Optional comment preceding the at-rule block.
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     */
    addAtRule(
        name: string,
        params: string | undefined,
        body: readonly (CssRule | CssAtRule)[],
        comment?: string
    ): this {
        this.nodes.push(Object.freeze({
            kind: 'at-rule',
            name: name.trim().replace(/^@/, ''),
            params: params?.trim(),
            body: Object.freeze([...body]),
            comment
        }));
        return this;
    }

    /**
     * Convenience helper to create and append an at-layer block container (@layer name { ... }).
     *
     * Parameters
     * ----------
     * @param {string} layerName
     *   Cascade layer identifier (e.g. 'biocircuit.tokens').
     * @param {readonly (CssRule | CssAtRule)[]} body
     *   Child rules or nested at-rules within the layer.
     * @param {string} [comment]
     *   Optional comment preceding the layer block.
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     */
    addLayer(layerName: string, body: readonly (CssRule | CssAtRule)[], comment?: string): this {
        return this.addAtRule('layer', layerName, body, comment);
    }

    /**
     * Convenience helper to create and append an at-media block container (@media condition { ... }).
     *
     * Parameters
     * ----------
     * @param {string} condition
     *   Media query condition string (e.g. '(min-width: 65ch)').
     * @param {readonly (CssRule | CssAtRule)[]} body
     *   Child rules or nested at-rules within the media block.
     * @param {string} [comment]
     *   Optional comment preceding the media block.
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     */
    addMedia(condition: string, body: readonly (CssRule | CssAtRule)[], comment?: string): this {
        return this.addAtRule('media', condition, body, comment);
    }

    /**
     * Factory helper to create a standalone rule node for nesting inside at-rules.
     *
     * Parameters
     * ----------
     * @param {string} selector
     *   CSS selector string.
     * @param {Record<string, string | number> | readonly CssDeclaration[]} declarations
     *   Key-value dictionary or declaration list.
     * @param {string} [comment]
     *   Optional comment preceding the rule.
     *
     * Returns
     * -------
     * @returns {CssRule}
     *   Immutable CSS rule node.
     */
    static createRule(
        selector: string,
        declarations: Record<string, string | number> | readonly CssDeclaration[],
        comment?: string
    ): CssRule {
        const declList: CssDeclaration[] = Array.isArray(declarations)
            ? declarations
            : Object.entries(declarations).map(([property, value]) => ({ property, value }));

        return Object.freeze({
            kind: 'rule',
            selector: selector.trim(),
            declarations: Object.freeze(declList),
            comment
        });
    }

    /**
     * Factory helper to create a standalone at-rule node for nesting.
     *
     * Parameters
     * ----------
     * @param {string} name
     *   At-rule identifier (e.g. 'layer', 'media', 'container').
     * @param {string | undefined} params
     *   Condition or parameter string (e.g. '(min-width: 65ch)').
     * @param {readonly (CssRule | CssAtRule)[]} body
     *   Child rules or nested at-rules.
     * @param {string} [comment]
     *   Optional comment preceding the at-rule block.
     *
     * Returns
     * -------
     * @returns {CssAtRule}
     *   Immutable CSS at-rule node.
     */
    static createAtRule(
        name: string,
        params: string | undefined,
        body: readonly (CssRule | CssAtRule)[],
        comment?: string
    ): CssAtRule {
        return Object.freeze({
            kind: 'at-rule',
            name: name.trim().replace(/^@/, ''),
            params: params?.trim(),
            body: Object.freeze([...body]),
            comment
        });
    }

    /**
     * Formats and serializes the complete CSS document into a deterministic CSS string.
     *
     * Returns
     * -------
     * @returns {string}
     *   Fully formatted CSS stylesheet string with indentation and linebreaks.
     */
    serialize(): string {
        const sections: string[] = [];
        const indentStr = ' '.repeat(this.indentSize);

        if (this.header) {
            sections.push(`/**\n${this.header.split('\n').map(l => ` * ${l}`).join('\n')}\n */`);
        }

        if (this.layerOrder.length > 0) {
            sections.push(`@layer ${this.layerOrder.join(', ')};`);
        }

        for (const node of this.nodes) {
            sections.push(this.formatNode(node, 0, indentStr));
        }

        return sections.join('\n\n') + '\n';
    }

    /**
     * Recursively formats a CSS node with indentation according to hierarchy level.
     *
     * Parameters
     * ----------
     * @param {CssNode} node
     *   The CSS AST node to serialize.
     * @param {number} level
     *   Current indentation nesting depth.
     * @param {string} indent
     *   Indentation space string.
     *
     * Returns
     * -------
     * @returns {string}
     *   Formatted text block.
     */
    private formatNode(node: CssNode, level: number, indent: string): string {
        const pad = indent.repeat(level);

        if (node.kind === 'rule') {
            const commentStr = node.comment ? `${pad}/* ${node.comment} */\n` : '';
            const declPad = indent.repeat(level + 1);
            const declLines = node.declarations.map(d => {
                const comment = d.comment ? ` /* ${d.comment} */` : '';
                return `${declPad}${d.property}: ${d.value};${comment}`;
            });

            return `${commentStr}${pad}${node.selector} {\n${declLines.join('\n')}\n${pad}}`;
        }

        // At-Rule formatting
        const paramStr = node.params ? ` ${node.params}` : '';
        const commentStr = node.comment ? `${pad}/* ${node.comment} */\n` : '';
        const bodyLines = node.body.map(child => this.formatNode(child, level + 1, indent)).join('\n\n');

        return `${commentStr}${pad}@${node.name}${paramStr} {\n${bodyLines}\n${pad}}`;
    }

    /**
     * Serializes and writes the generated CSS stylesheet directly to disk.
     *
     * Notes
     * -----
     * Ensures parent directories exist recursively before writing the file
     * and logs the formatted output path to stdout.
     *
     * Parameters
     * ----------
     * @param {string} outputPath
     *   Target file path for the emitted CSS file.
     * @param {string} [rootDir]
     *   Optional workspace or project root directory for clean relative path logging.
     *
     * Returns
     * -------
     * @returns {void}
     *
     * Examples
     * --------
     * ```ts
     * builder.writeBuildOutput('build/styles/layout.css', ROOT_DIR);
     * ```
     */
    writeBuildOutput(outputPath: string, rootDir?: string): void {
        const css = this.serialize();
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, css, 'utf-8');
        const displayPath = rootDir ? path.relative(rootDir, outputPath) : outputPath;
        console.log(`[emit] Generated: ${displayPath} via common CssDocumentBuilder`);
    }
}
