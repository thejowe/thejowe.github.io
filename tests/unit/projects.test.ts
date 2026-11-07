import { describe, expect, it } from 'vitest';
import {
  byOrder,
  getBySlug,
  getFeatured,
  getNonFeatured,
  projects,
  repoName,
  sortByYearDesc,
} from '../../src/data/projects';
import type { Project } from '../../src/types/project';

const p = (slug: string, over: Partial<Project> = {}): Project => ({
  slug,
  title: slug,
  summary: 's',
  role: 'r',
  stack: [],
  visibility: 'public',
  featured: true,
  order: 1,
  year: 2025,
  status: 'active',
  ...over,
});

describe('ordenación', () => {
  it('byOrder: order asc, luego año desc, luego slug', () => {
    const list = [
      p('c', { order: 2 }),
      p('b', { order: 1, year: 2024 }),
      p('a', { order: 1, year: 2026 }),
      p('d', { order: 1, year: 2024 }),
    ];
    expect([...list].sort(byOrder).map((x) => x.slug)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('sortByYearDesc ordena por año y no muta', () => {
    const list = [p('a', { year: 2023 }), p('b', { year: 2026 })];
    expect(sortByYearDesc(list).map((x) => x.slug)).toEqual(['b', 'a']);
    expect(list.map((x) => x.slug)).toEqual(['a', 'b']);
  });
});

describe('filtros', () => {
  const list = [p('a', { featured: false, order: 2 }), p('b'), p('c', { featured: false })];
  it('separa destacados y no destacados', () => {
    expect(getFeatured(list).map((x) => x.slug)).toEqual(['b']);
    expect(getNonFeatured(list).map((x) => x.slug)).toEqual(['c', 'a']);
  });
  it('getBySlug', () => {
    expect(getBySlug('b', list)?.slug).toBe('b');
    expect(getBySlug('zzz', list)).toBeUndefined();
  });
});

describe('repoName', () => {
  it('extrae el nombre en minúsculas', () => {
    expect(repoName(p('x', { repo: 'https://github.com/thejowe/LockIn' }))).toBe('lockin');
    expect(repoName(p('x', { repo: 'https://github.com/thejowe/app?tab=1' }))).toBe('app');
  });
  it('undefined sin repo o con URL ajena', () => {
    expect(repoName(p('x'))).toBeUndefined();
    expect(repoName(p('x', { repo: 'https://example.com/a/b' }))).toBeUndefined();
  });
});

describe('datos curados', () => {
  it('slugs únicos y válidos', () => {
    const slugs = projects.map((x) => x.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });
  it('un private-showcase nunca enlaza su repo', () => {
    for (const x of projects) {
      if (x.visibility === 'private-showcase') expect(x.repo).toBeUndefined();
    }
  });
});
