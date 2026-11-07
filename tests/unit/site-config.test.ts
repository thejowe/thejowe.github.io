import { describe, expect, it } from 'vitest';
import { site } from '../../src/config/site';

describe('site config', () => {
  it('usa una URL de producción sin barra final', () => {
    expect(site.url).toMatch(/^https:\/\/[^/]+$/);
  });

  it('tiene descripción por defecto y enlaces sociales absolutos', () => {
    expect(site.description.length).toBeGreaterThan(20);
    for (const link of site.social) expect(link.url).toMatch(/^https:\/\//);
  });
});
