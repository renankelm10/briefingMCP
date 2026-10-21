// Notas criadas no primeiro uso, em Documentos\Briefing.
// Linguagem simples: quem abre o app pela primeira vez não precisa saber o que é Markdown.
const WELCOME_NOTES = {
	'Comece aqui.md': `👋 Bem-vindo ao **Briefing**! Aqui você guarda as anotações do seu trabalho: clientes, reuniões, projetos, ideias.
Tudo fica numa pasta **no seu computador**, como arquivos de texto comuns. Nada vai para a nuvem.

## Seus primeiros passos
Marque cada item quando terminar (clique no quadradinho):

- [ ] **Criar sua primeira nota** — clique no **＋** no topo da lista à esquerda e dê um nome a ela.
- [ ] **Escrever com formatação** — comece uma linha com \`# \` para virar título, ou com \`- \` para virar lista.
- [ ] **Ligar uma nota a outra** — escreva \`[[\` e escolha uma nota da lista. Vira um link que você pode clicar.
- [ ] **Ver o mapa das suas notas** — clique no **◎** no canto de baixo, à esquerda.
- [ ] **Buscar qualquer coisa** — use a caixa de busca no topo da lista à esquerda.
- [ ] **Trabalhar com a equipe** — clique no **⇅** para criar uma equipe ou entrar com um convite.
- [ ] **Conversar com o Claude sobre suas notas** — clique no **✦** para conectar.

## Quer ajuda?
- Veja [[Trabalhar em equipe]] e [[Usar com o Claude]].
- O menu **Ajuda → Tour pela tela** mostra de novo onde fica cada coisa.
- Para quem gosta de atalhos: [[Atalhos]].
- Um exemplo de nota de trabalho: [[Briefing de campanha]].

> [!tip] Dica
> Pode apagar ou mudar esta nota à vontade. Ela é só um ponto de partida.
`,
	'Como usar/Trabalhar em equipe.md': `Com o Briefing, uma pasta pode ficar **igual no computador de todo mundo da equipe**.
Quando alguém muda uma nota, a mudança aparece para os outros em segundos.

## Como começar
1. Uma pessoa clica no **⇅** (canto de baixo, à esquerda) e escolhe **Criar uma equipe**.
2. O Briefing gera um **código de convite** (começa com \`BRF-\`). Mande esse código para os colegas por WhatsApp ou e-mail.
3. Cada colega clica no **⇅**, escolhe **Entrar numa equipe** e cola o código.

Pronto: a pasta passa a ser compartilhada.

## Bom saber
- Os computadores conversam **direto entre si**, com criptografia. Nenhum servidor guarda suas notas.
- Para sincronizar, o Briefing precisa estar aberto (ele pode ficar só no ícone perto do relógio).
- Se duas pessoas mudarem a **mesma frase** ao mesmo tempo, o Briefing guarda as duas versões, sem perder nada.
- **Quem tem o código entra na equipe.** Compartilhe só com quem você confia.

Voltar para [[Comece aqui]].
`,
	'Como usar/Usar com o Claude.md': `O Briefing se conecta ao **Claude** (assistente de IA da Anthropic). Com isso, o Claude consegue
**ler, buscar e escrever** nas suas notas enquanto conversa com você.

## Como conectar
Clique no **✦** (canto de baixo, à esquerda) e depois em **Conectar automaticamente**.
É preciso ter o **Claude Code** instalado neste computador. Depois de conectar, abra o Claude de novo.

## Exemplos do que pedir
- "Resuma a última reunião com o cliente X."
- "Quais tarefas estão pendentes no projeto Y?"
- "Crie uma nota com a pauta da reunião de amanhã."
- "O que a equipe decidiu sobre o prazo da campanha?"

As notas continuam no seu computador. O Claude só lê o que você pedir.

Voltar para [[Comece aqui]].
`,
	'Como usar/Atalhos.md': `Para quem prefere o teclado. No Mac, use ⌘ no lugar de Ctrl.

## Navegação
| Atalho | Ação |
|---|---|
| Ctrl+O | Abrir nota rápida (Ctrl+Enter abre em nova aba) |
| Ctrl+P | Paleta de comandos |
| Ctrl+T / Ctrl+W | Nova aba / fechar aba |
| Ctrl+Tab | Próxima aba |
| Ctrl+G / Ctrl+Shift+G | Mapa das notas / mapa da nota atual |
| Ctrl+Shift+F | Buscar em todas as notas |
| Ctrl+Alt+← / → | Voltar / avançar |
| Ctrl+\\ / Ctrl+Shift+\\ | Mostrar/ocultar painéis |
| Ctrl+Shift+Enter | Modo foco |
| Ctrl+, | Configurações |

## Criação
| Atalho | Ação |
|---|---|
| Ctrl+N | Nova nota |
| Ctrl+Shift+B | Novo briefing (a partir do modelo) |
| Ctrl+Shift+N | Nova nota a partir de modelo |
| Ctrl+Shift+T | Inserir modelo na nota |
| Ctrl+Shift+D | Nota do dia |

## Edição
| Atalho | Ação |
|---|---|
| Ctrl+B / Ctrl+I | Negrito / itálico |
| Ctrl+Shift+H | ==Destacar== |
| Ctrl+K | Link |
| Ctrl+L | Marcar/desmarcar tarefa |
| Ctrl+E | Alternar leitura / edição |
| F2 | Renomear nota |
| Ctrl+F | Buscar e substituir na nota |
| Ctrl+clique | Abrir link |

Na busca, digite \`#tag\` para filtrar por tag. Cole imagens direto na nota: elas vão para a pasta **Anexos**.

Voltar para [[Comece aqui]].
`,
	'Como usar/Recursos.md': `- **Abas**: abra várias notas ao mesmo tempo, como no navegador.
- **Formatação na hora**: escreva normalmente; títulos, listas e negrito aparecem enquanto você digita.
- **Ligações entre notas**: escreva \`[[\` para ligar uma nota a outra. O painel da direita mostra quem cita a nota aberta.
- **Prévia**: passe o mouse sobre um link para ver a nota sem abrir.
- **Tarefas**: todo \`- [ ]\` vira uma tarefa; o painel **Tarefas** junta as de todas as notas.
- **Agenda**: uma nota por dia, num calendário.
- **Histórico**: menu ⋯ → Histórico. O Briefing guarda versões antigas de cada nota.
- **PDF**: menu ⋯ → Exportar para PDF.
- **Modelos**: crie notas na pasta *Modelos* e use como ponto de partida.
- **Favoritos**: clique na ☆ no topo da nota.

Voltar para [[Comece aqui]].
`,
	'Projetos/Briefing de campanha.md': `---
cliente: Exemplo Ltda
status: em andamento
tags: [projeto, campanha]
---
# Briefing de campanha

> [!info] Esta é uma nota de exemplo
> Mostra como pode ficar uma nota de trabalho. As linhas lá em cima (cliente, status) são **propriedades**: aparecem como uma ficha.

## Objetivo
Aumentar o reconhecimento da marca no público de 25–40 anos.

## Público
Profissionais urbanos que pesquisam online antes de comprar.

## Entregáveis
- [ ] Peças para redes sociais
- [ ] Landing page
- [ ] Relatório de resultados

## Referências
- Reunião inicial: [[Reunião de kickoff]]

#projeto
`,
	'Projetos/Reunião de kickoff.md': `# Reunião de kickoff

**Participantes:** equipe de criação, atendimento, cliente.

## Decisões
1. Prazo de entrega em 30 dias.
2. Tom de voz próximo e direto.

Relacionado: [[Briefing de campanha]]

#reuniao #projeto
`,
};

// Nota aberta ao final das boas-vindas.
const START_NOTE = 'Comece aqui.md';

module.exports = { WELCOME_NOTES, START_NOTE };
