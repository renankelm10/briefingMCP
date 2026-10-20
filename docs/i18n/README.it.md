<div align="center">

<img src="../images/logo.svg" width="96" alt="Logo di Briefing">

# Briefing

**Il secondo cervello del tuo team: note Markdown locali, condivise peer‑to‑peer e leggibili da Claude.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Licenza: MIT](https://img.shields.io/badge/licenza-MIT-e3a43a.svg)](../../LICENSE)
![Piattaforme](https://img.shields.io/badge/piattaforme-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-pronto%20per%20Claude-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/Scarica-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="Scarica" height="40"></a>
<a href="https://github.com/renankelm10/briefingMCP/releases"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Frenankelm10%2FbriefingMCP%2Fmain%2Fdocs%2Fdownloads.json&style=for-the-badge" alt="Downloads" height="40"></a>


<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Italiano** · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Editor di Briefing con anteprima dal vivo, schede e backlink" width="900">

</div>

---

## Cos'è Briefing?

Briefing è un'app desktop per le note pensata per i team che vogliono **un'unica base di conoscenza condivisa senza un servizio cloud nel mezzo**.

- 📝 **Scrivi** in normali file Markdown che si trovano in una cartella del tuo computer (il tuo "vault").
- 🔄 **Condividi** una cartella con il team: ogni computer ne tiene una copia identica e le modifiche viaggiano **direttamente da un computer all'altro**, cifrate end‑to‑end, in pochi secondi.
- 🧠 **Chiedi** qualsiasi cosa: ogni nota viene indicizzata da un modello di IA che gira **sul tuo computer**, e **Claude** (o qualsiasi client MCP) può cercare, leggere e scrivere le tue note tramite il server MCP integrato.

Il risultato: tu e un collega potete lavorare ciascuno con il proprio Claude nello stesso momento, sulla stessa conoscenza aziendale, vedendo sempre l'ultima versione.

> Al momento l'interfaccia è in **portoghese brasiliano**. Le traduzioni sono benvenute: vedi [Contribuire](../../CONTRIBUTING.md).

## Come funziona

<div align="center"><img src="../images/architecture.svg" alt="Architettura: due computer che si sincronizzano direttamente, ognuno con un indice IA locale letto da Claude tramite MCP" width="860"></div>

1. **Crei un team** e scegli una cartella. Briefing genera un codice di invito come `BRF-7Q2M-…`.
2. **Il tuo collega incolla il codice.** I computer si trovano tramite la DHT pubblica di [Hyperswarm](https://github.com/holepunchto/hyperswarm), usata *solo* per la scoperta, e aprono una connessione diretta cifrata con Noise. Ogni lato dimostra di conoscere il codice prima che venga scambiato anche un solo file.
3. **Ogni modifica viene inviata subito**, che l'abbia scritta tu, il tuo collega o un Claude. Le modifiche simultanee vengono unite riga per riga (come in Git); se due persone cambiano le stesse righe, l'altra versione viene salvata come *copia di conflitto*, identica su tutti i computer: non si perde nulla.
4. **Ogni computer indicizza le note in locale** (embedding multilingue + ricerca per parole chiave). Claude interroga l'indice tramite MCP e riceve i passaggi più rilevanti in pochi millisecondi.

## Funzionalità

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Modalità lettura"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Cartelle del team"></td>
</tr>
<tr>
<td><b>Scrittura.</b> Editor con anteprima dal vivo, <code>[[link]]</code> con completamento automatico, backlink, tag, callout, attività, tabelle, incorporamenti, proprietà, incolla immagini, modelli, note giornaliere.</td>
<td><b>Cartelle del team.</b> Crea un team, condividi il codice e la cartella resta identica su tutti i computer. Presenza in tempo reale, unione, copie di conflitto, cronologia.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Ricerca semantica"></td>
<td><img src="../images/05-brain-claude.png" alt="Collegare Claude"></td>
</tr>
<tr>
<td><b>Secondo cervello.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> fa una domanda in linguaggio naturale. Ricerca ibrida (significato + parole esatte), completamente offline dopo il primo download del modello.</td>
<td><b>Claude via MCP.</b> Un clic registra il server MCP in Claude Code. Claude ottiene <code>search</code>, <code>read_note</code>, <code>write_note</code> e altro.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Vista a grafo"></td>
<td><img src="../images/06-tasks.png" alt="Pannello attività"></td>
</tr>
<tr>
<td><b>Grafo.</b> Guarda come si collegano le note; grafo locale, filtro, trascinamento e zoom.</td>
<td><b>Attività e agenda.</b> Tutte le <code>- [ ]</code> del vault in un unico pannello, più un calendario delle note giornaliere.</td>
</tr>
</table>

<details>
<summary><b>Elenco completo delle funzionalità</b></summary>

- Schede (ripristinate al riavvio), selettore rapido, tavolozza dei comandi, ricerca a testo pieno e per `#tag`
- Anteprima dal vivo: la sintassi Markdown si nasconde fuori dalla riga che stai modificando; tabelle, callout, immagini e caselle vengono visualizzati già formattati
- Anteprima al passaggio del mouse sui link, menzioni non collegate con collegamento in un clic
- Rinominare o spostare una nota aggiorna tutti i link che puntano a essa
- Modelli con variabili (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) e un modello pronto di **brief di progetto**
- Cronologia delle versioni per nota con ripristino; le eliminazioni finiscono nel cestino di sistema
- Esporta una nota in PDF
- Tema chiaro / scuro / di sistema, colore di accento, dimensione del testo, larghezza della riga, pannelli ridimensionabili, modalità focus
- Funziona con cartelle Markdown esistenti (compresi i vault di Obsidian)

</details>

## Installazione

Scarica l'ultima versione per il tuo sistema da **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| Sistema | File | Note |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Non ancora firmato: nell'avviso di SmartScreen fai clic su **Ulteriori informazioni → Esegui comunque**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Non ancora notarizzato: clic destro sull'app → **Apri**, oppure esegui `xattr -dr com.apple.quarantine /Applications/Briefing.app`. Mac Intel: compila dai sorgenti. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. Su Ubuntu 24.04+ preferisci il `.deb` (`sudo apt install ./briefing_*.deb`), che configura la sandbox di Chromium. |

Al primo avvio Briefing crea un vault di esempio in `Documenti/Briefing`. Usa **Arquivo → Abrir outro vault…** per aprire qualsiasi cartella.

### Compilare dai sorgenti

Richiede [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # avvia l'app
npm run dist         # crea l'installer per il tuo sistema (in release/)
```

## Cartelle del team in 3 passi

1. Apri come vault la cartella da condividere e premi <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → il codice di invito viene copiato. Invialo al collega tramite un canale privato.
3. Il collega apre **Equipes → Entrar numa equipe**, incolla il codice e sceglie una cartella vuota. I file arrivano non appena entrambi i computer sono online.

Briefing deve essere aperto su entrambi i computer per sincronizzare. Chiunque abbia il codice diventa membro a tutti gli effetti: trattalo come una password.

## Collegare Claude (MCP)

Apri **✦ Segundo cérebro → Conectar automaticamente**, oppure esegui:

```bash
claude mcp add briefing --scope user -- node "/percorso/di/briefingMCP/src/mcp/server.mjs"
```

Riavvia Claude Code. Il server espone il vault aperto e tutte le cartelle del team:

| Strumento | Cosa fa |
|---|---|
| `search` | Ricerca ibrida semantica + per parole chiave; restituisce i passaggi più rilevanti con file e riga |
| `read_note` | Contenuto completo di una nota (per percorso o solo per nome) |
| `list_notes` | Note di un vault o di una cartella, con data di modifica |
| `recent_changes` | Note modificate di recente, comprese le modifiche arrivate dai colleghi |
| `write_note` | Crea, sovrascrive o aggiunge testo a una nota (sincronizzata subito con il team) |
| `vault_info` | Vault, numero di note/passaggi indicizzati, stato della ricerca semantica |

Qualsiasi client MCP che supporti i server stdio funziona allo stesso modo. Usa `BRIEFING_VAULTS="/a;/b"` per scegliere i vault in modo esplicito.

## Sicurezza e privacy

- Nessun account, nessun server, nessuna telemetria. Le note sono normali file sul tuo disco.
- Le connessioni di sincronizzazione sono cifrate end‑to‑end e autenticate con il codice di invito; i file ricevuti dalla rete non vengono mai scritti fuori dalla cartella condivisa e Briefing non apre mai eseguibili ricevuti da altri.
- Gli embedding vengono calcolati in locale; il modello (`multilingual-e5-small`, ~120 MB) viene scaricato una sola volta da Hugging Face.
- Le risposte MCP contrassegnano il contenuto delle note come dati non affidabili per ridurre il rischio di prompt injection.

Leggi il modello di minaccia completo in **[SECURITY.md](../../SECURITY.md)**. Segnala le vulnerabilità in privato.

## Scorciatoie da tastiera

| Scorciatoia | Azione | Scorciatoia | Azione |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Selettore rapido | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Chiedi al secondo cervello |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Tavolozza dei comandi | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Cartelle del team |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Nuova nota | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Nuovo brief di progetto |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Lettura / modifica | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Grafo |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Nuova / chiudi scheda | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Nota giornaliera |

Su macOS usa <kbd>⌘</kbd> al posto di <kbd>Ctrl</kbd>.

## Domande frequenti

**È Obsidian?** No. Briefing è un progetto indipendente e open source, scritto da zero. È compatibile con le normali cartelle Markdown, quindi puoi aprire un vault esistente, ma non è affiliato né approvato da Obsidian.

**Serve internet?** Solo per trovare i colleghi (la DHT) e scaricare una volta il modello di IA. Note, ricerca e accesso di Claude funzionano offline.

**Cosa succede se due persone modificano la stessa nota?** Le parti diverse vengono unite automaticamente. Se cambiano le stesse righe, vengono conservate entrambe le versioni: una nella nota, l'altra in una copia `(conflito de …)` accanto.

**Dove sono i miei dati?** Nella cartella del tuo vault (file `.md`). I dati di Briefing si trovano in `<vault>/.briefing/` (indice, cronologia) e nella cartella di configurazione dell'utente (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Roadmap

- Traduzione dell'interfaccia (i18n)
- App mobile complementare
- Relay opzionale per le reti che bloccano le connessioni dirette
- Permessi per membro e rotazione della chiave del team
- Installer firmati e notarizzati

## Contribuire

Issue e pull request sono benvenute. Consulta **[CONTRIBUTING.md](../../CONTRIBUTING.md)** per configurazione, test e struttura del progetto.

## Licenza

[MIT](../../LICENSE) © 2026 Renan Kelm
