# TODO — visual

> Depende de `arquitecto` (layout) y de **D2** (dirección estética). Mock/dirección aprobada por el usuario antes de pulir detalles.

## Dirección
- [x] [Claude] Proponer 2-3 direcciones — saltado: D2 sin responder, se usa el valor por defecto (editorial minimalista) (moodboard en texto + referencias) y que el usuario elija (D2)
- [x] [Claude] Fijar paleta — Newsreader + JetBrains Mono (woff2 variable latin, `public/fonts/`); papel cálido + terracota. Skill `ui-taste` (claro/oscuro), tipografías (cargar con `font-display: swap`, autoalojadas en `public/fonts/`), escala y espaciado

## Sistema
- [x] [Claude] `src/styles/tokens.css`: color, tipografía, espaciado, radios, sombras, duraciones/curvas de motion
- [x] [Claude] `src/styles/global.css` — cableado en Base.astro (CSS, ThemeInit, ThemeToggle, Footer)
- [x] [Claude] Componentes `src/components/ui/` — + ThemeInit: Button, Card, Tag, NavLink, ThemeToggle

## Secciones
- [x] [Claude] Hero (`src/components/sections/Hero.astro`)
- [x] [Claude] Sección proyectos destacados — `ProjectsFeatured.astro` (lista editorial, recibe `Project[]`) (estilo de las tarjetas de `proyectos`)
- [x] [Claude] «Sobre mí» y contacto — About (slot) y Contact
- [x] [Claude] Footer y 404 — Footer.astro y NotFound.astro (falta que las páginas/Base los usen) con personalidad

## Motion
- [x] [Claude] Entradas y hover sutiles; transiciones entre páginas (`@view-transition` CSS, sin JS; skill `motion-doctrine`: una dirección, sin idle wobble) — **todo** respeta `prefers-reduced-motion`
- [x] [Claude] Sin animación que bloquee LCP — h1 sin animar; solo opacity/transform ni mueva layout (CLS 0)

## Cierre
- [ ] [comprobador] Capturas en 375/768/1440, claro y oscuro, con y sin reduced-motion
- [ ] [Claude] `codex review` del diff antes de commitear

## Hallazgos del comprobador
Comprobado 2026-11-07, commit 87db2ee + cambios sin commitear, build local (`astro preview`), Edge. Evidencia: `tests/artifacts/local/` (capturas `<ruta>-<ancho>-<tema>[-rm].png`, `resultados.json`, `extra-salida.txt`, scripts `run-check.mjs` y `run-extra.mjs`).
- CUMPLE: 6 rutas x 3 anchos x claro/oscuro x con/sin reduced-motion (72 combinaciones): sin scroll horizontal, fuentes e imágenes cargadas, axe (wcag2a/aa/21aa/22aa) 0 violaciones, sin errores de consola en rutas reales (la 404 devuelve 404 esperado).
- CUMPLE: contraste real. Claro: texto 16:1, muted 6.77:1, acento #a8361a 5.91:1. Oscuro: texto 15.07:1, muted 7.24:1, acento #ee8a64 7.48:1. Foco 2px solid, 16:1 / 15:1.
- CUMPLE: sin flash con tema oscuro guardado y sistema claro (html[data-theme=dark] ya presente antes del primer fondo pintado). Toggle persiste y aria-pressed correcto.
- CUMPLE: skip-link primero en el Tab, visible, lleva a #contenido y enfoca `main`. Foco visible en todos los elementos (WCAG 2.4.7).
- NO CUMPLE (menor): `/proyectos` tiene CLS 0.047 a 768 (0.026 a 1440, 0 a 375) y `/proyectos/lockin` 0.02. Origen: `.project-card__meta`/`.project-card__stack` (tarjetas) se desplazan a ~270 ms, probablemente reflujo por swap de fuente. Bajo el umbral de 0.1 pero el objetivo es 0. Sugerencia: `size-adjust`/preload de las fuentes o min-height en la meta. (WCAG no aplica; criterio Core Web Vitals.)
- NO CUMPLE (menor): `/sobre-mi` y `/contacto` no tienen `<h1>` (el título de sección es h2). Criterio WCAG 1.3.1/2.4.6 (buena práctica; axe no lo marca en estas etiquetas).
- Observación: una vez (home, 375, claro) apareció un 404 de recurso en consola; no se reprodujo en otras 71 cargas ni en una carga dedicada de home (0 respuestas >=400). Posible intermitencia del preview; sin causa identificada.
- No comprobable: Lighthouse (no ejecutado; falta Chrome de Playwright, solo Edge), `web-design-guidelines` (requiere fetch externo), revisión de lector de pantalla real.

## Pendiente de arquitecto (fuera de mi alcance)
- `Base.astro`: `import '../styles/global.css'`; `<ThemeInit />` primero en `<head>`; `<ThemeToggle />` en header; usar `<Footer />`.
- Páginas: usar Hero, ProjectsFeatured, About, Contact, NotFound.
- `web-design-guidelines`: no ejecutada (requiere fetch externo); revisar tras cablear.
