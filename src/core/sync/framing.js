// Mensagens sobre o fluxo P2P: 4 bytes (tamanho, big-endian) + JSON em UTF-8.
const MAX_MESSAGE = 150 * 1024 * 1024;

function encode(message) {
	const body = Buffer.from(JSON.stringify(message), 'utf8');
	const header = Buffer.alloc(4);
	header.writeUInt32BE(body.length);
	return Buffer.concat([header, body]);
}

class FrameReader {
	constructor(onMessage, onError) {
		this.onMessage = onMessage;
		this.onError = onError;
		this.chunks = [];
		this.length = 0;
	}

	push(chunk) {
		this.chunks.push(chunk);
		this.length += chunk.length;
		while (this.length >= 4) {
			const buf = this.chunks.length === 1 ? this.chunks[0] : Buffer.concat(this.chunks);
			this.chunks = [buf];
			const size = buf.readUInt32BE(0);
			if (size > (this.max ?? MAX_MESSAGE)) {
				this.onError?.(new Error(`Mensagem grande demais (${size} bytes)`));
				this.chunks = [];
				this.length = 0;
				return;
			}
			if (buf.length < 4 + size) return;
			const body = buf.subarray(4, 4 + size);
			const rest = buf.subarray(4 + size);
			this.chunks = rest.length ? [rest] : [];
			this.length = rest.length;
			let message;
			try {
				message = JSON.parse(body.toString('utf8'));
			} catch (err) {
				this.onError?.(err);
				continue;
			}
			this.onMessage(message);
		}
	}
}

module.exports = { encode, FrameReader, MAX_MESSAGE };
