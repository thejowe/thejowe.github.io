import { expect, test } from '@playwright/test';

test.describe('contacto: redes con logo pixel art', () => {
  test('GitHub y LinkedIn son enlaces con nombre accesible que abren su página', async ({
    page,
  }) => {
    await page.goto('/contacto');
    const redes = page.getByRole('list', { name: 'Redes' });
    const github = redes.getByRole('link', { name: /^GitHub/ });
    const linkedin = redes.getByRole('link', { name: /^LinkedIn/ });

    await expect(github).toHaveAttribute('href', /^https:\/\/github\.com\//);
    await expect(linkedin).toHaveAttribute('href', /^https:\/\/www\.linkedin\.com\/in\//);
    for (const link of [github, linkedin]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
      // El logo es un sprite SVG decorativo: el nombre sale del texto oculto
      await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
      const box = await link.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
