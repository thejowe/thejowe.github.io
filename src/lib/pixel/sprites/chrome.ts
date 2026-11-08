import { rng } from '../../intro/ps2';

/**
 * Sprites de cabecera, pie, navegación, tema y enlaces.
 * Claves de paleta: ver bitmap.ts (a acento, y/w luz, m luna, i tinta, g musgo, p/q pinos).
 */
export const chromeSprites: Record<string, string[]> = {
  /** La luz del bosque: la energía de la marca (7x9) */
  wisp: [
    '...a...',
    '..aya..',
    '.ayyya.',
    '.ayyya.',
    'ayywyya',
    'ayywwya',
    '.ayyya.',
    '..aaa..',
    '...a...',
  ],
  /** Icono del tema Noche: luna creciente (9x9) */
  'icon-moon': [
    '...mmm...',
    '..mmm....',
    '.mmm.....',
    '.mmm.....',
    '.mmm.....',
    '.mmm.....',
    '..mmm...m',
    '...mmmmmm',
    '.....mmm.',
  ],
  /** Icono del tema Amanecer: sol con rayos (9x9) */
  'icon-sun': [
    '....a....',
    '.a.....a.',
    '..aaaaa..',
    '..aaaaa..',
    'a.aaaaa.a',
    '..aaaaa..',
    '..aaaaa..',
    '.a.....a.',
    '....a....',
  ],
  /** Flecha de enlace externo (7x7), toma el color del texto */
  'arrow-ext': ['..aaaaa', '...aaaa', '....aaa', '...a.aa', '..a...a', '.a.....', 'a......'],
  /** Luciérnaga / pixel de energía (3x3) */
  firefly: ['.y.', 'yay', '.y.'],
};

/**
 * Suelo del pie: hierba (con alguna flor de energía) sobre dos filas de tierra.
 * `width` en pixeles de sprite; determinista.
 */
export function groundRows(width: number, seed = 11): string[] {
  const r = rng(seed);
  const tips: string[] = [];
  const blades: string[] = [];
  for (let x = 0; x < width; x++) {
    const v = r();
    const tip = v < 0.1;
    tips.push(tip ? 'g' : v < 0.115 ? 'a' : '.');
    blades.push(tip || v < 0.115 || r() < 0.45 ? 'g' : '.');
  }
  const soil = Array.from({ length: width }, (_, x) => ((x + (x >> 2)) % 3 === 0 ? 'p' : 'q'));
  return [tips.join(''), blades.join(''), soil.join(''), 'p'.repeat(width)];
}
