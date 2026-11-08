#!/usr/bin/env node
/**
 * Contraste WCAG de una paleta.
 *   node contrast.mjs '{"noche":{"bg":"#060b12","surface":"#0e1b29","ink":"#e6f0fb","muted":"#98b0c6","accent":"#ffb54a","line":"#4f86aa"}}'
 *   node contrast.mjs paleta.json
 * Por tema calcula: cada color de texto (todo lo que no sea bg, surface y line) sobre bg y superficies,
 * y `line`/`focus` (UI) contra bg y superficies. Texto ≥ 4.5, UI ≥ 3. Marca con ✗ lo que no llega.
 */
import { readFileSync, existsSync } from 'node:fs';

const arg = process.argv[2];
if (!arg) {
  console.error('Uso: node contrast.mjs <json|archivo.json>');
  process.exit(1);
}
const themes = JSON.parse(existsSync(arg) ? readFileSync(arg, 'utf8') : arg);

const lum = (hex) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const isSurface = (k) => k === 'bg' || k.startsWith('surface') || k.startsWith('bg');
const isUI = (k) => k === 'line' || k === 'focus' || k === 'edge';

let bad = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n== ${name}`);
  const surfaces = Object.entries(t).filter(([k]) => isSurface(k));
  for (const [k, v] of Object.entries(t)) {
    if (isSurface(k)) continue;
    const need = isUI(k) ? 3 : 4.5;
    const row = surfaces.map(([sk, sv]) => {
      const r = ratio(v, sv);
      if (r < need) bad++;
      return `${sk} ${r.toFixed(2)}${r < need ? ' ✗' : ''}`;
    });
    console.log(`  ${k.padEnd(10)} (≥${need}) ${row.join(' | ')}`);
  }
}
console.log(bad ? `\n${bad} combinaciones por debajo del mínimo` : '\nTodo cumple');
process.exit(bad ? 2 : 0);
