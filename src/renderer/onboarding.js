// Primeiros passos: assistente de boas-vindas (primeira abertura) e tour pela tela.
// Linguagem simples, sem termos técnicos: é a porta de entrada de quem nunca usou o app.
import { el } from './util.js';

const START_NOTE = 'Comece aqui.md';
const cleanError = (err) => String(err?.message ?? err).replace(/^Error invoking remote method '[^']+': Error: /, '');

/**
 * @param {object} ctx
 * @param {object} ctx.api            window.briefing
 * @param {() => object} ctx.vault    vault aberto { name, root }
 * @param {(cls?: string) => HTMLElement} ctx.modalShell
 * @param {() => void} ctx.closeModal
 * @param {() => Promise<boolean>} ctx.pickVault        escolhe outra pasta e abre (true se trocou)
 * @param {(folder: string) => Promise<void>} ctx.openFolderAsVault
 * @param {() => Promise<void>} ctx.openStartNote       abre "Comece aqui" se existir
 */
export function openWelcome(ctx) {
	const { api } = ctx;
	const box = ctx.modalShell('modal wizard');
	// Um clique fora não fecha o assistente por engano; Esc conta como "Pular".
	box.parentElement.addEventListener('mousedown', (e) => e.target === box.parentElement && e.stopImmediatePropagation(), true);
	ctx.onDismiss?.(() => api.app.setPref('onboarded', true));
	const answers = { joinedFolder: null };
	let index = 0;

	const finish = async ({ tour = false } = {}) => {
		await api.app.setPref('onboarded', true);
		ctx.closeModal();
		if (answers.joinedFolder) await ctx.openFolderAsVault(answers.joinedFolder);
		await ctx.openStartNote();
		if (tour) setTimeout(() => startTour(ctx), 300);
	};

	const steps = [
		{
			title: 'Bem-vindo ao Briefing',
			render(body) {
				body.append(
					el('div', 'wizard-hero', '◆'),
					el('p', 'wizard-lead', 'Um lugar para guardar as anotações do seu trabalho, compartilhar com a sua equipe e conversar com o Claude sobre elas.'),
				);
				const cards = el('div', 'wizard-cards');
				for (const [icon, title, text] of [
					['✎', 'Escreva', 'Clientes, reuniões, projetos e ideias, tudo ligado entre si.'],
					['⇅', 'Compartilhe', 'Uma pasta igual no computador de toda a equipe.'],
					['✦', 'Pergunte', 'O Claude lê suas notas e responde por você.'],
				]) {
					const card = el('div', 'wizard-card static');
					card.append(el('div', 'wizard-card-icon', icon), el('div', 'wizard-card-title', title), el('div', 'wizard-card-text', text));
					cards.append(card);
				}
				body.append(cards, el('p', 'wizard-note', 'Leva menos de um minuto. Dá para pular qualquer etapa.'));
			},
			next: 'Começar',
		},
		{
			title: 'Onde suas notas ficam guardadas',
			render(body) {
				body.append(
					el('p', 'wizard-lead', 'Suas notas são arquivos comuns numa pasta do seu computador. Nada vai para a nuvem e você pode copiar ou guardar essa pasta como quiser.'),
				);
				const current = el('div', 'wizard-path');
				const showPath = () => {
					current.replaceChildren(el('span', 'wizard-path-label', 'Pasta atual'), el('span', 'wizard-path-value', ctx.vault()?.root ?? '—'));
				};
				showPath();
				const other = el('button', 'btn', 'Escolher outra pasta…');
				other.onclick = async () => {
					if (await ctx.pickVault()) showPath();
				};
				body.append(current, other, el('p', 'wizard-note', 'Já usa o Obsidian? Escolha a pasta do seu vault: as notas continuam funcionando nos dois.'));
			},
		},
		{
			title: 'Como você se chama?',
			async render(body) {
				body.append(el('p', 'wizard-lead', 'Seus colegas vão ver esse nome quando vocês trabalharem juntos.'));
				const input = el('input', 'input wizard-input');
				input.placeholder = 'Seu nome';
				input.maxLength = 60;
				body.append(input);
				const info = await api.teams.info().catch(() => null);
				input.value = info?.deviceName ?? '';
				input.focus();
				input.select();
				input.addEventListener('keydown', (e) => e.key === 'Enter' && go(1));
				this.save = async () => {
					if (input.value.trim()) await api.teams.setDeviceName(input.value.trim());
				};
			},
		},
		{
			title: 'Vai usar com a sua equipe?',
			render(body) {
				body.append(el('p', 'wizard-lead', 'Uma pasta pode ficar igual no computador de todo mundo. Quando alguém muda uma nota, os outros veem em segundos.'));
				const cards = el('div', 'wizard-cards');
				const panel = el('div', 'wizard-panel');
				const choice = (icon, title, text, build) => {
					const card = el('button', 'wizard-card');
					card.append(el('div', 'wizard-card-icon', icon), el('div', 'wizard-card-title', title), el('div', 'wizard-card-text', text));
					card.onclick = () => {
						cards.querySelectorAll('.wizard-card').forEach((c) => c.classList.toggle('selected', c === card));
						panel.replaceChildren();
						build?.(panel);
					};
					cards.append(card);
					return card;
				};
				choice('＋', 'Criar uma equipe', 'Eu começo e convido os colegas', (p) => {
					const name = el('input', 'input wizard-input');
					name.placeholder = 'Nome da equipe (ex.: nome da empresa)';
					name.value = ctx.vault()?.name ?? '';
					const create = el('button', 'btn cta', 'Criar e gerar convite');
					const result = el('div', 'wizard-result');
					create.onclick = async () => {
						create.disabled = true;
						try {
							const team = await api.teams.create({ name: name.value, folder: ctx.vault()?.root });
							await navigator.clipboard.writeText(team.code).catch(() => {});
							const code = el('code', 'wizard-code', team.code);
							result.replaceChildren(
								el('div', 'wizard-ok', `Equipe "${team.name}" criada! O código já foi copiado.`),
								code,
								el('div', 'wizard-note', 'Mande esse código para os colegas por WhatsApp ou e-mail. Quem tem o código entra na equipe, então só envie para quem você confia.'),
							);
							name.disabled = true;
							create.hidden = true;
						} catch (err) {
							result.replaceChildren(el('div', 'wizard-error', cleanError(err)));
							create.disabled = false;
						}
					};
					p.append(el('p', 'wizard-note', `A pasta compartilhada será a que você escolheu: ${ctx.vault()?.root ?? ''}`), name, create, result);
				});
				choice('⇢', 'Tenho um convite', 'Um colega me mandou um código', (p) => {
					const code = el('input', 'input wizard-input');
					code.placeholder = 'Cole aqui o código (começa com BRF-)';
					code.spellcheck = false;
					const join = el('button', 'btn cta', 'Entrar na equipe');
					const result = el('div', 'wizard-result');
					join.onclick = async () => {
						join.disabled = true;
						try {
							const folder = await api.teams.defaultJoinFolder('Equipe');
							const team = await api.teams.join({ code: code.value, folder });
							answers.joinedFolder = team.folder;
							result.replaceChildren(
								el('div', 'wizard-ok', `Você entrou na equipe "${team.name}".`),
								el('div', 'wizard-note', `As notas da equipe chegam em ${team.folder} assim que um colega estiver com o Briefing aberto. Vamos abrir essa pasta no final.`),
							);
							code.disabled = true;
							join.hidden = true;
						} catch (err) {
							result.replaceChildren(el('div', 'wizard-error', cleanError(err)));
							join.disabled = false;
						}
					};
					p.append(code, join, result);
					code.focus();
				});
				choice('✓', 'Agora não', 'Vou usar sozinho por enquanto', (p) => {
					p.append(el('p', 'wizard-note', 'Sem problema. Quando quiser, clique no ⇅ no canto de baixo, à esquerda.'));
				});
				body.append(cards, panel);
			},
		},
		{
			title: 'Conectar ao Claude (opcional)',
			render(body) {
				body.append(
					el('p', 'wizard-lead', 'Conectado, o Claude consegue ler, buscar e escrever nas suas notas enquanto conversa com você.'),
				);
				const examples = el('ul', 'wizard-examples');
				for (const ex of ['"Resuma a última reunião com o cliente X."', '"Quais tarefas estão pendentes no projeto Y?"', '"Crie uma nota com a pauta de amanhã."']) examples.append(el('li', '', ex));
				const connect = el('button', 'btn cta', 'Conectar ao Claude');
				const result = el('div', 'wizard-result');
				connect.onclick = async () => {
					connect.disabled = true;
					connect.textContent = 'Conectando…';
					try {
						const r = await api.claude.register();
						if (r.ok) {
							result.replaceChildren(el('div', 'wizard-ok', 'Conectado! Feche e abra o Claude de novo para ele enxergar suas notas.'));
							connect.hidden = true;
						} else {
							result.replaceChildren(
								el('div', 'wizard-error', 'Não encontramos o Claude Code neste computador.'),
								el('div', 'wizard-note', 'Tudo bem: você pode instalar depois e conectar pelo ✦ no canto de baixo, à esquerda.'),
							);
							connect.textContent = 'Tentar de novo';
							connect.disabled = false;
						}
					} catch (err) {
						result.replaceChildren(el('div', 'wizard-error', cleanError(err)));
						connect.textContent = 'Tentar de novo';
						connect.disabled = false;
					}
				};
				body.append(examples, connect, result, el('p', 'wizard-note', 'Precisa do Claude Code instalado. Se você não usa o Claude, é só continuar.'));
			},
			next: 'Continuar',
		},
		{
			title: 'Tudo pronto!',
			render(body) {
				body.append(
					el('div', 'wizard-hero', '✓'),
					el('p', 'wizard-lead', 'Quer um passeio rápido pela tela para ver onde fica cada coisa? Leva um minuto.'),
				);
				const actions = el('div', 'wizard-final');
				const tour = el('button', 'btn cta', 'Fazer o tour');
				tour.onclick = () => finish({ tour: true });
				const alone = el('button', 'btn', 'Explorar sozinho');
				alone.onclick = () => finish();
				actions.append(tour, alone);
				body.append(actions, el('p', 'wizard-note', 'O tour fica no menu Ajuda, se quiser ver depois.'));
			},
			final: true,
		},
	];

	const header = el('div', 'wizard-header');
	const dots = el('div', 'wizard-dots');
	const skip = el('button', 'wizard-skip', 'Pular');
	skip.title = 'Pular as boas-vindas';
	skip.onclick = () => finish();
	header.append(dots, skip);
	const title = el('div', 'wizard-title');
	const body = el('div', 'wizard-body');
	const footer = el('div', 'wizard-footer');
	const back = el('button', 'btn', 'Voltar');
	const next = el('button', 'btn cta', 'Continuar');
	back.onclick = () => go(-1);
	next.onclick = () => go(1);
	footer.append(back, next);
	box.append(header, title, body, footer);

	async function go(delta) {
		const step = steps[index];
		if (delta > 0) await step.save?.().catch(() => {});
		index = Math.max(0, Math.min(steps.length - 1, index + delta));
		await show();
	}

	async function show() {
		const step = steps[index];
		dots.replaceChildren(...steps.map((_, i) => el('span', `wizard-dot${i === index ? ' active' : i < index ? ' done' : ''}`)));
		title.textContent = step.title;
		body.replaceChildren();
		back.hidden = index === 0 || step.final;
		next.hidden = !!step.final;
		next.textContent = step.next ?? 'Continuar';
		skip.hidden = !!step.final;
		await step.render(body);
		if (!body.querySelector('input:not([disabled])')) next.focus();
	}

	show();
}

/* ---------- tour pela tela ---------- */

const TOUR = [
	{ target: '#tree', title: 'Suas notas', text: 'Todas as suas notas e pastas aparecem aqui. Clique numa para abrir.' },
	{ target: '#btn-new-note', title: 'Criar uma nota', text: 'Clique no ＋ para criar uma nota nova.', key: 'Ctrl+N' },
	{
		target: '#scroller, #empty',
		title: 'Escreva à vontade',
		text: 'Escreva normalmente. Comece a linha com # para virar título, ou com - para virar lista: a formatação aparece sozinha. Para ligar uma nota a outra, escreva [[ e escolha a nota.',
	},
	{ target: '#search', title: 'Buscar', text: 'Procure qualquer palavra em todas as suas notas.', key: 'Ctrl+Shift+F' },
	{ target: '#right', title: 'Conexões da nota', text: 'Aqui aparecem as notas que citam a nota aberta, os títulos dela, as tags e as tarefas.' },
	{ target: '#btn-graph', title: 'Mapa das notas', text: 'Veja como suas notas se ligam umas às outras. Clique numa bolinha para ler a nota.', key: 'Ctrl+G' },
	{ target: '#btn-teams', title: 'Equipe', text: 'Compartilhe uma pasta com colegas: ela fica igual no computador de todos.' },
	{ target: '#btn-brain', title: 'Claude', text: 'Conecte o Claude para ele ler e escrever nas suas notas.' },
	{ target: '#btn-settings', title: 'Configurações', text: 'Aparência, tamanho do texto e mais. Este tour fica no menu Ajuda, se quiser ver de novo.', key: 'Ctrl+,' },
];

let activeTour = null;

const visible = (node) => {
	if (!node) return false;
	const r = node.getBoundingClientRect();
	return r.width > 4 && r.height > 4 && getComputedStyle(node).visibility !== 'hidden';
};

export function startTour(ctx = {}) {
	activeTour?.end();
	const pick = (selector) => selector.split(',').map((s) => document.querySelector(s.trim())).find(visible);
	const steps = TOUR.filter((s) => pick(s.target));
	if (!steps.length) return;
	const hotkey = ctx.formatHotkey ?? ((k) => k);

	const layer = el('div', 'tour-layer');
	const spot = el('div', 'tour-spot');
	const card = el('div', 'tour-card');
	layer.append(spot, card);
	document.body.append(layer);
	let index = 0;

	function place() {
		const step = steps[index];
		const target = pick(step.target);
		if (!target) return end();
		const r = target.getBoundingClientRect();
		const pad = 6;
		Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });

		card.replaceChildren(
			el('div', 'tour-step', `${index + 1} de ${steps.length}`),
			el('div', 'tour-title', step.title),
			el('div', 'tour-text', step.text),
		);
		if (step.key) card.append(el('div', 'tour-key', `Atalho: ${hotkey(step.key)}`));
		const buttons = el('div', 'tour-buttons');
		const skip = el('button', 'tour-link', 'Pular tour');
		skip.onclick = end;
		const prev = el('button', 'btn small', 'Voltar');
		prev.hidden = index === 0;
		prev.onclick = () => move(-1);
		const next = el('button', 'btn small cta', index === steps.length - 1 ? 'Concluir' : 'Próximo');
		next.onclick = () => move(1);
		buttons.append(skip, el('span', 'spacer'), prev, next);
		card.append(buttons);

		// Cartão ao lado do elemento destacado, sempre dentro da janela.
		const cw = 320;
		const ch = card.offsetHeight || 170;
		const margin = 14;
		let left;
		let top;
		if (r.right + margin + cw < innerWidth) {
			left = r.right + margin;
			top = r.top;
		} else if (r.left - margin - cw > 0) {
			left = r.left - margin - cw;
			top = r.top;
		} else {
			left = r.left + r.width / 2 - cw / 2;
			top = r.bottom + margin + ch < innerHeight ? r.bottom + margin : r.top - margin - ch;
		}
		left = Math.max(12, Math.min(innerWidth - cw - 12, left));
		top = Math.max(12, Math.min(innerHeight - ch - 12, top));
		Object.assign(card.style, { left: `${left}px`, top: `${top}px`, width: `${cw}px` });
		next.focus();
	}

	function move(delta) {
		if (index + delta >= steps.length) return end();
		index = Math.max(0, index + delta);
		place();
	}

	const onKey = (e) => {
		if (e.key === 'Escape') end();
		else if (e.key === 'ArrowRight') move(1);
		else if (e.key === 'ArrowLeft') move(-1);
		else return;
		e.preventDefault();
		e.stopImmediatePropagation();
	};
	const onResize = () => place();
	window.addEventListener('keydown', onKey, true);
	window.addEventListener('resize', onResize);

	function end() {
		window.removeEventListener('keydown', onKey, true);
		window.removeEventListener('resize', onResize);
		layer.remove();
		activeTour = null;
	}

	activeTour = { end };
	place();
	// Reposiciona depois que o cartão tem altura real.
	requestAnimationFrame(place);
}

export { START_NOTE };
