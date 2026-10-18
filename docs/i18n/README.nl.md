<div align="center">

<img src="../images/logo.svg" width="96" alt="Briefing-logo">

# Briefing

**Het tweede brein van je team — lokale Markdown-notities, peer‑to‑peer gedeeld en leesbaar voor Claude.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Licentie: MIT](https://img.shields.io/badge/licentie-MIT-e3a43a.svg)](../../LICENSE)
![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-klaar%20voor%20Claude-d97757)

<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · **Nederlands** · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Briefing-editor met live voorbeeld, tabbladen en backlinks" width="900">

</div>

---

## Wat is Briefing?

Briefing is een notitie-app voor de desktop, gemaakt voor teams die **één gedeelde kennisbank willen zonder clouddienst ertussen**.

- 📝 **Schrijf** in gewone Markdown-bestanden in een normale map op je computer (je "vault").
- 🔄 **Deel** een map met je team: elke computer houdt een identieke kopie en wijzigingen gaan **rechtstreeks van computer naar computer**, end‑to‑end versleuteld, binnen enkele seconden.
- 🧠 **Vraag** alles: elke notitie wordt geïndexeerd door een AI-model dat **op je eigen machine** draait, en **Claude** (of elke MCP-client) kan je notities doorzoeken, lezen en schrijven via de ingebouwde MCP-server.

Het resultaat: jij en een collega kunnen tegelijk elk met jullie eigen Claude werken aan dezelfde bedrijfskennis, en zien altijd de nieuwste versie.

> De interface is momenteel in het **Braziliaans-Portugees**. Vertalingen zijn welkom — zie [Bijdragen](../../CONTRIBUTING.md).

## Hoe het werkt

<div align="center"><img src="../images/architecture.svg" alt="Architectuur: twee computers die direct synchroniseren, elk met een lokale AI-index die Claude via MCP leest" width="860"></div>

1. **Je maakt een team aan** en kiest een map. Briefing maakt een uitnodigingscode zoals `BRF-7Q2M-…`.
2. **Je collega plakt de code.** De computers vinden elkaar via de openbare [Hyperswarm](https://github.com/holepunchto/hyperswarm)-DHT — *alleen* voor ontdekking — en openen een directe, met Noise versleutelde verbinding. Elke kant bewijst dat hij de code kent voordat er ook maar één bestand wordt uitgewisseld.
3. **Elke wijziging wordt direct verzonden**, of jij, je collega of een Claude hem nu schreef. Gelijktijdige wijzigingen worden regel voor regel samengevoegd (zoals Git); als twee mensen dezelfde regels wijzigen, wordt de andere versie bewaard als *conflictkopie*, identiek op elke computer — er gaat niets verloren.
4. **Elke computer indexeert de notities lokaal** (meertalige embeddings + zoeken op trefwoorden). Claude bevraagt de index via MCP en krijgt binnen milliseconden de meest relevante passages.

## Functies

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Leesmodus"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Teammappen"></td>
</tr>
<tr>
<td><b>Schrijven.</b> Editor met live voorbeeld, <code>[[links]]</code> met automatisch aanvullen, backlinks, tags, callouts, taken, tabellen, insluitingen, eigenschappen, afbeeldingen plakken, sjablonen, dagnotities.</td>
<td><b>Teammappen.</b> Maak een team, deel de code en de map blijft op elke computer identiek. Live aanwezigheid, samenvoegen, conflictkopieën, geschiedenis.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Semantisch zoeken"></td>
<td><img src="../images/05-brain-claude.png" alt="Claude koppelen"></td>
</tr>
<tr>
<td><b>Tweede brein.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> stelt een vraag in gewone taal. Hybride zoeken (betekenis + exacte woorden), volledig offline na de eerste download van het model.</td>
<td><b>Claude via MCP.</b> Eén klik registreert de MCP-server in Claude Code. Claude krijgt <code>search</code>, <code>read_note</code>, <code>write_note</code> en meer.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Grafiekweergave"></td>
<td><img src="../images/06-tasks.png" alt="Takenpaneel"></td>
</tr>
<tr>
<td><b>Grafiek.</b> Zie hoe notities verbonden zijn; lokale grafiek, filter, slepen en zoomen.</td>
<td><b>Taken & agenda.</b> Alle <code>- [ ]</code> uit de vault in één paneel, plus een kalender met dagnotities.</td>
</tr>
</table>

<details>
<summary><b>Volledige lijst met functies</b></summary>

- Tabbladen (hersteld bij herstart), snelle wisselaar, opdrachtpalet, zoeken in volledige tekst en op `#tag`
- Live voorbeeld: Markdown-opmaak verdwijnt buiten de regel die je bewerkt; tabellen, callouts, afbeeldingen en selectievakjes worden direct weergegeven
- Voorbeeld bij aanwijzen van links, niet-gekoppelde vermeldingen met koppelen in één klik
- Een notitie hernoemen of verplaatsen werkt elke link ernaar bij
- Sjablonen met variabelen (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) en een kant-en-klaar sjabloon voor een **projectbriefing**
- Versiegeschiedenis per notitie met herstel; verwijderde items gaan naar de prullenbak van het systeem
- Notitie exporteren naar PDF
- Licht / donker / systeemthema, accentkleur, lettergrootte, regelbreedte, aanpasbare panelen, focusmodus
- Werkt met bestaande Markdown-mappen (ook Obsidian-vaults)

</details>

## Installatie

Download de nieuwste versie voor je systeem via **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| Systeem | Bestand | Opmerkingen |
|---|---|---|
| Windows 10/11 | `Briefing Setup x.y.z.exe` | Nog niet ondertekend: klik in de SmartScreen-waarschuwing op **Meer informatie → Toch uitvoeren**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Nog niet genotariseerd: rechtsklik op de app → **Open**, of voer `xattr -dr com.apple.quarantine /Applications/Briefing.app` uit. Intel-Macs: bouw vanaf de broncode. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. Gebruik op Ubuntu 24.04+ liever de `.deb` (`sudo apt install ./briefing_*.deb`), die de Chromium-sandbox instelt. |

Bij de eerste start maakt Briefing een voorbeeldvault in `Documenten/Briefing`. Gebruik **Arquivo → Abrir outro vault…** om een willekeurige map te openen.

### Bouwen vanaf de broncode

Vereist [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # start de app
npm run dist         # maakt een installatieprogramma voor je systeem (in release/)
```

## Teammappen in 3 stappen

1. Open de map die je wilt delen als vault en druk op <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → de uitnodigingscode wordt gekopieerd. Stuur hem via een privékanaal naar je collega.
3. Je collega opent **Equipes → Entrar numa equipe**, plakt de code en kiest een lege map. De bestanden komen binnen zodra beide computers online zijn.

Briefing moet op beide computers open zijn om te synchroniseren. Iedereen met de code wordt volwaardig lid — behandel hem als een wachtwoord.

## Claude koppelen (MCP)

Open **✦ Segundo cérebro → Conectar automaticamente**, of voer uit:

```bash
claude mcp add briefing --scope user -- node "/pad/naar/briefingMCP/src/mcp/server.mjs"
```

Start Claude Code opnieuw. De server stelt de geopende vault en alle teammappen beschikbaar:

| Hulpmiddel | Wat het doet |
|---|---|
| `search` | Hybride semantisch + trefwoordzoeken; geeft de meest relevante passages met bestand en regel |
| `read_note` | Volledige inhoud van een notitie (via pad of alleen naam) |
| `list_notes` | Notities in een vault of map, met wijzigingstijd |
| `recent_changes` | Recent gewijzigde notities — ook wijzigingen die van teamgenoten kwamen |
| `write_note` | Een notitie maken, overschrijven of aanvullen (direct gesynchroniseerd met het team) |
| `vault_info` | Vaults, aantal geïndexeerde notities/passages, status van semantisch zoeken |

Elke MCP-client die stdio-servers ondersteunt werkt op dezelfde manier. Gebruik `BRIEFING_VAULTS="/a;/b"` om vaults expliciet te kiezen.

## Beveiliging & privacy

- Geen account, geen server, geen telemetrie. Notities zijn gewone bestanden op je schijf.
- Synchronisatieverbindingen zijn end‑to‑end versleuteld en geverifieerd met de uitnodigingscode; bestanden uit het netwerk worden nooit buiten de gedeelde map geschreven en Briefing opent nooit uitvoerbare bestanden van anderen.
- Embeddings worden lokaal berekend; het model (`multilingual-e5-small`, ~120 MB) wordt eenmalig van Hugging Face gedownload.
- MCP-antwoorden markeren notitie-inhoud als onbetrouwbare gegevens om het risico op prompt-injectie te verkleinen.

Lees het volledige dreigingsmodel in **[SECURITY.md](../../SECURITY.md)**. Meld kwetsbaarheden vertrouwelijk.

## Sneltoetsen

| Sneltoets | Actie | Sneltoets | Actie |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Snelle wisselaar | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Het tweede brein vragen |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Opdrachtpalet | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Teammappen |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Nieuwe notitie | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Nieuwe projectbriefing |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Lezen / bewerken | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Grafiek |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Nieuw / tabblad sluiten | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Dagnotitie |

Gebruik op macOS <kbd>⌘</kbd> in plaats van <kbd>Ctrl</kbd>.

## Veelgestelde vragen

**Is dit Obsidian?** Nee. Briefing is een onafhankelijk opensourceproject, vanaf nul geschreven. Het werkt met gewone Markdown-mappen, dus je kunt een bestaande vault openen, maar het is niet gelieerd aan of goedgekeurd door Obsidian.

**Is internet nodig?** Alleen om teamgenoten te vinden (de DHT) en om het AI-model één keer te downloaden. Notities, zoeken en toegang voor Claude werken offline.

**Wat als twee mensen dezelfde notitie bewerken?** Verschillende delen worden automatisch samengevoegd. Veranderen dezelfde regels, dan blijven beide versies bewaard: de ene in de notitie, de andere in een kopie `(conflito de …)` ernaast.

**Waar staan mijn gegevens?** In je vaultmap (`.md`-bestanden). Briefings eigen gegevens staan in `<vault>/.briefing/` (index, geschiedenis) en in je gebruikersconfiguratiemap (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Roadmap

- Vertaling van de interface (i18n)
- Mobiele begeleidende app
- Optionele relay voor netwerken die directe verbindingen blokkeren
- Rechten per lid en vernieuwen van de teamsleutel
- Ondertekende en genotariseerde installatieprogramma's

## Bijdragen

Issues en pull requests zijn welkom. Zie **[CONTRIBUTING.md](../../CONTRIBUTING.md)** voor installatie, tests en projectstructuur.

## Licentie

[MIT](../../LICENSE) © 2026 Renan Kelm
