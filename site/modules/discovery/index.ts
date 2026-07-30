import fs from 'node:fs/promises';
import path from 'node:path';
import { parseMarkdown } from '../md-parser';
import type { RawContentRecord, ContentKind } from './types';
import { Logger } from '../logger';

const log = new Logger('module:discovery');

/**
 * Recursively yields all markdown file paths in a directory.
 * 
 * @param dir - The absolute directory path to scan.
 * @returns An AsyncGenerator yielding absolute file paths to .md files.
 * @example
 * for await (const filePath of findMarkdownFiles('/path/to/content')) {
 *     console.log(filePath); // Outputs: "d:/projects/bloatware/content/article.md"
 * }
 */
async function* findMarkdownFiles(dir: string): AsyncGenerator<string> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            yield* findMarkdownFiles(fullPath);
            continue;
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
            yield fullPath;
        }
    }
}

/**
 * Discovers and parses all markdown content in a specified directory.
 * Operates as an AsyncGenerator to yield parsed ASTs one by one, 
 * maintaining low memory overhead.
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
    
    for await (const absolutePath of findMarkdownFiles(rootDir)) {
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
