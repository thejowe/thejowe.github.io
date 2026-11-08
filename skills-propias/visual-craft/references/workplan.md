# Plan de trabajo (el flujo completo)

Orden fijo. Cada paso termina con un artefacto comprobable. Marca cada paso en tu lista de tareas.

## 0. Entender y explorar (10 % del esfuerzo)

1. **Design Read** en una línea: `Pieza: <tipo> para <audiencia>, lenguaje <vibra>, familia <estética>`. Ejemplos de pieza: intro de scroll, sistema de UI, landing, portfolio, rediseño, fondo, tipografía, sprite set.
2. **Terreno**: lee `CLAUDE.md`, `AGENTS.md`, planes y memoria del proyecto; `package.json`; estructura (`src/`, estilos, tokens). Anota: stack, reglas de alcance de archivos, límites ("nada hacia fuera sin confirmar"), tests existentes, puertos ocupados (`Get-NetTCPConnection -State Listen`).
3. **Brief implícito**: del texto del usuario saca (a) el gesto protagonista, (b) lo que NO quiere ("no quiero UI genérica" = rechaza kit SaaS), (c) restricciones (móvil, claro/oscuro, rendimiento). Si hay contenido real (textos, datos), es intocable.
4. **Elección de tecnología** por el menor medio que logre el efecto:
   | Efecto | Medio |
   |---|---|
   | Hover/estado/entrada simple | CSS (transition, @starting-style) |
   | Scroll ligado a progreso, pin, timelines | GSAP + ScrollTrigger |
   | Escena 3D / mundo / personaje | three.js (carga diferida), render a baja resolución si es estilo retro |
   | Pixel art UI | CSS con unidad `--px` + sprites ASCII→SVG + fuente bitmap propia |
   | Dibujo de trazos | SVG (`pathLength`) |
   Un solo sistema de animación por árbol de componentes (no mezcles GSAP/three con Motion en el mismo árbol).

## 1. Skills

Carga todas las aplicables (ver `skills-index.md`). Apunta en el documento de diseño cuáles usaste.

## 2. Dirección y especificación (15 %)

Entregables:
- **Plan compacto** (antes de escribir código): color (4–6 hex con nombre), tipografía y roles, layout (frases + ASCII), principios (qué hace único esto).
- **Autocrítica**: compáralo con "lo que haría cualquiera con este brief". Si coincide, rehazlo y di qué cambiaste. Evita los defectos de manual: paleta crema+terracota, negro con acento verde ácido, kit de tarjetas redondeadas con sombra gris, eyebrow en mayúsculas sobre cada título, hero centrado con degradado.
- **Paleta con contrastes**: `node scripts/contrast.mjs` (texto ≥ 4.5:1, UI/foco ≥ 3:1) para cada tema (claro/oscuro u otros).
- **Documento de diseño** `docs/DISENO-<nombre>.md` con estas secciones (copia y rellena):

```
# Dirección visual — «<concepto>»
## Concepto            (3 líneas; el gesto protagonista)
## Reglas duras        (unidad de diseño, tipografía, color solo por tokens, acento único, movimiento, accesibilidad, contenido intocable, mobile-first, aislamiento de archivos)
## Herramientas ya hechas (primitivas, componentes, helpers, rutas)
## Verificación        (build en directorio propio, servidor estático propio, Edge/Playwright, viewports, temas, movimiento reducido, axe, consola)
```

## 3. Cimientos (20 %) — los haces tú

- `tokens.css` (o equivalente) con colores por tema, escala tipográfica, espaciado, movimiento.
- Primitivas de estilo y componentes base; utilidades de render; contratos TypeScript entre módulos (tipos, constantes de línea de tiempo, interfaz `{group, update(p, dt), dispose()}` para módulos 3D).
- Ensamblador mínimo + **laboratorio** (página temporal o script) que permita fijar el estado/progreso y capturar.
- Compila, captura una vez y mira la imagen. Corrige antes de repartir.
- Si hace falta tipografía propia: lánzala en paralelo ya (agente tipógrafo, ver `agent-prompts.md`).

## 4. Especialistas en paralelo (35 %)

Reglas de reparto:
- **Archivos disjuntos** por agente (anótalos en su prompt, incluidos los que NO puede tocar).
- Los agentes usan su **propio `outDir`, puerto y servidor estático** (Astro no deja dos `dev` en el mismo proyecto; no compartáis `dist`).
- Cada prompt incluye: contexto del proyecto, ruta al documento de diseño, lista de skills a invocar, objetivo artístico concreto, presupuesto técnico, verificación con capturas (Read) y límite de iteraciones, formato del informe, "no commit/push".
- Lánzalos con `run_in_background: true`. No dupliques su trabajo ni leas sus transcripciones. Al llegar cada informe, revisa capturas clave tú mismo y manda correcciones concretas con `SendMessage` al mismo agente (conserva su contexto).
- No ejecutes `prettier --write` sobre carpetas que un agente está editando.

## 5. Integración y verificación (20 %)

1. Integra y resuelve contradicciones (nombres, imports, tokens).
2. Calidad automática: typecheck, lint, format, tests unitarios, build, e2e. Si los e2e asumían el diseño antiguo, adáptalos (p. ej. movimiento reducido por defecto en la config y un spec propio para la animación).
3. **Verificación en navegador** (agente verificador, `agent-prompts.md`): 375/768/1440, claro/oscuro, con y sin `prefers-reduced-motion`, sin JS, sin WebGL, teclado completo, consola, axe, Lighthouse, fps de scroll, peso. Evidencia en `tests/artifacts/local/`.
4. Mira tú mismo las capturas clave; ordena los fallos por impacto y corrígelos **en un lote**.
5. Rendimiento: si el efecto pesa (p. ej. three.js), carga diferida tras `load`+idle, ceder hilo entre fases (`scheduler.yield`), detectar capacidad antes de descargar, y **presenta el trade-off al usuario** con opciones y recomendación si el umbral del proyecto (Lighthouse) no se cumple.

## 6. Revisión y entrega (10 %)

- Revisión independiente del diff (`codex review --uncommitted -c sandbox_mode=read-only` si está; si no, agente revisor). Corrige todo lo válido; repite una ronda si hubo cambios grandes.
- Actualiza docs/TODO del proyecto (casillas, hallazgos, decisiones tomadas por el usuario).
- Commit/push solo cuando el usuario lo pida. Mensaje claro, con el trailer de atribución que indique el entorno.
- Informe final (corto): qué hay, cómo se comporta, qué se verificó y con qué, qué NO se pudo verificar, decisiones reversibles y pendientes.

## Calibración de esfuerzo

| Petición | Qué hacer |
|---|---|
| Ajuste puntual ("quita esos píxeles") | Cambia, captura, comprueba, confirma. Sin agentes. |
| Componente o sección | Pasos 0–3 y 5–6; un agente solo si hay varias áreas. |
| Pieza completa (intro, sistema de UI, rediseño) | Flujo entero con agentes en paralelo. |
