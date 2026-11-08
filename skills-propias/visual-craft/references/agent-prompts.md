# Plantillas de prompts para agentes

Rellena los `<…>`. Pásalos con la herramienta `Agent` (tipo `claude`/general con todas las herramientas), `run_in_background: true`. Cada prompt debe ser autosuficiente: el agente no ve esta conversación.

## Bloque común (pégalo al principio de cada prompt)

```
Proyecto en <ruta>. Estamos creando <qué> con estética <concepto en una frase>.
LEE PRIMERO: <docs/DISENO-...md (contrato obligatorio)>, <tokens/estilos>, <tipos/contratos>, <archivos de tu área>.
Antes de diseñar invoca con la herramienta Skill (o, si no están instaladas, lee references/skills/<nombre>.md de la skill visual-craft): <lista de skills relevantes para esta área> y aplica su exigencia: nada genérico, muy currado, personalidad propia.
TU ÚNICO ALCANCE (puedes editar solo): <archivos>. NO toques: <archivos de otros agentes y cimientos>. Si necesitas algo fuera, dilo en el informe.
```

## Bloque de verificación (al final de cada prompt)

```
VERIFICACIÓN OBLIGATORIA: build con outDir PROPIO (`npx astro build --outDir tests/artifacts/local/dist-<área>`) y servidor estático propio en el puerto <43xx> (los otros usan <...>). Playwright con Edge (`chromium.launch({channel:'msedge'})`; para WebGL añade args `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`), viewports 375/768/1440, <temas>, `reducedMotion:'reduce'` cuando quieras desactivar la intro. Guarda capturas en tests/artifacts/local/<área>/ y REVÍSALAS con la herramienta Read. Itera máx. 3 rondas por lotes. Comprueba consola limpia, sin scroll horizontal y axe (@axe-core/playwright). Al final: typecheck, lint, prettier --write SOLO sobre tus archivos. Sin commit ni push. Informe breve en español: qué construiste, decisiones, métricas, rutas de capturas clave, límites conocidos y qué deben saber los demás agentes.
```

## Especialistas típicos

**Entorno 3D**: terreno, vegetación, cielo, niebla; presupuesto draw calls/triángulos/tiempo; despejar sendero; centro-bajo libre para manos y luz; sin elementos de color ajeno a la paleta. Skills: ui-taste, design-taste-frontend, impeccable, animate.

**Personaje / manos / objetos de primer plano**: rig por huesos, poses = f(p), sincronía con la marcha (`gait`), coincidencia numérica del contacto, encuadre en vertical y horizontal, depthTest off + renderOrder. Skills: animate, emil-design-eng, apple-design, animation-vocabulary, impeccable.

**Luz y efectos**: halo en bandas, motas, anticipación antes del clímax, explosión reversible = f(u), luz del entorno por vértice; el blanco global lo hace el post-proceso. Skills: animate, motion-doctrine, emil-design-eng, impeccable.

**Tipógrafo**: especificación de métricas (UPM 1200, píxel 100, cap 8, x 6, desc 2, ascent ≥ 11), glifos mínimos, script de build reproducible, espécimen verificado con capturas, informe con tamaños recomendados. Solo puede tocar `scripts/<fuente>/`, `public/fonts/` y devDependencies.

**UI chrome** (cabecera, nav, tema, botones, etiquetas, pie, favicon): menú con cursor, toggle de tema con persistencia y sin flash, objetivos ≥44 px, skip-link, adaptar tests de tema. Skills: impeccable, design-taste-frontend, high-end-visual-design, emil-design-eng, apple-design, ui-taste, frontend-design, accessibility, web-design-guidelines.

**Secciones** (héroe, destacados, sobre mí, contacto, 404): un concepto de juego por sección, contenido real intacto, anclas y ids que usen otros módulos (`#hero-title`, `#proyectos`), luna del fondo libre de texto.

**Páginas de datos** (listas/detalle de proyectos): HUD con datos reales (nada inventado), un solo enlace principal por tarjeta, estado vacío, cadenas largas sin desbordar, `h1` único.

**Verificador en navegador** (tras integrar): rutas × 375/768/1440 × temas × (con/sin movimiento reducido, sin JS, sin WebGL) · capturas por fases de la animación · teclado (Tab, Space/PageDown/flechas/End) · consola · axe · CLS/LCP · Lighthouse (`CHROME_PATH` a Edge) comparado con la referencia · fps de scroll · peso transferido · long tasks al arrancar. Solo informa y anota hallazgos en el TODO del proyecto; no toca código de producto.

## Correcciones posteriores

No relances: usa `SendMessage` al mismo agente con hechos concretos ("en p=0.4 hay placas grises sobre la luna: son los haces de luz; acórtalos"), una ronda por lote, y pide confirmación con capturas.
