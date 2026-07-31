import { defineConfig } from "vite";
import { devServerPlugin } from "./scripts/dev-server-plugin.js";

export default defineConfig({
    plugins: [devServerPlugin()],
    server: {
        fs: {
            allow: [".."]
        }
    }
});
