const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const schema = require('../schemas/analisisA02.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validarEsquema = ajv.compile(schema);

/** Valida un objeto contra el contrato JSON A02. */
function validarAnalisis(objeto) {
  const valido = validarEsquema(objeto);
  return {
    valido,
    errores: valido ? [] : validarEsquema.errors.map((e) => `${e.instancePath || '/'} ${e.message}`),
  };
}

module.exports = { validarAnalisis, schema };
