# TODO — proyectos

> Depende de `arquitecto` (tipo `Project`). Nunca llamar a la API desde el navegador ni meter un token en el bundle.

## Capa curada
- [ ] [Codex] `src/data/projects.ts`: array tipado `Project[]` con los repos candidatos, `visibility: 'public' | 'private-showcase' | 'hidden'`, por defecto privados = `hidden` (D4)
- [ ] [Codex] Helpers de ordenación/filtrado (`featured`, `order`, `year`) puros y exportados

## Cliente de GitHub (en build)
- [ ] [Claude] `src/lib/github/client.ts`: `GET /users/thejowe/repos` y `GET /repos/{owner}/{repo}` con `GITHUB_TOKEN` opcional; `fetch` con timeout
- [ ] [Claude] Caché en `.cache/github.json` con TTL y **fallback** al último resultado si la API falla o hay rate limit (el build nunca debe romperse por GitHub)
- [ ] [Codex] Normalizador: API → `{ stars, language, languages, pushedAt, description, archived, fork }`
- [ ] [Codex] Lista «otros repos»: excluye forks, archivados y los no marcados como publicables

## Componentes (estructura; estilo lo pone `visual`)
- [ ] [Claude] `src/components/projects/ProjectCard.astro` y `ProjectList.astro` con datos curados + stats
- [ ] [Claude] Página `/proyectos/[slug]` con `getStaticPaths` desde `src/content/projects/`

## Cierre
- [ ] [Claude] `codex review` del diff antes de commitear

## Hallazgos del comprobador
_(vacío)_
