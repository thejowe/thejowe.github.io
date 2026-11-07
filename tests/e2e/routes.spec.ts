import { expect, test } from '@playwright/test';

const routes = ['/', '/sobre-mi', '/contacto'];

for (const route of routes) {
  test(`${route} responde 200 y tiene title y description`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/.+/);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect((desc ?? '').length).toBeGreaterThan(20);
    await expect(page.locator('main#contenido')).toBeVisible();
  });
}

test('la ruta inexistente sirve la 404', async ({ page }) => {
  const res = await page.goto('/no-existe');
  expect(res?.status()).toBe(404);
});

test('robots.txt apunta al sitemap y el sitemap existe', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap: https://thejowe.github.io/sitemap-index.xml');
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
});

test('el skip-link es el primer elemento enfocable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
});
