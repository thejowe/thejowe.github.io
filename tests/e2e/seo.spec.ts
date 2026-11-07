import { expect, test } from '@playwright/test';

const routes = ['/', '/proyectos', '/proyectos/lockin', '/sobre-mi', '/contacto'];

test('title y description son únicos entre páginas', async ({ page }) => {
  const titles: string[] = [];
  const descs: string[] = [];
  for (const route of routes) {
    await page.goto(route);
    titles.push(await page.title());
    descs.push((await page.locator('meta[name="description"]').getAttribute('content')) ?? '');
  }
  expect(new Set(titles).size, `titles: ${titles.join(' | ')}`).toBe(routes.length);
  expect(new Set(descs).size, `descriptions: ${descs.join(' | ')}`).toBe(routes.length);
});

for (const route of routes) {
  test(`${route}: canonical, Open Graph y Twitter card coherentes`, async ({ page }) => {
    await page.goto(route);
    const meta = (sel: string) => page.locator(sel).first().getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/^https:\/\/thejowe\.github\.io\//);
    expect(await meta('meta[property="og:url"]')).toBe(canonical);
    expect(await meta('meta[property="og:title"]')).toBe(await page.title());
    expect(await meta('meta[property="og:description"]')).toBe(
      await meta('meta[name="description"]'),
    );
    expect(await meta('meta[property="og:type"]')).toBe('website');
    expect(await meta('meta[name="twitter:card"]')).toBeTruthy();
    expect(await meta('meta[name="twitter:title"]')).toBe(await page.title());
  });
}

test('JSON-LD Person válido y sin campos nulos inventados', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
  const data = JSON.parse(raw ?? '');
  expect(data['@context']).toBe('https://schema.org');
  expect(data['@type']).toBe('Person');
  expect(data.name).toBeTruthy();
  expect(data.url).toBe('https://thejowe.github.io/');
  expect(data.sameAs).toContain('https://github.com/thejowe');
  for (const v of Object.values(data)) expect(v).not.toBeNull();
});

test('la 404 lleva noindex', async ({ page }) => {
  await page.goto('/no-existe');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('el sitemap lista las rutas principales', async ({ request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  const child = index.match(/<loc>([^<]+)<\/loc>/)?.[1];
  expect(child).toBeTruthy();
  const xml = await (await request.get(new URL(child!).pathname)).text();
  for (const r of ['/proyectos/', '/sobre-mi/', '/contacto/']) expect(xml).toContain(r);
});
