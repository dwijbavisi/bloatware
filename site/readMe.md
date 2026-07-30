# bloatware-site

A robust, minimal, static-first React/TSX build system and decoupled markdown renderer for Project bloatware.

## Architecture & Scope

- **Static-First Generation**: The system is designed to compile markdown files into static HTML with O(1) memory safety.
- **Decoupled AST Rendering**: Markdown parsing and React rendering are strictly separated. The router produces discriminated AST nodes (`BlockNode`, `InlineNode`), which the templates render dynamically.
- **No Production Server**: The output is entirely static HTML/CSS/JS. SSR is out of scope.

## Content Sources

- `../content/articles` - Chronological posts and essays.
- `../content/pages` - Hierarchical pages and documentation.
- `../readMe.md` - Used to populate the intro section of the global home page.

## Commands

- `npm install` - Install dependencies.
- `npm run build` - Execute the `build-static.ts` orchestrator to generate the static site.
- `npm run dev` - Start the Vite dev server for local implementation and styling work.

## Build Orchestrator Pipeline

The core build script (`site/scripts/build-static.ts`) operates on a memory-safe asynchronous stream:
1. Discovers markdown content deepest-first.
2. Pipes into the Router to compute canonical paths and hierarchy footprints.
3. Rewrites relative AST links to static HTML paths.
4. Renders the React templates to HTML strings and flushes directly to disk (preventing OOM errors).
5. Compiles global index templates using lightweight `ChildRecord` footprints.

## Templates & Routing

All layouts are strictly typed and located in `site/src/templates/`:
- `CoreLayout.tsx` - The HTML shell, sticky header, and navigation.
- `IndexTemplate.tsx` - Route: `/`
- `ArticleIndexTemplate.tsx` - Route: `/articles/`
- `PageIndexTemplate.tsx` - Route: `/pages/`
- `ArticleDetailTemplate.tsx` - Route: `/articles/:year/:month/:slug/`
- `PageDetailTemplate.tsx` - Route: `/pages/:topic/:subtopic/:slug/`

## Deployment

- Generated output is flushed to `site/dist/`.
- A route dictionary is written to `site/dist/route-manifest.json` along with execution profiling stats.
- GitHub Pages deployment is fully automated on every push to `main` via `.github/workflows/deploy.yml`.
- See `site/deployment.md` for specific CI/CD details.
