# TODO — arquitecto

> Bloquea al resto. Al terminar, el contrato `src/types/project.ts` y `src/config/site.ts` queda **congelado**: cambios solo avisando.

## Repo y proyecto base
- [x] [Claude] `git init`, rama `main`, `.gitignore` (node_modules, dist, .astro, .cache, tests/artifacts/local), `.editorconfig`
- [x] [Claude] Scaffold Astro con TypeScript `strict` (leer la doc de la versión instalada antes)
- [x] [Claude] `astro.config.mjs`: `site` (D1), `output: 'static'`, integración sitemap
- [x] Scripts npm: `dev`, `build`, `preview`, `check`, `lint`, `test`

## Layout y rutas
- [x] [Claude] `src/layouts/Base.astro`: `<head>` con title/description por página, `lang`, viewport, skip-link, `<main id>`, header y footer
- [x] [Claude] Rutas shell: `/`, `/proyectos/[slug]`, `/sobre-mi`, `/contacto`, `/404` (placeholder honesto, no lorem)
- [x] [Claude] Navegación accesible (landmarks, `aria-current`, foco visible)

## Contratos congelados
- [x] [Claude] `src/types/project.ts`: `Project` (slug, title, summary, role, stack[], repo?, demo?, visibility, featured, order, year, status)
- [x] [Claude] `src/config/site.ts`: nombre, tagline, email, enlaces sociales, URL base
- [x] [Claude] Documentar el contrato en este archivo (campos obligatorios vs opcionales)

## Cierre
- [x] [Claude] `npm run build` verde y `npm run check` sin errores
- [x] `codex review` del diff antes de commitear en `main` — 0 hallazgos (solo lectura, 2026-11-07) (pendiente: la lanza la sesión orquestadora; sin commit hecho)

## Contrato congelado (2026-11-07)

Versiones: Astro 7.4.7, `@astrojs/sitemap` 3.x, `@astrojs/check`, TypeScript `strict` (`astro/tsconfigs/strict`). `site=https://thejowe.github.io`, `base='/'` (D1 por defecto). `lint` y `test` son stubs que imprimen un aviso: los sustituye `calidad`.

### `Project` (`src/types/project.ts`)
| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `slug` | `string` | si | URL `/proyectos/<slug>`; minúsculas, números, guiones |
| `title` | `string` | si | |
| `summary` | `string` | si | 1-2 frases |
| `role` | `string` | si | |
| `stack` | `string[]` | si | por relevancia |
| `repo` | `string` | no | omitir si privado y no se enlaza |
| `demo` | `string` | no | URL desplegada |
| `visibility` | `'public' \| 'private-showcase'` | si | privado solo con decisión D4 |
| `featured` | `boolean` | si | destacado = página de detalle |
| `order` | `number` | si | ascendente |
| `year` | `number` | si | |
| `status` | `'active' \| 'maintained' \| 'archived' \| 'prototype'` | si | |

### `SiteConfig` / `site` (`src/config/site.ts`)
`url`, `lang`, `title`, `githubUser`, `description`, `social: {label,url}[]` obligatorios con valor. `name`, `tagline`, `email` son `string | null`: **`null` = pendiente de D3/D8**; `contenido` los rellena sin cambiar la forma. Las vistas deben tratar `null` con gracia.

### Layout y rutas
`src/layouts/Base.astro`, props `{ title?, description?, noindex? }` (title se compone «título · sitio»); slot `head` para metadatos extra (OG/JSON-LD de `calidad`). Skip-link `.skip-link` (sin estilos aún: lo estiliza `visual`, debe ser visible al enfocar). Landmarks `header`/`nav`/`main#contenido`/`footer`; `aria-current="page"` en nav. Rutas: `/`, `/sobre-mi`, `/contacto`, `/404`, `/proyectos/[slug]` (shell con `getStaticPaths` vacío: `proyectos` lo conecta a `src/data/projects.ts`).

## Hallazgos del comprobador
_(vacío)_
