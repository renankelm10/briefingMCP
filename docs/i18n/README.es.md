<div align="center">

<img src="../images/logo.svg" width="96" alt="Logo de Briefing">

# Briefing

**El segundo cerebro de tu equipo: notas Markdown locales, compartidas de igual a igual y legibles por Claude.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Licencia: MIT](https://img.shields.io/badge/licencia-MIT-e3a43a.svg)](../../LICENSE)
![Plataformas](https://img.shields.io/badge/plataformas-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-listo%20para%20Claude-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/Descargar-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="Descargar" height="40"></a>


<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · **Español** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Editor de Briefing con vista previa en vivo, pestañas y backlinks" width="900">

</div>

---

## ¿Qué es Briefing?

Briefing es una aplicación de notas de escritorio para equipos que quieren **una base de conocimiento compartida sin un servicio en la nube de por medio**.

- 📝 **Escribe** en archivos Markdown normales, guardados en una carpeta de tu ordenador (tu "vault").
- 🔄 **Comparte** una carpeta con tu equipo: cada ordenador guarda una copia idéntica y los cambios viajan **directamente entre los ordenadores**, cifrados de extremo a extremo, en segundos.
- 🧠 **Pregunta** lo que quieras: cada nota se indexa con un modelo de IA que se ejecuta **en tu propia máquina**, y **Claude** (o cualquier cliente MCP) puede buscar, leer y escribir tus notas a través del servidor MCP integrado.

El resultado: tú y un compañero podéis trabajar cada uno con vuestro propio Claude al mismo tiempo, sobre el mismo conocimiento de la empresa, viendo siempre la última versión.

> Por ahora la interfaz está en **portugués de Brasil**. Las traducciones son bienvenidas: consulta [Contribuir](../../CONTRIBUTING.md).

## Cómo funciona

<div align="center"><img src="../images/architecture.svg" alt="Arquitectura: dos ordenadores sincronizando directamente, cada uno con un índice de IA local que Claude lee por MCP" width="860"></div>

1. **Creas un equipo** y eliges una carpeta. Briefing genera un código de invitación como `BRF-7Q2M-…`.
2. **Tu compañero pega el código.** Los ordenadores se encuentran a través de la DHT pública de [Hyperswarm](https://github.com/holepunchto/hyperswarm), usada *solo* para descubrirse, y abren una conexión directa cifrada con Noise. Cada lado demuestra que conoce el código antes de intercambiar un solo archivo.
3. **Cada cambio se envía al instante**, lo escribas tú, tu compañero o un Claude. Las ediciones simultáneas se fusionan línea a línea (como en Git); si dos personas cambian las mismas líneas, la otra versión se guarda como *copia de conflicto*, idéntica en todos los ordenadores. No se pierde nada.
4. **Cada ordenador indexa las notas localmente** (embeddings multilingües + búsqueda por palabras clave). Claude consulta el índice por MCP y obtiene los fragmentos más relevantes en milisegundos.

## Funciones

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Modo lectura"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Carpetas de equipo"></td>
</tr>
<tr>
<td><b>Escritura.</b> Editor con vista previa en vivo, <code>[[enlaces]]</code> con autocompletado, backlinks, etiquetas, callouts, tareas, tablas, incrustaciones, propiedades, pegar imágenes, plantillas y notas diarias.</td>
<td><b>Carpetas de equipo.</b> Crea un equipo, comparte el código y la carpeta se mantiene idéntica en todos los ordenadores. Presencia en vivo, fusión, copias de conflicto e historial.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Búsqueda semántica"></td>
<td><img src="../images/05-brain-claude.png" alt="Conectar Claude"></td>
</tr>
<tr>
<td><b>Segundo cerebro.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> hace una pregunta en lenguaje natural. Búsqueda híbrida (significado + palabras exactas), totalmente sin conexión tras la primera descarga del modelo.</td>
<td><b>Claude por MCP.</b> Un clic registra el servidor MCP en Claude Code. Claude obtiene <code>search</code>, <code>read_note</code>, <code>write_note</code> y más.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Vista de grafo"></td>
<td><img src="../images/06-tasks.png" alt="Panel de tareas"></td>
</tr>
<tr>
<td><b>Grafo.</b> Mira cómo se conectan las notas; grafo local, filtro, arrastrar y zoom.</td>
<td><b>Tareas y agenda.</b> Todas las <code>- [ ]</code> del vault en un solo panel, más un calendario de notas diarias.</td>
</tr>
</table>

<details>
<summary><b>Lista completa de funciones</b></summary>

- Pestañas (restauradas al reiniciar), selector rápido, paleta de comandos, búsqueda de texto completo y por `#etiqueta`
- Vista previa en vivo: la sintaxis Markdown se oculta fuera de la línea que editas; tablas, callouts, imágenes y casillas se muestran renderizadas
- Vista previa al pasar el ratón por los enlaces, menciones no enlazadas con enlace en un clic
- Renombrar o mover una nota actualiza todos los enlaces hacia ella
- Plantillas con variables (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) y una plantilla de **brief de proyecto** lista para usar
- Historial de versiones por nota con restauración; lo eliminado va a la papelera del sistema
- Exportar una nota a PDF
- Tema claro / oscuro / del sistema, color de acento, tamaño de letra, ancho de línea, paneles redimensionables y modo concentración
- Funciona con carpetas Markdown existentes (incluidos los vaults de Obsidian)

</details>

## Instalación

Descarga la última versión para tu sistema en **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| Sistema | Archivo | Notas |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Aún sin firma digital: en el aviso de SmartScreen pulsa **Más información → Ejecutar de todas formas**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Aún sin notarizar: clic derecho en la app → **Abrir**, o ejecuta `xattr -dr com.apple.quarantine /Applications/Briefing.app`. Mac con Intel: compila desde el código fuente. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. En Ubuntu 24.04+ es mejor el `.deb` (`sudo apt install ./briefing_*.deb`), que configura el sandbox de Chromium. |

Al abrirse por primera vez, Briefing crea un vault de ejemplo en `Documentos/Briefing`. Usa **Arquivo → Abrir outro vault…** para abrir cualquier carpeta.

### Compilar desde el código fuente

Requiere [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # ejecuta la app
npm run dist         # crea el instalador para tu sistema (en release/)
```

## Carpetas de equipo en 3 pasos

1. Abre como vault la carpeta que quieres compartir y pulsa <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → el código de invitación se copia. Envíaselo a tu compañero por un canal privado.
3. Tu compañero abre **Equipes → Entrar numa equipe**, pega el código y elige una carpeta vacía. Los archivos llegan en cuanto los dos ordenadores están en línea.

Briefing debe estar abierto en ambos ordenadores para sincronizar. Quien tenga el código es miembro con todos los permisos: trátalo como una contraseña.

## Conectar Claude (MCP)

Abre **✦ Segundo cérebro → Conectar automaticamente**, o ejecuta:

```bash
claude mcp add briefing --scope user -- node "/ruta/a/briefingMCP/src/mcp/server.mjs"
```

Reinicia Claude Code. El servidor expone el vault abierto y todas las carpetas de equipo:

| Herramienta | Qué hace |
|---|---|
| `search` | Búsqueda híbrida semántica + palabras clave; devuelve los fragmentos más relevantes con archivo y línea |
| `read_note` | Contenido completo de una nota (por ruta o solo por nombre) |
| `list_notes` | Notas de un vault o carpeta, con fecha de modificación |
| `recent_changes` | Notas modificadas recientemente, incluidos los cambios llegados de compañeros |
| `write_note` | Crea, sobrescribe o añade texto a una nota (se sincroniza con el equipo al instante) |
| `vault_info` | Vaults, número de notas/fragmentos indexados y estado de la búsqueda semántica |

Cualquier cliente MCP compatible con servidores stdio funciona igual. Usa `BRIEFING_VAULTS="/a;/b"` para elegir los vaults explícitamente.

## Seguridad y privacidad

- Sin cuenta, sin servidor, sin telemetría. Las notas son archivos normales en tu disco.
- Las conexiones de sincronización están cifradas de extremo a extremo y autenticadas con el código de invitación; los archivos de la red nunca se escriben fuera de la carpeta compartida y Briefing nunca abre ejecutables recibidos de otros.
- Los embeddings se calculan localmente; el modelo (`multilingual-e5-small`, ~120 MB) se descarga una sola vez desde Hugging Face.
- Las respuestas MCP marcan el contenido de las notas como datos no confiables para reducir el riesgo de inyección de prompts.

Lee el modelo de amenazas completo en **[SECURITY.md](../../SECURITY.md)**. Informa de vulnerabilidades de forma privada.

## Atajos de teclado

| Atajo | Acción | Atajo | Acción |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Selector rápido | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Preguntar al segundo cerebro |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Paleta de comandos | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Carpetas de equipo |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Nueva nota | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Nuevo brief de proyecto |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Lectura / edición | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Grafo |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Nueva / cerrar pestaña | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Nota diaria |

En macOS usa <kbd>⌘</kbd> en lugar de <kbd>Ctrl</kbd>.

## Preguntas frecuentes

**¿Esto es Obsidian?** No. Briefing es un proyecto independiente y de código abierto, escrito desde cero. Es compatible con carpetas Markdown normales, así que puedes abrir un vault existente, pero no está afiliado ni respaldado por Obsidian.

**¿Necesita internet?** Solo para encontrar a los compañeros (la DHT) y descargar el modelo de IA una vez. Las notas, la búsqueda y el acceso de Claude funcionan sin conexión.

**¿Qué pasa si dos personas editan la misma nota?** Las partes distintas se fusionan automáticamente. Si cambian las mismas líneas, se guardan ambas versiones: una en la nota y la otra en una copia `(conflito de …)` a su lado.

**¿Dónde están mis datos?** En la carpeta de tu vault (archivos `.md`). Los datos propios de Briefing están en `<vault>/.briefing/` (índice, historial) y en la carpeta de configuración del usuario (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Hoja de ruta

- Traducción de la interfaz (i18n)
- Aplicación móvil complementaria
- Relay opcional para redes que bloquean conexiones directas
- Permisos por miembro y rotación de la clave del equipo
- Instaladores firmados y notarizados

## Contribuir

Issues y pull requests son bienvenidos. Consulta **[CONTRIBUTING.md](../../CONTRIBUTING.md)** para la configuración, las pruebas y la estructura del proyecto.

## Licencia

[MIT](../../LICENSE) © 2026 Renan Kelm
