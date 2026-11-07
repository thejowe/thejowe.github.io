# TODO — publicacion

> Último bloque. **Todas las acciones hacia fuera (crear repo, push, activar Pages, README de perfil, dominio) requieren confirmación explícita del usuario en el momento** — la aprobación de una no vale para las demás.

## Antes de publicar
- [ ] [Claude] Confirmar D1 (nombre/URL) y D6 (dominio) con el usuario
- [ ] [Claude] Auditoría de privacidad: ningún repo privado ni dato personal no aprobado en el build (`grep` en `dist/`), sin secretos en el repo
- [ ] [Claude] `calidad` verde: CI, axe, Lighthouse ≥ 95

## Repo y despliegue
- [ ] [Claude] **(confirmar)** Crear repo `thejowe/thejowe.github.io` en GitHub y primer push de `main`
- [ ] [Claude] `.github/workflows/pages.yml`: build Astro + `actions/deploy-pages` con permisos mínimos (`pages: write`, `id-token: write`)
- [ ] [Claude] **(confirmar)** Activar Pages con fuente «GitHub Actions» y comprobar la URL pública
- [ ] [comprobador] Recorrer la URL pública en 3 viewports; Lighthouse sobre producción

## Cierre y presencia
- [ ] [Claude] README del repo: qué es, cómo correrlo, cómo añadir un proyecto
- [ ] [Claude] **(confirmar)** README de perfil (`thejowe/thejowe`) con enlace al portfolio; dominio propio solo si D6 lo pide

## Hallazgos del comprobador
_(vacío)_
