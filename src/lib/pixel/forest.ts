import { rng } from '../intro/ps2';

/**
 * Siluetas de pinos en pixel art generadas en build (deterministas por semilla).
 * Devuelve filas ASCII listas para `<Sprite rows={...}>`: `p` = pino cercano, `q` = pino lejano.
 */

function pine(h: number): string[] {
  // Copa en pisos que se ensanchan; tronco de 1-2 px. Anchura máxima ≈ h * 0.55.
  const tiers = Math.max(3, Math.round(h / 5));
  const trunk = Math.max(2, Math.round(h * 0.12));
  const crown = h - trunk;
  const rows: string[] = [];
  const maxHalf = Math.max(2, Math.round(h * 0.28));
  for (let y = 0; y < crown; y++) {
    const t = Math.floor((y / crown) * tiers);
    const local = (y / crown) * tiers - t; // 0..1 dentro del piso
    const half = Math.max(0, Math.round(((t + 0.4 + local * 0.6) / tiers) * maxHalf));
    rows.push('.'.repeat(maxHalf - half) + '#'.repeat(half * 2 + 1) + '.'.repeat(maxHalf - half));
  }
  for (let y = 0; y < trunk; y++) {
    const w = h > 18 ? 3 : 1;
    const pad = maxHalf - (w - 1) / 2;
    rows.push('.'.repeat(pad) + '#'.repeat(w) + '.'.repeat(pad));
  }
  return rows;
}

/**
 * Banda de bosque de `width` x `height` píxeles (unidades de sprite). Dos capas: pinos lejanos
 * pequeños (`q`) y cercanos más altos (`p`), con claros irregulares.
 */
export function forestBand(width: number, height: number, seed = 5, density = 1): string[] {
  const r = rng(seed);
  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill('.'));
  const stamp = (rows: string[], x: number, key: string) => {
    const top = height - rows.length;
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const gx = x + dx;
        if (row[dx] === '#' && gx >= 0 && gx < width && top + dy >= 0) grid[top + dy]![gx] = key;
      }
    });
  };
  // Capa lejana
  for (let x = -4; x < width; x += Math.round((3 + r() * 5) / density)) {
    stamp(pine(Math.round(height * (0.35 + r() * 0.3))), x, 'q');
  }
  // Capa cercana (se pinta encima)
  for (let x = -6; x < width; x += Math.round((6 + r() * 12) / density)) {
    stamp(pine(Math.round(height * (0.6 + r() * 0.4))), x, 'p');
  }
  return grid.map((row) => row.join(''));
}
