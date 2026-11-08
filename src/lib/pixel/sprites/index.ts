/**
 * Registro de sprites pixel art (cada carácter = un color de la paleta, ver bitmap.ts).
 * Cada área aporta los suyos en su propio archivo para no pisarse:
 *   chrome.ts  → cabecera, pie, nav, tema, enlaces
 *   scenes.ts  → héroe, sobre mí, contacto, 404
 *   projects.ts → proyectos
 */
import { chromeSprites } from './chrome';
import { projectSprites } from './projects';
import { sceneSprites } from './scenes';

export const baseSprites: Record<string, string[]> = {
  /** Cursor de menú estilo juego */
  cursor: [
    'a......',
    'aa.....',
    'aaa....',
    'aaaa...',
    'aaaaa..',
    'aaaa...',
    'aaa....',
    'aa.....',
    'a......',
  ],
  heart: ['.aa.aa.', 'aaaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'],
  star: ['...y...', '...y...', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.', 'yy...yy'],
};

export const sprites: Record<string, string[]> = {
  ...baseSprites,
  ...chromeSprites,
  ...sceneSprites,
  ...projectSprites,
};
