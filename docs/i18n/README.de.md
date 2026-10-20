<div align="center">

<img src="../images/logo.svg" width="96" alt="Briefing-Logo">

# Briefing

**Das zweite Gehirn deines Teams – lokale Markdown-Notizen, Peer-to-Peer geteilt und für Claude lesbar.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-e3a43a.svg)](../../LICENSE)
![Plattformen](https://img.shields.io/badge/Plattformen-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-bereit%20für%20Claude-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/Herunterladen-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="Herunterladen" height="40"></a>
<a href="https://github.com/renankelm10/briefingMCP/releases"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Frenankelm10%2FbriefingMCP%2Fmain%2Fdocs%2Fdownloads.json&style=for-the-badge" alt="Downloads" height="40"></a>


<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · **Deutsch** · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Briefing-Editor mit Live-Vorschau, Tabs und Backlinks" width="900">

</div>

---

## Was ist Briefing?

Briefing ist eine Notiz-App für den Desktop, gemacht für Teams, die **eine gemeinsame Wissensbasis ohne Cloud-Dienst dazwischen** wollen.

- 📝 **Schreiben** in ganz normalen Markdown-Dateien, die in einem gewöhnlichen Ordner auf deinem Computer liegen (deinem „Vault“).
- 🔄 **Teilen** eines Ordners mit dem Team: Jeder Computer hat eine identische Kopie, und Änderungen gehen **direkt von Computer zu Computer**, Ende-zu-Ende-verschlüsselt, innerhalb von Sekunden.
- 🧠 **Fragen** stellen: Jede Notiz wird von einem KI-Modell indiziert, das **auf deinem eigenen Rechner** läuft, und **Claude** (oder jeder MCP-Client) kann über den eingebauten MCP-Server deine Notizen durchsuchen, lesen und schreiben.

Das Ergebnis: Du und eine Kollegin könnt gleichzeitig jeweils mit eurem eigenen Claude am selben Firmenwissen arbeiten und seht immer die neueste Version.

> Die Oberfläche ist derzeit auf **brasilianischem Portugiesisch**. Übersetzungen sind willkommen – siehe [Mitwirken](../../CONTRIBUTING.md).

## So funktioniert es

<div align="center"><img src="../images/architecture.svg" alt="Architektur: zwei Computer synchronisieren direkt, jeder mit einem lokalen KI-Index, den Claude per MCP liest" width="860"></div>

1. **Du erstellst ein Team** und wählst einen Ordner. Briefing erzeugt einen Einladungscode wie `BRF-7Q2M-…`.
2. **Deine Kollegin fügt den Code ein.** Die Computer finden sich über die öffentliche [Hyperswarm](https://github.com/holepunchto/hyperswarm)-DHT – *nur* zur Erkennung – und öffnen eine direkte, mit Noise verschlüsselte Verbindung. Jede Seite beweist, dass sie den Code kennt, bevor auch nur eine Datei übertragen wird.
3. **Jede Änderung wird sofort gesendet**, egal ob du, deine Kollegin oder ein Claude sie geschrieben hat. Gleichzeitige Änderungen werden zeilenweise zusammengeführt (wie bei Git); ändern zwei Personen dieselben Zeilen, wird die andere Version als *Konfliktkopie* gespeichert – auf allen Computern identisch, nichts geht verloren.
4. **Jeder Computer indiziert die Notizen lokal** (mehrsprachige Embeddings + Stichwortsuche). Claude fragt den Index per MCP ab und erhält in Millisekunden die relevantesten Abschnitte.

## Funktionen

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Lesemodus"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Team-Ordner"></td>
</tr>
<tr>
<td><b>Schreiben.</b> Editor mit Live-Vorschau, <code>[[Links]]</code> mit Autovervollständigung, Backlinks, Tags, Callouts, Aufgaben, Tabellen, Einbettungen, Eigenschaften, Bilder einfügen, Vorlagen, Tagesnotizen.</td>
<td><b>Team-Ordner.</b> Team erstellen, Code teilen – und der Ordner bleibt auf allen Computern identisch. Live-Präsenz, Zusammenführung, Konfliktkopien, Verlauf.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Semantische Suche"></td>
<td><img src="../images/05-brain-claude.png" alt="Claude verbinden"></td>
</tr>
<tr>
<td><b>Zweites Gehirn.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> stellt eine Frage in natürlicher Sprache. Hybride Suche (Bedeutung + exakte Wörter), nach dem ersten Modell-Download komplett offline.</td>
<td><b>Claude per MCP.</b> Ein Klick registriert den MCP-Server in Claude Code. Claude erhält <code>search</code>, <code>read_note</code>, <code>write_note</code> und mehr.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Graphansicht"></td>
<td><img src="../images/06-tasks.png" alt="Aufgabenbereich"></td>
</tr>
<tr>
<td><b>Graph.</b> Sieh, wie Notizen zusammenhängen; lokaler Graph, Filter, Ziehen und Zoomen.</td>
<td><b>Aufgaben & Kalender.</b> Alle <code>- [ ]</code> des Vaults in einem Bereich, dazu ein Kalender der Tagesnotizen.</td>
</tr>
</table>

<details>
<summary><b>Vollständige Funktionsliste</b></summary>

- Tabs (beim Neustart wiederhergestellt), Schnellwechsler, Befehlspalette, Volltext- und `#Tag`-Suche
- Live-Vorschau: Markdown-Syntax verschwindet außerhalb der bearbeiteten Zeile; Tabellen, Callouts, Bilder und Kontrollkästchen werden direkt gerendert
- Vorschau beim Überfahren von Links, unverlinkte Erwähnungen mit Verlinkung per Klick
- Umbenennen oder Verschieben einer Notiz aktualisiert alle Links darauf
- Vorlagen mit Variablen (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) und eine fertige Vorlage für **Projekt-Briefings**
- Versionsverlauf pro Notiz mit Wiederherstellung; Gelöschtes landet im Papierkorb des Systems
- Notiz als PDF exportieren
- Helles / dunkles / System-Design, Akzentfarbe, Schriftgröße, Zeilenbreite, anpassbare Bereiche, Fokusmodus
- Funktioniert mit bestehenden Markdown-Ordnern (auch Obsidian-Vaults)

</details>

## Installation

Lade die neueste Version für dein System unter **[Releases](https://github.com/renankelm10/briefingMCP/releases)** herunter.

| System | Datei | Hinweise |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Noch nicht signiert: In der SmartScreen-Warnung auf **Weitere Informationen → Trotzdem ausführen** klicken. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Noch nicht notarisiert: Rechtsklick auf die App → **Öffnen**, oder `xattr -dr com.apple.quarantine /Applications/Briefing.app` ausführen. Intel-Macs: aus dem Quellcode bauen. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. Unter Ubuntu 24.04+ besser das `.deb` (`sudo apt install ./briefing_*.deb`), das die Chromium-Sandbox einrichtet. |

Beim ersten Start legt Briefing einen Beispiel-Vault in `Dokumente/Briefing` an. Mit **Arquivo → Abrir outro vault…** öffnest du jeden beliebigen Ordner.

### Aus dem Quellcode bauen

Benötigt [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # App starten
npm run dist         # Installer für dein System bauen (in release/)
```

## Team-Ordner in 3 Schritten

1. Öffne den zu teilenden Ordner als Vault und drücke <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → der Einladungscode wird kopiert. Schicke ihn über einen privaten Kanal an deine Kollegin.
3. Sie öffnet **Equipes → Entrar numa equipe**, fügt den Code ein und wählt einen leeren Ordner. Die Dateien kommen an, sobald beide Computer online sind.

Briefing muss auf beiden Computern laufen, damit synchronisiert wird. Wer den Code hat, ist vollwertiges Mitglied – behandle ihn wie ein Passwort.

## Claude verbinden (MCP)

Öffne **✦ Segundo cérebro → Conectar automaticamente** oder führe aus:

```bash
claude mcp add briefing --scope user -- node "/pfad/zu/briefingMCP/src/mcp/server.mjs"
```

Starte Claude Code neu. Der Server stellt den geöffneten Vault und alle Team-Ordner bereit:

| Werkzeug | Funktion |
|---|---|
| `search` | Hybride semantische + Stichwortsuche; liefert die relevantesten Abschnitte mit Datei und Zeile |
| `read_note` | Vollständiger Inhalt einer Notiz (per Pfad oder nur per Name) |
| `list_notes` | Notizen eines Vaults oder Ordners, mit Änderungszeit |
| `recent_changes` | Kürzlich geänderte Notizen – auch Änderungen, die von Teammitgliedern kamen |
| `write_note` | Notiz erstellen, überschreiben oder ergänzen (sofort mit dem Team synchronisiert) |
| `vault_info` | Vaults, Anzahl indizierter Notizen/Abschnitte, Status der semantischen Suche |

Jeder MCP-Client mit stdio-Servern funktioniert genauso. Mit `BRIEFING_VAULTS="/a;/b"` wählst du Vaults explizit aus.

## Sicherheit & Datenschutz

- Kein Konto, kein Server, keine Telemetrie. Notizen sind normale Dateien auf deiner Festplatte.
- Sync-Verbindungen sind Ende-zu-Ende-verschlüsselt und über den Einladungscode authentifiziert; Dateien aus dem Netz werden nie außerhalb des geteilten Ordners geschrieben, und von anderen erhaltene ausführbare Dateien öffnet Briefing nie.
- Embeddings werden lokal berechnet; das Modell (`multilingual-e5-small`, ~120 MB) wird einmalig von Hugging Face geladen.
- MCP-Antworten kennzeichnen Notizinhalte als nicht vertrauenswürdige Daten, um das Risiko von Prompt-Injection zu senken.

Das vollständige Bedrohungsmodell steht in **[SECURITY.md](../../SECURITY.md)**. Sicherheitslücken bitte vertraulich melden.

## Tastenkürzel

| Kürzel | Aktion | Kürzel | Aktion |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Schnellwechsler | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Das zweite Gehirn fragen |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Befehlspalette | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Team-Ordner |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Neue Notiz | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Neues Projekt-Briefing |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Lesen / Bearbeiten | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Graph |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Tab öffnen / schließen | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Tagesnotiz |

Unter macOS <kbd>⌘</kbd> statt <kbd>Ctrl</kbd> verwenden.

## FAQ

**Ist das Obsidian?** Nein. Briefing ist ein unabhängiges Open-Source-Projekt, von Grund auf neu geschrieben. Es ist mit normalen Markdown-Ordnern kompatibel, du kannst also einen bestehenden Vault öffnen, steht aber in keiner Verbindung zu Obsidian und wird nicht von Obsidian unterstützt.

**Braucht es Internet?** Nur um Teammitglieder zu finden (die DHT) und das KI-Modell einmal herunterzuladen. Notizen, Suche und Claude-Zugriff funktionieren offline.

**Was passiert, wenn zwei Personen dieselbe Notiz bearbeiten?** Unterschiedliche Stellen werden automatisch zusammengeführt. Ändern sich dieselben Zeilen, bleiben beide Versionen erhalten: eine in der Notiz, die andere in einer Kopie `(conflito de …)` daneben.

**Wo liegen meine Daten?** In deinem Vault-Ordner (`.md`-Dateien). Briefings eigene Daten liegen in `<vault>/.briefing/` (Index, Verlauf) und im Benutzer-Konfigurationsordner (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Roadmap

- Übersetzung der Oberfläche (i18n)
- Mobile Begleit-App
- Optionales Relay für Netze, die direkte Verbindungen blockieren
- Berechtigungen pro Mitglied und Rotation des Team-Schlüssels
- Signierte und notarisierte Installer

## Mitwirken

Issues und Pull Requests sind willkommen. Siehe **[CONTRIBUTING.md](../../CONTRIBUTING.md)** für Einrichtung, Tests und Projektstruktur.

## Lizenz

[MIT](../../LICENSE) © 2026 Renan Kelm
