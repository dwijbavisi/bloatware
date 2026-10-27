import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../dist").replace(/\\/g, "/");
const SRC_DIR = path.resolve(__dirname, "../src").replace(/\\/g, "/");
const TOKENS_DIR = path.resolve(__dirname, "../tokens").replace(/\\/g, "/");

export default defineConfig({
    server: {
        port: 5173,
        fs: {
            allow: [".."]
        }
    },
    esbuild: {
        jsx: "automatic"
    },
    resolve: {
        alias: [
            { find: /^@dist\/(.*)/, replacement: `${DIST_DIR}/$1` },
            { find: "@dist", replacement: `${DIST_DIR}/index.js` },
            { find: /^@tokens\/(.*)/, replacement: `${TOKENS_DIR}/$1` },
            { find: /^@biocircuit\/(.*)/, replacement: `${SRC_DIR}/$1` },
            { find: "@biocircuit", replacement: `${SRC_DIR}/index.ts` }
        ]
    }
});
