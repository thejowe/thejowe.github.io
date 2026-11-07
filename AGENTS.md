# Portfolio web de GitHub (thejowe)

Antes de tocar código lee `docs/plan/CONCEPTO.md` (qué es el producto) y `docs/plan/PLAN.md` (cómo se reparte el trabajo en bloques). El estado de cada bloque vive en `docs/plan/TODO.md` y `docs/plan/todo/<bloque>.md` — actualízalo según avances.

Este archivo lo lee cualquier agente de código que siga la convención AGENTS.md (Codex incluido); es la fuente de verdad compartida entre herramientas. Lo específico de Claude Code son `.claude/agents/*.md` (subagentes) y `.claude/skills/pilar/` (el comando `/pilar`). Si trabajas con otra herramienta, dale directamente el archivo de bloque correspondiente (p. ej. `.claude/agents/calidad.md` + `docs/plan/todo/calidad.md`) como instrucción explícita.

## Reglas de siempre

- Cada bloque toca **solo sus archivos** (sección «Alcance de archivos» de `PLAN.md`). Si necesitas salir de ahí, para y dilo.
- Sitio **estático**: Astro + TypeScript, sin backend, sin secretos en el cliente. Los datos de GitHub se piden **en build**, nunca desde el navegador del visitante.
- Antes de usar APIs de Astro, lee la doc de la versión instalada (`https://docs.astro.build`) — no escribas de memoria.
- **Skills primero**: si la tarea coincide con una skill de la tabla «Skills obligatorias por bloque» de `PLAN.md` (`astro`, `ui-taste`, `web-design-guidelines`, `accessibility`, `seo-audit`, `motion-doctrine`), úsala. Codex: sin skills, aplica sus criterios leyendo la guía equivalente.
- Accesibilidad (WCAG 2.2 AA), `prefers-reduced-motion` y modo claro/oscuro son requisitos, no extras.
- Nada de acciones hacia fuera (crear repo en GitHub, push, activar Pages, comprar dominio, publicar repos privados) sin confirmación explícita del usuario.
