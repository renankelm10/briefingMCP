// Calendário mensal para navegar pelas notas diárias.
import { el, MONTH_NAMES } from './util.js';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function renderCalendar(container, { month, hasNote, onPick, onMonth }) {
	const header = el('div', 'cal-header');
	const prev = el('button', 'icon-btn', '‹');
	const next = el('button', 'icon-btn', '›');
	const title = el('span', 'cal-title', `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`);
	const today = el('button', 'btn small', 'Hoje');
	prev.title = 'Mês anterior';
	next.title = 'Próximo mês';
	prev.onclick = () => onMonth(-1);
	next.onclick = () => onMonth(1);
	today.onclick = () => onMonth(0);
	header.append(prev, title, next, today);

	const grid = el('div', 'cal-grid');
	for (const d of WEEK) grid.append(el('div', 'cal-dow', d));
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const start = new Date(first);
	start.setDate(1 - first.getDay());
	const now = new Date();
	for (let i = 0; i < 42; i++) {
		const day = new Date(start);
		day.setDate(start.getDate() + i);
		const cell = el('button', 'cal-day', String(day.getDate()));
		if (day.getMonth() !== month.getMonth()) cell.classList.add('other');
		if (day.toDateString() === now.toDateString()) cell.classList.add('today');
		if (hasNote(day)) cell.classList.add('has-note');
		cell.title = day.toLocaleDateString('pt-BR');
		cell.onclick = () => onPick(day);
		grid.append(cell);
	}
	container.append(header, grid);
}
