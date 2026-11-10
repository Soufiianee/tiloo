import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';

const site = JSON.parse(readFileSync(new URL('./config/site.json', import.meta.url), 'utf8'));

export default defineConfig({
  site: site.BASE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  vite: { build: { assetsInlineLimit: 0 } },
});
