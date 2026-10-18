import { parseNote } from './parse.js';

self.onmessage = (event) => {
	const { id, text } = event.data;
	let meta;
	try {
		meta = parseNote(text);
	} catch (err) {
		meta = { links: [], embeds: [], tags: [], headings: [], tasks: [], frontmatter: null, error: String(err) };
	}
	self.postMessage({ id, meta });
};
