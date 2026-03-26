import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSiteData } from "../src/contentLoader";
import { IndexTemplate } from "../src/templates/Index";
import { ArticlesTemplate, ArticleDetailTemplate } from "../src/templates/Articles";
import { PagesTemplate, PageDetailTemplate } from "../src/templates/Pages";

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, "dist");
const WWW_DIR = path.resolve(ROOT, "../www");

function documentFromElement(element: React.ReactElement): string {
    return `<!doctype html>${renderToStaticMarkup(element)}`;
}

async function writeRoute(route: string, html: string): Promise<void> {
    const routePath = route === "/" ? "" : route.replace(/^\//, "");
    const outputDir = path.join(DIST, routePath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, "index.html"), html, "utf8");
}

async function copyIfExists(source: string, target: string): Promise<void> {
    try {
        await fs.access(source);
        await fs.cp(source, target, { recursive: true });
    } catch {
        // Optional directory does not exist.
    }
}

async function run(): Promise<void> {
    const siteData = await loadSiteData();

    await fs.rm(DIST, { recursive: true, force: true });
    await fs.mkdir(DIST, { recursive: true });

    await fs.copyFile(path.resolve(ROOT, "src/styles.css"), path.resolve(DIST, "styles.css"));
    await copyIfExists(WWW_DIR, DIST);

    const latestArticles = siteData.articles.slice(0, 6);
    const keyPages = siteData.pages.slice(0, 8);

    await writeRoute(
        "/",
        documentFromElement(React.createElement(IndexTemplate, { latestArticles, keyPages }))
    );
    await writeRoute(
        "/articles/",
        documentFromElement(React.createElement(ArticlesTemplate, { items: siteData.articles }))
    );
    await writeRoute(
        "/pages/",
        documentFromElement(React.createElement(PagesTemplate, { items: siteData.pages }))
    );

    for (const item of siteData.articles) {
        await writeRoute(
            item.route,
            documentFromElement(React.createElement(ArticleDetailTemplate, { item }))
        );
    }

    for (const item of siteData.pages) {
        await writeRoute(
            item.route,
            documentFromElement(React.createElement(PageDetailTemplate, { item }))
        );
    }

    const routeManifest = {
        generatedAt: new Date().toISOString(),
        routes: [
            "/",
            "/articles/",
            "/pages/",
            ...siteData.articles.map((item) => item.route),
            ...siteData.pages.map((item) => item.route)
        ]
    };

    await fs.writeFile(path.join(DIST, "route-manifest.json"), JSON.stringify(routeManifest, null, 2), "utf8");

    console.log(`Generated ${routeManifest.routes.length} routes into ${DIST}`);
}

run().catch((error: unknown) => {
    console.error("Static build failed", error);
    process.exit(1);
});
