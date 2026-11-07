// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// D1 (valor por defecto): repo thejowe/thejowe.github.io -> raíz del dominio.
export default defineConfig({
  site: 'https://thejowe.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  // CSS en línea: elimina la petición que bloquea el render (el CSS total pesa pocos KB)
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});
