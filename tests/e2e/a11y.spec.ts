import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/proyectos', '/proyectos/lockin', '/sobre-mi', '/contacto', '/no-existe'];
const themes = ['light', 'dark'] as const;

for (const theme of themes) {
  test.describe(`axe · tema ${theme}`, () => {
    test.use({ colorScheme: theme });

    for (const route of routes) {
      test(`${route} sin violaciones WCAG 2.x A/AA`, async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const summary = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target.join(' ')),
        }));
        expect(summary).toEqual([]);
      });
    }
  });
}
