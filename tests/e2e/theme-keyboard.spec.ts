import { expect, test, type Page } from '@playwright/test';

const toggle = (page: Page) => page.locator('[data-theme-toggle]').first();

test.describe('tema', () => {
  test.use({ colorScheme: 'light' });

  test('el toggle cambia el tema, actualiza aria-pressed y persiste en localStorage', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');

    await toggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');

    await toggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
  });

  test('el tema persiste al navegar a otra página', async ({ page }) => {
    await page.goto('/');
    await toggle(page).click();
    await page.getByRole('link', { name: 'Contacto' }).first().click();
    await expect(page).toHaveURL(/\/contacto/);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('con tema guardado no hay flash: ya está aplicado cuando se parsea <body>', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      const w = window as unknown as { __themeAtBody?: string | null };
      const obs = new MutationObserver(() => {
        if (document.body && w.__themeAtBody === undefined) {
          w.__themeAtBody = document.documentElement.dataset.theme ?? null;
          obs.disconnect();
        }
      });
      obs.observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    const atBody = await page.evaluate(
      () => (window as unknown as { __themeAtBody?: string | null }).__themeAtBody,
    );
    expect(atBody).toBe('dark');
  });

  test('un valor inválido en localStorage se ignora', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'rosa'));
    await page.goto('/');
    expect(await page.locator('html').getAttribute('data-theme')).toBeNull();
  });
});

test.describe('teclado', () => {
  test('el toggle se activa con Enter y Espacio', async ({ page }) => {
    await page.goto('/');
    await toggle(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('todos los enlaces y controles son alcanzables con Tab y muestran foco visible', async ({
    page,
  }) => {
    await page.goto('/');
    const total = await page
      .locator('a[href], button, input, select, textarea, [tabindex="0"]')
      .evaluateAll(
        (els) =>
          els.filter((el) => {
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return (
              (r.width > 0 && r.height > 0 && s.visibility !== 'hidden') || el.matches('.skip-link')
            );
          }).length,
      );
    expect(total).toBeGreaterThan(3);

    for (let i = 0; i < total + 2; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        el.setAttribute('data-seen', '');
        const s = getComputedStyle(el);
        const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
        const shadow = s.boxShadow !== 'none';
        return {
          key: `${el.tagName}|${el.getAttribute('href') ?? el.getAttribute('aria-label') ?? el.textContent?.trim()}`,
          visible: outline || shadow,
        };
      });
      if (!info) continue;
      expect(info.visible, `sin indicador de foco en ${info.key}`).toBe(true);
    }
    expect(await page.locator('[data-seen]').count()).toBe(total);
  });

  test('el skip-link lleva el foco al contenido principal', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('main#contenido')).toBeFocused();
  });

  test('la navegación principal funciona solo con teclado', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sobre mí' }).first().focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/sobre-mi/);
    await expect(page.getByRole('link', { name: 'Sobre mí' }).first()).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
