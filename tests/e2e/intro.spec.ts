import { expect, test } from '@playwright/test';

// WebGL por software para que la escena PS2 arranque en Chromium sin GPU.
const GL_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

test.use({ launchOptions: { args: GL_ARGS } });

test.describe('intro obligatoria', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('bloquea la página, no ofrece saltarla y se libera al completarla', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/intro-ready/, { timeout: 30_000 });

    // Sin botón de saltar y sin acceso a la cabecera por teclado mientras dura.
    await expect(page.getByRole('button', { name: /saltar intro/i })).toHaveCount(0);
    await expect(page.locator('body > header a').first()).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('[data-intro]')).toBeVisible();

    // Recorrido completo: hasta el final del tramo.
    await page.evaluate(() => {
      const top =
        document.getElementById('hero-title')!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: 'instant' });
    });
    await expect(page.locator('[data-intro]')).toBeHidden({ timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await expect(page.locator('body > header a').first()).not.toHaveAttribute('tabindex', '-1');
  });
});

test.describe('intro con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no existe y el hero queda directo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-intro]')).toBeHidden();
    await expect(page.locator('[data-intro-runway]')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  });
});
