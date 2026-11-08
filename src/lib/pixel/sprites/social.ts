/**
 * Logos de redes en pixel art, generados por código (40x40). Una sola tinta + huecos (`.`) que
 * dejan ver el fondo de la ficha, como las marcas oficiales monocromas.
 */

const SIZE = 40;
/** Las formas por código se piensan en una cuadrícula de 24 y se escalan a SIZE. */
const UNIT = 24 / SIZE;

type Test = (x: number, y: number) => boolean;

const inRect =
  (x0: number, y0: number, x1: number, y1: number): Test =>
  (x, y) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1;

const any =
  (...tests: Test[]): Test =>
  (x, y) =>
    tests.some((t) => t(x, y));

function render(fill: (x: number, y: number) => boolean, key: string): string[] {
  const rows: string[] = [];
  for (let y = 0; y < SIZE; y++) {
    let row = '';
    for (let x = 0; x < SIZE; x++) row += fill((x + 0.5) * UNIT, (y + 0.5) * UNIT) ? key : '.';
    rows.push(row);
  }
  return rows;
}

/**
 * Octocat de cuerpo entero (41x50): rasterizado del arte oficial de GitHub (Octodex) con paleta propia.
 * i = negro del gato (tinta del tema para que se lea en Noche y Amanecer), s = cara, w = blanco de
 * los ojos, r = pupilas, nariz y sonrisa, c = ventosas de la cola. Sin bigotes ni charco.
 */
const GITHUB_ROWS: string[] = [
  '.....ii..........................iii.....',
  '.....iiiii.....................iiiii.....',
  '....iiiiiiii.......iii.......iiiiiii.....',
  '....iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii....',
  '....iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii....',
  '....iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii....',
  '....iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii....',
  '....iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii.....',
  '....iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii....',
  '....iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii...',
  '...iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii...',
  '...iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii..',
  '..iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii..',
  '..iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii..',
  '..iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii.',
  '..iiiiiiiisssssssssssssssssssssiiiiiiiii.',
  '..iiiiiiissssssssssssssssssssssssiiiiiii.',
  '..iiiiiisssswwsssssssssssssswwssssiiiiii.',
  '..iiiiisssswwwwsssssssssssswwwwsssiiiiii.',
  '..iiiiisssswrrrwssssssssssswrrrwsssiiiii.',
  '..iiiiissswrrrrwsssssssssswrrrrwsssiiiii.',
  '..iiiiissswrrrrwsssssssssswrrrrwsssiiii..',
  '..iiiiissswrrrrwsssssssssswrrrrwsssiiii..',
  '...iiiissswrrrrwsssssssssswrrrrwsssiiii..',
  '...iiiisssswrrwsssssssssssswrrwssssiiii..',
  '....iiissssswwssssssrrsssssswwssssiiii...',
  '....iiiissssssssssssssssssssssssssiiii...',
  '.....iiiissssssssssrssrssssssssssiiii....',
  '.......iiiisssssssssrrssssssssssiiii.....',
  '........iiiiiisssssssssssssssiiiii.......',
  'iii........iiiiiiiiiiiiiiiiiiii..........',
  '.iici..........iiiiiiiiiiii..............',
  '..iic..........iiiiiiiiiiii..............',
  'c..iii........iiiiiiiiiiiiii.............',
  '....iii.......iiiiiiiiiiiiii.............',
  '....iiiii...iiiiiiiiiiiiiiiii............',
  '.....iiiiiciciiiiiiiiiiiiiiii............',
  '.....iiiiiiiiiiiiiiiiiiiiiiii............',
  '.......iiiiiiiii.iiiiiiii.iii............',
  '.........iii.iii.iiiiiiii.iii............',
  '.............iii.iiiiiiii.iii............',
  '.............iii.iiiiiiii.iii............',
  '.............iii.iiiiiiii.iii............',
  '.............iii.iiiiiiii.iii............',
  '.............iii.iiiiiiii.iii............',
  '.............iii.iiiiiiii.iii............',
  '............iiii.iii..iii.iiii...........',
  '...........iiii..iii..iii..iiii..........',
  '................iii....iii...............',
  '................i........i...............',
];

function githubRows(): string[] {
  return GITHUB_ROWS;
}

/** Marca de LinkedIn: cuadrado de esquinas cortadas con «in» recortado. */
function linkedinRows(): string[] {
  const tile: Test = (x, y) => {
    const cx = x < 2 || x > 22;
    const cy = y < 2 || y > 22;
    return !(cx && cy);
  };
  const letters = any(
    inRect(4, 4, 7, 7), // punto de la i
    inRect(4, 9, 7, 19), // palo de la i
    inRect(10, 9, 13, 19), // palo de la n
    inRect(13, 9, 20, 12), // arco de la n
    inRect(17, 12, 20, 19), // pata derecha de la n
  );
  return render((x, y) => tile(x, y) && !letters(x, y), 'm');
}

export const socialSprites: Record<string, string[]> = {
  'logo-github': githubRows(),
  'logo-linkedin': linkedinRows(),
};
