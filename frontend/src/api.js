const BASE = import.meta.env.VITE_API_URL || '';

async function llamar(ruta, opciones = {}) {
  const resp = await fetch(`${BASE}${ruta}`, { headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(datos.detalles?.join(' · ') || datos.detalle || datos.error || `Error ${resp.status}`);
  return datos;
}

export const salud = () => llamar('/api/health');
export const listarSolicitudes = () => llamar('/api/solicitudes');
export const crearSolicitud = (payload) => llamar('/api/solicitudes', { method: 'POST', body: JSON.stringify(payload) });
export const reanalizar = (id, proveedor) => llamar(`/api/solicitudes/${id}/analisis`, { method: 'POST', body: JSON.stringify({ proveedor }) });
export const cambiarEstado = (id, estado) => llamar(`/api/solicitudes/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
