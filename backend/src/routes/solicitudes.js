const express = require('express');
const repo = require('../repositories/solicitudesRepo');
const { analizarSolicitud } = require('../services/orquestadorA02');
const { PROVEEDORES } = require('../services/llm');

const router = express.Router();
const CANALES = ['CORREO', 'WHATSAPP', 'FORMULARIO'];
const ESTADOS = ['RECIBIDA', 'ANALIZADA', 'EN_ACLARACION', 'VALIDADA'];

/** OT-101: recibe una solicitud, la analiza con GenAI y devuelve el JSON A02 validado. */
router.post('/', async (req, res, next) => {
  try {
    const { texto, canal, cliente = {}, proveedor } = req.body || {};
    const errores = [];
    if (!texto || typeof texto !== 'string' || texto.trim().length < 15) errores.push('texto: obligatorio, mínimo 15 caracteres');
    if (texto && texto.length > 5000) errores.push('texto: máximo 5000 caracteres');
    if (!CANALES.includes(canal)) errores.push(`canal: debe ser uno de ${CANALES.join(', ')}`);
    if (proveedor && !PROVEEDORES.includes(proveedor)) errores.push(`proveedor: debe ser uno de ${PROVEEDORES.join(', ')}`);
    if (errores.length) return res.status(400).json({ error: 'Solicitud inválida', detalles: errores });

    const fecha = new Date();
    const solicitud = repo.guardar({
      id_solicitud: repo.nuevoId(fecha),
      canal_origen: canal,
      texto_original: texto.trim(),
      cliente: { nombre: cliente.nombre || null, email: cliente.email || null, telefono: cliente.telefono || null },
      fecha_recepcion: fecha.toISOString(),
      estado: 'RECIBIDA',
      analisis: [],
    });

    const analisis = await analizarSolicitud({
      idSolicitud: solicitud.id_solicitud, texto: solicitud.texto_original, canal, fechaRecepcion: solicitud.fecha_recepcion, proveedor,
    });
    solicitud.analisis.push(analisis);
    solicitud.estado = 'ANALIZADA';
    res.status(201).json({ solicitud: resumen(solicitud), analisis });
  } catch (err) { next(err); }
});

/** Re-analiza una solicitud con otro proveedor (comparación de modelos). */
router.post('/:id/analisis', async (req, res, next) => {
  try {
    const s = repo.obtener(req.params.id);
    if (!s) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const proveedor = req.body?.proveedor;
    if (proveedor && !PROVEEDORES.includes(proveedor)) return res.status(400).json({ error: `proveedor: debe ser uno de ${PROVEEDORES.join(', ')}` });
    const analisis = await analizarSolicitud({
      idSolicitud: s.id_solicitud, texto: s.texto_original, canal: s.canal_origen, fechaRecepcion: s.fecha_recepcion, proveedor,
    });
    s.analisis.push(analisis);
    res.status(201).json({ analisis });
  } catch (err) { next(err); }
});

router.get('/', (_req, res) => res.json(repo.listar().map(resumen)));

router.get('/:id', (req, res) => {
  const s = repo.obtener(req.params.id);
  return s ? res.json(s) : res.status(404).json({ error: 'Solicitud no encontrada' });
});

router.patch('/:id/estado', (req, res) => {
  const s = repo.obtener(req.params.id);
  if (!s) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (!ESTADOS.includes(req.body?.estado)) return res.status(400).json({ error: `estado debe ser uno de ${ESTADOS.join(', ')}` });
  s.estado = req.body.estado;
  res.json(resumen(s));
});

function resumen(s) {
  const ultimo = s.analisis[s.analisis.length - 1];
  return {
    id_solicitud: s.id_solicitud, canal_origen: s.canal_origen, fecha_recepcion: s.fecha_recepcion, estado: s.estado,
    texto_original: s.texto_original, informacion_suficiente: ultimo?.informacion_suficiente ?? null, numero_analisis: s.analisis.length,
  };
}

module.exports = router;
