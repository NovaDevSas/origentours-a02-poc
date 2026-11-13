const config = require('../../config');
const { PROMPT_SISTEMA, construirMensajeUsuario, extraerJson } = require('./prompt');

async function analizar(entrada, { correccion } = {}) {
  if (!config.anthropic.apiKey) throw new Error('ANTHROPIC_API_KEY no configurada');
  const mensajes = [{ role: 'user', content: construirMensajeUsuario(entrada) }];
  if (correccion) {
    mensajes[0].content += `\n\nNota: un intento anterior no cumplió el esquema (${correccion}). Corrige esos puntos.`;
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.anthropic.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: config.anthropic.model, max_tokens: 1500, system: PROMPT_SISTEMA, messages: mensajes }),
  });
  if (!resp.ok) throw new Error(`Anthropic API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const texto = data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return {
    resultado: extraerJson(texto),
    modelo: config.anthropic.model,
    tokens_entrada: data.usage?.input_tokens ?? null,
    tokens_salida: data.usage?.output_tokens ?? null,
  };
}

module.exports = { nombre: 'anthropic', analizar };
