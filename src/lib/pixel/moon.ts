import { vnoise } from '../intro/ps2';

/**
 * La luna del bosque de la intro, como sprite: mismo disco crema con cráteres y halo azul en
 * 8 niveles (la textura de 64x64 de la escena 3D). Caracteres: `1`..`8` = niveles de halo,
 * `u` = disco, `v` = cráter claro-oscuro, `x` = cráter profundo.
 */
export const MOON_PALETTE: Record<string, string> = {
  '1': 'rgb(150 190 235 / 0.06)',
  '2': 'rgb(150 190 235 / 0.13)',
  '3': 'rgb(150 190 235 / 0.2)',
  '4': 'rgb(150 190 235 / 0.28)',
  '5': 'rgb(150 190 235 / 0.37)',
  '6': 'rgb(150 190 235 / 0.46)',
  '7': 'rgb(150 190 235 / 0.55)',
  '8': 'rgb(150 190 235 / 0.64)',
  u: 'rgb(238 244 238)',
  v: 'rgb(214 222 214)',
  x: 'rgb(186 194 186)',
};

const SIZE = 64;

export const moonRows: string[] = (() => {
  const rows: string[] = [];
  for (let y = 0; y < SIZE; y++) {
    let row = '';
    for (let x = 0; x < SIZE; x++) {
      const r = Math.hypot(x - 31.5, y - 31.5);
      if (r < 10.5) {
        const cr = vnoise(x / 5, y / 5, 71);
        row += cr > 0.62 ? 'x' : cr < 0.3 ? 'v' : 'u';
      } else {
        const a = Math.pow(Math.max(0, 1 - (r - 10.5) / 21.5), 2.4);
        const q = Math.round(a * 8);
        row += q > 0 ? String(q) : '.';
      }
    }
    rows.push(row);
  }
  return rows;
})();
