import { describe, expect, it } from 'vitest';
import { normalizeRepo, otherRepos, statsFor } from '../../src/lib/github/normalize';
import type { ApiRepo, RepoStats } from '../../src/lib/github/types';

const api = (over: Partial<ApiRepo> = {}): ApiRepo => ({
  name: 'demo',
  html_url: 'https://github.com/thejowe/demo',
  stargazers_count: 3,
  language: 'TypeScript',
  pushed_at: '2026-01-02T00:00:00Z',
  description: 'Un repo',
  archived: false,
  fork: false,
  private: false,
  ...over,
});

const repo = (name: string, over: Partial<RepoStats> = {}): RepoStats => ({
  ...normalizeRepo(api({ name, html_url: `https://github.com/thejowe/${name}` })),
  ...over,
});

describe('normalizeRepo', () => {
  it('mapea los campos de la API', () => {
    expect(normalizeRepo(api(), { TypeScript: 100, CSS: 300, HTML: 200 })).toEqual({
      name: 'demo',
      url: 'https://github.com/thejowe/demo',
      stars: 3,
      language: 'TypeScript',
      languages: ['CSS', 'HTML', 'TypeScript'],
      pushedAt: '2026-01-02T00:00:00Z',
      description: 'Un repo',
      archived: false,
      fork: false,
      isPublic: true,
    });
  });

  it('tolera nulos y ausencias', () => {
    const r = normalizeRepo(
      api({
        language: null,
        pushed_at: null,
        description: null,
        stargazers_count: undefined as unknown as number,
      }),
    );
    expect(r).toMatchObject({
      stars: 0,
      language: null,
      languages: [],
      pushedAt: null,
      description: null,
    });
  });

  it('marca privados, forks y archivados', () => {
    const r = normalizeRepo(api({ private: true, fork: true, archived: true }));
    expect(r).toMatchObject({ isPublic: false, fork: true, archived: true });
  });
});

describe('statsFor', () => {
  const list = [repo('LockIn'), repo('ninjex')];
  it('busca sin distinguir mayúsculas', () => {
    expect(statsFor(list, 'lockin')?.name).toBe('LockIn');
  });
  it('devuelve undefined si no hay nombre o no existe', () => {
    expect(statsFor(list, undefined)).toBeUndefined();
    expect(statsFor(list, 'otro')).toBeUndefined();
  });
});

describe('otherRepos', () => {
  const list = [
    repo('viejo', { pushedAt: '2024-01-01T00:00:00Z' }),
    repo('nuevo', { pushedAt: '2026-05-01T00:00:00Z' }),
    repo('sin-fecha', { pushedAt: null }),
    repo('curado', { pushedAt: '2026-06-01T00:00:00Z' }),
    repo('excluido'),
    repo('fork', { fork: true }),
    repo('archivado', { archived: true }),
    repo('privado', { isPublic: false }),
  ];

  it('filtra privados, forks, archivados, curados y excluidos (sin distinguir mayúsculas)', () => {
    const names = otherRepos(list, ['Curado', undefined], ['EXCLUIDO']).map((r) => r.name);
    expect(names).toEqual(['nuevo', 'viejo', 'sin-fecha']);
  });

  it('ordena por push más reciente primero', () => {
    const names = otherRepos(list, [], ['excluido']).map((r) => r.name);
    expect(names).toEqual(['curado', 'nuevo', 'viejo', 'sin-fecha']);
  });

  it('no muta la entrada', () => {
    const copy = [...list];
    otherRepos(list, []);
    expect(list).toEqual(copy);
  });
});
