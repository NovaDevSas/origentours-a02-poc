/**
 * Proveedor simulado (sin API key) basado en reglas.
 * Sirve como línea base para comparar contra los LLM y para ejecutar pruebas sin costo.
 */
const DESTINOS = ['Eje Cafetero', 'Valle del Cocora', 'Salento', 'Cartagena', 'Santa Marta', 'Parque Tayrona', 'San Andrés', 'Guatapé',
  'Villa de Leyva', 'Amazonas', 'Leticia', 'La Guajira', 'Caño Cristales', 'Barichara', 'San Gil', 'Nuquí', 'Medellín', 'Bogotá'];
const CIUDADES = ['Cali', 'Bogotá', 'Medellín', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Armenia', 'Pasto', 'Cúcuta', 'Ibagué'];
const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const TIPOS = {
  NATURALEZA: ['naturaleza', 'aves', 'ecologic', 'senderismo', 'montana', 'selva', 'parque natural'],
  CULTURAL: ['cultura', 'historia', 'museo', 'cafe', 'cafeter', 'tradicion'],
  AVENTURA: ['aventura', 'rafting', 'parapente', 'extremo', 'buceo'],
  GASTRONOMICA: ['gastronom', 'comida tipica', 'cocina'],
  PLAYA: ['playa', 'caribe', 'isla'],
  BIENESTAR: ['relax', 'descanso', 'spa', 'bienestar', 'yoga'],
  ACADEMICA: ['salida de campo', 'academic', 'universidad', 'colegio', 'estudiantes'],
  CORPORATIVA: ['empresa', 'corporativ', 'equipo de trabajo', 'incentivo'],
};
const INTERESES = ['caficultura', 'avistamiento de aves', 'senderismo', 'buceo', 'gastronomía', 'historia', 'fotografía', 'rafting', 'artesanías'];

const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const incluye = (texto, palabra) => norm(texto).includes(norm(palabra));

function extraerPresupuesto(t) {
  const millones = t.match(/(\d+(?:[.,]\d+)?)\s*millones?/i);
  if (millones) return Math.round(parseFloat(millones[1].replace(',', '.')) * 1_000_000);
  const pesos = t.match(/\$\s*([\d.]{4,})/) || t.match(/([\d.]{5,})\s*(?:pesos|cop)/i);
  return pesos ? Number(pesos[1].replace(/\./g, '')) : null;
}

function extraerFecha(t, fechaRecepcion) {
  const iso = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const m = norm(t).match(/(?:(\d{1,2})\s+de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+|del\s+)?(\d{4}))?/);
  if (!m) return null;
  const base = new Date(fechaRecepcion);
  const mes = MESES[m[2]];
  let anio = m[3] ? Number(m[3]) : base.getFullYear();
  if (!m[3] && mes < base.getMonth() + 1) anio += 1;
  const dia = m[1] ? Number(m[1]) : 1;
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

async function analizar({ texto, fechaRecepcion }) {
  const t = texto;
  const viajeros = t.match(/(\d+)\s*(personas|estudiantes|viajeros|adultos|pasajeros|colaboradores|integrantes)/i);
  const dias = t.match(/(\d+)\s*d[ií]as/i);
  const salida = norm(t).match(/(?:desde|saliendo de|salimos de|saldriamos de|salida desde)\s+([a-z]+)/);
  const ciudadSalida = salida ? CIUDADES.find((c) => norm(c) === salida[1]) || null : null;
  const destino = DESTINOS.find((d) => incluye(t, d) && norm(d) !== norm(ciudadSalida || '#')) || null;

  const tipo_experiencia = Object.entries(TIPOS).filter(([, kws]) => kws.some((k) => incluye(t, k))).map(([k]) => k);
  const restricciones = [];
  const veg = t.match(/(\d+)\s*(?:personas\s*)?(?:son\s*)?vegetarian[oa]s?/i);
  if (veg || incluye(t, 'vegetarian')) restricciones.push({ tipo: 'ALIMENTARIA', detalle: veg ? `${veg[1]} personas vegetarianas` : 'Alimentación vegetariana' });
  if (incluye(t, 'silla de ruedas') || incluye(t, 'movilidad reducida')) restricciones.push({ tipo: 'MOVILIDAD', detalle: 'Persona con movilidad reducida' });
  if (incluye(t, 'alerg')) restricciones.push({ tipo: 'SALUD', detalle: 'Alergias reportadas' });

  let tipo_cliente = 'INDIVIDUAL';
  if (/universidad|colegio|facultad|estudiantes/i.test(t)) tipo_cliente = 'GRUPO_ACADEMICO';
  else if (/empresa|s\.a\.s|compañ[ií]a|colaboradores/i.test(t)) tipo_cliente = 'ORGANIZACION';
  else if (/familia|hijos|esposa|esposo/i.test(t)) tipo_cliente = 'FAMILIA';
  const org = t.match(/((?:Universidad|Colegio) (?:del |de la |de )?[A-ZÁÉÍÓÚ][\wáéíóúñ ]*?)(?=[,.\n]| para| con)/);

  const numViajeros = viajeros ? Number(viajeros[1]) : null;
  return {
    resultado: {
      tipo_cliente,
      organizacion: org ? org[1].trim() : null,
      requerimientos: {
        tipo_experiencia,
        destino_preferido: destino,
        ciudad_de_salida: ciudadSalida,
        fecha_inicio_estimada: extraerFecha(t, fechaRecepcion),
        duracion_dias: dias ? Number(dias[1]) : null,
        numero_viajeros: numViajeros,
        presupuesto_por_persona_cop: extraerPresupuesto(t),
        restricciones,
        intereses: INTERESES.filter((i) => incluye(t, i.split(' ').pop())),
      },
      preguntas_sugeridas: [],
      prioridad: numViajeros && numViajeros >= 15 ? 'ALTA' : 'MEDIA',
      confianza: 0.7,
    },
    modelo: 'mock-reglas-v1',
    tokens_entrada: 0,
    tokens_salida: 0,
  };
}

module.exports = { nombre: 'mock', analizar };
