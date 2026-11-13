const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
process.env.LLM_PROVIDER = 'mock';
const app = require('../src/app');
const repo = require('../src/repositories/solicitudesRepo');
const { validarAnalisis } = require('../src/services/validador');
const { evaluarCompletitud } = require('../src/services/completitud');
const casos = require('../data/solicitudes_sinteticas.json');

beforeEach(() => repo.limpiar());

test('health responde ok', async () => {
  const r = await request(app).get('/api/health');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.estado, 'ok');
});

test('rechaza solicitud sin texto o canal inválido (400)', async () => {
  const r = await request(app).post('/api/solicitudes').send({ texto: 'corto', canal: 'FAX' });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.detalles.length, 2);
});

test('D1: verificador de completitud detecta campos faltantes', () => {
  const d1 = evaluarCompletitud({ destino_preferido: 'Salento', numero_viajeros: 2 });
  assert.strictEqual(d1.informacion_suficiente, false);
  assert.ok(d1.campos_faltantes.includes('presupuesto_por_persona_cop'));
});

for (const caso of casos) {
  test(`${caso.id_caso}: genera JSON A02 válido y campos esperados`, async () => {
    const r = await request(app).post('/api/solicitudes').send({ texto: caso.texto, canal: caso.canal });
    assert.strictEqual(r.status, 201);
    const a = r.body.analisis;
    assert.ok(validarAnalisis(a).valido, JSON.stringify(validarAnalisis(a).errores));
    assert.match(a.id_solicitud, /^COT-\d{4}-\d{4}$/);
    for (const [campo, valor] of Object.entries(caso.esperado)) {
      if (campo === 'campos_faltantes') assert.deepStrictEqual([...a.campos_faltantes].sort(), [...valor].sort());
      else assert.deepStrictEqual(a.requerimientos[campo], valor, campo);
    }
    assert.strictEqual(a.informacion_suficiente, caso.esperado.campos_faltantes.length === 0);
    assert.strictEqual(a.siguiente_paso, a.informacion_suficiente ? 'A05_CONSOLIDAR_REQUERIMIENTOS' : 'A03_PREGUNTAS_ADICIONALES');
  });
}
