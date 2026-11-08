/**
 * Logos de redes en pixel art, generados por código (24x24). Una sola tinta + huecos (`.`) que
 * dejan ver el fondo de la ficha, como las marcas oficiales monocromas.
 */

const SIZE = 24;

type Test = (x: number, y: number) => boolean;

const inEllipse =
  (cx: number, cy: number, rx: number, ry: number): Test =>
  (x, y) =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

const inRect =
  (x0: number, y0: number, x1: number, y1: number): Test =>
  (x, y) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1;

/** Triángulo (signo de áreas) */
const inTri =
  (a: [number, number], b: [number, number], c: [number, number]): Test =>
  (x, y) => {
    const s = (p: [number, number], q: [number, number]) =>
      (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1]);
    const d1 = s(a, b);
    const d2 = s(b, c);
    const d3 = s(c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };

const any =
  (...tests: Test[]): Test =>
  (x, y) =>
    tests.some((t) => t(x, y));

function render(fill: (x: number, y: number) => boolean, key: string): string[] {
  const rows: string[] = [];
  for (let y = 0; y < SIZE; y++) {
    let row = '';
    for (let x = 0; x < SIZE; x++) row += fill(x + 0.5, y + 0.5) ? key : '.';
    rows.push(row);
  }
  return rows;
}

/** Marca de GitHub: disco de tinta con la silueta del gato recortada. */
function githubRows(): string[] {
  const disc = inEllipse(12, 12, 11.9, 11.9);
  const cat = any(
    inEllipse(12, 10, 5.6, 4.6), // cabeza
    inTri([6.5, 2.6], [6.5, 7.6], [11, 6]), // oreja izquierda
    inTri([17.5, 2.6], [17.5, 7.6], [13, 6]), // oreja derecha
    inEllipse(12, 16, 5.8, 4.6), // cuerpo
    inEllipse(18.4, 17, 2, 3.4), // cola
    inRect(8.5, 19, 10.5, 22), // pata izquierda
    inRect(13.5, 19, 15.5, 22), // pata derecha
  );
  return render((x, y) => disc(x, y) && !cat(x, y), 'i');
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
