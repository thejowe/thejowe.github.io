# Lecciones aprendidas (errores reales y su solución)

## Herramientas y entorno
- **Heredocs con comillas en Bash** fallaron en Windows (`unexpected EOF`). Escribe archivos con la herramienta Write y usa Python/Node para ediciones por patrón; para texto con tildes usa UTF-8 explícito.
- **`prettier --write` sobre carpetas en edición** pisa el trabajo de agentes concurrentes. Formatea solo tus archivos o espera.
- **Dev servers**: Astro no permite dos `astro dev` en el mismo proyecto, y `astro preview` ajeno en :4321 sirve un build viejo (Playwright lo reutiliza → tests con lógica antigua). Cada agente: `astro build --outDir <propio>` + servidor estático propio en puerto alto (4361…). Antes de los e2e, reconstruye `dist` y comprueba qué escucha en 4321.
- **Cerrar procesos** de otros requiere permiso explícito del usuario: pídelo en lugar de forzarlo.
- **Playwright en `describe`**: `test.use({ launchOptions })` debe ir a nivel de archivo (si no, error "forces a new worker").
- **WebGL en headless**: lanza Edge/Chromium con `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Es WebGL por software: fps y TBT salen pesimistas; dilo en el informe.
- **Lighthouse local**: `CHROME_PATH` al navegador disponible (Edge en Windows). Con `staticDistDir` las URLs son `/index.html`; para exigir distintos umbrales por página usa `assertMatrix` con patrón `^https?://[^/]+/index\.html$` (el patrón `.*/index.html` casaría con todas).
- **`sleep` largo** está bloqueado: usa tareas en segundo plano y espera la notificación, o `Monitor`.

## Diseño y producto
- El usuario rechaza "UI genérica": un solo concepto fuerte, lenguaje coherente en TODA la web, no solo en la pieza estrella.
- Las animaciones deben respetar la **escala del usuario**: si pide "menos scroll", acorta recorrido y distancia a la vez (tiempo-en-pantalla = scroll). Mide en pantallas de scroll, no en intuición.
- **Tamaño de elementos en perspectiva**: usa tamaño físico + perspectiva natural (con mínimo de 1-2 px) para que algo lejano se vea pequeño y crezca al acercarse; el tamaño angular constante se ve "pegado".
- **Lo que está arriba/abajo** se decide en 3D con altura de mundo y mirada de cámara; ajusta alcance de manos/objetos para que el contacto coincida (comprueba numéricamente).
- Elementos sueltos de color ajeno a la paleta (p. ej. luciérnagas lima) se ven como errores: la paleta manda.
- La luna/elementos de fondo no deben quedar bajo texto largo; los paneles llevan fondo sólido y el contraste no debe depender del fondo.

## Animación de scroll
- Una sola timeline padre con ScrollTrigger (nunca en tweens hijos); `scrub: 1`; progreso 0→1 como contrato compartido (`T` con fases).
- **Overlay `position:fixed` + espaciador ("runway")** en lugar de `pin:true` cuando el contenedor tiene ancho limitado o hay cabecera previa; el fin del recorrido = top del contenido real (o `maxScroll` si es menor).
- El suavizado del scrub comprime el flash si se salta de golpe: sube el blanco gradualmente y, si se salta (botón/enlace), pon el progreso final con `tl.progress(1)` tras `scrollTo({behavior:'instant'})` (CSS `scroll-behavior:smooth` global lo estropea).
- Cuando la animación es de una sola pasada: al terminar (usa `onScrubComplete` y progreso ≥ 0.999) retira escena, espaciador y bloqueos y **compensa el scroll** (`scrollBy(shift)`) para que el contenido no salte; subir ya no la reactiva.
- Si es **obligatoria**: sin botón de saltar, pero con salidas para movimiento reducido, sin JS, sin WebGL y plazo de carga (15 s) → abandona. Bloquea interacción con lo tapado (overlay `pointer-events:auto` que traga clics; `tabindex=-1` en focusables tapados, `blur` del activo; restaura al terminar); el skip-link debe llevar al contenido tras la intro (preventDefault + scroll al final).
- Si el usuario cambia `prefers-reduced-motion` en vivo, `gsap.matchMedia()` debe recrear/revertir; no descargues la escena si hay movimiento reducido.
- Carga diferida: `load` + `requestIdleCallback`; detecta WebGL con un canvas temporal ANTES de importar three (evita errores de consola y descarga inútil); cede el hilo entre fases de creación.

## Rendimiento / calidad
- three.js añade ~560 KB (138 KB gzip) y un arranque de cientos de ms: el Lighthouse de la página baja; avísalo, mide y ofrece opciones (relajar umbral solo en esa ruta / aligerar / cargar solo con interacción).
- Verifica CLS con fuentes de respaldo de métricas ajustadas (`size-adjust`, `ascent-override`).
- Lighthouse "Unattributable long task" pudo ser previo a los cambios: compara contra un build del commit anterior antes de culpar a tu feature.

## Proceso con agentes
- Un agente por área con archivos disjuntos y contrato escrito; cuéntales qué hacen los otros.
- Lee sus informes con escepticismo: pide capturas y revísalas tú. Corrige con `SendMessage` concreto (qué se ve mal, dónde, qué esperas).
- Los agentes "no pueden tocar" archivos fuera de su alcance: si necesitan algo, lo piden en el informe.
- Cuando un cambio sale del alcance del bloque (dependencias, configs, tests), anótalo en el TODO/informe.
- La revisión de código independiente encuentra fallos reales (timeouts, foco, clics tapados, descargas innecesarias): hazla siempre antes de commit.

## Sistema de UI pixel art / fuentes (segunda ronda)
- **Git Bash convierte `/ruta` en rutas de disco** (`C:/.../Git/ruta`) al pasarla como argumento a node. Usa `MSYS_NO_PATHCONV=1`, rutas del script en formato `C:/...`, o rutas sin barra (`home`, `proyectos`). `scripts/shots.mjs` ya las repara.
- **Los scripts de la skill resuelven paquetes desde su propia carpeta**: importa Playwright desde el `cwd` del proyecto (`createRequire(cwd/package.json)`), no con `import` estático.
- **Un `*/` dentro de un comentario `/** */` lo cierra** (p. ej. "surface*/line"). Evita comodines con barra en comentarios de bloque.
- **Fuente propia pixel**: pide al tipógrafo glifos mínimos con `j`, `i`, `l`, `g` revisados en palabras reales del proyecto ("thejowe"): un ancho de 4 px en la `j` dejó un hueco visible. Verifica con el texto real a 48 y 96 px.
- **Texto largo en botones móviles** (emails): `<wbr>` tras la `@`, `overflow-wrap: break-word` y `flex-wrap: wrap` en el botón; evita `anywhere` que rompe en cualquier letra.
- **Elementos fijos que tapan decoración** (luna bajo la cabecera en 375 px): en móvil, baja y reduce el elemento (`transform: scale(.5)` con origen arriba-derecha) en vez de ocultarlo.
- **Temas**: si la estética es de noche, la noche es el defecto y NO sigue `prefers-color-scheme`; el modo claro sigue existiendo (amanecer) por accesibilidad/requisito. Adapta tests e2e y el JS del toggle a ese defecto.
- **`lint`/`format` y carpetas de terceros** (skills empaquetadas, vendor): añádelas a `.prettierignore` y a `ignores` de ESLint.
- **Directorio global de la skill vs copia versionada**: la local en `~/.claude/skills` y la copia del repo pueden divergir; tras cambiar una, sincroniza la otra.
