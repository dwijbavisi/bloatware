import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Logger } from '../logger';

const log = new Logger('incremental:hasher');

/**
 * Computes SHA-256 hash of a string or buffer.
 */
export function sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Computes SHA-256 hash of a file on disk.
 */
export async function hashFile(filePath: string): Promise<string> {
    try {
        const buffer = await fs.readFile(filePath);
        return sha256(buffer);
    } catch (err: any) {
        if (err?.code === 'ENOENT') {
            log.debug(`File not found for hashing: ${filePath}`);
        } else {
            log.warn(`Failed reading file for hashing: ${filePath} (${err?.message || err})`);
        }
        return '';
    }
}

/**
 * Recursively scans directory for files matching specified extensions,
 * sorting paths deterministically to produce a composite SHA-256 hash.
 */
export async function hashDirectory(
    dirPath: string,
    extensions: string[] = ['.ts', '.tsx', '.css']
): Promise<{ hash: string; fileHashes: Record<string, string> }> {
    const fileHashes: Record<string, string> = {};

    async function scan(currentDir: string): Promise<void> {
        let entries;
        try {
            entries = await fs.readdir(currentDir, { withFileTypes: true });
        } catch (err: any) {
            log.warn(`Failed reading directory for hashing: ${currentDir} (${err?.message || err})`);
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.cache') {
                    continue;
                }
                await scan(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (extensions.includes(ext)) {
                    const relativePath = path.relative(dirPath, fullPath).replace(/\\/g, '/');
                    const fileHash = await hashFile(fullPath);
                    fileHashes[relativePath] = fileHash;
                }
            }
        }
    }

    await scan(dirPath);

    const sortedKeys = Object.keys(fileHashes).sort();
    const compositeData = sortedKeys.map((k) => `${k}:${fileHashes[k]}`).join('\n');
    const hash = sha256(compositeData);

    return { hash, fileHashes };
}

export interface ProjectCodeHashResult {
    hash: string;
    fileHashes: Record<string, string>;
}

export interface CodeDiffResult {
    modified: string[];
    added: string[];
    deleted: string[];
}

/**
 * Compares two sets of code file hashes to pinpoint modified, added, and deleted files.
 */
export function diffCodeHashes(
    prev: Record<string, string> = {},
    curr: Record<string, string> = {}
): CodeDiffResult {
    const modified: string[] = [];
    const added: string[] = [];
    const deleted: string[] = [];

    for (const [file, hash] of Object.entries(curr)) {
        if (!prev[file]) {
            added.push(file);
        } else if (prev[file] !== hash) {
            modified.push(file);
        }
    }

    for (const file of Object.keys(prev)) {
        if (!curr[file]) {
            deleted.push(file);
        }
    }

    return { modified, added, deleted };
}

/**
 * Computes a composite code hash across all source directories:
 * site/src, site/modules, site/scripts.
 */
export async function computeProjectCodeHash(siteRoot: string): Promise<ProjectCodeHashResult> {
    const srcDir = path.resolve(siteRoot, 'src');
    const modulesDir = path.resolve(siteRoot, 'modules');
    const scriptsDir = path.resolve(siteRoot, 'scripts');

    const [srcHash, modHash, scrHash] = await Promise.all([
        hashDirectory(srcDir),
        hashDirectory(modulesDir),
        hashDirectory(scriptsDir)
    ]);

    const combinedFileHashes: Record<string, string> = {};
    for (const [k, v] of Object.entries(srcHash.fileHashes)) {
        combinedFileHashes[`src/${k}`] = v;
    }
    for (const [k, v] of Object.entries(modHash.fileHashes)) {
        combinedFileHashes[`modules/${k}`] = v;
    }
    for (const [k, v] of Object.entries(scrHash.fileHashes)) {
        combinedFileHashes[`scripts/${k}`] = v;
    }

    const hash = sha256(`src:${srcHash.hash}|mod:${modHash.hash}|scr:${scrHash.hash}`);
    return { hash, fileHashes: combinedFileHashes };
}
