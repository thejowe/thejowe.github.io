// Compila "Wisp Pixel" (Regular y Bold) a woff2 desde scripts/pixel-font/glyphs.mjs.
// Uso: npm run build:font
//
// Reproducible: createdTimestamp fijo y orden de glifos determinista.
// Cada píxel de 100 unidades se fusiona en contornos poligonales (sin costuras).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';
import { GLYPHS, NOTDEF, MARKS, MARKS_BOLD, BOLD_GLYPHS, COMPOSE } from './glyphs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, 'out');
const FONT_DIR = join(here, '..', '..', 'public', 'fonts');

const PX = 100; // unidades por píxel
const UPM = 1200;
const ASCENT = 11 * PX; // 11 px: las tildes de mayúscula llegan a y=11
const DESCENT = 3 * PX;
const SPACE_ADV = 4; // píxeles
const FIXED_MS = 1767225600000; // 2026-01-01T00:00:00Z

// ───────── Parseo del arte ASCII ─────────
// Devuelve { px: Set("x,y"), w } con y = píxeles sobre la línea base (fila inferior = 0).
function parseArt(art) {
  const lines = art
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const mark = lines.indexOf('-');
  const rows = lines.filter((l) => l !== '-');
  const above = mark === -1 ? rows.length : mark;
  const px = new Set();
  let w = 0;
  rows.forEach((row, i) => {
    w = Math.max(w, row.length);
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') px.add(`${x},${above - 1 - i}`);
    }
  });
  return { px, w, above, below: rows.length - above };
}

const key = (x, y) => `${x},${y}`;
const parsePx = (s) => s.split(',').map(Number);

function flip(g, axis) {
  const px = new Set();
  const ys = [...g.px].map((s) => parsePx(s)[1]);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, g.above - 1);
  for (const s of g.px) {
    const [x, y] = parsePx(s);
    if (axis === 'h') px.add(key(g.w - 1 - x, y));
    else px.add(key(x, maxY + minY - y));
  }
  return { ...g, px };
}

function stampMark(base, markName, yBottom, bold) {
  const rows = (bold && MARKS_BOLD[markName]) || MARKS[markName];
  const mw = Math.max(...rows.map((r) => r.length));
  const off = Math.floor((base.w - mw) / 2);
  const px = new Set(base.px);
  rows.forEach((row, i) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') px.add(key(off + x, yBottom + (rows.length - 1 - i)));
    }
  });
  return { ...base, px };
}

function resolveAll(bold) {
  const out = new Map();
  const raw = new Map();
  for (const [ch, def] of Object.entries(GLYPHS)) {
    if (typeof def === 'string')
      raw.set(
        ch,
        bold
          ? BOLD_GLYPHS[ch]
            ? parseArt(BOLD_GLYPHS[ch])
            : embolden(parseArt(def), ch)
          : parseArt(def),
      );
  }
  // dependientes (flip)
  for (const [ch, def] of Object.entries(GLYPHS)) {
    if (typeof def === 'object') {
      const srcCh = def.flipV ?? def.flipH;
      let src = raw.get(srcCh);
      if (!src) throw new Error(`flip: falta el glifo origen ${srcCh} para ${ch}`);
      if (def.flipV) src = flip(src, 'v');
      if (def.flipH) src = flip(src, 'h');
      if (def.dy)
        src = {
          ...src,
          px: new Set(
            [...src.px].map((s) => {
              const [x, y] = parsePx(s);
              return key(x, y + def.dy);
            }),
          ),
        };
      raw.set(ch, src);
    }
  }
  for (const [ch, g] of raw) out.set(ch, g);
  for (const [ch, c] of Object.entries(COMPOSE)) {
    const base = raw.get(c.base);
    if (!base) throw new Error(`compose: falta la base ${c.base} para ${ch}`);
    out.set(ch, stampMark(base, c.mark, c.y, bold));
  }
  return out;
}

// Bold: cada píxel se ensancha 1 px a la derecha (trazo 2 px, mismo grid).
function embolden(g, ch) {
  const px = new Set();
  for (const s of g.px) {
    const [x, y] = parsePx(s);
    px.add(key(x, y));
    // no rellenar huecos de exactamente 1 px (se perderían los contrapunzones)
    if (g.px.has(key(x + 2, y)) && !g.px.has(key(x + 1, y))) {
      if (ch) console.log('gap-protect:', ch);
      continue;
    }
    px.add(key(x + 1, y));
  }
  return { ...g, px, w: g.w + 1 };
}

// ───────── Píxeles → contornos fusionados ─────────
// Aristas dirigidas con el interior a la izquierda (exterior antihorario, huecos horarios).
function pixelsToContours(px) {
  const has = (x, y) => px.has(key(x, y));
  const edges = new Map(); // "x,y" de inicio → [{to:[x,y]}]
  const addEdge = (a, b) => {
    const k = key(a[0], a[1]);
    if (!edges.has(k)) edges.set(k, []);
    edges.get(k).push({ from: a, to: b, used: false });
  };
  for (const s of px) {
    const [x, y] = parsePx(s);
    if (!has(x, y - 1)) addEdge([x, y], [x + 1, y]);
    if (!has(x + 1, y)) addEdge([x + 1, y], [x + 1, y + 1]);
    if (!has(x, y + 1)) addEdge([x + 1, y + 1], [x, y + 1]);
    if (!has(x - 1, y)) addEdge([x, y + 1], [x, y]);
  }
  const contours = [];
  const all = [...edges.values()]
    .flat()
    .sort((a, b) => a.from[1] - b.from[1] || a.from[0] - b.from[0]);
  for (const start of all) {
    if (start.used) continue;
    const pts = [];
    let e = start;
    while (e && !e.used) {
      e.used = true;
      pts.push(e.from);
      const cands = (edges.get(key(e.to[0], e.to[1])) || []).filter((c) => !c.used);
      if (cands.length === 0) break;
      if (cands.length === 1) {
        e = cands[0];
      } else {
        // en vértices diagonales: giro más a la izquierda (separa píxeles que solo se tocan en la esquina)
        const din = [e.to[0] - e.from[0], e.to[1] - e.from[1]];
        let best = null;
        let bestAng = -Infinity;
        for (const c of cands) {
          const d = [c.to[0] - c.from[0], c.to[1] - c.from[1]];
          const ang = Math.atan2(din[0] * d[1] - din[1] * d[0], din[0] * d[0] + din[1] * d[1]);
          if (ang > bestAng) {
            bestAng = ang;
            best = c;
          }
        }
        e = best;
      }
    }
    // quitar puntos colineales
    const clean = pts.filter((p, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length];
      const b = pts[(i + 1) % pts.length];
      return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0;
    });
    if (clean.length >= 3) contours.push(clean);
  }
  return contours;
}

function toPath(px) {
  const path = new opentype.Path();
  for (const c of pixelsToContours(px)) {
    c.forEach(([x, y], i) => (i === 0 ? path.moveTo(x * PX, y * PX) : path.lineTo(x * PX, y * PX)));
    path.close();
  }
  return path;
}

// ───────── Fuente ─────────
function buildFont(weight) {
  const bold = weight === 'Bold';
  const glyphs = [];
  const notdef = parseArt(NOTDEF);
  const nd = bold ? embolden(notdef) : notdef;
  glyphs.push(
    new opentype.Glyph({
      name: '.notdef',
      unicode: undefined,
      advanceWidth: (nd.w + 1) * PX,
      path: toPath(nd.px),
    }),
  );

  glyphs.push(
    new opentype.Glyph({
      name: 'space',
      unicode: 32,
      advanceWidth: SPACE_ADV * PX,
      path: new opentype.Path(),
    }),
  );
  glyphs.push(
    new opentype.Glyph({
      name: 'uni00A0',
      unicode: 0xa0,
      advanceWidth: SPACE_ADV * PX,
      path: new opentype.Path(),
    }),
  );

  const all = resolveAll(bold);
  const chars = [...all.keys()].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    let g = all.get(ch);
    glyphs.push(
      new opentype.Glyph({
        name: 'uni' + cp.toString(16).toUpperCase().padStart(4, '0'),
        unicode: cp,
        advanceWidth: (g.w + 1) * PX,
        path: toPath(g.px),
      }),
    );
  }

  return new opentype.Font({
    familyName: 'Wisp Pixel',
    styleName: weight,
    unitsPerEm: UPM,
    ascender: ASCENT,
    descender: -DESCENT,
    weightClass: bold ? 700 : 400,
    designer: 'thejowe',
    designerURL: 'https://github.com/thejowe',
    manufacturer: 'thejowe',
    license:
      'Wisp Pixel es propiedad de thejowe y se distribuye solo con este portfolio. Todos los derechos reservados.',
    description: 'Fuente bitmap propia para el portfolio de thejowe. Rejilla de 12 px por em.',
    version: 'Version 1.000',
    copyright: 'Copyright (c) 2026 thejowe',
    createdTimestamp: 1767225600, // 2026-01-01, fijo para builds reproducibles
    tables: {
      os2: {
        // 64 = REGULAR, 32 = BOLD, 128 = USE_TYPO_METRICS
        fsSelection: (bold ? 32 : 64) | 128,
        sTypoAscender: ASCENT,
        sTypoDescender: -DESCENT,
        sTypoLineGap: 0,
        usWinAscent: ASCENT,
        usWinDescent: DESCENT,
      },
    },
    glyphs,
  });
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(FONT_DIR, { recursive: true });

for (const [weight, file] of [
  ['Regular', 'wisp-pixel'],
  ['Bold', 'wisp-pixel-bold'],
]) {
  const font = buildFont(weight);
  // opentype.js estampa head.modified con la hora actual: se fija para que el build sea reproducible
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...a) {
      super(...(a.length ? a : [FIXED_MS]));
    }
    static now() {
      return FIXED_MS;
    }
  };
  const sfnt = Buffer.from(font.toArrayBuffer());
  globalThis.Date = RealDate;
  writeFileSync(join(OUT_DIR, `${file}.otf`), sfnt);
  const woff2 = Buffer.from(await wawoff2.compress(sfnt));
  writeFileSync(join(FONT_DIR, `${file}.woff2`), woff2);
  console.log(
    `${file}: ${font.glyphs.length} glifos, otf ${sfnt.length} B, woff2 ${woff2.length} B`,
  );
}
