---
name: visual-craft
description: Crea cualquier cosa visual de nivel estudio a partir de una simple idea, sin especificaciones: animaciones de scroll e intros (GSAP, ScrollTrigger, WebGL/three.js), sistemas de UI, rediseños de webs, estéticas con personalidad (pixel art PS2, editorial, brutalista, glass...), tipografías propias, sprites, fondos y microinteracciones. Replica el flujo completo: dirección y contrato de diseño, cimientos, agentes especialistas en paralelo, verificación con capturas reales, accesibilidad/rendimiento y revisión de código. Úsala SIEMPRE que se pida algo visual (hazme una intro, animación, UI, web, landing, portfolio, rediseño, estilo X; mejora el diseño; hazlo más currado; no quiero UI genérica), aunque solo haya una frase y no se nombre la skill. Lleva dentro todas las skills de diseño, así que funciona en cualquier equipo.
---

# visual-craft

Convierte **una idea de una frase** en un resultado visual terminado, verificado y entregable, con el mismo nivel de esfuerzo que un estudio de diseño: dirección clara, sistema coherente, ejecución cuidada, comprobación en navegador real y revisión final.

El usuario NO tiene que dar especificaciones. Tú decides todo lo decidible (estética, paleta, tipografía, tecnología, estructura, pasos). Esto es lo que hace que la skill valga la pena: el trabajo de pensar el "cómo" ya está hecho aquí.

## Principios (el porqué de todo lo demás)

1. **Autonomía.** Pregunta solo si algo es destructivo, saldría hacia fuera (publicar, push, pagar) o es imposible de inferir y cambia radicalmente el resultado. Todo lo demás: decide, anota la decisión en una línea y avanza. Preguntar de más es el fallo más caro: bloquea al usuario por cosas que tú puedes resolver.
2. **Dirección antes que píxeles.** Lo genérico se nota. Una idea clara (concepto memorable + un único gesto protagonista) vale más que veinte efectos. Todo lo que no sirva al concepto sobra.
3. **Contrato antes que paralelismo.** Varios agentes en paralelo solo funcionan si comparten tokens, interfaces y archivos asignados desde el principio. Un documento de diseño + cimientos hechos por ti evitan que cada agente invente su propio estilo.
4. **Ver para creer.** Nada visual se da por bueno sin haber mirado capturas reales (herramienta de lectura de imágenes) en móvil y escritorio. El código que "debería verse bien" miente a menudo.
5. **Accesibilidad y rendimiento son parte del diseño**, no extras: contraste AA calculado, foco visible, teclado, `prefers-reduced-motion`, nunca atrapar al usuario (salidas para sin JS / sin WebGL / movimiento reducido), presupuesto de peso y de hilo principal.
6. **Verificación acotada.** Construye completo, inspecciona en una ronda por lotes (móvil+escritorio, claro+oscuro), corrige todo de una vez, confirma con a lo sumo una ronda más y para. El pulido infinito gasta dinero y empeora el resultado.
7. **Honestidad.** Informa de lo que probaste y de lo que no (p. ej. "medido en WebGL por software, no en GPU real"). No afirmes éxito visual sin evidencia.

## Cómo usar las skills incluidas (portabilidad)

Esta skill lleva dentro copias de todas las skills de diseño que alimentan el flujo (`references/skills/*.md`, más sub-referencias en `references/impeccable/`, `references/ui-taste/`, `references/motion-doctrine/`). Para cada skill que el flujo pida:

1. Si la herramienta `Skill` la tiene instalada, invócala por su nombre (es la versión más actual).
2. Si no, **lee el archivo `references/skills/<nombre>.md`** de esta skill y aplícalo igual. Nunca te saltes una skill por no estar instalada.

Índice y cuándo usar cada una: `references/skills-index.md`. Léelo en el paso 1.

## Flujo de trabajo (síguelo entero; no es opcional)

Detalle de cada paso con comandos, plantillas y checklists en `references/workplan.md`. Resumen:

**0. Entender el encargo y el terreno.** Lee la idea del usuario como "Design Read" en una línea (tipo de pieza, audiencia, vibra, familia estética). Inspecciona el repo: framework, estilos, tokens, reglas del proyecto (`CLAUDE.md`, `AGENTS.md`, planes, memoria). Respeta límites de alcance de archivos y reglas ("nada hacia fuera sin confirmar"). Si es un proyecto nuevo, elige un stack ligero adecuado (Astro/HTML+CSS por defecto; three.js solo si el concepto lo pide).

**1. Cargar las skills.** Lee `references/skills-index.md` y carga (instaladas o por referencia) todas las que apliquen. Para una pieza visual completa son prácticamente todas: dirección y gusto (`impeccable`, `design-taste-frontend`, `ui-taste`, `high-end-visual-design`, `frontend-design`, `redesign-existing-projects`), movimiento (`animate`, `emil-design-eng`, `apple-design`, `animation-vocabulary`, `motion-*`, `motion-doctrine`, `gsap-core`, `gsap-scrolltrigger`) y calidad (`accessibility`, `web-design-guidelines`, y `astro` si procede).

**2. Dirección y especificación.** Decide concepto, paleta (con contrastes calculados con `scripts/contrast.mjs`), tipografía (si ninguna fuente existente encaja, **crea una propia**: ver `references/playbooks.md` §Tipografía), unidad de diseño, movimiento, estados claro/oscuro. Revisa tu plan contra el brief ("¿esto es lo que haría cualquiera?") y corrígelo. Escribe el contrato en `docs/` del proyecto (`DISENO-<nombre>.md`) con reglas duras, herramientas disponibles y cómo se verifica. Plantilla en `references/workplan.md`.

**3. Cimientos (los haces tú).** Tokens, primitivas, componentes base, utilidades de render, interfaces entre módulos y un laboratorio/preview mínimo. Que compile y se vea algo antes de repartir trabajo. Verifica con una captura.

**4. Especialistas en paralelo.** Reparte por áreas con archivos disjuntos usando agentes (plantillas listas en `references/agent-prompts.md`): p. ej. entorno, personaje/objetos, efectos, UI chrome, secciones, páginas, tipografía. Cada agente: invoca/lee las skills, trabaja solo en sus archivos, construye en su propio directorio de salida y puerto, verifica con capturas, itera máx. 3 rondas por lotes e informa. Lanza en segundo plano y no dupliques su trabajo.

**5. Integración y verificación.** Cuando entreguen: integra, ejecuta typecheck/lint/format/tests/e2e/build, y lanza el agente de verificación en navegador (viewports 375/768/1440, claro y oscuro, con y sin movimiento reducido, consola, axe, Lighthouse, teclado). Mira tú mismo las capturas clave. Corrige en lote.

**6. Revisión y entrega.** Pasa una revisión de código independiente (`codex review` si existe, si no un agente revisor). Corrige los hallazgos. Actualiza docs/TODO del proyecto. **Commit y push solo si el usuario lo pide** (o lo ha autorizado de forma duradera). Informa al final con: qué se hizo, qué se probó y cómo, decisiones que el usuario puede querer cambiar, riesgos y pendientes.

## Cuando la petición es pequeña

La skill escala: un ajuste ("hazlo más pequeño", "quita estos píxeles") no necesita agentes ni documentos; aplica el mismo criterio y la verificación con captura, y listo. Lo grande (intro, sistema de UI, rediseño) usa el flujo entero.

## Reglas de oficio que no se negocian

- Un concepto, un gesto protagonista; lo demás sobrio.
- Todo valor de diseño sale de tokens; nada de números sueltos.
- Solo `transform`/`opacity` en animaciones continuas; nada que mueva el layout; sin parpadeos >3 Hz ni flashes bruscos (el blanco sube y baja en fundido).
- Movimiento con propósito (jerarquía, narrativa, feedback, estado) y siempre con alternativa para `prefers-reduced-motion`.
- Texto real del usuario intacto: cambia presentación, no contenido, salvo petición.
- Mobile-first, sin scroll horizontal, objetivos táctiles cómodos.
- Contrastes AA mínimos (4.5:1 texto, 3:1 UI) calculados, no estimados.
- No añadas dependencias sin motivo; las que añadas, cárgalas diferidas si pesan.
- Lee `references/lessons.md` antes de empezar: son los tropiezos reales de proyectos anteriores y ahorran horas.

## Archivos de esta skill

- `references/workplan.md`: el plan paso a paso con plantillas (documento de diseño, checklists, comandos).
- `references/agent-prompts.md`: plantillas de prompts para cada tipo de agente especialista y para el verificador.
- `references/playbooks.md`: recetas: intro/animación scroll (GSAP+ScrollTrigger), escena 3D estilo PS2/pixel (three.js), sistema de UI pixel art, tipografía bitmap propia, sprites ASCII, fondos y paletas.
- `references/lessons.md`: errores y soluciones reales.
- `references/skills-index.md`: qué skill leer y cuándo; ruta a cada copia.
- `references/skills/`, `references/impeccable/`, `references/ui-taste/`, `references/motion-doctrine/`: skills de apoyo incluidas.
- `scripts/contrast.mjs`: calcula contrastes WCAG de una paleta. `scripts/shots.mjs`: servidor estático + capturas en varios viewports/temas con Playwright.
- `NOTICE.md`: procedencia de las skills incluidas.
