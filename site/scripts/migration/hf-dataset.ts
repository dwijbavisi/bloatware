import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { Logger } from '../../modules/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = new Logger('hf-migration');

interface MigrationOptions {
    hfToken: string;
    repoId: string;
    isPrivate: boolean;
}

function prompt(question: string, hidden = false): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        if (hidden && process.stdin.isTTY) {
            process.stdout.write(question);
            const stdin = process.stdin;
            const originalRawMode = stdin.isRaw;
            stdin.setRawMode(true);
            stdin.resume();

            let input = '';
            const onData = (chunk: Buffer) => {
                const str = chunk.toString();
                for (const char of str) {
                    if (char === '\n' || char === '\r' || char === '\u0004') {
                        stdin.setRawMode(originalRawMode ?? false);
                        stdin.removeListener('data', onData);
                        process.stdout.write('\n');
                        rl.close();
                        resolve(input.trim());
                        return;
                    } else if (char === '\u0003') {
                        // Ctrl+C
                        process.stdout.write('\n');
                        process.exit(1);
                    } else if (char === '\b' || char === '\x7f') {
                        // Backspace
                        if (input.length > 0) {
                            input = input.slice(0, -1);
                        }
                    } else {
                        input += char;
                    }
                }
            };
            stdin.on('data', onData);
        } else {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        }
    });
}

function parseArgs(): Partial<MigrationOptions> {
    const args = process.argv.slice(2);
    const options: Partial<MigrationOptions> = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--token' && args[i + 1]) {
            options.hfToken = args[++i];
        } else if (arg === '--repo' && args[i + 1]) {
            options.repoId = args[++i];
        } else if (arg === '--public') {
            options.isPrivate = false;
        } else if (arg === '--private') {
            options.isPrivate = true;
        }
    }

    return options;
}

async function validateHfToken(token: string): Promise<string> {
    const response = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Invalid HuggingFace token (HTTP ${response.status}). Please check your token.`);
    }

    const data = (await response.json()) as { name?: string };
    return data.name || 'authenticated user';
}

async function ensureDatasetExists(token: string, repoId: string, isPrivate: boolean): Promise<void> {
    const checkResponse = await fetch(`https://huggingface.co/api/datasets/${repoId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (checkResponse.ok) {
        log.info(`HuggingFace dataset "${repoId}" already exists.`);
        return;
    }

    log.info(`Creating ${isPrivate ? 'private' : 'public'} dataset "${repoId}" on HuggingFace...`);

    const parts = repoId.split('/');
    const repoName = parts.length > 1 ? parts[1] : parts[0];
    const organization = parts.length > 1 ? parts[0] : undefined;

    const createPayload: Record<string, unknown> = {
        name: repoName,
        type: 'dataset',
        private: isPrivate
    };

    if (organization) {
        createPayload.organization = organization;
    }

    const createResponse = await fetch('https://huggingface.co/api/repos/create', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
    });

    if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create HuggingFace dataset (HTTP ${createResponse.status}): ${errorText}`);
    }

    log.info(`HuggingFace dataset "${repoId}" created successfully.`);
}

function runGit(cmd: string, cwd?: string): string {
    return execSync(cmd, {
        cwd: cwd || process.cwd(),
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
}

function findRepoRoot(startDir: string): string {
    let current = startDir;
    while (current !== path.dirname(current)) {
        if (fs.existsSync(path.join(current, '.git'))) {
            return current;
        }
        current = path.dirname(current);
    }
    return path.resolve(startDir, '../../../../');
}

async function main() {
    log.info('Starting content folder migration to HuggingFace Dataset...');

    const rootDir = findRepoRoot(__dirname);
    const contentDir = path.join(rootDir, 'content');

    if (!fs.existsSync(contentDir)) {
        log.error(`Content folder not found at "${contentDir}".`);
        process.exit(1);
    }

    const parsedOptions = parseArgs();

    // 1. Gather & Validate HF Token
    let token = parsedOptions.hfToken || process.env.HF_TOKEN;
    if (!token) {
        token = await prompt('Enter your HuggingFace Token (write permission): ', true);
    }
    if (!token) {
        log.error('HuggingFace Token is required.');
        process.exit(1);
    }

    log.info('Validating token with HuggingFace API...');
    const username = await validateHfToken(token);
    log.info(`Authenticated as: ${username}`);

    // 2. Gather Target Repo ID
    let repoId = parsedOptions.repoId || process.env.HF_REPO_ID;
    if (!repoId) {
        const defaultRepo = `${username}/bloatware-content`;
        const inputRepo = await prompt(`Enter Target HuggingFace Dataset repo ID [${defaultRepo}]: `);
        repoId = inputRepo || defaultRepo;
    }

    const isPrivate = parsedOptions.isPrivate !== undefined ? parsedOptions.isPrivate : true;

    // 4. Ensure dataset exists on HuggingFace
    await ensureDatasetExists(token, repoId, isPrivate);

    // 5. Perform Git Subtree Split to extract commit history
    const tempBranch = `hf-migration-${Date.now()}`;
    log.info(`Extracting Git commit history for "content" into branch "${tempBranch}"...`);

    try {
        runGit(`git subtree split --prefix=content -b ${tempBranch}`, rootDir);
        log.info('Extracted isolated commit history.');
    } catch (err: unknown) {
        log.error('Failed to perform git subtree split:', err);
        process.exit(1);
    }

    // 6. Push to HuggingFace Dataset
    const remoteUrl = `https://${encodeURIComponent(token)}@huggingface.co/datasets/${repoId}.git`;
    log.info(`Pushing commit history to HuggingFace dataset (${repoId})...`);

    try {
        runGit(`git push "${remoteUrl}" ${tempBranch}:main --force`, rootDir);
        log.info(`Successfully pushed content with full Git history to https://huggingface.co/datasets/${repoId}`);
    } catch (err: unknown) {
        log.error('Failed to push to HuggingFace:', err);
        // Clean up temporary branch before exiting
        try { runGit(`git branch -D ${tempBranch}`, rootDir); } catch { }
        process.exit(1);
    } finally {
        // Clean up local temp branch
        try {
            runGit(`git branch -D ${tempBranch}`, rootDir);
        } catch { }
    }

    log.info('Migration completed successfully!');
    log.info(`Dataset URL: https://huggingface.co/datasets/${repoId}`);
    log.info('Next steps to complete decoupling:');
    log.info('1. Untrack content from main GitHub repo: git rm -r --cached content');
    log.info('2. Add /content to .gitignore: echo "/content" >> .gitignore');
    log.info(`3. Commit and push main repo changes: git commit -m "chore: decouple content to HuggingFace dataset (${repoId})"`);
    log.info(`4. Re-clone your dataset locally for editing: git clone https://huggingface.co/datasets/${repoId} content`);
}

main().catch((err) => {
    log.error('Migration failed with error:', err);
    process.exit(1);
});
