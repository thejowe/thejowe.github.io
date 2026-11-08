/**
 * Sprites pixel art como texto: cada fila es una cadena ASCII, cada carácter un color de la paleta.
 * Se convierten en SVG con rectángulos exactos (shape-rendering: crispEdges), un <path> por color.
 * No hay imágenes raster ni dependencias: todo es texto versionable y escala con `--px`.
 */

export type Palette = Record<string, string>;

/** Paleta por defecto: variables CSS del tema (cambian solas entre Noche y Amanecer). */
export const DEFAULT_PALETTE: Palette = {
  i: 'var(--ink)',
  a: 'var(--accent)',
  m: 'var(--moon)',
  g: 'var(--moss)',
  l: 'var(--line)',
  h: 'var(--line-hi)',
  d: 'var(--line-lo)',
  s: 'var(--surface)',
  t: 'var(--surface-2)',
  b: 'var(--bg)',
  r: 'var(--danger)',
  p: 'var(--pine)',
  q: 'var(--pine-2)',
  w: '#fff6dc',
  y: '#ffe08a',
  k: '#05080d',
};

export interface BuiltSprite {
  width: number;
  height: number;
  /** Un trazado por color (carácter → atributo `d`). */
  paths: Array<{ key: string; d: string }>;
}

/** Une píxeles contiguos de una fila en rectángulos y agrupa por color. */
export function buildSprite(rows: readonly string[]): BuiltSprite {
  const height = rows.length;
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const byKey = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      byKey.set(ch, (byKey.get(ch) ?? '') + `M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  return { width, height, paths: [...byKey].map(([key, d]) => ({ key, d })) };
}
