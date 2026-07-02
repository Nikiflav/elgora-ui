import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';

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

export default defineConfig({
  plugins: [keepOnlyWoff2FontFace(), dts()],

  // DEV SERVER (playground)
  server: {
    open: '/playground/index.html'
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
