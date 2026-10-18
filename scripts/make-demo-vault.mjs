// Cria um vault de demonstração (agência fictícia "Aurora Studio") para testes e capturas de tela.
// Uso: node scripts/make-demo-vault.mjs <pasta>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
	console.error('Uso: node scripts/make-demo-vault.mjs <pasta>');
	process.exit(1);
}

const notes = {
	'Início.md': `---
tags: [home]
---
> [!tip] Segundo cérebro da Aurora Studio
> Tudo o que a agência sabe sobre clientes, projetos e processos. Pergunte qualquer coisa com **Ctrl+J**.

## Clientes ativos
| Cliente | Projeto | Status |
|---|---|---|
| [[Padaria Pão Quente]] | [[Campanha de Verão]] | em produção |
| [[Academia Forte]] | [[Site novo da Academia]] | aprovação |
| [[Café da Serra]] | [[Rebranding Café da Serra]] | briefing |

## Equipe
- [[Marina Alves]] — direção de criação
- [[João Prado]] — atendimento

## Processos
- [[Onboarding de clientes]]
- [[Checklist de entrega]]

#home
`,
	'Clientes/Padaria Pão Quente.md': `---
tags: [cliente]
contato: Maria Souza
desde: 2023
contrato: R$ 2.500/mês
---
# Padaria Pão Quente

Padaria de bairro com 3 lojas. Quer atrair o público jovem sem perder os clientes antigos.

## Contrato
Pagamento mensal de **R$ 2.500**, vencimento dia 10. Renovação em março.

## Histórico
- Reunião de kickoff: [[Kickoff Padaria]]
- Projeto atual: [[Campanha de Verão]]

Atendimento: [[João Prado]] · #cliente
`,
	'Clientes/Academia Forte.md': `---
tags: [cliente]
contato: Carlos Lima
---
# Academia Forte

Rede com 2 unidades. Foco em matrículas no verão e em treinos para iniciantes.

- Projeto: [[Site novo da Academia]]
- Reunião: [[Reunião de alinhamento Academia]]

#cliente
`,
	'Clientes/Café da Serra.md': `---
tags: [cliente, prospect]
---
# Café da Serra

Cafeteria artesanal. Pediu proposta de nova identidade visual.

- Projeto: [[Rebranding Café da Serra]]

#cliente
`,
	'Projetos/Campanha de Verão.md': `---
cliente: Padaria Pão Quente
status: em produção
prazo: 2026-12-01
tags: [projeto, campanha]
---
> [!info] Resumo
> Campanha para Instagram e lojas com o tema "verão leve", lançando a linha de sucos e salgados assados.

## Objetivo
Aumentar em 20% as vendas da linha leve entre 18 e 30 anos.

## Público-alvo
Jovens que trabalham perto das lojas e pedem café da manhã rápido.

## Entregáveis
- [x] Conceito criativo
- [x] Paleta e moodboard
- [ ] 12 posts para Instagram
- [ ] 3 vídeos curtos
- [ ] Cartazes para as lojas

## Equipe
Criação: [[Marina Alves]] · Atendimento: [[João Prado]]
Cliente: [[Padaria Pão Quente]] · Kickoff: [[Kickoff Padaria]]

#projeto
`,
	'Projetos/Site novo da Academia.md': `---
cliente: Academia Forte
status: aprovação
tags: [projeto, site]
---
# Site novo da Academia

Site com agendamento de aula experimental e página para cada unidade.

## Entregáveis
- [x] Wireframes
- [ ] Layout final aprovado
- [ ] Integração com WhatsApp

Cliente: [[Academia Forte]] · Reunião: [[Reunião de alinhamento Academia]]

#projeto
`,
	'Projetos/Rebranding Café da Serra.md': `---
cliente: Café da Serra
status: briefing
tags: [projeto, branding]
---
# Rebranding Café da Serra

Nova identidade visual com referência às montanhas e ao café de origem.

- [ ] Pesquisa de referências
- [ ] Proposta comercial

Cliente: [[Café da Serra]] · Criação: [[Marina Alves]]

#projeto
`,
	'Reuniões/Kickoff Padaria.md': `# Kickoff Padaria

**Participantes:** Maria Souza (cliente), [[João Prado]], [[Marina Alves]]

## Decisões
1. Tom de voz leve e bem-humorado.
2. Produção das fotos nas próprias lojas.
3. Lançamento no primeiro fim de semana de dezembro.

## Próximos passos
- [ ] Enviar cronograma para a Maria
- [ ] Agendar sessão de fotos

Projeto: [[Campanha de Verão]] · #reuniao
`,
	'Reuniões/Reunião de alinhamento Academia.md': `# Reunião de alinhamento Academia

O cliente pediu destaque maior para a aula experimental gratuita e fotos reais dos alunos.

- [ ] Ajustar a home do [[Site novo da Academia]]

#reuniao
`,
	'Pessoas/Marina Alves.md': `---
cargo: Diretora de criação
tags: [pessoa]
---
# Marina Alves

Responsável pela criação da [[Campanha de Verão]] e do [[Rebranding Café da Serra]].
Prefere receber referências em moodboard, não em lista de links.

#pessoa
`,
	'Pessoas/João Prado.md': `---
cargo: Atendimento
tags: [pessoa]
---
# João Prado

Ponto de contato da [[Padaria Pão Quente]] e da [[Academia Forte]].

#pessoa
`,
	'Processos/Onboarding de clientes.md': `# Onboarding de clientes

1. Reunião de kickoff (modelo em *Modelos/Reunião*)
2. Coletar logotipo, fontes e paleta
3. Criar a pasta do cliente em **Clientes/**
4. Montar o cronograma e enviar em até 2 dias úteis

Depois do onboarding, siga o [[Checklist de entrega]].

#processo
`,
	'Processos/Checklist de entrega.md': `# Checklist de entrega

- [ ] Revisão ortográfica
- [ ] Arquivos nos formatos combinados
- [ ] Aprovação registrada na nota do projeto
- [ ] Fatura enviada pelo financeiro

#processo
`,
	'Diário/2026-10-16.md': `# Sexta-feira, 16 de outubro de 2026

- Aprovado o conceito da [[Campanha de Verão]].
- [[Café da Serra]] pediu a proposta até terça.
`,
	'Diário/2026-10-17.md': `# Sábado, 17 de outubro de 2026

## Prioridades do dia
- [ ] Finalizar os 4 primeiros posts da [[Campanha de Verão]]
- [ ] Revisar layout do [[Site novo da Academia]]
`,
};

for (const [rel, content] of Object.entries(notes)) {
	const abs = path.join(dir, ...rel.split('/'));
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	fs.writeFileSync(abs, content);
}
console.log(`${Object.keys(notes).length} notas criadas em ${dir}`);
