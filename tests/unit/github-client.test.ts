import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fsMock = vi.hoisted(() => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));
vi.mock('node:fs/promises', () => fsMock);

const apiRepo = {
  name: 'demo',
  html_url: 'https://github.com/thejowe/demo',
  stargazers_count: 1,
  language: 'TypeScript',
  pushed_at: '2026-01-01T00:00:00Z',
  description: null,
  archived: false,
  fork: false,
  private: false,
};

const cachedRepo = {
  name: 'cached',
  url: 'https://github.com/thejowe/cached',
  stars: 0,
  language: null,
  languages: [],
  pushedAt: null,
  description: null,
  archived: false,
  fork: false,
  isPublic: true,
};

const json = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

async function load() {
  vi.resetModules(); // el módulo memoiza la promesa
  return (await import('../../src/lib/github/client')).getGithubSnapshot;
}

beforeEach(() => {
  fsMock.readFile.mockReset();
  fsMock.writeFile.mockReset().mockResolvedValue(undefined);
  fsMock.mkdir.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getGithubSnapshot', () => {
  it('usa la caché vigente sin llamar a la red', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fsMock.readFile.mockResolvedValue(
      JSON.stringify({ fetchedAt: Date.now() - 1000, repos: [cachedRepo] }),
    );
    const snap = await (await load())('thejowe');
    expect(snap.repos.map((r) => r.name)).toEqual(['cached']);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pide a la API sin caché, normaliza y escribe la caché', async () => {
    const fetchMock = vi.fn((url: string) =>
      url.includes('/languages') ? json({ TypeScript: 10 }) : json([apiRepo]),
    );
    vi.stubGlobal('fetch', fetchMock);
    fsMock.readFile.mockRejectedValue(new Error('ENOENT'));
    const snap = await (await load())('thejowe');
    expect(snap.repos).toHaveLength(1);
    expect(snap.repos[0]).toMatchObject({
      name: 'demo',
      languages: ['TypeScript'],
      isPublic: true,
    });
    expect(fsMock.writeFile).toHaveBeenCalledOnce();
  });

  it('descarta repos privados devueltos por la API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        url.includes('/languages')
          ? json({})
          : json([{ ...apiRepo, name: 'secreto', private: true }]),
      ),
    );
    fsMock.readFile.mockRejectedValue(new Error('ENOENT'));
    expect((await (await load())('thejowe')).repos).toEqual([]);
  });

  it('con rate limit (403) y caché caducada devuelve la caché anterior', async () => {
    const fetchMock = vi.fn(() => json({ message: 'rate limit' }, 403));
    vi.stubGlobal('fetch', fetchMock);
    const old = { fetchedAt: Date.now() - 7 * 60 * 60 * 1000, repos: [cachedRepo] };
    fsMock.readFile.mockResolvedValue(JSON.stringify(old));
    const snap = await (await load())('thejowe');
    expect(fetchMock).toHaveBeenCalled(); // la caché caducada sí intenta refrescar
    expect(snap.repos.map((r) => r.name)).toEqual(['cached']);
    expect(fsMock.writeFile).not.toHaveBeenCalled();
  });

  it('con caché caducada y API disponible refresca y reescribe la caché', async () => {
    const fetchMock = vi.fn((url: string) =>
      url.includes('/languages') ? json({ TypeScript: 10 }) : json([apiRepo]),
    );
    vi.stubGlobal('fetch', fetchMock);
    const old = { fetchedAt: Date.now() - 7 * 60 * 60 * 1000, repos: [cachedRepo] };
    fsMock.readFile.mockResolvedValue(JSON.stringify(old));
    const snap = await (await load())('thejowe');
    expect(fetchMock).toHaveBeenCalled();
    expect(snap.repos.map((r) => r.name)).toEqual(['demo']);
    expect(fsMock.writeFile).toHaveBeenCalledOnce();
  });

  it('con fallo de red y sin caché devuelve lista vacía y no lanza', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    fsMock.readFile.mockRejectedValue(new Error('ENOENT'));
    await expect((await load())('thejowe')).resolves.toEqual({ fetchedAt: 0, repos: [] });
  });

  it('ignora entradas corruptas de la caché', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    fsMock.readFile.mockResolvedValue(
      JSON.stringify({ fetchedAt: 1, repos: [cachedRepo, { name: 5 }, null] }),
    );
    const snap = await (await load())('thejowe');
    expect(snap.repos.map((r) => r.name)).toEqual(['cached']);
  });

  it('una caché con JSON inválido se trata como ausente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    fsMock.readFile.mockResolvedValue('{no json');
    expect((await (await load())('thejowe')).repos).toEqual([]);
  });
});
