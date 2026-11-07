// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// D1 (valor por defecto): repo thejowe/thejowe.github.io -> raíz del dominio.
export default defineConfig({
  site: 'https://thejowe.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
