/** Sprites de proyectos: iconos de inventario de 12 px de ancho (cofre, mapa, pergamino, gema). */
export const projectSprites: Record<string, string[]> = {
  /** Cofre del tesoro con cerradura ámbar */
  chest: [
    '..kkkkkkkk..',
    '.kaaaaaaaak.',
    'kaaaaaaaaaak',
    'kddddddddddk',
    'kllllyyllllk',
    'kllllyyllllk',
    'kllllkkllllk',
    'kllllllllllk',
    'kddddddddddk',
    '.kkkkkkkkkk.',
  ],
  /** Mapa con ruta y una X de energía */
  map: [
    'kkkkkkkkkkkk',
    'kgggtttttttk',
    'kggttmmmtttk',
    'ktttmttttatk',
    'ktttmtttaaak',
    'ktmmmttttatk',
    'ktttttggtttk',
    'kttttgggggtk',
    'kttttttgggtk',
    'kkkkkkkkkkkk',
  ],
  /** Pergamino con líneas de texto */
  scroll: [
    '.kkkkkkkkkk.',
    'kwwwwwwwwwwk',
    '.kwwwwwwwwk.',
    '.kwkkkkkkwk.',
    '.kwwwwwwwwk.',
    '.kwkkkkkwwk.',
    '.kwwwwwwwwk.',
    '.kwkkkkkkwk.',
    '.kwwwwwwwwk.',
    'kwwwwwwwwwwk',
    '.kkkkkkkkkk.',
  ],
  /** Gema luna */
  gem: [
    '..kkkkkkkk..',
    '.kmmhhhhmmk.',
    'kmmhhmmmmmmk',
    'kmhhmmmmmmdk',
    '.kmmmmmmmdk.',
    '..kmmmmmdk..',
    '...kmmmdk...',
    '....kmdk....',
    '.....kk.....',
  ],
};

/** Icono estable por proyecto (a partir del slug). */
export const projectIconNames = ['chest', 'map', 'scroll', 'gem'] as const;
export function projectIcon(slug: string): (typeof projectIconNames)[number] {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return projectIconNames[h % projectIconNames.length]!;
}
