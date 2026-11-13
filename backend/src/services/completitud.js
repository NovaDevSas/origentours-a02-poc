/**
 * Verificador de completitud (decisión D1).
 * La lista mínima para cotizar se evalúa de forma DETERMINISTA: el LLM extrae,
 * pero la regla de negocio que decide si la información es suficiente vive en código.
 */
const CAMPOS_MINIMOS = [
  'destino_preferido',
  'ciudad_de_salida',
  'fecha_inicio_estimada',
  'duracion_dias',
  'numero_viajeros',
  'presupuesto_por_persona_cop',
];

const PREGUNTAS_POR_CAMPO = {
  destino_preferido: '¿Qué destino o región de Colombia le gustaría visitar?',
  ciudad_de_salida: '¿Desde qué ciudad saldría el grupo?',
  fecha_inicio_estimada: '¿En qué fecha aproximada desea iniciar el viaje?',
  duracion_dias: '¿Cuántos días le gustaría que dure la experiencia?',
  numero_viajeros: '¿Cuántas personas viajarían?',
  presupuesto_por_persona_cop: '¿Cuál es el presupuesto aproximado por persona?',
};

function vacio(valor) {
  return valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && valor.length === 0);
}

function evaluarCompletitud(requerimientos = {}) {
  const camposFaltantes = CAMPOS_MINIMOS.filter((c) => vacio(requerimientos[c]));
  return {
    campos_faltantes: camposFaltantes,
    informacion_suficiente: camposFaltantes.length === 0,
    preguntas_base: camposFaltantes.map((c) => PREGUNTAS_POR_CAMPO[c]),
  };
}

module.exports = { evaluarCompletitud, CAMPOS_MINIMOS, PREGUNTAS_POR_CAMPO };
