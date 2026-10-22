import path from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const execFileAsync = promisify(execFile);

function emitDocumentationContent() {
    return {
        name: "emit-documentation-content",
        configureServer(server: { watcher: { on: (event: string, callback: (fileName: string) => void) => void }, ws: { send: (message: { type: string }) => void } }) {
            let pending: Promise<void> = Promise.resolve();
            const refresh = (fileName: string) => {
                const normalized = fileName.replaceAll("\\", "/");
                const isMarkdownChange = normalized.startsWith(docsDirectory.replaceAll("\\", "/") + "/content/")
                    && (normalized.endsWith(".md") || normalized.endsWith(".md.ts"));
                const isSourceChange = normalized.startsWith(projectRoot.replaceAll("\\", "/") + "/src/")
                    && normalized.endsWith(".ts");
                if (!isMarkdownChange && !isSourceChange) return;

                pending = pending.then(async () => {
                    if (isSourceChange)
                        await execFileAsync(process.execPath, [path.join(projectRoot, "tools", "generate-api-docs.mjs")], { cwd: projectRoot });
                    await execFileAsync(process.execPath, [path.join(projectRoot, "tools", "generate-docs.mjs")], { cwd: projectRoot });
                    server.ws.send({ type: "full-reload" });
                }).catch(error => {
                    console.error("Documentation regeneration failed:", error);
                });
            };

            server.watcher.on("change", refresh);
            server.watcher.on("add", refresh);
            server.watcher.on("unlink", refresh);
        },
        generateBundle() {
            for (const fileName of ["topics-manifest.json", "api-docs.json", "editor-types.json"]) {
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

            for (const assetGroup of ["flags", "products"]) {
                const assetDirectory = path.join(docsDirectory, "assets", assetGroup);
                for (const fileName of readdirSync(assetDirectory).filter(name => name.endsWith(".svg"))) {
                    this.emitFile({
                        type: "asset",
                        fileName: `docs/assets/${assetGroup}/` + fileName,
                        source: readFileSync(path.join(assetDirectory, fileName))
                    });
                }
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
                sandbox: path.join(docsDirectory, "demo-sandbox.html"),
                forma: path.join(docsDirectory, "forma.html")
            }
        }
    }
});
