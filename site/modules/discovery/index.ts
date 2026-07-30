import fs from 'node:fs/promises';
import path from 'node:path';
import { parseMarkdown } from '../md-parser';
import type { RawContentRecord, ContentKind } from './types';
import { Logger } from '../logger';

const log = new Logger('module:discovery');

/**
 * Recursively collects all markdown file paths in a directory into a flat array.
 *
 * @param dir - The absolute directory path to scan.
 * @returns A Promise resolving to an array of absolute file paths to .md files.
 * @example
 * const files = await gatherMarkdownFiles('/path/to/content');
 */
async function gatherMarkdownFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            const nested = await gatherMarkdownFiles(fullPath);
            results.push(...nested);
            continue;
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * Discovers and parses all markdown content in a specified directory.
 * Operates as an AsyncGenerator to yield parsed ASTs one by one,
 * maintaining low memory overhead. Guarantees that deepest nested files
 * (children) are yielded before shallow files (parents) by pre-sorting paths.
 *
 * @param kind - 'article' or 'page'
 * @param rootDir - The absolute path to the root content directory
 * @returns An AsyncGenerator yielding RawContentRecord objects
 * @example
 * const articleGen = loadContentGenerator('article', 'd:/projects/bloatware/content/articles');
 * for await (const record of articleGen) {
 *     console.log(record.sourcePath, record.metadata.author);
 * }
 */
export async function* loadContentGenerator(kind: ContentKind, rootDir: string): AsyncGenerator<RawContentRecord> {
    log.info(`Discovering ${kind}s in ${rootDir}...`);

    // Gather and sort paths by depth (deepest first) to ensure child pages process before parent pages
    const files = await gatherMarkdownFiles(rootDir);
    files.sort((a, b) => {
        const depthA = a.split(path.sep).length;
        const depthB = b.split(path.sep).length;
        return depthB - depthA;
    });

    for (const absolutePath of files) {
        const sourcePath = path.relative(rootDir, absolutePath).replace(/\\/g, '/');
        log.debug(`Loading ${kind}: ${sourcePath}`);

        try {
            const fileText = await fs.readFile(absolutePath, 'utf8');
            const { ast, metadata, diagnostics } = parseMarkdown(fileText);

            if (diagnostics.length > 0) {
                log.warn(`[${sourcePath}] Parsed with ${diagnostics.length} warnings.`);
            }

            yield {
                kind,
                sourcePath,
                absolutePath,
                ast,
                metadata
            };
        } catch (error) {
            log.error(`Failed to load or parse ${sourcePath}`, error instanceof Error ? error : new Error(String(error)));
        }
    }

    log.info(`Finished discovery stream for ${kind}s in ${rootDir}.`);
}
