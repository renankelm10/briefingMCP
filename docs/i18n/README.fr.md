<div align="center">

<img src="../images/logo.svg" width="96" alt="Logo de Briefing">

# Briefing

**Le second cerveau de votre équipe : des notes Markdown locales, partagées en pair à pair et lisibles par Claude.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Licence : MIT](https://img.shields.io/badge/licence-MIT-e3a43a.svg)](../../LICENSE)
![Plateformes](https://img.shields.io/badge/plateformes-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-prêt%20pour%20Claude-d97757)

<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · **Français** · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Éditeur Briefing avec aperçu en direct, onglets et rétroliens" width="900">

</div>

---

## Qu'est-ce que Briefing ?

Briefing est une application de notes pour ordinateur, pensée pour les équipes qui veulent **une base de connaissances partagée sans service cloud au milieu**.

- 📝 **Écrivez** dans de simples fichiers Markdown, rangés dans un dossier ordinaire de votre ordinateur (votre « vault »).
- 🔄 **Partagez** un dossier avec votre équipe : chaque ordinateur garde une copie identique et les modifications circulent **directement d'un ordinateur à l'autre**, chiffrées de bout en bout, en quelques secondes.
- 🧠 **Posez vos questions** : chaque note est indexée par un modèle d'IA qui tourne **sur votre propre machine**, et **Claude** (ou tout client MCP) peut chercher, lire et écrire dans vos notes grâce au serveur MCP intégré.

Résultat : vous et un collègue pouvez travailler chacun avec votre Claude en même temps, sur les mêmes connaissances de l'entreprise, en voyant toujours la dernière version.

> L'interface est pour l'instant en **portugais du Brésil**. Les traductions sont les bienvenues — voir [Contribuer](../../CONTRIBUTING.md).

## Comment ça marche

<div align="center"><img src="../images/architecture.svg" alt="Architecture : deux ordinateurs synchronisés directement, chacun avec un index IA local lu par Claude via MCP" width="860"></div>

1. **Vous créez une équipe** et choisissez un dossier. Briefing génère un code d'invitation du type `BRF-7Q2M-…`.
2. **Votre collègue colle le code.** Les ordinateurs se trouvent grâce à la DHT publique d'[Hyperswarm](https://github.com/holepunchto/hyperswarm) — utilisée *uniquement* pour la découverte — puis ouvrent une connexion directe chiffrée avec Noise. Chaque côté prouve qu'il connaît le code avant le moindre échange de fichier.
3. **Chaque modification est envoyée immédiatement**, que ce soit vous, votre collègue ou un Claude qui l'ait écrite. Les éditions simultanées sont fusionnées ligne par ligne (comme Git) ; si deux personnes modifient les mêmes lignes, l'autre version est enregistrée comme *copie de conflit*, identique sur tous les ordinateurs — rien n'est perdu.
4. **Chaque ordinateur indexe les notes localement** (embeddings multilingues + recherche par mots-clés). Claude interroge l'index via MCP et obtient les passages les plus pertinents en quelques millisecondes.

## Fonctionnalités

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Mode lecture"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Dossiers d'équipe"></td>
</tr>
<tr>
<td><b>Écriture.</b> Éditeur avec aperçu en direct, <code>[[liens]]</code> avec autocomplétion, rétroliens, tags, callouts, tâches, tableaux, intégrations, propriétés, collage d'images, modèles, notes quotidiennes.</td>
<td><b>Dossiers d'équipe.</b> Créez une équipe, partagez le code, et le dossier reste identique sur tous les ordinateurs. Présence en direct, fusion, copies de conflit, historique.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Recherche sémantique"></td>
<td><img src="../images/05-brain-claude.png" alt="Connecter Claude"></td>
</tr>
<tr>
<td><b>Second cerveau.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> pose une question en langage naturel. Recherche hybride (sens + mots exacts), entièrement hors ligne après le premier téléchargement du modèle.</td>
<td><b>Claude via MCP.</b> Un clic enregistre le serveur MCP dans Claude Code. Claude obtient <code>search</code>, <code>read_note</code>, <code>write_note</code> et plus encore.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Vue graphe"></td>
<td><img src="../images/06-tasks.png" alt="Panneau des tâches"></td>
</tr>
<tr>
<td><b>Graphe.</b> Voyez comment les notes sont reliées ; graphe local, filtre, glisser et zoomer.</td>
<td><b>Tâches et agenda.</b> Toutes les <code>- [ ]</code> du vault dans un seul panneau, plus un calendrier des notes quotidiennes.</td>
</tr>
</table>

<details>
<summary><b>Liste complète des fonctionnalités</b></summary>

- Onglets (restaurés au redémarrage), sélecteur rapide, palette de commandes, recherche plein texte et par `#tag`
- Aperçu en direct : la syntaxe Markdown se masque hors de la ligne en cours ; tableaux, callouts, images et cases à cocher s'affichent rendus
- Aperçu au survol des liens, mentions non liées avec liaison en un clic
- Renommer ou déplacer une note met à jour tous les liens qui pointent vers elle
- Modèles avec variables (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) et un modèle prêt à l'emploi de **brief de projet**
- Historique des versions par note avec restauration ; les suppressions vont dans la corbeille du système
- Exporter une note en PDF
- Thème clair / sombre / système, couleur d'accent, taille du texte, largeur de ligne, panneaux redimensionnables, mode concentration
- Fonctionne avec des dossiers Markdown existants (y compris les vaults Obsidian)

</details>

## Installation

Téléchargez la dernière version pour votre système depuis **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| Système | Fichier | Remarques |
|---|---|---|
| Windows 10/11 | `Briefing Setup x.y.z.exe` | Pas encore signé : sur l'avertissement SmartScreen, cliquez sur **Informations complémentaires → Exécuter quand même**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Pas encore notarisé : clic droit sur l'app → **Ouvrir**, ou exécutez `xattr -dr com.apple.quarantine /Applications/Briefing.app`. Mac Intel : compilez depuis les sources. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage : `chmod +x Briefing-*.AppImage`. Sur Ubuntu 24.04+, préférez le `.deb` (`sudo apt install ./briefing_*.deb`), qui configure la sandbox de Chromium. |

Au premier lancement, Briefing crée un vault d'exemple dans `Documents/Briefing`. Utilisez **Arquivo → Abrir outro vault…** pour ouvrir n'importe quel dossier.

### Compiler depuis les sources

Nécessite [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # lance l'application
npm run dist         # crée un installateur pour votre système (dans release/)
```

## Dossiers d'équipe en 3 étapes

1. Ouvrez comme vault le dossier à partager, puis appuyez sur <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → le code d'invitation est copié. Envoyez-le à votre collègue par un canal privé.
3. Votre collègue ouvre **Equipes → Entrar numa equipe**, colle le code et choisit un dossier vide. Les fichiers arrivent dès que les deux ordinateurs sont en ligne.

Briefing doit être ouvert sur les deux ordinateurs pour synchroniser. Toute personne qui possède le code devient membre à part entière : traitez-le comme un mot de passe.

## Connecter Claude (MCP)

Ouvrez **✦ Segundo cérebro → Conectar automaticamente**, ou exécutez :

```bash
claude mcp add briefing --scope user -- node "/chemin/vers/briefingMCP/src/mcp/server.mjs"
```

Redémarrez Claude Code. Le serveur expose le vault ouvert et tous les dossiers d'équipe :

| Outil | Rôle |
|---|---|
| `search` | Recherche hybride sémantique + mots-clés ; renvoie les passages les plus pertinents avec fichier et ligne |
| `read_note` | Contenu complet d'une note (par chemin ou simplement par nom) |
| `list_notes` | Notes d'un vault ou d'un dossier, avec date de modification |
| `recent_changes` | Notes modifiées récemment — y compris les changements reçus des collègues |
| `write_note` | Crée, écrase ou complète une note (synchronisée immédiatement avec l'équipe) |
| `vault_info` | Vaults, nombre de notes/passages indexés, état de la recherche sémantique |

Tout client MCP compatible avec les serveurs stdio fonctionne de la même façon. Utilisez `BRIEFING_VAULTS="/a;/b"` pour choisir les vaults explicitement.

## Sécurité et confidentialité

- Pas de compte, pas de serveur, pas de télémétrie. Les notes sont de simples fichiers sur votre disque.
- Les connexions de synchronisation sont chiffrées de bout en bout et authentifiées par le code d'invitation ; les fichiers reçus du réseau ne peuvent jamais être écrits hors du dossier partagé, et Briefing n'ouvre jamais les exécutables reçus d'autres personnes.
- Les embeddings sont calculés localement ; le modèle (`multilingual-e5-small`, ~120 Mo) est téléchargé une seule fois depuis Hugging Face.
- Les réponses MCP signalent le contenu des notes comme données non fiables afin de limiter les risques d'injection de prompt.

Lisez le modèle de menaces complet dans **[SECURITY.md](../../SECURITY.md)**. Signalez les vulnérabilités en privé.

## Raccourcis clavier

| Raccourci | Action | Raccourci | Action |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Sélecteur rapide | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Interroger le second cerveau |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Palette de commandes | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Dossiers d'équipe |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Nouvelle note | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Nouveau brief de projet |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Lecture / édition | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Graphe |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Nouvel / fermer l'onglet | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Note quotidienne |

Sur macOS, utilisez <kbd>⌘</kbd> à la place de <kbd>Ctrl</kbd>.

## FAQ

**Est-ce Obsidian ?** Non. Briefing est un projet indépendant et open source, écrit de zéro. Il est compatible avec les dossiers Markdown ordinaires, vous pouvez donc ouvrir un vault existant, mais il n'est ni affilié à Obsidian ni approuvé par lui.

**Faut-il Internet ?** Seulement pour trouver les collègues (la DHT) et télécharger une fois le modèle d'IA. Les notes, la recherche et l'accès de Claude fonctionnent hors ligne.

**Que se passe-t-il si deux personnes modifient la même note ?** Les parties différentes sont fusionnées automatiquement. Si les mêmes lignes changent, les deux versions sont conservées : l'une dans la note, l'autre dans une copie `(conflito de …)` à côté.

**Où sont mes données ?** Dans le dossier de votre vault (fichiers `.md`). Les données propres à Briefing sont dans `<vault>/.briefing/` (index, historique) et dans le dossier de configuration utilisateur (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Feuille de route

- Traduction de l'interface (i18n)
- Application mobile complémentaire
- Relais optionnel pour les réseaux qui bloquent les connexions directes
- Permissions par membre et renouvellement de la clé d'équipe
- Installateurs signés et notarisés

## Contribuer

Issues et pull requests bienvenues. Consultez **[CONTRIBUTING.md](../../CONTRIBUTING.md)** pour l'installation, les tests et l'organisation du projet.

## Licence

[MIT](../../LICENSE) © 2026 Renan Kelm
