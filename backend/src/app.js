const express = require('express');
const cors = require('cors');
const config = require('./config');
const solicitudesRouter = require('./routes/solicitudes');
const { schema } = require('./services/validador');
const { PROVEEDORES } = require('./services/llm');

const app = express();
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ estado: 'ok', proveedor_por_defecto: config.llmProvider, proveedores: PROVEEDORES }));
app.get('/api/esquema/a02', (_req, res) => res.json(schema));
app.use('/api/solicitudes', solicitudesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(502).json({ error: 'Error al analizar la solicitud', detalle: err.message });
});

module.exports = app;
