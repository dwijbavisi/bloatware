import { type Plugin, type ViteDevServer } from 'vite';
import path from 'node:path';

export function devServerPlugin(): Plugin {
    let routeMap = new Map<string, string>();
    let isBuilding = false;

    async function rebuildRoutes(server: ViteDevServer) {
        if (isBuilding) return;
        isBuilding = true;
        try {
            console.log('[Vite SSG] Rebuilding routes in memory...');
            const builderPath = path.resolve(process.cwd(), 'scripts/builder.ts');
            const builder = await server.ssrLoadModule(builderPath);
            routeMap = await builder.generateAllRoutes();
            console.log(`[Vite SSG] Successfully generated ${routeMap.size} routes.`);
        } catch (e) {
            console.error('[Vite SSG] Error rebuilding routes:', e);
        } finally {
            isBuilding = false;
        }
    }

    return {
        name: 'vite-plugin-ssg-dev',
        
        async configureServer(server) {
            // Watch the content directory and markdown files
            server.watcher.add(path.resolve(process.cwd(), '../content'));
            server.watcher.add(path.resolve(process.cwd(), '../readMe.md'));

            // Perform initial build
            await rebuildRoutes(server);

            // Add middleware to intercept HTML requests BEFORE Vite's defaults
            server.middlewares.use(async (req, res, next) => {
                if (!req.url) return next();

                // Skip static assets
                if (req.url.match(/\.(css|js|ts|tsx|png|jpg|jpeg|svg|json|ico)$/)) {
                    return next();
                }

                try {
                    let route = req.url.split('?')[0];
                    
                    // Normalize SSG explicit index.html requests
                    if (route.endsWith('/index.html')) {
                        route = route.slice(0, -10);
                    }

                    if (route !== '/' && !route.endsWith('/')) {
                        route += '/';
                    }

                    if (routeMap.has(route)) {
                        let html = routeMap.get(route)!;
                        
                        // Rewrite assets to point to Vite's dev server src/assets
                        html = html
                            .replace(/href="([^"]*)assets\/styles\.css"/g, 'href="/src/assets/styles.css"')
                            .replace(/src="([^"]*)assets\/interaction\.js"/g, 'src="/src/assets/interaction.ts"');

                        // Inject Vite's HMR scripts
                        const transformedHtml = await server.transformIndexHtml(req.url, html);
                        
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html');
                        res.end(transformedHtml);
                        return;
                    } else if (req.headers.accept?.includes('text/html')) {
                        // If it's an HTML request but not in our map, don't let Vite serve the SPA index.html
                        // Let the user know it's a 404 from SSG.
                        res.statusCode = 404;
                        res.setHeader('Content-Type', 'text/html');
                        res.end(`<h1>404 Not Found in SSG</h1><p>Route: ${route}</p>`);
                        return;
                    }
                } catch (e) {
                    server.ssrFixStacktrace(e as Error);
                    console.error(e);
                    res.statusCode = 500;
                    res.end((e as Error).message);
                    return;
                }
                
                next();
            });
        },

        async handleHotUpdate({ file, server }) {
            // Rebuild map if any relevant file changes
            if (file.endsWith('.md') || file.endsWith('.tsx') || file.endsWith('.ts')) {
                await rebuildRoutes(server);
                
                server.ws.send({
                    type: 'full-reload',
                    path: '*'
                });
            }
        }
    };
}
