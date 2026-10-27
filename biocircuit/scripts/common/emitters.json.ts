"use strict";

/**
 * @fileoverview Common Reusable JSON AST & Serialization Utility.
 *
 * Provides a structured, strongly-typed document builder and file serializer
 * for emitting W3C DTCG-compliant design token JSON documents and ASTs across
 * all Biocircuit subsystems (primitives, semantics, layout, components).
 *
 * Architectural Features
 * ======================
 * - Strongly-typed document wrapping and serialization
 * - Optional schema declaration attachment ($schema)
 * - Deterministic, configurable indentation formatting (default 4 spaces)
 * - Built-in disk emission helper with automatic recursive directory creation
 * - Consistent console logging matching common emitter utilities
 *
 * @module scripts/common/emitters.json
 * @license GPL-3.0-or-later
 * @author Dwij Bavisi <dwij.bavisi@crabwire.net>
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Configuration options for JSON document serialization.
 *
 * Attributes
 * ----------
 * @property {number | string} [space=4]
 *   Indentation size in spaces or indentation string (defaults to 4).
 * @property {string} [schema]
 *   Optional W3C DTCG schema URI to inject at the root level ($schema).
 */
export interface JsonDocumentOptions {
    /** Indentation size in spaces or indentation string (defaults to 4). */
    readonly space?: number | string;
    /** Optional W3C DTCG schema URI to inject at the root level ($schema). */
    readonly schema?: string;
}

/**
 * Generic root container representing a W3C Design Tokens Community Group (DTCG) document.
 *
 * Attributes
 * ----------
 * @property {string} [$schema]
 *   Optional JSON schema URL for token validation.
 * @property {Record<string, unknown>} [key: string]
 *   Token group hierarchy nodes and token definitions.
 */
export interface TokenDocumentStructure {
    /** Optional JSON schema URL for token validation. */
    $schema?: string;
    /** Token groups and token declarations. */
    [groupOrToken: string]: unknown;
}

/**
 * Fluent builder for programmatic construction and deterministic serialization of JSON documents.
 *
 * Notes
 * -----
 * Provides a uniform API matching CssDocumentBuilder for serializing intermediate
 * token outputs to disk, ensuring directory existence, and logging formatted output paths.
 *
 * Examples
 * --------
 * ```ts
 * const builder = new JsonDocumentBuilder(tokenData, {
 *   schema: 'https://design-tokens.github.io/community-group/format/'
 * });
 * builder.writeBuildOutput('build/tokens/color.palette.json', ROOT_DIR);
 * ```
 */
export class JsonDocumentBuilder<T extends object = Record<string, unknown>> {
    private payload: T;
    private readonly space: number | string;
    private schema: string | null = null;

    /**
     * Initializes a new JSON document builder.
     *
     * Parameters
     * ----------
     * @param {T} payload
     *   The root data object or token tree to serialize.
     * @param {JsonDocumentOptions} [options={}]
     *   Serialization options including indentation spacing and schema URI.
     */
    constructor(payload: T, options: JsonDocumentOptions = {}) {
        this.payload = payload;
        this.space = options.space ?? 4;
        if (options.schema) {
            this.schema = options.schema;
        }
    }

    /**
     * Sets or updates the W3C DTCG $schema URI for the document.
     *
     * Parameters
     * ----------
     * @param {string} schemaUri
     *   Valid schema URI string.
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     */
    setSchema(schemaUri: string): this {
        this.schema = schemaUri.trim();
        return this;
    }

    /**
     * Updates or replaces the root data payload.
     *
     * Parameters
     * ----------
     * @param {T} payload
     *   New data payload object.
     *
     * Returns
     * -------
     * @returns {this}
     *   Current builder instance for fluent chaining.
     */
    setPayload(payload: T): this {
        this.payload = payload;
        return this;
    }

    /**
     * Serializes the document into a deterministic, formatted JSON string.
     *
     * Returns
     * -------
     * @returns {string}
     *   Formatted JSON string with trailing newline.
     */
    serialize(): string {
        let outputObject: unknown = this.payload;

        if (this.schema && typeof this.payload === 'object' && this.payload !== null) {
            outputObject = {
                $schema: this.schema,
                ...this.payload
            };
        }

        return JSON.stringify(outputObject, null, this.space) + '\n';
    }

    /**
     * Serializes and writes the JSON document directly to disk.
     *
     * Notes
     * -----
     * Ensures parent directories exist recursively before writing the file
     * and logs the relative output path to stdout.
     *
     * Parameters
     * ----------
     * @param {string} outputPath
     *   Target file path for the emitted JSON file.
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
     * builder.writeBuildOutput('build/tokens/color.palette.json', ROOT_DIR);
     * ```
     */
    writeBuildOutput(outputPath: string, rootDir?: string): void {
        const jsonContent = this.serialize();
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, jsonContent, 'utf-8');
        const displayPath = rootDir ? path.relative(rootDir, outputPath) : outputPath;
        console.log(`[emit] Generated: ${displayPath} via common JsonDocumentBuilder`);
    }
}
