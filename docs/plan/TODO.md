# TODO maestro — Portfolio web

## ▶ Al retomar (2026-11-07): plan creado, código sin empezar

**Estado:** solo existe el plan (`docs/plan/`), los agentes (`.claude/agents/`) y la skill `pilar`. Directorio sin `git init`, sin scaffold, sin repo remoto. Nada publicado.

**Siguiente paso:** lanzar `arquitecto` (bloquea al resto). En paralelo, el usuario puede responder las decisiones abiertas D1-D8 de `PLAN.md` (las que más bloquean: D3 nombre/posicionamiento y D4 repos privados).

**Datos reales:** usuario GitHub `thejowe`, 13 repos (8 públicos, 5 privados). Ver `CONCEPTO.md`.

---

## Tablero por bloque

Marca aquí el resumen; el detalle vive en `docs/plan/todo/<bloque>.md`.

| Bloque | Estado | Casillas | Detalle |
|---|---|---|---|
| arquitecto | hecho salvo `codex review` (sin commit) | 11/12 | [todo/arquitecto.md](todo/arquitecto.md) |
| contenido | bloqueado (D3, D4) | 0/9 | [todo/contenido.md](todo/contenido.md) |
| proyectos | espera a arquitecto | 0/9 | [todo/proyectos.md](todo/proyectos.md) |
| visual | espera a arquitecto (D2) | 0/13 | [todo/visual.md](todo/visual.md) |
| calidad | arranca con scaffold | 0/14 | [todo/calidad.md](todo/calidad.md) |
| publicacion | último; confirmar cada acción | 0/9 | [todo/publicacion.md](todo/publicacion.md) |

## Registro de cambios

- 2026-11-07 — arquitecto: scaffold Astro 7 + layout + rutas shell + contratos `Project`/`site` congelados; build y check en verde. Pendiente `codex review` y commit.
- 2026-11-07 — Plan inicial creado (Claude): CONCEPTO, PLAN, TODO por bloque, 6 agentes + `comprobador`, skill `pilar` del proyecto.
