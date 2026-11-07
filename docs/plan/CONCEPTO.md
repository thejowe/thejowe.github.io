# Concepto — Portfolio web de GitHub

## Qué es

Web personal estática que sirve de portfolio de desarrollo: presenta quién soy, qué he construido y cómo contactarme. Se publica en GitHub Pages (`thejowe.github.io`, dominio propio opcional más adelante) y se alimenta de mi GitHub (`thejowe`) para que no se quede desfasada.

## Para quién

1. **Reclutadores / equipos técnicos**: deben entender en 30 segundos qué hago y ver 3-4 proyectos con prueba real (código, demo, resultado).
2. **Clientes / colaboradores**: quieren saber si pueden trabajar conmigo y cómo escribirme.
3. **Otros desarrolladores**: miran el código fuente del propio portfolio — también es una pieza de portfolio.

## Principios de producto

- **Pocos proyectos, bien contados** > lista de 13 repos. Cada proyecto destacado lleva problema, decisión técnica, stack y enlace (repo o demo).
- **Prueba, no adjetivos**: estrellas, último commit, lenguajes y demos reales; sin «apasionado por…».
- **Rápido y accesible**: sin framework pesado en cliente, Lighthouse ≥ 95 en las cuatro categorías, navegación completa por teclado.
- **Privacidad por defecto**: los repos privados solo aparecen si yo los marco como publicables en la capa de datos curada.
- **Mantenimiento cero**: añadir un proyecto = una entrada en un archivo de datos; el resto (stats de GitHub) se rellena en build.

## Secciones (MVP)

1. **Hero** — nombre, una frase de posicionamiento, CTA a proyectos y contacto.
2. **Proyectos destacados** — tarjetas + página de detalle (caso de estudio corto).
3. **Resto de repos públicos** — lista compacta generada desde la API de GitHub.
4. **Sobre mí** — bio breve, stack, qué busco.
5. **Contacto** — email, GitHub, (LinkedIn si se decide).
6. **Utilidades** — toggle claro/oscuro, 404, `sitemap.xml`, `robots.txt`, metadatos Open Graph.

## Datos reales de partida (a 2026-11-07)

Usuario GitHub: `thejowe`. 13 repos: 8 públicos (`lockin`, `cofounder-web`, `circuit`, `ninjex`, `gamblex`, `larp`, `Miniempresa`, `Mecanografia`) y 5 privados (nombres omitidos en el repo público) — varios con demo en Vercel. Candidatos a destacados: LockIn / cofounder (app Expo + Supabase en tiendas), privados (ver D4). **Qué privados se muestran lo decide el usuario** (ver «Decisiones abiertas» en `PLAN.md`).

## Fuera del MVP (fases posteriores)

- Blog / notas técnicas.
- Dominio propio y analítica respetuosa con la privacidad.
- Versión en inglés completa (si no entra en MVP).
- Página «Now» / changelog personal.
