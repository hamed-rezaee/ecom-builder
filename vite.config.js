import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { rolldown } from 'rolldown';

// `import js from './entry.js?iife'` yields the entry bundled (with its dependencies) as a minified IIFE string.
function iifeRaw() {
  const suffix = '?iife';
  return {
    name: 'iife-raw',
    enforce: 'pre',
    async load(id) {
      if (!id.endsWith(suffix)) return null;
      const file = id.slice(0, -suffix.length);
      const bundle = await rolldown({ input: file, platform: 'browser' });
      try {
        const { output } = await bundle.generate({
          format: 'iife',
          minify: true,
        });
        // Without this, edits to bundled sources leave Vite serving a stale bundle.
        for (const f of await bundle.watchFiles) this.addWatchFile(f);
        return `export default ${JSON.stringify(output[0].code)};`;
      } finally {
        await bundle.close();
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/ecom-builder/',
  plugins: [iifeRaw(), react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});
