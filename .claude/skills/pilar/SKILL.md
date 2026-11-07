---
name: pilar
description: Skill de orientación del proyecto Portfolio web (GitHub thejowe). Invócala al retomar el trabajo tras una pausa o para saber qué hacer a continuación. Lee el estado real del repo y de los TODO, resume dónde está el proyecto, decide qué bloque(s) tocan según las dependencias de docs/plan/PLAN.md, y genera las órdenes exactas para lanzar en otras sesiones (formato subagente para Claude Code, instrucción autocontenida para Codex, orden para el agente comprobador).
---

# Pilar — orientación del Portfolio web

Responde en español, conciso: esto es para saber qué hacer ahora, no para releer el histórico. Esta skill **sustituye** a la global `pilar` (que es de LockIn) dentro de este repo.

## 1. Reconstruye el estado real

- Lee `docs/plan/PLAN.md` y `docs/plan/TODO.md`.
- Revisa `docs/plan/todo/*.md` y cuenta casillas marcadas por bloque. Para cada una sin marcar, mira su etiqueta: `[Codex]`, `[Claude]`, `[comprobador]`, o ninguna (bloqueada o sin decidir).
- Una casilla sin marcar puede estar hecha y sin registrar: comprueba si la evidencia que pide ya existe (archivo, test, run verde). Y al revés: **una casilla marcada sin código detrás es la señal de alerta más cara** — dilo.
- Cruza con el repo: `git log --oneline -20`, `git status`, `git branch -a` (si hay `.git`). Comprueba que los archivos de cada bloque («Alcance de archivos» de `PLAN.md`) existen de verdad y no son solo el placeholder del scaffold.
- Antes de dar una rama por superada: `git cherry -v HEAD <rama>`, no el título del commit. Antes de proponer borrar un worktree: `git -C <worktree> status --short`.
- Revisa la tabla «Decisiones abiertas» (D1-D8) de `PLAN.md`: qué sigue sin respuesta y qué bloquea.

## 2. Resume el estado en 4-6 líneas

Bloques terminados, el que está a medias (y en qué punto exacto), los que no han empezado, y cuántas tareas abiertas hay por etiqueta (ej. «quedan 3 `[Codex]` en calidad y 2 `[Claude]` en arquitecto»). Solo lo que cambió desde la última vez.

## 3. Decide qué toca

Aplica las dependencias de `PLAN.md`: `arquitecto` bloquea al resto; `contenido`, `proyectos` y `visual` van en paralelo después; `calidad` es incremental; `publicacion` va el último y exige confirmación del usuario en cada acción hacia fuera. Nunca recomiendes lanzar a la vez dos bloques que toquen los mismos archivos sin avisar del riesgo.

## 4. Genera las órdenes

Separa por etiqueta: `[Claude]`/sin etiqueta que cruza bloques → 4a; `[Codex]` → 4b; `[comprobador]` → 4c. Si hay de varias, dilo y recuerda la regla de `git worktree` de `PLAN.md` si van a correr a la vez.

### 4a. Claude Code

```
Actúa como el agente `<nombre>` definido en .claude/agents/<nombre>.md.
Contexto: <1-2 frases del estado actual específico de este bloque>
Continúa docs/plan/todo/<nombre>.md desde donde está y marca las casillas según avances.
```

Ajusta el «Contexto» a lo que encontraste en el paso 1; no lo dejes genérico.

### 4b. Codex (sin subagentes: instrucción completa, nunca «actúa como el agente X»)

```
Contexto del producto: portfolio web estático (Astro + TypeScript) de GitHub
`thejowe`, publicado en GitHub Pages. Lee docs/plan/CONCEPTO.md y AGENTS.md antes
de nada si no los tienes en contexto.

Tarea: <descripción concreta, adaptada de docs/plan/todo/<bloque>.md>

Alcance de archivos — toca solo esto: <lista explícita>.
Si necesitas tocar algo fuera, para y dilo en vez de improvisar.

Hazlo así: <pasos verificables: comando a correr, patrón de qué archivo existente,
criterio de «terminado»>

Cuando termines: marca la casilla en docs/plan/todo/<bloque>.md (quitando su
etiqueta [Codex]) y anota brevemente qué hiciste.
```

Rellena «Hazlo así» con detalle real (qué archivos existen como referencia, qué patrón siguen los tests vecinos). Una instrucción vaga es el error más caro con Codex.

### 4c. Agente `comprobador`

```
Actúa como el agente `comprobador` definido en .claude/agents/comprobador.md.
Comprueba: <la casilla, citada de docs/plan/todo/<bloque>.md>.
Objetivo: <build local | URL de Pages>. Commit: <HEAD actual>.
```

Del usuario solo quedan: su foto/CV, aprobar el tono del texto, credenciales y confirmar acciones hacia fuera.

## 5. Si algo no cuadra, dilo primero

Un bloque que se salió de su alcance de archivos, conflictos de merge pendientes, un bloque bloqueado por una decisión sin responder (D1-D8), una tarea abierta sin bloquear y sin etiqueta de herramienta, un secreto o repo privado a punto de filtrarse en `dist/`. Dilo antes de proponer órdenes.

## Skills obligatorias

Cada orden de 4a/4c debe nombrar las skills que le tocan según la tabla «Skills obligatorias por bloque» de `PLAN.md` (`astro`, `ui-taste`, `web-design-guidelines`, `accessibility`, `seo-audit`, `motion-doctrine`; `ios-design` no aplica). Ejemplo: «Usa `astro` antes de crear la colección». En el paso 1, si un bloque se marca cerrado sin rastro de las skills que le tocan (auditoría a11y, seo-audit, revisión UI), dilo en el paso 5. A Codex (sin skills) pásale el criterio, no el nombre de la skill.

## Enrutado Claude vs Codex

**A Codex**: tarea acotada y bien definida, independiente (paralelizable), revisión/caza de bugs sobre cambios hechos (`codex review`), mecánica (renombrados, lint, tipos).
**A Claude/subagente**: arquitectura y contratos, diseño y tono (criterio subjetivo), transversal a varias capas, ambigua o que requiere preguntar al usuario, depuración que exige entender el sistema.

Cómo delegar a Codex: prompt autocontenido (objetivo, archivos, criterio de «hecho», restricciones); plugin `codex:codex-rescue` o `codex exec --full-auto "<prompt>"`; `-s read-only` para análisis/revisión; **no** el MCP.

Al recibir su resultado: revisa siempre el diff; si falla dos veces en la misma tarea, hazla tú.

**Regla fija de revisión:** todo agente que escriba código pasa por `codex review` sobre su diff **antes de fusionar o commitear en `main`** (la lanza la sesión que orquesta, `-s read-only`). Excepción: `comprobador`. Hallazgos: corregir o anotar en el `todo/<bloque>.md` antes de cerrar la casilla. Si el autor era Codex, revisa Claude.

**Registro:** al final de cada tarea, una línea: quién la hizo y por qué.

## Notas

Esta skill es de solo lectura + orientación: no escribe código ni marca el TODO por sí misma. Si el usuario pide seguir ya mismo en el bloque que toca, hazlo directamente en esta sesión (las órdenes son para paralelizar en sesiones separadas).
