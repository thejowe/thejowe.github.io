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

### Hallazgos del comprobador — intro scroll-driven (2026-11-07)

Commit base `ba1907f` + árbol sucio (Hero.astro modificado, Intro.astro sin seguimiento, package.json/lock modificados); build local `npm run build` + `astro preview` :4321. Evidencia: `tests/artifacts/local/intro/` (`salida.txt`, `axe-cls-lcp.txt`, `lhci-numeros.txt`, `montage-{375,768,1440}.png`, capturas `home-<ancho>-pNNN.png`).

1. **BLOQUEANTE: al 100 % el hero NO se ve, queda una pantalla negra.** `.intro` (fixed, z-index 50) tiene `background:#04060b` y al final solo se desvanecen `[data-scene]` y `[data-burst]`; `.intro` sigue `visibility: visible` (medido en 375/768/1440). Se ve un lienzo #04060b en vez del hero (`home-*-p100.png`, `after-skip-1440.png`, `after-skip-375.png`). Los clics sí pasan (pointer-events none, enlaces del hero con hit-test correcto), pero el hero está tapado visualmente. Reproducir: `/`, scroll hasta el top del hero. Arreglo sugerido: al final de la timeline `tl.set(intro, {autoAlpha:0}, 0.95)` o quitar el fondo de `.intro` y dejarlo en `.sky`. Criterio: contenido invisible, WCAG 1.4.1/usabilidad; el punto 1 del encargo («intro visibility hidden al 100 %») no se cumple.
2. **En 768x1024 el recorrido no llega a su final**: `end`=3140 > scroll máximo 3105 (docH 4129 − 1024), así que al fondo `burst` sigue en 0.22 de opacidad. Con el arreglo del punto 1 el hero quedaría semi-tapado por el flash; conviene que el fin del trigger sea `min(heroTop, maxScroll)` o `end: 'max'`.
3. **Orden de tabulación**: «Saltar intro» es el 8.º tab; los 7 anteriores (skip-link, cabecera, etc.) quedan bajo el overlay opaco, con foco invisible (WCAG 2.4.7 y 2.4.11). Sugerido: colocar el botón al principio del DOM/`tabindex` coherente, o inertizar el resto mientras la intro está activa. Con foco en el botón: anillo `2px solid #ffe2ae` visible (`skip-focus-1440.png`): cumple.
4. **Rendimiento Lighthouse en `/` baja**: perf 88 (línea base 100), TBT 470 ms, SI 2.3 s, LCP 0.6 s, CLS 0; a11y 100, SEO 100, BP 100 (base 96). El `lhci autorun` falla la aserción (>=0.95) en `/index.html` por la carga/ejecución de gsap + ScrollTrigger y el pintado de las 5 capas SVG. Sobre-mi/contacto siguen en 100. (Nota: hace falta `CHROME_PATH` al Chromium de Playwright para que lhci arranque aquí.)
5. Skip: Enter y clic llevan a `scrollY`=end (2768 / 2536) y `main#contenido` recibe el foco; tras ello no hay bloqueo de clics, pero se ve el negro del punto 1.

Cumple: bosque nocturno con luz lejana en 0 %; luz crece y capas escalan/desvanecen en 15-90 %; flash cálido cubre todo a ~93 % (burst 0.93); reversible (volver a 0: scene 1, burst 0, `home-*-back0.png`); consola vacía en 375/768/1440; sin scroll horizontal (todas las rutas); axe wcag2a/aa/21aa/22aa 0 violaciones en `/` a scroll 0 y al final, 375 y 1440 (sin aria-hidden-focus); CLS 0, LCP 84-144 ms (PerformanceObserver); reduced-motion: `.intro` y `.runway` display none, sin clase intro-on, hero directo (docH 1147 ≈ sin scroll extra); sin JS: no hay intro (captura `home-375-nojs.png`); /proyectos, /sobre-mi, /contacto sin intro ni scroll horizontal.

Observaciones visuales: siluetas nítidas hasta ~70 %, sin pixelado perceptible; a 90 % las capas muy escaladas muestran bordes escalonados propios del vector (aceptable). En 375 el pasillo central deja ver la luz en todas las fases hasta el flash, pero las capas 1-2 quedan estrechas y los árboles cercanos recortan los lados (correcto). La luz queda ~56 % de altura. Pendiente: no he medido con throttling de CPU ni en dispositivo táctil real.

#### Re-verificación tras arreglos (2026-11-07, build local, árbol sucio, evidencia `tests/artifacts/local/intro/r2-*`, `salida-r2.txt`, `perf-trace.txt`)

- Cumple: al 100 % se ve el hero en 375/768/1440 (`r2-montage-100.png`); 768x1024 llega a burst 0 con end=3105 (=scroll máx.); «Saltar intro» es el 1.er Tab con anillo visible; tras Enter/clic el hero se ve, 0 elementos `inert` y el enlace de cabecera es clicable; reversible (al volver a 0: scene 1, burst 0); consola vacía; axe 0 violaciones a scroll 0 y al final (375/1440); CLS 0, LCP 112-204 ms.
- Matiz: en 768 al 90 % el burst ya vale 0.0096 (empieza antes de 93 %, esperado por la timeline).
- Causa del perf 88 (TBT 470 ms): **evaluación/arranque del bundle de gsap + ScrollTrigger** (`e.enable` ≈170 ms de self-time a 4x CPU en una sola tarea larga a ~55 ms tras la navegación; resto `ss`, `init`, `refresh` < 35 ms). Con el bundle bloqueado TBT 0-14 ms, FCP 250-300 ms. Quitar el `ScrollTrigger.refresh` de `document.fonts.ready` apenas cambia (TBT 214-219 vs 231-309 ms): no es la causa. Rasterizado de SVG no aparece como tarea larga. Idea: no importar gsap de forma estática; `import()` dinámico tras `requestIdleCallback`/`load` (el overlay ya se pinta por CSS y hay red de seguridad de 8 s), o dividir el chunk.

#### Re-verificación 3 tras import() dinámico de gsap (2026-11-07, build local, árbol sucio; `tests/artifacts/local/intro/r3-*`, `lhci-*-r3*`, `lhci-variantes-r3.txt`)

- Funcional: cumple. Capturas 0/70/100 % en 375 y 1440 (`r3-montage.png`), 768 llega al final, hero visible al 100 %, reversible, «Saltar intro» 1.er Tab con anillo, tras saltar el enlace de cabecera `/proyectos` navega (`http://localhost:4321/proyectos`), 0 `inert`, reduced-motion sin intro (display none, sin scroll extra), consola vacía, axe 0 (375/1440, scroll 0 y final), CLS 0, LCP 92-148 ms.
- Lighthouse `/` : perf 69-73, TBT 1,6-3,1 s (antes con gsap estático: 88 / 470 ms; línea base 100). a11y 100, SEO 100, BP 100, LCP 0,6-0,7 s, CLS 0. /sobre-mi y /contacto 100.
- NO lo causa la intro: la misma regresión aparece (a) con la copia de `dist` sin ningún script ni DOM de intro (TBT 1,6 s), (b) con `.intro{display:none}`, (c) construyendo `HEAD` (ba1907f, sin Intro.astro): TBT 1,7-2,2 s. Es una tarea larga de 1,6-2,6 s «Unattributable» (no es JS) a ~700 ms en `/`. La línea base de 100 es de las 10:16, anterior al commit ba1907f / edición de `index.astro` de las 10:50; la causa no está aislada (en local a 4x CPU el layout es 108 ms; solo reproduce en Lighthouse). Pendiente: bisecar contenido de la home (p. ej. quitar la sección Proyecto/ cambios de ba1907f) o comprobar si es ruido del entorno.
- El import() dinámico sí quita el coste de gsap del arranque (trace local 4x: TBT 61-81 ms frente a 231-309 ms).

## Intro scroll-driven (2026-11-07)
- [x] [Claude] `src/components/sections/Intro.astro` (montada desde `Hero.astro`): bosque nocturno, luz que se acerca, flash cálido y reveal del hero. gsap + ScrollTrigger (carga diferida tras `load`), overlay `fixed` + runway de 300svh, `gsap.matchMedia()` (reduce → sin intro). Skills: `gsap-core`, `gsap-scrolltrigger`, `animate`, `motion-doctrine`, `astro`.
- [x] `codex review` del diff: 6 hallazgos, corregidos: cabecera accesible sobre la escena, contenido cubierto con `inert`, salto «Saltar intro» instantáneo (`behavior: 'instant'`), burst oculto en CSS, fallback de 8 s terminal, e2e adaptados (`reducedMotion` en el bloque de teclado + `tests/e2e/intro.spec.ts`).
- Fuera de alcance tocado: `package.json`/lock (dependencia `gsap`) y `tests/e2e/` (adaptación a la intro).
- Pendiente: perf de Lighthouse en `/` (69-73) NO es de la intro (reproduce en `ba1907f` sin ella); sin aislar. Ventana previa a la carga de gsap: la rueda no mueve la escena y cabecera/contenido aún no están `inert`.

## Hallazgos del comprobador — intro 3D PS2 (2026-11-07)

Commit base `abda2db` + árbol sin commitear (Intro.astro, `src/lib/intro/*`, package.json/lock, playwright.config.ts, tests/e2e/intro.spec.ts). Build local (`npm run build`) servido con un servidor estático de `dist` en :4330 (el `astro preview` ya ocupaba :4321). Chromium con `--use-gl=angle --use-angle=swiftshader` (WebGL por CPU: fps y TBT son pesimistas frente a una GPU real). Evidencia: `tests/artifacts/local/intro/final/` (`salida-visual.txt`, `salida-func.txt`, `salida-perf.txt`, `salida-lighthouse.txt`, `montage-{375,768,1440}.png`, `home-<ancho>-pNNN.png`, `trace-x{1,4}.json`, scripts `run-*.mjs`).

**Cumple**
- Capturas a 0/20/40/60/78/86/90/93/96/100 % en 375x667, 768x1024 y 1440x900: bosque nocturno con luna, camino y luciérnagas; manos en primera persona; la luz aparece a ~40 %, se acerca (60 %), la mano la toca (78-86 %), estalla en partículas cuadradas (90 %), fundido crema a 93 % y hero real a 100 %. Al 100 % `.intro` queda `visibility:hidden` y no hay lienzo negro/blanco residual. Las manos no salen de cuadro ni se rompen en vertical (375 y 768); en 78-86 % la mano izquierda se alza y el antebrazo sale por el borde inferior-izquierdo, correcto. En 768 el recorrido llega al final (`end`=4334).
- Obligatoriedad: no existe «Saltar intro» (0 coincidencias). Durante la intro hay 12 `tabindex=-1` y 8 Tab seguidos no dejan el foco en nada (queda en BODY, scrollY 0). Al completarla solo queda `main` (su `tabindex=-1` original) y el Tab recorre skip-link, nombre del sitio y menú. Scroll completa la intro con rueda, Space (6 pulsaciones), PageDown (7), flechas (98) y End (2).
- Reversible: tras volver arriba con rueda, `scrollY`=0, intro visible/opacidad 1, 12 `tabindex=-1` otra vez, sin saltos (captura `reverse-top-1440.png`, `home-*-back0.png`). Scroll previo a `intro-ready` (4x CPU): la posición se conserva y la escena se sincroniza sin salto.
- Reduced-motion: sin intro (`.intro` display none, clase vacía, docH 1147 ≈ viewport + contenido, hero a 224-242 px). Sin JS: igual. Sin WebGL (`--disable-gpu --disable-3d-apis`): la intro se abandona en <300 ms, hero directo, primer Tab = skip-link, no hay atrapamiento.
- Axe wcag2a/aa/21aa/22aa: 0 violaciones en `/` con intro activa (inicio) y al final, a 375 y 1440. CLS 0. LCP 80-232 ms. Sin scroll horizontal en las 3 anchuras. Consola sin errores con WebGL; /proyectos, /proyectos/lockin, /sobre-mi y /contacto sin intro, sin canvas, sin errores, sin scroll horizontal.
- Rendimiento en scroll (6 s continuos, rAF, WebGL por CPU): 375 → 58 fps medios, p95 16,8 ms; 1440 → 41 fps, p95 66,7 ms (32 frames >50 ms) sólo por el raster por software del canvas a 1440. Sin trabajo de layout apreciable.

**Hallazgos**
1. **Lighthouse de `/` sigue bajo y ahora sí lo causa la intro (arranque de la escena).** Móvil x3: perf 66/67/67 (a11y/BP/SEO 100), FCP 0,8 s, LCP 0,8 s, TBT 3,9-4,5 s, SI 4,6-5,3 s, CLS 0, peso 820 KiB; escritorio perf 75 (TBT 580 ms). `/sobre-mi`: 100 (TBT 20 ms). La referencia previa (69-73, TBT 1,6-3,1 s) se medía sin WebGL; ahora la tarea más larga es la creación de la escena (2,3-2,8 s a 4x CPU con rasterizador por software, más tareas de 0,5-1 s después). Con GPU real será menor pero no está medido. Reproducir: `tests/artifacts/local/intro/final/run-lh.mjs`. Mitigación sugerida: crear la escena por fases (geometría/texturas en varios `await` con `scheduler.yield()`/`requestIdleCallback`), compilar shaders con `renderer.compileAsync`, reducir `forest.ts` (1486 líneas) en el primer frame.
2. **Coste de arrancar three (trace, 412x823)**: a 1x CPU long tasks 57+105+168 ms (≈180 ms bloqueando; `FunctionCall scene.*.js` 167 ms; `intro-ready` a 468 ms); a 4x: 5 long tasks (282, 52, 105, 406, 301 ms; ≈900 ms bloqueando; `FunctionCall` 295 ms; `intro-ready` a ~1,96 s). Archivos: `trace-x1.json`, `trace-x4.json`, `salida-perf.txt`.
3. **Peso**: 818 KB sin comprimir en la home; `scene.*.js` (three) 558 KB (138 KB gzip), `Intro…js` 117 KB (gsap), forest 25 KB, fuentes 98 KB. La home pasa de ~113 KiB (sobre-mi) a 820 KiB. Aceptable si el servidor comprime, pero es 7x el resto del sitio.
4. **Consola con WebGL bloqueado**: three escribe 3 `console.error` («THREE.WebGLRenderer: A WebGL context could not be created…») antes de abandonar. La página funciona, pero ensucia la consola. Sugerencia: comprobar `canvas.getContext('webgl2')` en un `try` antes de crear el `WebGLRenderer`.
5. **Pantalla oscura mientras carga la escena**: hasta `intro-ready` solo se ve el fondo `#0a1620` con «Desplaza» (captura `early-250ms-1440.png`); a 4x CPU son ~2 s sin hero ni escena (ya vigente con la red de seguridad de 15 s). Si la escena tarda, el LCP depende de ese bloque. Sugerencia: pintar un fotograma estático/degradado de bosque por CSS.
6. **Ventana previa a `intro-ready`**: la rueda mueve la página (probado: scrollY 1500 antes de estar lista) porque el runway ya existe; no hay salto al arrancar, pero ya vale 12 `tabindex=-1` (el bloqueo es coherente). Menor.
7. Menor: «Desplaza» a 1440 mide ~13 px de mono con baja jerarquía sobre el camino (legible; WCAG 1.4.3 no aplica, es decorativo y `aria-hidden`).
8. Menor visual: a 78-90 % aparecen pequeños glifos blancos sueltos (setas/partículas) en el borde izquierdo en 375/768 (`home-375-p086.png`), no parecen errores.

Pendiente del usuario/dispositivo real: fps y TBT con GPU y CPU móvil reales (aquí solo WebGL por software); prueba táctil real del scroll.

## Intro 3D PS2 obligatoria (2026-11-07)
- [x] [Claude] Rehecha como escena WebGL (three.js, `src/lib/intro/`): render a baja resolución, snapping de vértices, dither, bosque, manos en primera persona, luz y explosión. Obligatoria (sin «Saltar intro»; cabecera/pie/contenido fuera del Tab y los clics tragados por la escena mientras dura). Excepciones: reduced-motion, sin JS, sin WebGL, o escena que no carga en 15 s.
- [x] `codex review` (2 rondas): hallazgos corregidos (timeout terminal, skip-link al hero, clics tapados, no cargar three con reduced-motion, detección de WebGL previa).
- Skills y agentes: `impeccable`, `design-taste-frontend`, `emil-design-eng`, `apple-design`, `high-end-visual-design`, `animation-vocabulary`, `motion-advanced`, `ui-taste`, `gsap-*`, `animate`, `motion-doctrine`; agentes de bosque, manos y luz en paralelo; `comprobador` verificó (ver hallazgos arriba).
- Fuera de alcance tocado: `package.json`/lock (`gsap`, `three`), `playwright.config.ts` (reduced-motion por defecto en e2e), `tests/e2e/`, `lighthouserc.json`.
- DECISIÓN (usuario, opción 1): la home asume un rendimiento Lighthouse menor por el peso de three (~560 KB) y su arranque; `lighthouserc.json` exige ≥ 0.55 solo en `/` (resto ≥ 0.95). Pendiente: medir fps/TBT en dispositivo real.
