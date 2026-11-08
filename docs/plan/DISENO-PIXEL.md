# Dirección visual — «Claro del bosque» (pixel art nocturno)

Toda la web comparte el lenguaje de la intro 3D: pixel art estilo PS2, noche de bosque, una única luz cálida (la energía). Es el contrato para quien toque UI.

## Concepto
HUD de videojuego nocturno. Paneles tipo ventana de diálogo, menús con cursor, barras de estado, sprites ASCII y un bosque de pinos pixel. **Lo memorable es la luz ámbar (`--accent`)**: todo lo demás es frío y sobrio. Cada superficie importante tiene un detalle de juego (cursor, corazones, guardado, «game over»), nunca decoración genérica.

## Reglas duras
1. **Unidad pixel `--px`** (4 px escritorio / 3 px móvil). Márgenes, bordes, sombras y tamaños de sprite son múltiplos de `--px`. Sin `border-radius`, sin `blur`, sin degradados lisos (usa bandas duras o tramado `.px-dither`).
2. **Tipografía**: familia propia **Wisp Pixel** (`--font-display`, Regular 400 / Bold 700; respaldo Pixelify Sans). Tamaños SOLO con los tokens `--step-*` (múltiplos de 12 px: 24/36/48/72/96/120; en móvil se reducen solos). Nada de `rem` o `clamp` en `font-size` salvo los tokens. `line-height` múltiplo de 12 px (cuerpo 1.5 × 24 = 36). Etiquetas HUD: `.hud-label` (mayúsculas, `--muted`).
3. **Color solo con tokens** (`tokens.css`). Noche = por defecto; Amanecer = `html[data-theme="light"]`. Contraste AA mínimo en ambos (4.5:1 texto, 3:1 UI/foco). Nunca hex sueltos salvo en sprites ya definidos.
4. **Un solo acento** (`--accent`, ámbar). Musgo (`--moss`) y luna (`--moon`) solo como apoyo en sprites/estados.
5. **Movimiento**: solo `steps()`; transform/opacity; todo detrás de `prefers-reduced-motion: no-preference`. Sin vaivenes ociosos salvo parpadeos de HUD (`.px-caret`, titileo de estrellas). `.rise` existe pero NO en el h1 del hero (LCP).
6. **Accesibilidad**: foco visible (`:focus-visible` global: cuadrado `--focus`), objetivos ≥ 44 px donde sea posible (mín. 24 px), un `h1` por página, landmarks, `aria-current`, sprites decorativos `aria-hidden` (el componente `Sprite` ya lo hace; con `label` son imagen con nombre). El contenido siempre debe ser legible sin hover.
7. **Contenido**: no cambies los textos reales (nombre, tagline, proyectos); solo estructura y presentación. Español, frases directas.
8. **Mobile first**: 375 / 768 / 1440 sin scroll horizontal; cadenas largas rompen (`overflow-wrap: anywhere`).
9. Aislar: cada agente toca solo sus archivos (ver su encargo). Sprites nuevos en su archivo `src/lib/pixel/sprites/<área>.ts`.

## Herramientas ya hechas
- `src/styles/pixel.css`: `.px-box` (panel con esquinas escalonadas + bisel; variantes `--lift`, `--sunk`, `--glow`), `.px-btn` (+ `--ghost`), `.px-dither`, `.px-title`, `.px-caret`, `.hud-label`.
- `src/components/ui/Sprite.astro`: sprites ASCII→SVG (`name` del registro `src/lib/pixel/sprites/` o `rows`), paleta del tema por carácter (`i` ink, `a` accent, `m` moon, `g` moss, `l` line, `h` line-hi, `d` line-lo, `s` surface, `t` surface-2, `b` bg, `r` danger, `p`/`q` pinos, `w` blanco cálido, `y` amarillo, `k` negro; `.` = vacío), `scale`, `fluid`, `label`.
- `src/lib/pixel/forest.ts`: `forestBand(ancho, alto, semilla, densidad)` → filas de pinos para `<Sprite rows=... fluid />`.
- `src/components/ui/Sky.astro` (ya en `Base.astro`): cielo en bandas, estrellas, luna del bosque (absoluta arriba a la derecha del documento: **no pongas texto largo debajo de la luna ni de su halo**).
- Intro 3D: `Intro.astro` va dentro de `Hero.astro`; el hero debe conservar `<section aria-labelledby="hero-title">` con `<h1 id="hero-title">` (la intro lo usa para calcular su recorrido).

## Verificación
Build a un directorio propio y servidor estático propio (no compartas `dist` ni puertos entre agentes), Edge con Playwright, `reducedMotion: 'reduce'` (desactiva la intro) a 375/768/1440 en Noche y Amanecer; axe sin violaciones; sin scroll horizontal; consola limpia.
