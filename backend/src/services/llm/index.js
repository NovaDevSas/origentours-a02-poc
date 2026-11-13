const proveedores = {
  mock: require('./mockProvider'),
  anthropic: require('./anthropicProvider'),
  openai: require('./openaiProvider'),
};

// Precio de referencia USD por millón de tokens [entrada, salida]. Ajustar a la tarifa vigente del proveedor.
const PRECIOS = { mock: [0, 0], anthropic: [3, 15], openai: [0.4, 1.6] };

function obtenerProveedor(nombre) {
  const p = proveedores[nombre];
  if (!p) throw new Error(`Proveedor LLM no soportado: ${nombre}`);
  return p;
}

function estimarCosto(nombre, tokensEntrada, tokensSalida) {
  const [pe, ps] = PRECIOS[nombre] || [0, 0];
  return Number((((tokensEntrada || 0) * pe + (tokensSalida || 0) * ps) / 1_000_000).toFixed(6));
}

module.exports = { obtenerProveedor, estimarCosto, PROVEEDORES: Object.keys(proveedores) };
