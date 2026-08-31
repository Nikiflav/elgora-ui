import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// remixicon.css declares @font-face src with eot/woff2/woff/ttf/svg fallbacks.
// Vite base64-inlines every url() it finds, which balloons the built CSS by
// several MB (the bundled legacy svg font alone is ~3MB). woff2 is the
// modern, smallest format and covers all browsers we target (no IE).
// This rewrites the raw source text before Vite's own CSS/asset pipeline
// (which resolves and inlines url() references) ever sees the file.
function keepOnlyWoff2FontFace(): Plugin {
  return {
    name: 'remixicon-woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('remixicon/fonts/remixicon.css')) return

      return code.replace(
        /@font-face\s*\{[^}]*\}/,
        `@font-face {\n  font-family: "remixicon";\n  src: url("remixicon.woff2") format("woff2");\n  font-display: swap;\n}`
      )
    }
  }
}

function docsMetadataWatcher(): Plugin {
  const projectRoot = process.cwd();
  const docsContentRoot = path.resolve(projectRoot, 'docs', 'content');
  const sourceRoot = path.resolve(projectRoot, 'src');
  const docsGenerator = path.resolve(projectRoot, 'tools', 'generate-docs.mjs');
  const apiGenerator = path.resolve(projectRoot, 'tools', 'generate-api-docs.mjs');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingContent = false;
  let pendingApi = false;
  let running = false;

  const isInside = (file: string, directory: string) =>
    file === directory || file.startsWith(`${directory}${path.sep}`);

  const regenerate = async (server: { ws: { send(message: { type: string }): void } }) => {
    if (running) return;
    running = true;
    const runContent = pendingContent;
    const runApi = pendingApi;
    pendingContent = false;
    pendingApi = false;

    try {
      if (runApi) await execFileAsync(process.execPath, [apiGenerator], { cwd: projectRoot });
      if (runContent) await execFileAsync(process.execPath, [docsGenerator], { cwd: projectRoot });
      if (runApi || runContent) server.ws.send({ type: 'full-reload' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[docs] Metadata generation failed: ${message}`);
    } finally {
      running = false;
      if (pendingContent || pendingApi) void regenerate(server);
    }
  };

  const schedule = (server: { ws: { send(message: { type: string }): void } }) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void regenerate(server), 120);
  };

  return {
    name: 'docs-metadata-watcher',
    configureServer(server: any) {
      server.watcher.on('change', (file: string) => {
        if (isInside(file, sourceRoot)) {
          pendingApi = true;
          schedule(server);
          return;
        }

        if (isInside(file, docsContentRoot) && (file.endsWith('.md') || file.endsWith('.ts'))) {
          pendingContent = true;
          schedule(server);
        }
      });
    }
  } satisfies Plugin;
}

export default defineConfig({
  plugins: [keepOnlyWoff2FontFace(), docsMetadataWatcher(), dts()],

  // DEV SERVER (documentation site)
  server: {
    open: '/docs/index.html'
  },

  // LIBRARY BUILD
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ElgoraUI',
      fileName: 'elgora-ui',
      formats: ['es', 'umd']
    }
  }
});
