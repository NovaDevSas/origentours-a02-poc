/** Repositorio en memoria para la PoC (se reemplaza por PostgreSQL/RDS en el MVP). */
const solicitudes = new Map();
let consecutivo = 0;

function nuevoId(fecha = new Date()) {
  consecutivo += 1;
  return `COT-${fecha.getFullYear()}-${String(consecutivo).padStart(4, '0')}`;
}

function guardar(solicitud) { solicitudes.set(solicitud.id_solicitud, solicitud); return solicitud; }
function obtener(id) { return solicitudes.get(id) || null; }
function listar() { return [...solicitudes.values()].sort((a, b) => b.fecha_recepcion.localeCompare(a.fecha_recepcion)); }
function limpiar() { solicitudes.clear(); consecutivo = 0; }

module.exports = { nuevoId, guardar, obtener, listar, limpiar };
