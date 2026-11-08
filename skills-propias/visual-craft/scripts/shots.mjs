#!/usr/bin/env node
/**
 * Capturas reproducibles de un sitio estático: levanta un servidor sobre `--dist`, abre Edge/Chromium con
 * Playwright y guarda una captura por ruta × viewport × tema. Ejecutar desde la raíz del proyecto
 * (necesita `@playwright/test` instalado en el proyecto).
 *
 *   node shots.mjs --dist dist --out tests/artifacts/local/ui --routes / /proyectos \
 *       --viewports 375x800 768x1024 1440x900 --themes dark light --motion reduce --port 4399
 *
 * Opciones: --webgl (args para WebGL por software), --full (página entera), --wait 600 (ms),
 *           --channel msedge|chrome|chromium, --scroll 0.5 (fracción del scroll antes de capturar).
 * El tema se fija con localStorage('theme'); ajusta `setTheme` si tu proyecto usa otra clave.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const out = [];
  for (let j = i + 1; j < args.length && !args[j].startsWith('--'); j++) out.push(args[j]);
  return out.length ? out : [true];
};
const one = (name, def) => String(opt(name, [def])[0]);

const dist = one('dist', 'dist');
const outDir = one('out', 'tests/artifacts/local/shots');
// Rutas: '/', '/proyectos', o sin barra ('home', 'proyectos'). Git Bash en Windows convierte los
// argumentos que empiezan por '/' en rutas de disco (C:/.../Git/proyectos): se reparan aquí.
const routes = opt('routes', ['/']).map((r) => {
  r = String(r);
  if (/^[A-Za-z]:[\/]/.test(r)) r = '/' + (r.split(/\/Git\/|\/msys64\//).pop() ?? '');
  if (r === 'home' || r === '.') return '/';
  return r.startsWith('/') ? r : '/' + r;
});
const viewports = opt('viewports', ['375x800', '768x1024', '1440x900']);
const themes = opt('themes', ['dark', 'light']);
const motion = one('motion', 'reduce');
const port = Number(one('port', 4399));
const wait = Number(one('wait', 600));
const channel = one('channel', 'msedge');
const scroll = Number(one('scroll', 0));
const webgl = args.includes('--webgl');
const full = args.includes('--full');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};
const root = resolve(dist);
const server = createServer((req, res) => {
  // Solo sirve dentro de `dist`: resuelve a ruta absoluta y rechaza lo que se salga (../ y %2F).
  let p = resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (p !== root && !p.startsWith(root + sep)) {
    res.writeHead(403);
    return res.end('403');
  }
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) {
    res.writeHead(404);
    return res.end('404');
  }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(port, '127.0.0.1');

const { createRequire } = await import('node:module');
const { chromium } = createRequire(join(process.cwd(), 'package.json'))('@playwright/test');
const browser = await chromium.launch({
  channel: channel === 'chromium' ? undefined : channel,
  args: webgl
    ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : [],
});
mkdirSync(outDir, { recursive: true });

for (const route of routes) {
  for (const vp of viewports) {
    const [w, h] = vp.split('x').map(Number);
    for (const theme of themes) {
      const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: motion });
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('theme', t);
        } catch {
          /* sin almacenamiento */
        }
      }, theme);
      await page.goto(`http://localhost:${port}${route}`);
      await page.waitForTimeout(wait);
      if (scroll > 0) {
        await page.evaluate((f) => scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' }), scroll);
        await page.waitForTimeout(wait);
      }
      const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      const slug = (route === '/' ? 'home' : route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')) + `-${w}-${theme}`;
      await page.screenshot({ path: join(outDir, `${slug}.png`), fullPage: full });
      console.log(`${slug}: scroll horizontal=${hscroll} errores consola=${errors.length}${errors[0] ? ' → ' + errors[0].slice(0, 120) : ''}`);
      await page.close();
    }
  }
}
await browser.close();
server.close();
