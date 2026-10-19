<div align="center">

<img src="../images/logo.svg" width="96" alt="Logo do Briefing">

# Briefing

**O segundo cérebro da sua equipe — notas em Markdown locais, compartilhadas ponto a ponto e legíveis pelo Claude.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/licença-MIT-e3a43a.svg)](../../LICENSE)
![Plataformas](https://img.shields.io/badge/plataformas-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-pronto%20para%20Claude-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/Baixar-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="Baixar" height="40"></a>


<!-- langs -->
[English](../../README.md) · **Português** · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Editor do Briefing com Live Preview, abas e backlinks" width="900">

</div>

---

## O que é o Briefing?

O Briefing é um app de notas para desktop feito para equipes que querem **uma base de conhecimento compartilhada sem um serviço de nuvem no meio**.

- 📝 **Escreva** em arquivos Markdown comuns, numa pasta normal do seu computador (o "vault").
- 🔄 **Compartilhe** uma pasta com a equipe: cada computador mantém uma cópia idêntica e as mudanças viajam **direto de um computador para o outro**, com criptografia ponta a ponta, em segundos.
- 🧠 **Pergunte** qualquer coisa: cada nota é indexada por uma IA que roda **na sua própria máquina**, e o **Claude** (ou qualquer cliente MCP) pode buscar, ler e escrever nas suas notas pelo servidor MCP embutido.

Resultado: você e um colega podem trabalhar cada um com o seu Claude ao mesmo tempo, sobre o mesmo conhecimento da empresa, sempre vendo a versão mais recente.

> A interface hoje está em **português do Brasil**. Traduções são bem-vindas — veja [Como contribuir](../../CONTRIBUTING.md).

## Como funciona

<div align="center"><img src="../images/architecture.svg" alt="Arquitetura: dois computadores sincronizando direto, cada um com um índice de IA local lido pelo Claude via MCP" width="860"></div>

1. **Você cria uma equipe** e escolhe uma pasta. O Briefing gera um código de convite como `BRF-7Q2M-…`.
2. **Seu colega cola o código.** Os computadores se encontram pela DHT pública do [Hyperswarm](https://github.com/holepunchto/hyperswarm) — usada *só* para se acharem — e abrem uma conexão direta, criptografada com Noise. Cada lado prova que conhece o código antes de qualquer arquivo ser trocado.
3. **Toda mudança é enviada na hora**, seja sua, do colega ou de um Claude. Edições simultâneas são mescladas linha a linha (como no Git); se duas pessoas mudarem as mesmas linhas, a outra versão vira uma *cópia de conflito*, idêntica em todos os computadores — nada se perde.
4. **Cada computador indexa as notas localmente** (embeddings multilíngues + busca por palavras). O Claude consulta o índice via MCP e recebe os trechos mais relevantes em milissegundos.

## Recursos

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Modo leitura"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Pastas de equipe"></td>
</tr>
<tr>
<td><b>Escrita.</b> Editor com Live Preview, <code>[[links]]</code> com autocompletar, backlinks, tags, callouts, tarefas, tabelas, embeds, propriedades, colar imagens, modelos, notas diárias.</td>
<td><b>Pastas de equipe.</b> Crie uma equipe, compartilhe o código e a pasta fica idêntica em todos os computadores. Presença ao vivo, mesclagem, cópias de conflito, histórico.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Busca semântica"></td>
<td><img src="../images/05-brain-claude.png" alt="Conectar o Claude"></td>
</tr>
<tr>
<td><b>Segundo cérebro.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> faz uma pergunta em linguagem natural. Busca híbrida (significado + palavras exatas), totalmente offline depois do primeiro download do modelo.</td>
<td><b>Claude via MCP.</b> Um clique registra o servidor MCP no Claude Code. O Claude ganha <code>search</code>, <code>read_note</code>, <code>write_note</code> e mais.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Grafo"></td>
<td><img src="../images/06-tasks.png" alt="Painel de tarefas"></td>
</tr>
<tr>
<td><b>Grafo.</b> Veja como as notas se conectam; grafo local, filtro, arrastar e zoom.</td>
<td><b>Tarefas e agenda.</b> Todas as <code>- [ ]</code> do vault num painel só, mais um calendário de notas diárias.</td>
</tr>
</table>

<details>
<summary><b>Lista completa de recursos</b></summary>

- Abas (restauradas ao reabrir), abertura rápida, paleta de comandos, busca por texto e por `#tag`
- Live Preview: a marcação Markdown some fora da linha em edição; tabelas, callouts, imagens e caixas de tarefa aparecem renderizados
- Prévia ao passar o mouse sobre links, menções não vinculadas com vínculo em um clique
- Renomear ou mover uma nota atualiza todos os links para ela
- Modelos com variáveis (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) e um modelo pronto de **briefing de projeto**
- Histórico de versões por nota com restauração; exclusões vão para a lixeira do sistema
- Exportar nota para PDF
- Tema claro / escuro / do sistema, cor de destaque, tamanho do texto, largura da linha, painéis redimensionáveis, modo foco
- Funciona com pastas de Markdown existentes (inclusive vaults do Obsidian)

</details>

## Instalação

Baixe a versão mais recente para o seu sistema em **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| Sistema | Arquivo | Observações |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Ainda sem assinatura digital: no aviso do SmartScreen clique em **Mais informações → Executar assim mesmo**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Ainda sem notarização: clique com o botão direito no app → **Abrir**, ou rode `xattr -dr com.apple.quarantine /Applications/Briefing.app`. Macs Intel: compile a partir do código. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. No Ubuntu 24.04+ prefira o `.deb` (`sudo apt install ./briefing_*.deb`), que configura o sandbox do Chromium. |

Na primeira execução o Briefing cria um vault de exemplo em `Documentos/Briefing`. Use **Arquivo → Abrir outro vault…** para abrir qualquer pasta.

### Compilar a partir do código

Requer [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # roda o app
npm run dist         # gera o instalador do seu sistema (em release/)
```

## Pastas de equipe em 3 passos

1. Abra a pasta que você quer compartilhar como vault e pressione <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → o código de convite é copiado. Envie para o colega por um canal privado.
3. O colega abre **Equipes → Entrar numa equipe**, cola o código e escolhe uma pasta vazia. Os arquivos chegam assim que os dois computadores estiverem online.

O Briefing precisa estar aberto nos dois computadores para sincronizar. Quem tem o código vira membro completo — trate-o como uma senha.

## Conectar o Claude (MCP)

Abra **✦ Segundo cérebro → Conectar automaticamente**, ou rode:

```bash
claude mcp add briefing --scope user -- node "/caminho/para/briefingMCP/src/mcp/server.mjs"
```

Reinicie o Claude Code. O servidor expõe o vault aberto e todas as pastas de equipe:

| Ferramenta | O que faz |
|---|---|
| `search` | Busca híbrida por significado + palavras; retorna os trechos mais relevantes com arquivo e linha |
| `read_note` | Conteúdo completo de uma nota (pelo caminho ou só pelo nome) |
| `list_notes` | Notas de um vault ou pasta, com data de modificação |
| `recent_changes` | Notas modificadas recentemente — inclusive as que chegaram dos colegas |
| `write_note` | Cria, sobrescreve ou acrescenta a uma nota (sincronizada na hora com a equipe) |
| `vault_info` | Vaults, quantidade de notas/trechos indexados, status da busca semântica |

Qualquer cliente MCP com suporte a servidores stdio funciona do mesmo jeito. Use `BRIEFING_VAULTS="/a;/b"` para escolher os vaults manualmente.

## Segurança e privacidade

- Sem conta, sem servidor, sem telemetria. As notas são arquivos comuns no seu disco.
- As conexões de sincronização têm criptografia ponta a ponta e são autenticadas pelo código de convite; arquivos vindos da rede nunca são gravados fora da pasta compartilhada, e executáveis recebidos de outras pessoas nunca são abertos pelo Briefing.
- Os embeddings são calculados localmente; o modelo (`multilingual-e5-small`, ~120 MB) é baixado uma única vez do Hugging Face.
- As respostas do MCP marcam o conteúdo das notas como dado não confiável, para reduzir o risco de prompt injection.

Leia o modelo de ameaças completo em **[SECURITY.md](../../SECURITY.md)**. Reporte vulnerabilidades de forma privada.

## Atalhos de teclado

| Atalho | Ação | Atalho | Ação |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Abrir nota rápida | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Perguntar ao segundo cérebro |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Paleta de comandos | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Pastas de equipe |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Nova nota | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Novo briefing de projeto |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Leitura / edição | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Grafo |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Nova aba / fechar aba | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Nota diária |

No macOS use <kbd>⌘</kbd> no lugar de <kbd>Ctrl</kbd>.

## Perguntas frequentes

**Isto é o Obsidian?** Não. O Briefing é um projeto independente e open source, escrito do zero. Ele é compatível com pastas de Markdown comuns, então você pode abrir um vault existente, mas não tem relação nem aval do Obsidian.

**Precisa de internet?** Só para encontrar os colegas (a DHT) e para baixar o modelo de IA uma vez. Notas, busca e acesso do Claude funcionam offline.

**E se duas pessoas editarem a mesma nota?** Partes diferentes são mescladas automaticamente. Se as mesmas linhas mudarem, as duas versões são guardadas: uma na nota e a outra numa cópia `(conflito de …)` ao lado.

**Onde ficam meus dados?** Na pasta do vault (arquivos `.md`). Os dados do próprio Briefing ficam em `<vault>/.briefing/` (índice, histórico) e na pasta de configuração do usuário (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Próximos passos

- Tradução da interface (i18n)
- Versão para celular
- Relay opcional para redes que bloqueiam conexões diretas
- Permissões por membro e troca da chave da equipe
- Instaladores assinados e notarizados

## Como contribuir

Issues e pull requests são bem-vindos. Veja **[CONTRIBUTING.md](../../CONTRIBUTING.md)** para preparar o ambiente, rodar os testes e entender a estrutura do projeto.

## Licença

[MIT](../../LICENSE) © 2026 Renan Kelm
