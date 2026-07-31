import fs from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';
import { Logger } from '../modules/logger';
import profiler from '../modules/profiler';
import { generateAllRoutes } from './builder';

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, 'dist');
const ASSETS_DIR = path.resolve(DIST, 'assets');
const log = new Logger('build-static');

async function writeRoute(route: string, html: string): Promise<void> {
    const routePath = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
    const outputDir = path.join(DIST, routePath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}

async function run(): Promise<void> {
    profiler.time('build');
    log.info('Starting build orchestrator...');

    log.info('Clearing workspace...');
    await fs.rm(DIST, { recursive: true, force: true });
    await fs.mkdir(ASSETS_DIR, { recursive: true });

    log.info('Bundling static assets...');
    await fs.copyFile(path.resolve(ROOT, 'src/assets/styles.css'), path.resolve(ASSETS_DIR, 'styles.css'));

    await esbuild.build({
        entryPoints: [path.resolve(ROOT, 'src/assets/interaction.ts')],
        outfile: path.resolve(ASSETS_DIR, 'interaction.js'),
        bundle: true,
        format: 'iife',
        platform: 'browser',
        minify: true,
    });

    const routeMap = await generateAllRoutes();

    log.info('Writing HTML files to disk...');
    for (const [route, html] of routeMap.entries()) {
        await writeRoute(route, html);
    }

    log.info('Writing route-manifest.json...');
    const durationMs = profiler.timeEnd('build', 'Total build execution time') ?? 0;

    const routeManifest = {
        generatedAt: new Date().toISOString(),
        totalGenerated: routeMap.size,
        durationMs,
        routes: Array.from(routeMap.keys())
    };

    await fs.writeFile(path.join(DIST, 'route-manifest.json'), JSON.stringify(routeManifest, null, 2), 'utf8');

    log.info(`Build successful. Generated ${routeMap.size} routes in ${routeManifest.durationMs}ms.`);
}

run().catch((error: unknown) => {
    log.error(`Build failed critically.`, error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
});
