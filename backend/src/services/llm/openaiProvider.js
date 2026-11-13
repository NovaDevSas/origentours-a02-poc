const config = require('../../config');
const { PROMPT_SISTEMA, construirMensajeUsuario, extraerJson } = require('./prompt');

async function analizar(entrada, { correccion } = {}) {
  if (!config.openai.apiKey) throw new Error('OPENAI_API_KEY no configurada');
  const messages = [
    { role: 'system', content: PROMPT_SISTEMA },
    { role: 'user', content: construirMensajeUsuario(entrada) },
  ];
  if (correccion) messages.push({ role: 'user', content: `Tu JSON anterior no cumplió el esquema: ${correccion}. Devuelve el JSON corregido.` });

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${config.openai.apiKey}` },
    body: JSON.stringify({ model: config.openai.model, messages, response_format: { type: 'json_object' } }),
  });
  if (!resp.ok) throw new Error(`OpenAI API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return {
    resultado: extraerJson(data.choices[0].message.content),
    modelo: config.openai.model,
    tokens_entrada: data.usage?.prompt_tokens ?? null,
    tokens_salida: data.usage?.completion_tokens ?? null,
  };
}

module.exports = { nombre: 'openai', analizar };
