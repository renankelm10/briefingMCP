// Modelos de nota. Variáveis: {{title}}, {{date}}, {{date:FORMATO}}, {{time}}, {{longdate}}.
import { formatDate, longDate } from './util.js';

export const BUILTIN_TEMPLATES = [
	{
		name: 'Briefing',
		content: `---
cliente:
projeto: {{title}}
status: rascunho
prazo:
responsavel:
tags: [briefing]
---
> [!info] Resumo
> Em uma frase: o que precisa ser feito e por quê.

## Contexto
O que está acontecendo com o cliente / produto agora.

## Objetivo
- Objetivo principal:
- Como vamos medir:

## Público-alvo
Quem queremos atingir, o que pensam e o que esperam.

## Mensagem principal
A ideia que o público deve levar.

## Entregáveis
- [ ]

## Prazo e orçamento
- Entrega:
- Orçamento:

## Restrições e obrigatórios
-

## Referências
-

## Aprovações
- [ ] Cliente
- [ ] Direção de criação

*Criado em {{date:DD/MM/YYYY}} às {{time}}*
`,
	},
	{
		name: 'Reunião',
		content: `**Data:** {{date:DD/MM/YYYY}} · **Hora:** {{time}}
**Participantes:**

## Pauta
-

## Discussão


## Decisões
1.

## Próximos passos
- [ ]
`,
	},
	{
		name: 'Nota diária',
		content: `# {{longdate}}

## Prioridades do dia
- [ ]

## Agenda


## Anotações


## Encerramento
- O que avançou:
- O que fica para amanhã:
`,
	},
	{
		name: 'Projeto',
		content: `---
status: ativo
inicio: {{date}}
tags: [projeto]
---
## Visão geral


## Metas
- [ ]

## Marcos
| Marco | Data | Status |
|---|---|---|
|  |  |  |

## Notas relacionadas
-
`,
	},
	{
		name: 'Pessoa / contato',
		content: `---
empresa:
cargo:
email:
telefone:
tags: [pessoa]
---
## Quem é


## Histórico
- {{date:DD/MM/YYYY}}:
`,
	},
];

export function applyTemplate(content, { title = '', date = new Date() } = {}) {
	return content.replace(/\{\{\s*(\w+)(?::([^}]*))?\s*\}\}/g, (match, key, arg) => {
		switch (key.toLowerCase()) {
			case 'title':
				return title;
			case 'date':
				return formatDate(date, arg?.trim() || 'YYYY-MM-DD');
			case 'time':
				return formatDate(date, arg?.trim() || 'HH:mm');
			case 'longdate':
				return longDate(date);
			default:
				return match;
		}
	});
}
