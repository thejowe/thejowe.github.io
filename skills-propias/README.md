# Skills propias

## visual-craft

Skill que crea cualquier pieza visual (intro/animación de scroll, UI, rediseño, estética pixel art, tipografía...) a partir de una idea de una frase, siguiendo el mismo flujo con el que se hizo este portfolio. Lleva dentro todas las skills de diseño que usa, así que no necesita nada más.

**Instalar en otro equipo** (carpeta global de skills de Claude Code):

```powershell
# Windows
Copy-Item -Recurse skills-propias\visual-craft $env:USERPROFILE\.claude\skills\visual-craft
```

```bash
# macOS / Linux
cp -r skills-propias/visual-craft ~/.claude/skills/visual-craft
```

También hay un paquete `visual-craft.skill` (zip) junto a esta carpeta. Al abrir Claude Code, se invoca con `/visual-craft <idea>` o simplemente pidiendo algo visual.

La instalación local en este equipo ya está hecha en `~/.claude/skills/visual-craft`. La copia de aquí es la que se versiona.
