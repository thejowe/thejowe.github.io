/**
 * Sprites de las escenas: héroe, sobre mí, contacto y 404.
 * Algunos se calculan con una rejilla (halo, iconos con diagonales) para no contar caracteres a mano.
 */

type Cell = (x: number, y: number) => string;

function grid(w: number, h: number, cell: Cell): string[] {
  return Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => cell(x, y)).join(''),
  );
}

/** Halo de la luz en anillos duros: `y` cerca del núcleo, `a` fuera, borde tramado (damero). */
function haloRows(radius: number): string[] {
  const size = radius * 2 + 1;
  return grid(size, size, (x, y) => {
    const d = Math.hypot(x - radius, y - radius);
    if (d > radius) return '.';
    if (d > radius * 0.78) return (x + y) % 2 === 0 ? 'a' : '.';
    if (d > radius * 0.55) return 'a';
    if (d > radius * 0.32) return (x + y) % 2 === 0 ? 'y' : 'a';
    return 'y';
  });
}

/** Icono de código «</>» en 17x9. */
function codeRows(): string[] {
  const W = 17;
  return grid(W, 9, (x, y) => {
    const e = Math.abs(y - 4); // 4 en los bordes, 0 en el centro
    const left = e; // «<»: la punta a la izquierda en la fila central
    if (x === left || x === left + 1) return 'a';
    const right = W - 1 - e; // «>»
    if (x === right || x === right - 1) return 'a';
    const slash = 10 - Math.floor(y / 2); // «/»
    if (x === slash || x === slash + 1) return 'i';
    return '.';
  });
}

/** Disquete de «punto de guardado» (12x12). */
function floppyRows(): string[] {
  return grid(12, 12, (x, y) => {
    if (x === 11 && y === 0) return '.';
    if (x === 10 && y === 0) return 'k';
    if (x === 11 && y === 1) return 'k';
    if (x === 0 || y === 0 || x === 11 || y === 11) return 'k';
    if (x >= 3 && x <= 8 && y >= 1 && y <= 4) return x >= 6 && x <= 7 && y >= 2 ? 'k' : 'l';
    if (x >= 2 && x <= 9 && y >= 6 && y <= 10) return y === 8 || y === 10 ? 'h' : 'w';
    return 'm';
  });
}

export const sceneSprites: Record<string, string[]> = {
  /** Núcleo de la luz: la energía. */
  wispCore: [
    '...aaa...',
    '..aaaaa..',
    '.aawwwaa.',
    'aawwwwwaa',
    'aawwwwwaa',
    'aawwwwwaa',
    '.aawwwaa.',
    '..aaaaa..',
    '...aaa...',
  ],
  /** Halo en bandas (se pinta con opacidad baja detrás del núcleo). */
  wispHalo: haloRows(15),
  /** Chispa de luz (cruz de 5 px). */
  spark: ['..y..', '..y..', 'yyyyy', '..y..', '..y..'],
  /** Viajero encapuchado con linterna. */
  wanderer: [
    '....llll.......',
    '...llllll......',
    '..llllllll.....',
    '..llkkkkll.....',
    '..lkakkakl.....',
    '..llkkkkll.....',
    '.llllllllll....',
    'lllllmmlllll..d',
    'lllllmmllllldaa',
    'llllmmmmllllldwa',
    'llllmmmmllllldaa',
    '.lllmmmmlll....',
    '.llllllllll....',
    '..kk....kk.....',
    '..kk....kk.....',
  ],
  /** Disquete: punto de guardado. */
  floppy: floppyRows(),
  /** Sobre. */
  mail: [
    'kkkkkkkkkkkkkk',
    'kwwwwwwwwwwwwk',
    'kkwwwwwwwwwwkk',
    'kwkkwwwwwwkkwk',
    'kwwwkkwwkkwwwk',
    'kwwwwwkkwwwwwk',
    'kwwwwwwwwwwwwk',
    'kkkkkkkkkkkkkk',
  ],
  /** Código «</>» (para GitHub). */
  code: codeRows(),
  /** Calavera de «Fin de la partida». */
  skull: [
    '..iiiiiiii..',
    '.iiiiiiiiii.',
    'iiiiiiiiiiii',
    'iikkkiikkkii',
    'iikrkiikrkii',
    'iikkkiikkkii',
    'iiiiikkiiiii',
    '.iiiikkiiii.',
    '..iiiiiiii..',
    '..ikikikik..',
    '..iiiiiiii..',
  ],
  /** Corazón vacío (vida perdida). */
  heartEmpty: ['.ll.ll.', 'l..l..l', 'l.....l', '.l...l.', '..l.l..', '...l...'],
  /** Móvil: icono de la misión «app móvil». */
  questPhone: [
    'kkkkkkkkk',
    'klllllllk',
    'klaaaaalk',
    'klaiiialk',
    'klaiiialk',
    'klaiiialk',
    'klaiiialk',
    'klaiiialk',
    'klaaaaalk',
    'klllllllk',
    'klllllllk',
    'kllkkkllk',
    'klllllllk',
    'kkkkkkkkk',
  ],
};
