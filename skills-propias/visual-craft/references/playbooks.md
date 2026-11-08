# Recetas (playbooks)

Contenido: 1 Intro/animación de scroll · 2 Escena 3D estilo PS2 · 3 Sistema de UI pixel art · 4 Tipografía bitmap propia · 5 Sprites ASCII · 6 Fondos y paletas · 7 Otras estéticas.

---

## 1. Intro / animación guiada por scroll (GSAP + ScrollTrigger)

**Arquitectura**
- `<div class="runway">` (espaciador en flujo, 260–420 svh) + `<div class="intro">` `position:fixed; inset:0; z-index` alto, `aria-hidden` en lo decorativo. Una sola `gsap.timeline({ paused:true, defaults:{ease:'none'}, scrollTrigger:{ trigger: runway, start: 0, end: () => Math.min(heroTop(), ScrollTrigger.maxScroll(window)), scrub: 1, invalidateOnRefresh: true } })`. Posición en la timeline = progreso 0..1.
- Constantes de fase compartidas (`T = { walkStart, walkEnd, reachStart, reachEnd, touch, flashEnd, fadeStart }`) en un módulo que todos importan.
- `gsap.matchMedia()`: `(prefers-reduced-motion: no-preference)` crea todo y devuelve limpieza; con `reduce` la intro no existe (CSS `display:none` por defecto, se activa con `html.intro-on` puesto por un script en línea).
- El contenido real está en el DOM desde el principio (no oculto a lectores de pantalla).
- Fases típicas: 0–.04 quieto · .04–.78 avance · .6–.86 gesto · .88 contacto · .88–.93 blanco sube (fundido, ≥300 ms de scrub) · .95–1 se disipa y revela.
- Fin de una sola pasada: `onScrubComplete` con `progress ≥ 0.999` → retirar escena/runway/bloqueos, `scrollBy(shift)` para compensar, marcar `finished`.
- Cue de "Desplaza" con estado "Cargando" mientras llega la escena.

**Si es obligatoria**: sin botón de saltar; salidas para reduced-motion, sin JS, sin WebGL y plazo de carga (animación CSS de abandono a los 15 s + temporizador JS que libera foco y mata el trigger). Bloqueo de lo tapado con `tabindex=-1` + `blur` y restauración al terminar; overlay `pointer-events:auto` para tragar clics.

**Movimiento**: solo transform/opacity/filter; sin flashes >3/s; el blanco es un fundido; `will-change` solo en capas animadas.

---

## 2. Escena 3D estilo PlayStation 2 (three.js)

Estructura (`src/lib/intro/`): `types.ts` (fases `T`, interfaces `IntroPath`/`IntroModule {group, update(p,dt), dispose()}`), `path.ts` (sendero + posición de la luz), `gait.ts` (paso compartido cámara/manos), `ps2.ts` (render y materiales), `scene.ts` (orquesta; render bajo demanda con rAF solo si cambia el progreso), módulos `forest.ts`, `hands.ts`, `wisp.ts`.

**Look PS2 (`ps2.ts`)**
- Render a baja resolución: `WebGLRenderTarget` ≈ 240 px de alto (ancho por aspecto) con `NearestFilter`; pasada final a pantalla con **dither Bayer 4×4** y color de 5 bits por canal, viñeta ligera y mezcla a blanco cálido `uFlash`. Canvas CSS 100% con `image-rendering: pixelated`.
- **Vértices cuantizados** a la rejilla de píxeles (`gl_Position.xy = floor(ndc*res/2+.5)/(res/2)`), parche vía `onBeforeCompile` sobre `MeshBasicMaterial`/`PointsMaterial` (`#include <project_vertex>`); iluminación **por vértice** (color horneado + luz cálida de la luz dinámica por distancia en el mismo parche).
- Texturas procedurales de 32–64 px (`CanvasTexture`, nearest, sin mipmaps), niebla `FogExp2` corta, color de vértice con sombras de copa horneadas.
- Sprites/Points aditivos con `fog:false, depthWrite:false`; texturas radiales con bandas escalonadas (no degradado liso).
- Manos/objetos de primer plano: `depthTest:false` + `renderOrder` alto (como el arma de un FPS); `SkinnedMesh` con ~15 huesos por mano, pose función pura de `p`; **corrección analítica** para que la punta del dedo coincida con el objetivo en espacio de cámara (`HANDS_TOUCH`).
- Todo determinista respecto a `p`: sin tiempo, sin acumulación, reversible. Sin vaivenes ociosos.
- Presupuesto orientativo: ≤ 40 draw calls, ≤ 120k triángulos, creación < 400 ms, three diferido (≈560 KB / 138 KB gzip).

**Bosque (entorno)**: terreno segmentado con relieve que se aplana a lo largo del sendero; árboles `InstancedMesh` (pinos, copa irregular, secos), sotobosque con quads cruzados `alphaTest`, rocas, troncos, setas; cielo (cúpula, estrellas estáticas, **luna** = disco crema con cráteres + halo azul en 8 niveles); niebla baja y haces lunares sutiles. Evita elementos de color ajeno a la paleta.

**Cámara**: balanceo de pasos con `abs(sin(fase))` (un paso cada ~0.75 m), mirada que se inclina hacia la luz según el progreso, empujón final hacia el objetivo. Tamaño de la luz = tamaño físico + perspectiva con mínimo de 1–2 px.

---

## 3. Sistema de UI pixel art

- **Unidad `--px`** (4 px escritorio / 3 px móvil) y todo en múltiplos. Sin `border-radius`, sin blur, sin degradados lisos (bandas duras o tramado).
- **Primitivas** (`pixel.css`): `.px-box` (borde con esquinas escalonadas por `box-shadow` + bisel inset; variantes `--lift`, `--sunk`, `--glow`), `.px-btn` (cara plana + borde oscuro + sombra dura que se hunde al pulsar; `--ghost`), `.px-dither`, `.px-title` (sombra escalonada), `.px-caret` (cursor parpadeante con `steps`), `.hud-label`.
- **Cielo/fondo** (`Sky`): bandas duras, estrellas como baldosa SVG data-URI con titileo por `steps`, luna del bosque como sprite absoluto en el documento (no fija, para no quedar bajo texto largo).
- **Componentes con concepto de juego**: cabecera = HUD con menú de cursor ▶; héroe = diálogo con caret y luz con halo en bandas; proyectos = registro de misiones/inventario con corazones, estrellas, barra de bloques; sobre mí = ficha de personaje; contacto = punto de guardado; 404 = "fin de la partida / continuar"; pie = banda de pinos + suelo + luciérnagas.
- **Temas**: noche por defecto + amanecer; variables en `:root` y `:root[data-theme='light']`; mismo lenguaje en ambos; contrastes calculados.
- **Motion**: `steps()` solamente, tras `prefers-reduced-motion: no-preference`.

---

## 4. Tipografía bitmap propia (cuando ninguna existente encaja)

- Fuente de verdad: arte ASCII (`#` = píxel, `.` = vacío) en `scripts/pixel-font/glyphs.mjs`; `build.mjs` genera contornos poligonales fusionados (sin costuras) con `opentype.js` y comprime a woff2 con `wawoff2` (`npm run build:font`, reproducible: fija timestamps).
- Métricas: 1 píxel = 100 unidades, UPM 1200 (em = 12 px), mayúsculas 8, x-height 6, descendentes 2, ascent ≥ 11 (para tildes sobre mayúsculas), `USE_TYPO_METRICS`. Avance = ancho + 1 px; espacio = 4 px. Bold = ensanchado 1 px por fila con retoques manuales.
- Cobertura: Basic Latin, acentos y ñ, ¿¡«»·©ºª×çß, tipográficos (– — … comillas •) y símbolos HUD (▶ ◀ ▲ ▼ ★ ♥ ✓ ✕ → ← ↑ ↓ ↗).
- Uso: **tamaños múltiplos de 12 px** (24/36/48/72/96); `line-height` 1.5 en cuerpo; `letter-spacing:0`; `font-kerning:none`; `text-rendering:optimizeSpeed`; `font-synthesis:none`; evita `scale()` no entero. Verifica con un espécimen capturado en 24/36/48/96 y mide que solo hay 2 colores de píxel.
- Cuerpo a 24 px ≈ 28 caracteres por línea en móvil de 375: aceptable para textos cortos; dilo al usuario.

---

## 5. Sprites ASCII → SVG

- Cada fila = cadena; cada carácter = color de la paleta del tema (`i` tinta, `a` acento, `m` luna, `g` musgo, `l/h/d` línea/alta/baja, `s/t` superficies, `b` fondo, `r` peligro, `p/q` pinos, `w/y/k` fijos). `.` = vacío.
- Conversión: runs horizontales → un `<path>` por color, `shape-rendering="crispEdges"`, tamaño = columnas × `--px` × `scale`. Sin imágenes raster.
- Generadores procedurales deterministas (semilla) para pinos, suelo, estrellas; registro por áreas para que los agentes no se pisen.
- Para reproducir algo de otra escena (p. ej. la luna), porta el algoritmo de la textura al generador de filas.

---

## 6. Fondos y paletas

- Cielos en bandas duras con 4–6 tonos; estrellas como baldosas; nada de degradados lisos si la estética es pixel.
- Paleta: 4–6 hex con nombre, un único acento, el resto neutro; calcula contrastes con `scripts/contrast.mjs` y ajusta los bordes de UI a ≥3:1.
- Noche/amanecer como pareja coherente (mismos roles, valores distintos).

---

## 7. Otras estéticas (cuando la idea no es pixel art)

Elige por la idea, no por costumbre, y consulta la skill correspondiente:
- Editorial / lujo → `high-end-visual-design`, `design-taste-frontend` (tipografía de carácter, rejilla asimétrica, grano fijo).
- Minimal → `minimalist-ui`. Brutalista → `industrial-brutalist-ui` si está instalada. Cristal/Apple → `apple-design` (materiales honestos, no pegatinas).
- Móvil/gestos/física → `apple-design`, `ecc:motion-advanced`.
- Scroll con pin/horizontal/apilado → `gsap-scrolltrigger` + esqueletos de `design-taste-frontend` §5.
Siempre: concepto único, tokens, contraste, reduced-motion, verificación con capturas.
