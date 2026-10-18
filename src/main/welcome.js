// Notas criadas no primeiro uso, em Documentos\Briefing.
const WELCOME_NOTES = {
	'Bem-vindo ao Briefing.md': `---
tags: [inicio]
criado: ${new Date().toISOString().slice(0, 10)}
---
# Bem-vindo ao Briefing

O Briefing guarda suas notas como arquivos **Markdown** comuns numa pasta do seu computador.
Nada fica preso ao app: você pode abrir, copiar ou versionar essa pasta como quiser.

## Comece por aqui
- Leia [[Links e backlinks]] para entender como as notas se conectam.
- Veja os [[Atalhos]] do teclado e os [[Recursos]] do app.
- Crie um briefing com **Ctrl+Shift+B**.
- Abra o exemplo [[Briefing de campanha]] para ver uma nota de trabalho real.

> [!tip] Dica
> Pressione **Ctrl+O** para pular para qualquer nota e **Ctrl+G** para ver o grafo.

## Tarefas
- [x] Instalar o Briefing
- [ ] Criar minha primeira nota com **Ctrl+N**
- [ ] Conectar duas notas com \`[[ ]]\`

#inicio
`,
	'Como usar/Links e backlinks.md': `# Links e backlinks

Escreva \`[[Nome da nota]]\` para criar um link. Se a nota não existir, ela é criada quando você clicar no link.

- Link com texto diferente: \`[[Atalhos|veja os atalhos]]\` → [[Atalhos|veja os atalhos]]
- Link para um título: \`[[Atalhos#Navegação]]\`
- Incorporar outra nota: \`![[Atalhos]]\`

No modo edição, segure **Ctrl** e clique num link para abri-lo.

O painel da direita mostra os **backlinks**: as notas que apontam para a nota aberta.
Volte para o [[Bem-vindo ao Briefing]].

#guia
`,
	'Como usar/Atalhos.md': `# Atalhos

## Navegação
| Atalho | Ação |
|---|---|
| Ctrl+O | Abrir nota rápida (Ctrl+Enter abre em nova aba) |
| Ctrl+P | Paleta de comandos |
| Ctrl+T / Ctrl+W | Nova aba / fechar aba |
| Ctrl+Tab | Próxima aba |
| Ctrl+G / Ctrl+Shift+G | Grafo / grafo local |
| Ctrl+Shift+F | Buscar no vault |
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
| Ctrl+Shift+D | Nota diária |

## Edição
| Atalho | Ação |
|---|---|
| Ctrl+B / Ctrl+I | Negrito / itálico |
| Ctrl+Shift+H | ==Destacar== |
| Ctrl+K | Link Markdown |
| Ctrl+L | Alternar tarefa |
| Ctrl+E | Alternar leitura / edição |
| F2 | Renomear nota |
| Ctrl+F | Buscar e substituir na nota |
| Ctrl+clique | Abrir link |

Na busca, digite \`#tag\` para filtrar por tag. Cole imagens direto no editor: elas vão para a pasta **Anexos**.

#guia
`,
	'Como usar/Recursos.md': `# Recursos do Briefing

- **Abas**: abra várias notas ao mesmo tempo; arraste para reordenar.
- **Live Preview**: a formatação aparece enquanto você escreve; a marcação volta quando o cursor entra na linha.
- **Prévia ao passar o mouse** sobre qualquer [[Links e backlinks|link]].
- **Painel de tarefas**: todas as \`- [ ]\` do vault num lugar só.
- **Agenda**: calendário de notas diárias.
- **Menções não vinculadas**: o Briefing encontra onde o nome da nota aparece sem link.
- **Histórico de versões**: menu ⋯ → Histórico. Uma cópia é guardada antes de cada edição (a cada 5 min).
- **Exportar para PDF**: menu ⋯ → Exportar.
- **Modelos**: crie notas na pasta *Modelos* com \`{{title}}\`, \`{{date}}\`, \`{{time}}\`.
- **Favoritos**: ☆ no topo da nota.

> [!tip] Comentários
> Texto entre %%sinais de porcentagem%% não aparece no modo leitura.

#guia
`,
	'Projetos/Briefing de campanha.md': `---
cliente: Exemplo Ltda
status: em andamento
tags: [projeto, campanha]
---
# Briefing de campanha

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
- Guia de uso: [[Links e backlinks]]

#projeto
`,
	'Projetos/Reunião de kickoff.md': `# Reunião de kickoff

**Participantes:** equipe de criação, atendimento, cliente.

## Decisões
1. Prazo de entrega em 30 dias.
2. Tom de voz próximo e direto.

Relacionado: [[Briefing de campanha]] · [[Próximos passos]]

#reuniao #projeto
`,
};

module.exports = { WELCOME_NOTES };
