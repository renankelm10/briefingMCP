<div align="center">

<img src="../images/logo.svg" width="96" alt="Logo Briefing">

# Briefing

**Drugi mózg Twojego zespołu — lokalne notatki Markdown, udostępniane peer‑to‑peer i czytelne dla Claude.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Licencja: MIT](https://img.shields.io/badge/licencja-MIT-e3a43a.svg)](../../LICENSE)
![Platformy](https://img.shields.io/badge/platformy-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-gotowe%20dla%20Claude-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/Pobierz-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="Pobierz" height="40"></a>


<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · **Polski** · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Edytor Briefing z podglądem na żywo, kartami i linkami zwrotnymi" width="900">

</div>

---

## Czym jest Briefing?

Briefing to aplikacja do notatek na komputer, stworzona dla zespołów, które chcą **jednej wspólnej bazy wiedzy bez usługi chmurowej pośrodku**.

- 📝 **Pisz** w zwykłych plikach Markdown, które leżą w zwykłym folderze na Twoim komputerze (Twoim „vaulcie”).
- 🔄 **Udostępniaj** folder zespołowi: każdy komputer ma identyczną kopię, a zmiany trafiają **bezpośrednio z komputera na komputer**, szyfrowane end‑to‑end, w ciągu kilku sekund.
- 🧠 **Pytaj** o wszystko: każda notatka jest indeksowana przez model AI działający **na Twoim własnym komputerze**, a **Claude** (lub dowolny klient MCP) może przeszukiwać, czytać i zapisywać Twoje notatki przez wbudowany serwer MCP.

Efekt: Ty i współpracownik możecie jednocześnie pracować, każdy ze swoim Claude, na tej samej wiedzy firmy i zawsze widzieć najnowszą wersję.

> Interfejs jest obecnie w języku **portugalskim (brazylijskim)**. Tłumaczenia są mile widziane — zobacz [Współtworzenie](../../CONTRIBUTING.md).

## Jak to działa

<div align="center"><img src="../images/architecture.svg" alt="Architektura: dwa komputery synchronizujące się bezpośrednio, każdy z lokalnym indeksem AI czytanym przez Claude przez MCP" width="860"></div>

1. **Tworzysz zespół** i wybierasz folder. Briefing generuje kod zaproszenia, np. `BRF-7Q2M-…`.
2. **Współpracownik wkleja kod.** Komputery odnajdują się przez publiczną sieć DHT [Hyperswarm](https://github.com/holepunchto/hyperswarm) — używaną *wyłącznie* do wykrywania — i otwierają bezpośrednie połączenie szyfrowane protokołem Noise. Każda strona udowadnia, że zna kod, zanim zostanie wymieniony choćby jeden plik.
3. **Każda zmiana jest wysyłana natychmiast** — niezależnie od tego, czy wpisałeś ją Ty, współpracownik, czy Claude. Równoczesne zmiany są scalane linia po linii (jak w Git); jeśli dwie osoby zmienią te same linie, druga wersja zostaje zapisana jako *kopia konfliktu*, identyczna na każdym komputerze — nic nie ginie.
4. **Każdy komputer indeksuje notatki lokalnie** (wielojęzyczne embeddingi + wyszukiwanie słów kluczowych). Claude odpytuje indeks przez MCP i w milisekundach dostaje najtrafniejsze fragmenty.

## Funkcje

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Tryb czytania"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Foldery zespołu"></td>
</tr>
<tr>
<td><b>Pisanie.</b> Edytor z podglądem na żywo, <code>[[linki]]</code> z autouzupełnianiem, linki zwrotne, tagi, callouty, zadania, tabele, osadzenia, właściwości, wklejanie obrazów, szablony, notatki dzienne.</td>
<td><b>Foldery zespołu.</b> Utwórz zespół, udostępnij kod, a folder pozostanie identyczny na każdym komputerze. Obecność na żywo, scalanie, kopie konfliktów, historia.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Wyszukiwanie semantyczne"></td>
<td><img src="../images/05-brain-claude.png" alt="Połączenie z Claude"></td>
</tr>
<tr>
<td><b>Drugi mózg.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> zadaje pytanie w języku naturalnym. Wyszukiwanie hybrydowe (znaczenie + dokładne słowa), w pełni offline po pierwszym pobraniu modelu.</td>
<td><b>Claude przez MCP.</b> Jedno kliknięcie rejestruje serwer MCP w Claude Code. Claude dostaje <code>search</code>, <code>read_note</code>, <code>write_note</code> i więcej.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Widok grafu"></td>
<td><img src="../images/06-tasks.png" alt="Panel zadań"></td>
</tr>
<tr>
<td><b>Graf.</b> Zobacz, jak łączą się notatki; graf lokalny, filtr, przeciąganie i powiększanie.</td>
<td><b>Zadania i kalendarz.</b> Wszystkie <code>- [ ]</code> z vaultu w jednym panelu oraz kalendarz notatek dziennych.</td>
</tr>
</table>

<details>
<summary><b>Pełna lista funkcji</b></summary>

- Karty (przywracane po ponownym uruchomieniu), szybki przełącznik, paleta poleceń, wyszukiwanie pełnotekstowe i po `#tagu`
- Podgląd na żywo: składnia Markdown chowa się poza edytowaną linią; tabele, callouty, obrazy i pola wyboru są wyświetlane gotowe
- Podgląd po najechaniu na link, niepowiązane wzmianki z łączeniem jednym kliknięciem
- Zmiana nazwy lub przeniesienie notatki aktualizuje wszystkie linki do niej
- Szablony ze zmiennymi (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) oraz gotowy szablon **briefu projektu**
- Historia wersji każdej notatki z przywracaniem; usunięte pliki trafiają do kosza systemowego
- Eksport notatki do PDF
- Motyw jasny / ciemny / systemowy, kolor akcentu, rozmiar tekstu, szerokość linii, zmienne rozmiary paneli, tryb skupienia
- Działa z istniejącymi folderami Markdown (także z vaultami Obsidian)

</details>

## Instalacja

Pobierz najnowszą wersję dla swojego systemu z **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| System | Plik | Uwagi |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Jeszcze bez podpisu cyfrowego: w ostrzeżeniu SmartScreen kliknij **Więcej informacji → Uruchom mimo to**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Jeszcze bez notaryzacji: kliknij aplikację prawym przyciskiem → **Otwórz** lub uruchom `xattr -dr com.apple.quarantine /Applications/Briefing.app`. Mac z procesorem Intel: zbuduj ze źródeł. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. Na Ubuntu 24.04+ lepiej użyć `.deb` (`sudo apt install ./briefing_*.deb`), który konfiguruje sandbox Chromium. |

Przy pierwszym uruchomieniu Briefing tworzy przykładowy vault w `Dokumenty/Briefing`. Użyj **Arquivo → Abrir outro vault…**, aby otworzyć dowolny folder.

### Budowanie ze źródeł

Wymaga [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # uruchamia aplikację
npm run dist         # buduje instalator dla Twojego systemu (w release/)
```

## Foldery zespołu w 3 krokach

1. Otwórz jako vault folder, który chcesz udostępnić, i naciśnij <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → kod zaproszenia zostaje skopiowany. Wyślij go współpracownikowi prywatnym kanałem.
3. Współpracownik otwiera **Equipes → Entrar numa equipe**, wkleja kod i wybiera pusty folder. Pliki przychodzą, gdy tylko oba komputery są online.

Briefing musi być uruchomiony na obu komputerach, aby synchronizować. Każdy, kto ma kod, staje się pełnoprawnym członkiem — traktuj go jak hasło.

## Połączenie z Claude (MCP)

Otwórz **✦ Segundo cérebro → Conectar automaticamente** lub uruchom:

```bash
claude mcp add briefing --scope user -- node "/sciezka/do/briefingMCP/src/mcp/server.mjs"
```

Uruchom ponownie Claude Code. Serwer udostępnia otwarty vault i wszystkie foldery zespołów:

| Narzędzie | Co robi |
|---|---|
| `search` | Wyszukiwanie hybrydowe semantyczne + słowa kluczowe; zwraca najtrafniejsze fragmenty z plikiem i linią |
| `read_note` | Pełna treść notatki (po ścieżce lub samej nazwie) |
| `list_notes` | Notatki w vaulcie lub folderze, z czasem modyfikacji |
| `recent_changes` | Ostatnio zmienione notatki — także zmiany, które przyszły od współpracowników |
| `write_note` | Tworzy, nadpisuje lub dopisuje do notatki (od razu synchronizowane z zespołem) |
| `vault_info` | Vaulty, liczba zindeksowanych notatek/fragmentów, stan wyszukiwania semantycznego |

Każdy klient MCP obsługujący serwery stdio działa tak samo. Użyj `BRIEFING_VAULTS="/a;/b"`, aby jawnie wybrać vaulty.

## Bezpieczeństwo i prywatność

- Bez konta, bez serwera, bez telemetrii. Notatki to zwykłe pliki na Twoim dysku.
- Połączenia synchronizacji są szyfrowane end‑to‑end i uwierzytelniane kodem zaproszenia; pliki z sieci nigdy nie są zapisywane poza udostępnionym folderem, a Briefing nigdy nie otwiera plików wykonywalnych otrzymanych od innych.
- Embeddingi są liczone lokalnie; model (`multilingual-e5-small`, ~120 MB) jest pobierany jednorazowo z Hugging Face.
- Odpowiedzi MCP oznaczają treść notatek jako niezaufane dane, aby ograniczyć ryzyko prompt injection.

Pełny model zagrożeń znajdziesz w **[SECURITY.md](../../SECURITY.md)**. Luki bezpieczeństwa zgłaszaj prywatnie.

## Skróty klawiszowe

| Skrót | Działanie | Skrót | Działanie |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Szybki przełącznik | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Zapytaj drugi mózg |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Paleta poleceń | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Foldery zespołu |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Nowa notatka | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Nowy brief projektu |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Czytanie / edycja | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Graf |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Nowa / zamknij kartę | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Notatka dzienna |

Na macOS używaj <kbd>⌘</kbd> zamiast <kbd>Ctrl</kbd>.

## FAQ

**Czy to Obsidian?** Nie. Briefing to niezależny projekt open source napisany od zera. Jest zgodny ze zwykłymi folderami Markdown, więc możesz otworzyć istniejący vault, ale nie jest powiązany z Obsidian ani przez niego wspierany.

**Czy potrzebny jest internet?** Tylko do znalezienia współpracowników (DHT) i jednorazowego pobrania modelu AI. Notatki, wyszukiwanie i dostęp Claude działają offline.

**Co jeśli dwie osoby edytują tę samą notatkę?** Różne fragmenty są scalane automatycznie. Jeśli zmienią się te same linie, zachowane zostają obie wersje: jedna w notatce, druga w kopii `(conflito de …)` obok.

**Gdzie są moje dane?** W folderze vaultu (pliki `.md`). Dane samego Briefing znajdują się w `<vault>/.briefing/` (indeks, historia) oraz w folderze konfiguracji użytkownika (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Plany

- Tłumaczenie interfejsu (i18n)
- Aplikacja mobilna
- Opcjonalny przekaźnik (relay) dla sieci blokujących bezpośrednie połączenia
- Uprawnienia dla poszczególnych członków i rotacja klucza zespołu
- Podpisane i notaryzowane instalatory

## Współtworzenie

Zgłoszenia i pull requesty są mile widziane. Zobacz **[CONTRIBUTING.md](../../CONTRIBUTING.md)** — konfiguracja, testy i struktura projektu.

## Licencja

[MIT](../../LICENSE) © 2026 Renan Kelm
