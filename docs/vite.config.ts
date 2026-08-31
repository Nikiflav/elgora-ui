import path from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

function emitDocumentationContent() {
    return {
        name: "emit-documentation-content",
        generateBundle() {
            for (const fileName of ["topics-manifest.json", "api-docs.json"]) {
                const filePath = path.join(docsDirectory, "content", fileName);
                this.emitFile({
                    type: "asset",
                    fileName: "docs/content/" + fileName,
                    source: readFileSync(filePath, "utf8")
                });
            }

            const topicDirectory = path.join(docsDirectory, "content", "topics");
            for (const fileName of readdirSync(topicDirectory).filter(name => name.endsWith(".js"))) {
                this.emitFile({
                    type: "asset",
                    fileName: "docs/content/topics/" + fileName,
                    source: readFileSync(path.join(topicDirectory, fileName), "utf8")
                });
            }

            const apiDirectory = path.join(docsDirectory, "content", "api");
            this.emitFile({
                type: "asset",
                fileName: "docs/content/api/manifest.json",
                source: readFileSync(path.join(apiDirectory, "manifest.json"), "utf8")
            });
            for (const fileName of readdirSync(apiDirectory).filter(name => name.endsWith(".js"))) {
                this.emitFile({
                    type: "asset",
                    fileName: "docs/content/api/" + fileName,
                    source: readFileSync(path.join(apiDirectory, fileName), "utf8")
                });
            }
        }
    };
}

const docsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(docsDirectory, "..");

export default defineConfig({
    root: projectRoot,
    base: "./",
    plugins: [emitDocumentationContent()],
    build: {
        outDir: path.resolve(projectRoot, "docs-dist"),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                docs: path.join(docsDirectory, "index.html"),
                sandbox: path.join(docsDirectory, "demo-sandbox.html")
            }
        }
    }
});
