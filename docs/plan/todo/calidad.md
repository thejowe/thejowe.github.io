# TODO — calidad

> Incremental: arranca con el scaffold y se completa cuando los demás entregan.

## Herramientas base (tras `arquitecto`)
- [ ] [Codex] ESLint (flat config con plugin astro + typescript) y Prettier; `npm run lint` verde — configurado; falla por ThemeInit.astro (ver Hallazgos) y Prettier pendiente de `format` en archivos de otros bloques
- [x] [Codex] `astro check` en CI y como script — `npm run check`: 0 errores, 0 avisos (37 archivos)
- [x] [Codex] Vitest configurado (`vitest.config.ts`) y primer test trivial verde — `npm test`: 2 passed
- [x] [Codex] `.github/workflows/ci.yml`: install, lint, check, test, build en cada push/PR (lint, format:check, check, test, build; aún no ejecutado en GitHub)

## Tests de lógica (tras `proyectos`)
- [ ] [Codex] Tests del normalizador de la API de GitHub, del filtrado de «otros repos» y de la ordenación
- [ ] [Codex] Test del fallback de caché cuando la API falla / rate limit

## E2E y accesibilidad (tras `visual`)
- [ ] [Claude] Playwright: todas las rutas responden 200, navegación completa por teclado, toggle de tema persiste
- [ ] [Claude] axe en cada ruta y en ambos temas: 0 violaciones serias/críticas
- [ ] [comprobador] Contraste real del texto sobre fondos en claro y oscuro

## SEO y rendimiento
- [ ] [Codex] `title` + `description` únicos por página, Open Graph + Twitter card, imagen OG
- [ ] [Codex] `sitemap.xml` (integración, ya en astro.config), `src/pages/robots.txt.ts` (hecho; test e2e pendiente de ejecutar), JSON-LD `Person` (pendiente: va en Base.astro, de `arquitecto`/`visual`)
- [ ] [Claude] Lighthouse CI (`lighthouserc.json`) ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO; falla el CI si baja
- [ ] [Codex] Comprobador de enlaces rotos (internos en CI; externos en tarea programada, no en cada PR)

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
