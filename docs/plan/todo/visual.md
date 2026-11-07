# TODO — visual

> Depende de `arquitecto` (layout) y de **D2** (dirección estética). Mock/dirección aprobada por el usuario antes de pulir detalles.

## Dirección
- [ ] [Claude] Proponer 2-3 direcciones (moodboard en texto + referencias) y que el usuario elija (D2)
- [ ] [Claude] Fijar paleta (claro/oscuro), tipografías (cargar con `font-display: swap`, autoalojadas en `public/fonts/`), escala y espaciado

## Sistema
- [ ] [Claude] `src/styles/tokens.css`: color, tipografía, espaciado, radios, sombras, duraciones/curvas de motion
- [ ] [Claude] `src/styles/global.css`: reset, base, foco visible, `prefers-color-scheme` + toggle persistente sin flash (script inline mínimo)
- [ ] [Claude] Componentes `src/components/ui/`: Button, Card, Tag, NavLink, ThemeToggle

## Secciones
- [ ] [Claude] Hero (`src/components/sections/Hero.astro`)
- [ ] [Claude] Sección proyectos destacados (estilo de las tarjetas de `proyectos`)
- [ ] [Claude] «Sobre mí» y contacto
- [ ] [Claude] Footer y 404 con personalidad

## Motion
- [ ] [Claude] Entradas y hover sutiles; transiciones entre páginas (View Transitions de Astro) — **todo** respeta `prefers-reduced-motion`
- [ ] [Claude] Sin animación que bloquee LCP ni mueva layout (CLS 0)

## Cierre
- [ ] [comprobador] Capturas en 375/768/1440, claro y oscuro, con y sin reduced-motion
- [ ] [Claude] `codex review` del diff antes de commitear

## Hallazgos del comprobador
_(vacío)_
