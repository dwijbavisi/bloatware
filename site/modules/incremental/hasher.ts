import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

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
    } catch {
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
        } catch {
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

/**
 * Computes a composite code hash across all source directories:
 * site/src, site/modules, site/scripts.
 */
export async function computeProjectCodeHash(siteRoot: string): Promise<string> {
    const srcDir = path.resolve(siteRoot, 'src');
    const modulesDir = path.resolve(siteRoot, 'modules');
    const scriptsDir = path.resolve(siteRoot, 'scripts');

    const [srcHash, modHash, scrHash] = await Promise.all([
        hashDirectory(srcDir),
        hashDirectory(modulesDir),
        hashDirectory(scriptsDir)
    ]);

    return sha256(`src:${srcHash.hash}|mod:${modHash.hash}|scr:${scrHash.hash}`);
}
