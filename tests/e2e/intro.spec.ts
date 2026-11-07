import { expect, test } from '@playwright/test';

test.describe('intro scroll-driven', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('se activa, «Saltar intro» revela el hero y libera el foco', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/intro-ready/);
    await expect(page.locator('[data-scene]')).toHaveAttribute('aria-hidden', 'true');

    await page.getByRole('button', { name: 'Saltar intro' }).click();
    await expect(page.locator('[data-scene]')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await expect(page.locator('main [inert]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ver proyectos' })).toBeVisible();
  });

  test('la cabecera sigue siendo accesible sobre la escena', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/intro-ready/);
    await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
    await expect(page).toHaveURL(/\/proyectos/);
  });
});

test.describe('intro con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no se muestra y el hero queda directo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-intro]')).toBeHidden();
    await expect(page.locator('[data-intro-runway]')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  });
});
