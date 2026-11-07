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

## Ronda de pulido (2026-11-07)
Skills: `ui-taste`, `motion-doctrine`, `web-design-guidelines` (criterios aplicados leyendo la guía; sin fetch externo). Capturas antes/después en `tests/artifacts/local/ronda2/` (prefijos `a-` antes, `c-` después; script `tests/artifacts/local/shots.mjs`).
- [x] Hallazgo principal: `/proyectos`, `/proyectos/<slug>` y «Otros repositorios» no tenían CSS (HTML en bruto). Nuevo `src/styles/pages.css` (importado desde `global.css`) con el mismo lenguaje editorial que la home: filas con líneas finas, meta en mono, etiquetas, enlace que cubre la tarjeta, detalle con rejilla de metadatos y botones. El detalle sin caso de estudio queda compuesto (migas, título grande, entradilla, metadatos, tecnologías, enlace).
- [x] Hero con carácter: título hasta 9.5rem (`--step-5`), línea de acento antes de `@thejowe`, regla fina y pie en dos columnas (tagline izquierda, botones derecha). h1 sigue sin animar (LCP).
- [x] Cabecera: en móvil marca + toggle en una fila y nav debajo (antes el toggle ocupaba una fila entera); en escritorio rejilla 1fr/auto/1fr con nav realmente centrada. Subrayado del enlace activo/hover como `::after` con `scaleX` pegado al texto (antes flotaba a 44px). `view-transition-name` en la cabecera: no se desvanece al navegar.
- [x] Pie: la línea superior ya no desborda el contenido; alineación vertical centrada.
- [x] Sobre mí / Contacto: dos columnas en >=64rem (título a la izquierda, sticky en Sobre mí), primer párrafo como entrada, espacio h1-contenido (antes 0).
- [x] Lista destacada: títulos a `--step-2`, hover con fondo `--surface` (pseudo-elemento, sin mover layout) y número en acento; nada esencial depende de hover.
- [x] CLS: fuentes fallback con métricas ajustadas (`size-adjust`/`ascent-override`, medidas en navegador) para Newsreader (sobre Georgia) y JetBrains Mono (sobre Courier New). CLS medido 0 en 6 rutas x 3 anchos x 2 temas.
- [x] Render-blocking: `build.inlineStylesheets: 'always'` en `astro.config.mjs` (cambio mínimo fuera de alcance, pedido por el encargo): el CSS (~12 KB) va en línea, sin petición bloqueante. Sin JS nuevo.
- Verificado: axe wcag2a/aa/21aa/22aa 0 violaciones, sin scroll horizontal, lint/format/check/test/e2e(35)/links en verde.
- Pendiente fuera de alcance: el dato `status: 'active'` aparece en inglés en el detalle (datos de `proyectos`/`contenido`). No se ejecutó Lighthouse (sin Chrome de Playwright).

### Hallazgos del comprobador — ronda de pulido (2026-11-07)
Commit 658fba4 + cambios sin commitear, build local (`astro preview`), Edge. Evidencia en `tests/artifacts/local/`: `ronda2-check.txt` (72 combinaciones, `run-check.mjs`), `ronda2-salida.txt`/`ronda2b-salida.txt` (`run-ronda2.mjs`, `run-ronda2b.mjs`), `lhci-salida.txt`, `lhci-numeros.txt`, capturas `estres-*`, `foco-*`, `hover-*`.
- CUMPLE: 6 rutas x 375/768/1440 x claro/oscuro x con/sin reduced-motion: sin scroll horizontal, CLS 0 (ninguna combinación supera 0.001), axe wcag2a/aa/21aa/22aa 0 violaciones, imágenes y fuentes cargadas, 1 h1 por ruta (corrige el hallazgo anterior de h1 y de CLS en /proyectos).
- CUMPLE: Lighthouse (`npx lhci autorun` con Edge, 3 URLs): perf 100, a11y 100, SEO 100, best-practices 96; LCP 0.8 s, CLS 0, TBT <=70 ms. Aserciones >=0.95 en verde.
- CUMPLE: foco en la fila-enlace (WCAG 2.4.7/2.4.11): cabecera `static`, nada fixed/sticky cubre el foco; anillo 2px visible y dentro del viewport en todas las rutas (captura `foco-fila-proyectos-375-light.png`). Salvedad menor: en 1440x700 el último foco (enlace GitHub del pie en `/`) queda a 0.28 px del borde inferior, el anillo se recorta unos px (`foco-ultimo-home-1440.png`); no lo oculta.
- CUMPLE: objetivos (WCAG 2.5.8) todos >=24 px en 6 rutas x 3 anchos.
- CUMPLE: contraste en hover de fila (fondo `--surface`): claro acento 5.50, muted 6.30; oscuro acento 6.93, muted 6.71 (>=4.5).
- CUMPLE: con datos realistas (nombre de 100 caracteres, etiqueta de 30) no hay scroll horizontal a 375 en /proyectos.
- NO CUMPLE (menor): con cadenas sin espacios extremas (nombre/URL ~190 caracteres, etiquetas de 100) hay desbordamiento a 375: /proyectos scrollWidth 838 (título, resumen, `ul.project-card__stack`, `dl.project-card__meta`), y en el detalle `/proyectos/lockin` +229 px con URL larga en `dd`/`p`. Falta `overflow-wrap: anywhere` (o `min-width:0` en los hijos de la rejilla). WCAG 1.4.10 Reflow. Riesgo real bajo (nombres de repo <=100), pero el detalle con URLs es plausible.
- NO CUMPLE (menor): consola con 404 de `/favicon.ico` (no hay `<link rel=icon>` ni archivo en `public/`). Era el 404 intermitente de la ronda anterior (solo la primera carga de Edge lo pide). Resta puntos a best-practices (96). Falta icono (pendiente del responsable de SEO/visual).
- Pendiente del usuario / no comprobable: lector de pantalla real; `web-design-guidelines` sin fetch externo.
