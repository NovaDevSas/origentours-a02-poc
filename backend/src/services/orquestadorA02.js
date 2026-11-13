/**
 * Orquestador A02: coordina extracción (LLM), validación de esquema, verificación de
 * completitud (D1), umbral de confianza y armado del JSON final.
 */
const config = require('../config');
const { obtenerProveedor, estimarCosto } = require('./llm');
const { evaluarCompletitud } = require('./completitud');
const { validarAnalisis } = require('./validador');

async function analizarSolicitud({ idSolicitud, texto, canal, fechaRecepcion, proveedor = config.llmProvider }) {
  const llm = obtenerProveedor(proveedor || config.llmProvider);
  const inicio = Date.now();
  const entrada = { texto, canal, fechaRecepcion };

  let respuesta = await llm.analizar(entrada);
  let analisis = armar(respuesta.resultado, { idSolicitud, canal, fechaRecepcion });
  let validacion = validarAnalisis(analisis);
  let reintentos = 0;

  // Un reintento enviando los errores de validación al modelo (patrón de auto-corrección)
  if (!validacion.valido && llm.nombre !== 'mock') {
    reintentos = 1;
    respuesta = await llm.analizar(entrada, { correccion: validacion.errores.join('; ') });
    analisis = armar(respuesta.resultado, { idSolicitud, canal, fechaRecepcion });
    validacion = validarAnalisis(analisis);
  }

  analisis.metadatos = {
    proveedor: llm.nombre,
    modelo: respuesta.modelo,
    latencia_ms: Date.now() - inicio,
    tokens_entrada: respuesta.tokens_entrada,
    tokens_salida: respuesta.tokens_salida,
    costo_usd: estimarCosto(llm.nombre, respuesta.tokens_entrada, respuesta.tokens_salida),
    esquema_valido: validacion.valido,
    errores_esquema: validacion.errores,
    reintentos,
  };
  return analisis;
}

function armar(r = {}, { idSolicitud, canal, fechaRecepcion }) {
  const requerimientos = {
    tipo_experiencia: [], destino_preferido: null, ciudad_de_salida: null, fecha_inicio_estimada: null,
    duracion_dias: null, numero_viajeros: null, presupuesto_por_persona_cop: null, restricciones: [], intereses: [],
    ...(r.requerimientos || {}),
  };
  const d1 = evaluarCompletitud(requerimientos);
  const confianza = typeof r.confianza === 'number' ? r.confianza : 0.5;
  // Se usan las preguntas del LLM si existen; si no, las plantillas deterministas.
  const preguntas = d1.informacion_suficiente ? [] : (r.preguntas_sugeridas?.length ? r.preguntas_sugeridas : d1.preguntas_base);

  return {
    id_solicitud: idSolicitud,
    actividad: 'A02_ANALISIS_SOLICITUD',
    canal_origen: canal,
    fecha_recepcion: fechaRecepcion,
    tipo_cliente: r.tipo_cliente || 'NO_DETERMINADO',
    organizacion: r.organizacion ?? null,
    requerimientos,
    campos_faltantes: d1.campos_faltantes,
    informacion_suficiente: d1.informacion_suficiente,
    preguntas_sugeridas: preguntas,
    prioridad: r.prioridad || 'MEDIA',
    confianza,
    requiere_revision_humana: confianza < config.umbralConfianza || r.tipo_cliente === 'ORGANIZACION',
    siguiente_paso: d1.informacion_suficiente ? 'A05_CONSOLIDAR_REQUERIMIENTOS' : 'A03_PREGUNTAS_ADICIONALES',
  };
}

module.exports = { analizarSolicitud, armar };
