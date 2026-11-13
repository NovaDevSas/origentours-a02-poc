import { useEffect, useState } from 'react';
import { salud, listarSolicitudes, crearSolicitud, reanalizar, cambiarEstado } from './api';

const EJEMPLO = 'Buenos días. Soy la profesora Gómez de la Universidad del Valle, Facultad de Ciencias. Queremos organizar una salida de campo al Eje Cafetero para 28 estudiantes, 4 días a partir del 15 de marzo de 2027. Nos interesa la caficultura y el avistamiento de aves. 3 personas son vegetarianas.';

const ETIQUETAS = {
  destino_preferido: 'Destino', ciudad_de_salida: 'Ciudad de salida', fecha_inicio_estimada: 'Fecha de inicio',
  duracion_dias: 'Duración (días)', numero_viajeros: 'Viajeros', presupuesto_por_persona_cop: 'Presupuesto / persona (COP)',
};

export default function App() {
  const [api, setApi] = useState(null);
  const [form, setForm] = useState({ texto: '', canal: 'CORREO', proveedor: '' });
  const [analisis, setAnalisis] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [verJson, setVerJson] = useState(false);

  const refrescar = () => listarSolicitudes().then(setHistorial).catch(() => {});
  useEffect(() => { salud().then(setApi).catch(() => setApi(false)); refrescar(); }, []);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true); setError('');
    try {
      const payload = { texto: form.texto, canal: form.canal, ...(form.proveedor && { proveedor: form.proveedor }) };
      const r = await crearSolicitud(payload);
      setAnalisis(r.analisis); refrescar();
    } catch (err) { setError(err.message); } finally { setCargando(false); }
  }

  async function comparar(proveedor) {
    setCargando(true); setError('');
    try { const r = await reanalizar(analisis.id_solicitud, proveedor); setAnalisis(r.analisis); refrescar(); }
    catch (err) { setError(err.message); } finally { setCargando(false); }
  }

  async function aprobar() {
    await cambiarEstado(analisis.id_solicitud, analisis.informacion_suficiente ? 'VALIDADA' : 'EN_ACLARACION');
    refrescar();
  }

  const req = analisis?.requerimientos;
  return (
    <div className="app">
      <header>
        <div>
          <h1>OrigenTours · Análisis de solicitudes</h1>
          <p>PoC A02 — Recibir y revisar solicitud con GenAI</p>
        </div>
        <span className={`estado ${api ? 'ok' : 'off'}`}>
          {api === null ? 'Conectando…' : api ? `API activa · LLM: ${api.proveedor_por_defecto}` : 'API no disponible'}
        </span>
      </header>

      <main>
        <section className="panel">
          <h2>1. Registrar solicitud</h2>
          <form onSubmit={enviar}>
            <label>Canal de origen
              <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })}>
                <option value="CORREO">Correo</option><option value="WHATSAPP">WhatsApp</option><option value="FORMULARIO">Formulario web</option>
              </select>
            </label>
            <label>Modelo
              <select value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })}>
                <option value="">Por defecto</option>
                {api?.proveedores?.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label>Texto de la solicitud
              <textarea rows={8} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="Pegue aquí el correo, mensaje de WhatsApp o formulario del cliente" />
            </label>
            <div className="acciones">
              <button type="button" className="sec" onClick={() => setForm({ ...form, texto: EJEMPLO })}>Usar ejemplo</button>
              <button type="submit" disabled={cargando}>{cargando ? 'Analizando…' : 'Analizar con GenAI'}</button>
            </div>
          </form>
          {error && <p className="error">{error}</p>}
        </section>

        <section className="panel">
          <h2>2. Resultado A02</h2>
          {!analisis ? <p className="vacio">Aún no hay análisis.</p> : (
            <>
              <div className={`d1 ${analisis.informacion_suficiente ? 'si' : 'no'}`}>
                <strong>D1 · ¿Información suficiente?</strong> {analisis.informacion_suficiente ? 'Sí → A05 Consolidar requerimientos' : 'No → A03 Solicitar aclaraciones'}
              </div>
              <p className="meta">{analisis.id_solicitud} · {analisis.tipo_cliente}{analisis.organizacion ? ` · ${analisis.organizacion}` : ''} · prioridad {analisis.prioridad} · confianza {analisis.confianza}
                {analisis.requiere_revision_humana && <span className="badge">Requiere revisión humana</span>}</p>
              <table>
                <tbody>
                  {Object.entries(ETIQUETAS).map(([k, etiqueta]) => (
                    <tr key={k} className={analisis.campos_faltantes.includes(k) ? 'falta' : ''}>
                      <th>{etiqueta}</th><td>{req[k] ?? '— faltante —'}</td>
                    </tr>
                  ))}
                  <tr><th>Tipo de experiencia</th><td>{req.tipo_experiencia.join(', ') || '—'}</td></tr>
                  <tr><th>Intereses</th><td>{req.intereses.join(', ') || '—'}</td></tr>
                  <tr><th>Restricciones</th><td>{req.restricciones.map((r) => `${r.tipo}: ${r.detalle}`).join('; ') || '—'}</td></tr>
                </tbody>
              </table>
              {analisis.preguntas_sugeridas.length > 0 && (<><h3>Preguntas sugeridas (A03)</h3><ul>{analisis.preguntas_sugeridas.map((p) => <li key={p}>{p}</li>)}</ul></>)}
              <p className="meta">Modelo: {analisis.metadatos.modelo} · {analisis.metadatos.latencia_ms} ms · tokens {analisis.metadatos.tokens_entrada}/{analisis.metadatos.tokens_salida} · USD {analisis.metadatos.costo_usd} · esquema {analisis.metadatos.esquema_valido ? 'válido ✔' : 'inválido ✖'}</p>
              <div className="acciones">
                {api?.proveedores?.map((p) => <button key={p} className="sec" disabled={cargando} onClick={() => comparar(p)}>Re-analizar con {p}</button>)}
                <button onClick={aprobar}>{analisis.informacion_suficiente ? 'Aprobar traspaso a diseño' : 'Marcar en aclaración'}</button>
              </div>
              <button className="link" onClick={() => setVerJson(!verJson)}>{verJson ? 'Ocultar' : 'Ver'} JSON A02</button>
              {verJson && <pre>{JSON.stringify(analisis, null, 2)}</pre>}
            </>
          )}
        </section>

        <section className="panel ancho">
          <h2>3. Historial de solicitudes</h2>
          {historial.length === 0 ? <p className="vacio">Sin solicitudes registradas.</p> : (
            <table>
              <thead><tr><th>ID</th><th>Canal</th><th>Estado</th><th>D1</th><th>Análisis</th><th>Texto</th></tr></thead>
              <tbody>{historial.map((s) => (
                <tr key={s.id_solicitud}><td>{s.id_solicitud}</td><td>{s.canal_origen}</td><td>{s.estado}</td>
                  <td>{s.informacion_suficiente ? 'Suficiente' : 'Incompleta'}</td><td>{s.numero_analisis}</td><td className="texto">{s.texto_original}</td></tr>
              ))}</tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
