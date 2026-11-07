# TODO — calidad

> Incremental: arranca con el scaffold y se completa cuando los demás entregan.

## Herramientas base (tras `arquitecto`)
- [x] [Codex] ESLint (flat config con plugin astro + typescript) y Prettier — `npm run lint` y `npm run format:check` verdes (2026-11-07)
- [x] [Codex] `astro check` en CI y como script — `npm run check`: 0 errores, 0 avisos (37 archivos)
- [x] [Codex] Vitest configurado (`vitest.config.ts`) y primer test trivial verde — `npm test`: 2 passed
- [x] [Codex] `.github/workflows/ci.yml`: install, lint, check, test, build en cada push/PR (lint, format:check, check, test, build; aún no ejecutado en GitHub)

## Tests de lógica (tras `proyectos`)
- [x] [Codex] Tests del normalizador, del filtrado de «otros repos» y de la ordenación — `tests/unit/normalize.test.ts`, `projects.test.ts`; `npm test`: 4 archivos, 25 passed
- [x] [Codex] Test del fallback de caché (403 + caché caducada, red caída sin caché, caché corrupta, privados descartados) — `tests/unit/github-client.test.ts` con fetch/fs mockeados

## E2E y accesibilidad (tras `visual`)
- [x] [Claude] Playwright: rutas 200, teclado (Tab/foco visible/skip-link/Enter/Espacio), toggle persiste y sin flash — `routes.spec.ts`, `theme-keyboard.spec.ts`; `npm run test:e2e`: 35 passed
- [x] [Claude] axe (wcag2a/2aa/21a/21aa/22aa) en `/`, `/proyectos`, `/proyectos/lockin`, `/sobre-mi`, `/contacto`, 404, claro y oscuro: 0 violaciones — `tests/e2e/a11y.spec.ts` (12 tests verdes). Auditoría manual WCAG 2.2 de la skill `accessibility` pendiente de pasada visual (axe no cubre target size, foco oculto, etc.)
- [ ] [comprobador] Contraste real del texto sobre fondos en claro y oscuro

## SEO y rendimiento
- [~] [Codex] `title` + `description` únicos (test e2e verde), Open Graph + Twitter card + canonical coherentes (verde, `seo.spec.ts`). Imagen OG: no hay imagen real en `public/img` (vacío); omitida a propósito. Twitter card = `summary`
- [x] [Codex] `sitemap-index.xml`/`sitemap-0.xml` y `robots.txt` verificados por e2e; JSON-LD `Person` en `Base.astro` (name = `site.name ?? githubUser`, omite email/tagline nulos, `sameAs` de `site.social`), validado por e2e
- [ ] [Claude] Lighthouse CI (`lighthouserc.json`) ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO; falla el CI si baja
- [~] [Codex] Enlaces internos: `npm run test:links` (`tests/links/check-internal-links.mjs`, también anclas) en CI tras build — `OK: 106 referencias internas en 10 páginas`. Externos en tarea programada: pendiente (workflow cron no escrito)

## Cierre
- [ ] [Claude] `codex review` del diff antes de commitear

## Hallazgos del comprobador
_(vacío)_

## Hallazgos de calidad (para otros bloques)
- `visual`: `src/components/ui/ThemeInit.astro` rompe `npm run lint` (`no-var`, `catch (e)` sin usar, bloque vacío). Usar `let`/`const` y `catch {}` con comentario.
- `visual`/`proyectos`: 19 archivos de `src/` no pasan `prettier --check`; ejecutar `npm run format` al cerrar cada bloque (CI tiene `format:check`).
- `arquitecto`/`visual`: `Base.astro` no emite Open Graph, Twitter card, imagen OG ni JSON-LD `Person`; fuera de mi alcance. Pendiente de decidir quién lo añade.
- Hecho: `lighthouserc.json` escrito (umbral 0.95 en las 4 categorías) pero sin ejecutar ni en CI hasta que `visual` cierre; casilla sin marcar.
- Hecho: reglas a11y activas con `eslint-plugin-jsx-a11y-x` (compatible con ESLint 10); verificado: detecta `<img>` sin `alt`. (Codex P2-1)
- Hecho: CI con `permissions: contents: read`, E2E con Playwright y job de Lighthouse CI. (Codex P2-2)
- Medido en local (Edge, Windows, 2026-11-07): Lighthouse performance 0.92-0.93 (<0.95) por TBT ~350 ms, probable ruido de la máquina; a11y/SEO/best-practices pasan. Umbral intacto; confirmar en el runner de CI.
- Hecho (2026-11-07): `Base.astro` (autorizado solo para SEO) emite Open Graph, Twitter card y JSON-LD `Person`. Hallazgo: en la 404 (`noindex`) el canonical apuntaba a `/404/`, que no existe (lo cazó `test:links`); ahora canonical y `og:url` se omiten con `noindex`.
- Pendiente de seo-audit: sin imagen OG, sin `og:image`/`twitter:image` (tarjeta `summary` sin imagen). Cuando exista una imagen 1200x630 en `public/img`, añadirla y pasar a `summary_large_image`.
- Pendiente: `name`/`tagline`/`email` en `site.ts` son `null`; el JSON-LD usa el handle `thejowe` como `name` hasta que haya nombre real.
