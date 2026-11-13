# Prompts utilizados para generar el código base (Parte II – Actividad 4)

## Prompt 1 – Creación del codebase
> Actúa como Tech Lead. Crea un monorepo con dos proyectos: `backend` (Node.js 18 + Express, CommonJS) y `frontend` (React 18 + Vite).
> El backend expone una API REST para la PoC A02 de OrigenTours. Incluye `.gitignore` con `node_modules/` y `.env`, un `.env.example`
> y un README con instrucciones de ejecución.

## Prompt 2 – Primera tarea de la HU-01 (ticket OT-101)
> Implementa el ticket OT-101: endpoint `POST /api/solicitudes` que reciba `{ texto, canal, proveedor? }`, valide la entrada
> (texto ≥ 15 caracteres, canal ∈ CORREO|WHATSAPP|FORMULARIO), genere el id `COT-AAAA-NNNN`, invoque un orquestador que llame al LLM con
> el prompt de sistema A02, valide la respuesta con AJV contra `analisisA02.schema.json`, calcule de forma determinista los campos
> faltantes (decisión D1) y responda 201 con el JSON A02 y metadatos (modelo, latencia, tokens, costo). Si el JSON es inválido,
> reintenta una vez enviando los errores al modelo. Incluye pruebas con node:test y supertest.

## Prompt 3 – Abstracción de proveedores
> Crea una capa `services/llm` con tres proveedores intercambiables con la misma interfaz `analizar(entrada)`: `mock` (reglas, sin API key),
> `anthropic` (Messages API) y `openai` (Chat Completions con `response_format: json_object`). Todos usan el mismo prompt de sistema
> para poder comparar modelos con los mismos casos.

## Prompt 4 – Consola del asesor
> En el frontend React crea una única pantalla con: formulario (canal, modelo, texto), resultado A02 (D1, requerimientos con faltantes
> resaltados, preguntas sugeridas, métricas), botones para re-analizar con cada proveedor y aprobar el traspaso, e historial.
