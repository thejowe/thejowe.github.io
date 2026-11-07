# TODO — calidad

> Incremental: arranca con el scaffold y se completa cuando los demás entregan.

## Herramientas base (tras `arquitecto`)
- [ ] [Codex] ESLint (flat config con plugin astro + typescript) y Prettier; `npm run lint` verde
- [ ] [Codex] `astro check` en CI y como script
- [ ] [Codex] Vitest configurado (`vitest.config.ts`) y primer test trivial verde
- [ ] [Codex] `.github/workflows/ci.yml`: install, lint, check, test, build en cada push/PR

## Tests de lógica (tras `proyectos`)
- [ ] [Codex] Tests del normalizador de la API de GitHub, del filtrado de «otros repos» y de la ordenación
- [ ] [Codex] Test del fallback de caché cuando la API falla / rate limit

## E2E y accesibilidad (tras `visual`)
- [ ] [Claude] Playwright: todas las rutas responden 200, navegación completa por teclado, toggle de tema persiste
- [ ] [Claude] axe en cada ruta y en ambos temas: 0 violaciones serias/críticas
- [ ] [comprobador] Contraste real del texto sobre fondos en claro y oscuro

## SEO y rendimiento
- [ ] [Codex] `title` + `description` únicos por página, Open Graph + Twitter card, imagen OG
- [ ] [Codex] `sitemap.xml` (integración), `src/pages/robots.txt.ts`, JSON-LD `Person`
- [ ] [Claude] Lighthouse CI (`lighthouserc.json`) ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO; falla el CI si baja
- [ ] [Codex] Comprobador de enlaces rotos (internos en CI; externos en tarea programada, no en cada PR)

## Cierre
- [ ] [Claude] `codex review` del diff antes de commitear

## Hallazgos del comprobador
_(vacío)_
