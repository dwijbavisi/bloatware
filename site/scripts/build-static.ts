import fs from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';
import { Logger } from '../modules/logger';
import profiler from '../modules/profiler';
import { executeIncrementalBuild } from './builder';
import { generateSitemapXml, generateRobotsTxt } from './sitemap';

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, 'dist');
const ASSETS_DIR = path.resolve(DIST, 'assets');
const CACHE_DIR = path.resolve(ROOT, '.cache');
const log = new Logger('build-static');

async function writeRoute(route: string, html: string): Promise<void> {
    try {
        if (route === '/404.html') {
            await fs.writeFile(path.join(DIST, '404.html'), html, 'utf8');
            log.debug(`Wrote output: ${path.join(DIST, '404.html')} (${Buffer.byteLength(html)} bytes)`);
            return;
        }
        const routePath = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
        const outputDir = path.join(DIST, routePath);
        await fs.mkdir(outputDir, { recursive: true });
        const filePath = path.join(outputDir, 'index.html');
        await fs.writeFile(filePath, html, 'utf8');
        log.debug(`Wrote output: ${filePath} (${Buffer.byteLength(html)} bytes)`);
    } catch (err: any) {
        log.error(`Failed to write route "${route}" to disk:`, {
            message: err?.message || String(err),
            stack: err?.stack
        });
        throw err;
    }
}

async function deleteRoute(route: string): Promise<void> {
    try {
        if (route === '/404.html') {
            await fs.rm(path.join(DIST, '404.html'), { force: true });
            log.debug(`Deleted output: ${path.join(DIST, '404.html')}`);
            return;
        }
        const routePath = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
        if (!routePath) return;
        const targetDir = path.join(DIST, routePath);
        await fs.rm(targetDir, { recursive: true, force: true });
        log.debug(`Deleted output directory: ${targetDir}`);
    } catch (err: any) {
        log.warn(`Failed deleting output for route "${route}":`, err?.message || err);
    }
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function run(): Promise<void> {
    profiler.time('build');
    const isClean = process.argv.includes('--clean');
    log.info(`Starting build orchestrator (${isClean ? 'clean build' : 'incremental build'})...`);

    const distExists = await fileExists(DIST);

    if (isClean || !distExists) {
        log.info('Clearing workspace and cache for clean build...');
        await fs.rm(DIST, { recursive: true, force: true });
        await fs.rm(CACHE_DIR, { recursive: true, force: true });
    }

    await fs.mkdir(ASSETS_DIR, { recursive: true });

    // 1. Run Incremental Route Evaluation
    const buildResult = await executeIncrementalBuild({
        forceClean: isClean || !distExists,
        rootDir: ROOT,
        cacheDir: CACHE_DIR,
        distDir: DIST
    });

    const { routeMap, changedRoutes, deletedRoutes, sitemapEntries, searchEntries, stats } = buildResult;

    // 2. Incremental Asset Bundling
    const cssPath = path.resolve(ASSETS_DIR, 'styles.css');
    const jsPath = path.resolve(ASSETS_DIR, 'interaction.js');
    const assetsMissing = !(await fileExists(cssPath)) || !(await fileExists(jsPath));

    if (isClean || stats.codeChanged || stats.assetsChanged || assetsMissing) {
        log.info('Bundling static assets with esbuild...');
        try {
            await esbuild.build({
                entryPoints: [path.resolve(ROOT, 'src/assets/styles.css')],
                outfile: cssPath,
                bundle: true,
                minify: true,
            });

            await esbuild.build({
                entryPoints: [path.resolve(ROOT, 'src/assets/interaction.ts')],
                outfile: jsPath,
                bundle: true,
                format: 'iife',
                platform: 'browser',
                minify: true,
            });

            const cssStat = await fs.stat(cssPath);
            const jsStat = await fs.stat(jsPath);
            log.info(`Asset bundles generated: styles.css (${(cssStat.size / 1024).toFixed(1)} KB), interaction.js (${(jsStat.size / 1024).toFixed(1)} KB).`);
        } catch (assetErr: any) {
            log.error('Asset bundling failed:', {
                message: assetErr?.message || String(assetErr),
                stack: assetErr?.stack
            });
            throw assetErr;
        }
    } else {
        log.info('Static assets up to date. Reusing cached bundles.');
    }

    const cssContent = await fs.readFile(cssPath, 'utf8');

    // 3. Differential HTML Generation
    const shouldWriteAllRoutes = isClean || !distExists || stats.codeChanged || stats.assetsChanged;

    if (shouldWriteAllRoutes) {
        log.info(`Writing all ${routeMap.size} HTML files to disk (reason: ${isClean ? 'clean build' : !distExists ? 'missing dist' : stats.codeChanged ? 'code changed' : 'assets changed'})...`);
        for (const [route, html] of routeMap.entries()) {
            const optimizedHtml = html.replace(
                /<link rel="stylesheet" href="[^"]*assets\/styles\.css"\s*\/?>/g,
                `<style>${cssContent}</style>`
            );
            await writeRoute(route, optimizedHtml);
        }
        log.info(`Completed writing ${routeMap.size} HTML files.`);
    } else if (changedRoutes.size > 0 || deletedRoutes.size > 0) {
        log.info(`Differential write: ${changedRoutes.size} modified/added, ${deletedRoutes.size} deleted...`);
        for (const route of changedRoutes) {
            const html = routeMap.get(route);
            if (html) {
                const optimizedHtml = html.replace(
                    /<link rel="stylesheet" href="[^"]*assets\/styles\.css"\s*\/?>/g,
                    `<style>${cssContent}</style>`
                );
                await writeRoute(route, optimizedHtml);
            }
        }
        for (const route of deletedRoutes) {
            log.info(`Pruning deleted route: ${route}`);
            await deleteRoute(route);
        }
        log.info(`Differential write completed (${changedRoutes.size} written, ${deletedRoutes.size} pruned).`);
    } else {
        log.info(`All ${routeMap.size} HTML files are up to date on disk. Skipping write.`);
    }

    // 4. Global Artifacts
    const globalArtifactsMissing =
        !(await fileExists(path.join(DIST, 'sitemap.xml'))) ||
        !(await fileExists(path.join(DIST, 'search-index.json')));

    if (shouldWriteAllRoutes || changedRoutes.size > 0 || deletedRoutes.size > 0 || globalArtifactsMissing) {
        log.info('Generating global artifacts (sitemap.xml, robots.txt, search-index.json)...');
        const sitemapXml = generateSitemapXml(sitemapEntries);
        await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');

        const robotsTxt = generateRobotsTxt();
        await fs.writeFile(path.join(DIST, 'robots.txt'), robotsTxt, 'utf8');

        const searchJson = JSON.stringify(searchEntries);
        await fs.writeFile(
            path.join(DIST, 'search-index.json'),
            searchJson,
            'utf8'
        );

        const durationMs = profiler.timeEnd('build', 'Total build execution time') ?? 0;
        const routeManifest = {
            generatedAt: new Date().toISOString(),
            totalGenerated: routeMap.size,
            durationMs,
            routes: Array.from(routeMap.keys())
        };
        await fs.writeFile(path.join(DIST, 'route-manifest.json'), JSON.stringify(routeManifest, null, 2), 'utf8');
        await fs.writeFile(path.join(DIST, 'CNAME'), 'bloatware.crabwire.net\n', 'utf8');

        log.info(
            `Artifacts written: sitemap.xml (${sitemapEntries.length} routes), search-index.json (${searchEntries.length} items, ${(Buffer.byteLength(searchJson) / 1024).toFixed(1)} KB).`
        );
        log.info(`Build successful. ${routeMap.size} routes (${stats.rebuiltRoutes} rebuilt, ${stats.cachedRoutes} cached, ${stats.deletedRoutes} deleted) in ${durationMs}ms.`);
    } else {
        const durationMs = profiler.timeEnd('build', 'Total build execution time') ?? 0;
        log.info(`Build up to date. ${routeMap.size} routes (${stats.rebuiltRoutes} rebuilt, ${stats.cachedRoutes} cached) in ${durationMs}ms.`);
    }
}

run().catch((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error(`Build failed critically: ${err.message}`, err.stack ? { stack: err.stack } : undefined);
    process.exit(1);
});
