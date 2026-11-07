// Comprueba los enlaces y recursos internos del sitio construido (dist/).
// Uso: npm run build && npm run test:links
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist');
const ORIGIN = 'https://thejowe.github.io';

if (!existsSync(root)) {
  console.error('No existe dist/. Ejecuta `npm run build` antes.');
  process.exit(2);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const pages = walk(root).filter((f) => f.endsWith('.html'));

/** ¿Existe la ruta de URL en dist? */
function resolves(pathname) {
  const target = join(root, decodeURIComponent(pathname));
  if (!target.startsWith(root)) return false;
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, 'index.html')) || existsSync(`${target}.html`);
}

function pageFile(pathname) {
  const target = join(root, decodeURIComponent(pathname));
  if (existsSync(join(target, 'index.html'))) return join(target, 'index.html');
  if (existsSync(`${target}.html`)) return `${target}.html`;
  return target;
}

// Vacía el cuerpo de los <script> pero conserva la etiqueta (y su `src`).
const stripScriptBodies = (html) =>
  html.replace(/<script([^>]*)>[\s\S]*?<\/script>/g, '<script$1></script>');

const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = stripScriptBodies(readFileSync(file, 'utf8'));
    idsCache.set(file, new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

const errors = [];
let checked = 0;

for (const page of pages) {
  const rel = '/' + relative(root, page).replaceAll('\\', '/');
  const pageUrl = new URL(rel.replace(/index\.html$/, ''), ORIGIN);
  const html = stripScriptBodies(readFileSync(page, 'utf8'));
  for (const m of html.matchAll(/\s(?:href|src)=["']([^"']*)["']/g)) {
    const raw = m[1].trim();
    if (!raw || /^(mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
    let url;
    try {
      url = new URL(raw, pageUrl);
    } catch {
      errors.push(`${rel}: URL no válida «${raw}»`);
      continue;
    }
    if (url.origin !== ORIGIN) continue; // externos: tarea programada
    checked++;
    if (!resolves(url.pathname)) {
      errors.push(`${rel}: enlace roto → ${raw}`);
      continue;
    }
    if (url.hash.length > 1) {
      const id = decodeURIComponent(url.hash.slice(1));
      const file = pageFile(url.pathname);
      if (file.endsWith('.html') && !idsOf(file).has(id)) {
        errors.push(`${rel}: ancla inexistente → ${raw}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`${errors.length} enlace(s) interno(s) roto(s):\n` + errors.join('\n'));
  process.exit(1);
}
console.log(`OK: ${checked} referencias internas en ${pages.length} páginas.`);
