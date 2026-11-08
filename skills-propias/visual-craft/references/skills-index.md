# Índice de skills incluidas

Todas están copiadas en `references/skills/<nombre>.md`. Si la herramienta `Skill` tiene la versión instalada, úsala por nombre; si no, lee el archivo. Las sub-referencias clave están en `references/impeccable/`, `references/ui-taste/` y `references/motion-doctrine/`.

| Skill | Cuándo | Para qué |
|---|---|---|
| `impeccable` | Siempre en piezas completas | Modos (persuadir/operar/leer/experiencia), "la brief manda", refine vs redesign, comandos (shape, craft, polish, critique, audit, animate, bolder, delight, overdrive…). Sub-refs: `references/impeccable/*.md` (`new-work`, `craft-floor` antes de editar UI) |
| `design-taste-frontend` | Landing, portfolio, redesign | Lectura del brief, diales (variance/motion/density), anti-patrones de IA, esqueletos de ScrollTrigger (pila pegajosa, pan horizontal), checklist previo a entregar |
| `ui-taste` | Nuevo diseño, rediseño, pulido | Investigación de referencias, "imagen primero", anti-slop craft, auditoría. Sub-refs: `references/ui-taste/*.md` |
| `high-end-visual-design` | Look de agencia premium | Doble bisel, botones con icono anidado, ritmo espacial, coreografía de movimiento, guardarraíles de rendimiento |
| `frontend-design` | Siempre que haya diseño de web | Plan de tokens, autocrítica contra defaults de IA, restraint |
| `frontend-design-direction` | Dirección según dominio | Propósito/audiencia/tono/detalle memorable, anti-patrones |
| `redesign-existing-projects` | Rediseño de webs existentes | Auditoría y orden de prioridades (fuente → color → estados → layout → componentes) |
| `design-system` | Generar/auditar sistema de diseño | Tokens, auditoría visual de 10 dimensiones, detección de "AI slop" |
| `stitch-design-taste`, `minimalist-ui` | Estéticas concretas (semántica Stitch / minimal editorial) | Reglas propias de cada una |
| `animate` | Construir cualquier animación | Puerta "¿debe animarse?", propósito, herramienta mínima, propiedades, curvas y duraciones, interrupción, reduced-motion, lista "Never ship" |
| `emil-design-eng` | Pulido de interacción | Detalle invisible, springs, clip-path, rendimiento de animación, checklist de revisión |
| `apple-design` | Gestos, física, materiales | Respuesta, manipulación directa, springs (amortiguamiento/respuesta), velocidad, proyección de momentum, consistencia espacial, tipografía |
| `animation-vocabulary` | Nombrar efectos | Glosario preciso (stagger, morph, parallax, rubber-banding…) |
| `find-animation-opportunities`, `improve-animations` | Auditar movimiento existente | Dónde animar y qué corregir |
| `motion-doctrine` | Cualquier secuencia | Ley del vector entre escenas, corriente, trayectos, portadores, causalidad, sin balanceo ocioso, quietud antes del clímax |
| `ecc:motion-foundations`, `motion-patterns`, `motion-advanced` | UI con Motion (React) | Tokens, patrones estándar, drag/gestos/texto/SVG |
| `gsap-core`, `gsap-scrolltrigger` | Animación por timeline y scroll | API, matchMedia, scrub, pin, containerAnimation, refresh, no-hacer |
| `astro` | Proyectos Astro | Estructura, config, comandos |
| `accessibility` | Siempre antes de entregar | WCAG 2.2: foco, teclado, contraste, objetivos, movimiento; flujo de auditoría con evidencia |
| `web-design-guidelines` | Al cerrar cada sección | Auditar contra las Web Interface Guidelines (requiere red para traer la lista; si no hay red, aplica los criterios de `accessibility` y `ui-taste`) |

## Combinaciones recomendadas

- **Intro/animación de scroll**: impeccable, ui-taste, animate, motion-doctrine, gsap-core, gsap-scrolltrigger, emil-design-eng, apple-design, animation-vocabulary, accessibility (+ astro).
- **Sistema de UI / web completa**: impeccable, design-taste-frontend, ui-taste, high-end-visual-design, frontend-design(-direction), redesign-existing-projects, design-system, emil-design-eng, apple-design, accessibility, web-design-guidelines.
- **Ajuste de movimiento**: animate, emil-design-eng, motion-doctrine, improve-animations.
- **Auditoría**: ui-taste (audit), impeccable (audit/critique), accessibility, web-design-guidelines, design-system (slop).
