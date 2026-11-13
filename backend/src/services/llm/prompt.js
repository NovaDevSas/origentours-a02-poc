/** Prompt de sistema compartido por todos los proveedores (misma instrucción para comparar modelos). */
const PROMPT_SISTEMA = `Eres el agente de análisis de solicitudes (actividad A02) de OrigenTours, una agencia colombiana de experiencias de viaje personalizadas.
Tu tarea: leer la solicitud del cliente en lenguaje natural y extraer SOLO lo que el cliente dijo. No inventes datos.
Si un dato no aparece, usa null. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni bloques de código.

Estructura exacta:
{
  "tipo_cliente": "INDIVIDUAL | GRUPO_ACADEMICO | ORGANIZACION | FAMILIA | NO_DETERMINADO",
  "organizacion": string | null,
  "requerimientos": {
    "tipo_experiencia": ["NATURALEZA" | "CULTURAL" | "AVENTURA" | "GASTRONOMICA" | "PLAYA" | "BIENESTAR" | "ACADEMICA" | "CORPORATIVA"],
    "destino_preferido": string | null,
    "ciudad_de_salida": string | null,
    "fecha_inicio_estimada": "AAAA-MM-DD" | null,
    "duracion_dias": entero | null,
    "numero_viajeros": entero | null,
    "presupuesto_por_persona_cop": número | null,
    "restricciones": [{"tipo": "ALIMENTARIA | MOVILIDAD | SALUD | EDAD | OTRA", "detalle": string}],
    "intereses": [string]
  },
  "preguntas_sugeridas": [string],
  "prioridad": "ALTA | MEDIA | BAJA",
  "confianza": número entre 0 y 1
}
Reglas: convierte presupuestos totales a valor por persona solo si el número de viajeros es explícito; las fechas relativas se resuelven con la fecha de recepción; formula preguntas cordiales y concretas solo para los datos faltantes.`;

function construirMensajeUsuario({ texto, canal, fechaRecepcion }) {
  return `Canal: ${canal}\nFecha de recepción: ${fechaRecepcion}\nSolicitud del cliente:\n"""${texto}"""`;
}

/** Extrae el primer objeto JSON de una respuesta de texto (tolera bloques ```json). */
function extraerJson(textoRespuesta) {
  const limpio = String(textoRespuesta).replace(/```json|```/g, '').trim();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin === -1) throw new Error('La respuesta del LLM no contiene JSON');
  return JSON.parse(limpio.slice(inicio, fin + 1));
}

module.exports = { PROMPT_SISTEMA, construirMensajeUsuario, extraerJson };
