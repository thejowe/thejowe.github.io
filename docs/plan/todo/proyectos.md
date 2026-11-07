# TODO — proyectos

> Depende de `arquitecto` (tipo `Project`). Nunca llamar a la API desde el navegador ni meter un token en el bundle.

## Capa curada
- [x] [Codex] `src/data/projects.ts`: array tipado `Project[]` con los repos candidatos, `visibility: 'public' | 'private-showcase' | 'hidden'`, por defecto privados = `hidden` (D4)
  - Nota: el tipo congelado no tiene `hidden`; oculto = ausente del array (privados nunca listados).
- [x] [Codex] Helpers de ordenación/filtrado (`featured`, `order`, `year`) puros y exportados

## Cliente de GitHub (en build)
- [x] [Claude] `src/lib/github/client.ts`: `GET /users/thejowe/repos` y `GET /repos/{owner}/{repo}` con `GITHUB_TOKEN` opcional; `fetch` con timeout
- [x] [Claude] Caché en `.cache/github.json` con TTL y **fallback** al último resultado si la API falla o hay rate limit (el build nunca debe romperse por GitHub)
- [x] [Codex] Normalizador: API → `{ stars, language, languages, pushedAt, description, archived, fork }`
- [x] [Codex] Lista «otros repos»: excluye forks, archivados y los no marcados como publicables

## Componentes (estructura; estilo lo pone `visual`)
- [x] [Claude] `src/components/projects/ProjectCard.astro` y `ProjectList.astro` con datos curados + stats
- [x] [Claude] Página `/proyectos/[slug]` con `getStaticPaths` desde `src/content/projects/`

## Cierre
- [ ] [Claude] `codex review` del diff antes de commitear

## Hallazgos del comprobador
_(vacío)_

## Revisión Codex (2026-11-07)
- [x] Caché: validación por repo en `readCache` (descarta entradas inválidas como `repos: [null]`). Corregido por la sesión orquestadora.
- [ ] [Claude] `/proyectos/[slug]` aún no une el caso de estudio de `src/content/`: lo bloquea `contenido` (D3/D4). Conectar cuando `contenido` entregue las entradas.
