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
    if (route === '/404.html') {
        await fs.writeFile(path.join(DIST, '404.html'), html, 'utf8');
        return;
    }
    const routePath = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
    const outputDir = path.join(DIST, routePath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

async function deleteRoute(route: string): Promise<void> {
    if (route === '/404.html') {
        await fs.rm(path.join(DIST, '404.html'), { force: true });
        return;
    }
    const routePath = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
    if (!routePath) return;
    const targetDir = path.join(DIST, routePath);
    await fs.rm(targetDir, { recursive: true, force: true });
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
    } else {
        log.info('Static assets up to date. Reusing cached bundles.');
    }

    const cssContent = await fs.readFile(cssPath, 'utf8');

    // 3. Differential HTML Generation
    const shouldWriteAllRoutes = isClean || !distExists || stats.codeChanged || stats.assetsChanged;

    if (shouldWriteAllRoutes) {
        log.info(`Writing all ${routeMap.size} HTML files to disk...`);
        for (const [route, html] of routeMap.entries()) {
            const optimizedHtml = html.replace(
                /<link rel="stylesheet" href="[^"]*assets\/styles\.css"\s*\/?>/g,
                `<style>${cssContent}</style>`
            );
            await writeRoute(route, optimizedHtml);
        }
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
    } else {
        log.info(`All ${routeMap.size} HTML files are up to date on disk. Skipping write.`);
    }

    // 4. Global Artifacts
    const globalArtifactsMissing =
        !(await fileExists(path.join(DIST, 'sitemap.xml'))) ||
        !(await fileExists(path.join(DIST, 'search-index.json')));

    if (shouldWriteAllRoutes || changedRoutes.size > 0 || deletedRoutes.size > 0 || globalArtifactsMissing) {
        log.info('Writing sitemap.xml, robots.txt, and search-index.json...');
        const sitemapXml = generateSitemapXml(sitemapEntries);
        await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');

        const robotsTxt = generateRobotsTxt();
        await fs.writeFile(path.join(DIST, 'robots.txt'), robotsTxt, 'utf8');

        await fs.writeFile(
            path.join(DIST, 'search-index.json'),
            JSON.stringify(searchEntries),
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

        log.info(`Build successful. ${routeMap.size} routes (${stats.rebuiltRoutes} rebuilt, ${stats.cachedRoutes} cached, ${stats.deletedRoutes} deleted) in ${durationMs}ms.`);
    } else {
        const durationMs = profiler.timeEnd('build', 'Total build execution time') ?? 0;
        log.info(`Build up to date. ${routeMap.size} routes (${stats.rebuiltRoutes} rebuilt, ${stats.cachedRoutes} cached) in ${durationMs}ms.`);
    }
}

run().catch((error: unknown) => {
    log.error('Build failed critically.', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
});
