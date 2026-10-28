/**
 * Pedido 2026-10: "alumno" pasa a "estudiante" en toda la web, y cambios de Educación Física.
 * Toca la colección `pages` (los textos de las plantillas se cambiaron en el código).
 *
 * Qué hace:
 *   1) /educacionfisica: saca la última oración de parrafo2 (desde "Tanto en lo referente…")
 *      y reemplaza cardTexto2 (Torneos / Encuentros) y cardTexto3 (Campamentos).
 *   2) En todas las páginas, "alumno/s", "alumna/s" y "alumnos/as" -> "estudiante/s".
 *      No toca rutas ni paths de imágenes (`ruta`, `pagina`, `/img/.../alumnos-...`).
 *
 * Idempotente. Dry-run por defecto; `--apply` escribe. Usa process.env.MONGODB_URI.
 * Los cambios de Educación Física sólo se aplican si el campo tiene el valor esperado: si
 * alguien lo editó por /pagesEdit, avisa "inesperado" y lo saltea.
 *
 *   node --no-deprecation scripts/2026-10-estudiantes.js
 *   node --no-deprecation scripts/2026-10-estudiantes.js --apply
 */
require("dotenv").config();
const mongoose = require("mongoose");

const APPLY = process.argv.includes("--apply");

// Campos que no son texto visible.
const NO_TOCAR = new Set(["_id", "ruta", "pagina", "createdAt", "updatedAt", "__v"]);

// Primero los casos con género o concordancia; después el reemplazo general. El general no
// toca palabras pegadas a "/", "-" o comillas, para no romper paths como
// /img/deptos/informatica/alumnos-inversores ni rutas como /alumnos-intercambio.
const REGLAS = [
  [/Nuestras alumnas y alumnos/g, "Nuestros estudiantes"],
  [/Los alumnos y las alumnas/g, "Los estudiantes"],
  [/alumnos\/as/g, "estudiantes"],
  [/Grupo de alumno de la ES/g, "Grupo de estudiantes de la ES"],
  [/^Alumnos Intercambio$/g, "Estudiantes de Intercambio"],
  [/(?<![-"\/\w])Alumn[oa](s?)(?![-"\/\w])/g, "Estudiante$1"],
  [/(?<![-"\/\w])alumn[oa](s?)(?![-"\/\w])/g, "estudiante$1"],
];

function transformar(texto) {
  return REGLAS.reduce((t, [re, por]) => t.replace(re, por), texto);
}

const ORACION_EF =
  "Tanto en lo referente a la gestión de las giras deportivas, como a la gestión de los " +
  "campamentos educativos, los alumnos son partícipes de las tareas de programación, y actores " +
  "comprometidos en generar los recursos necesarios para afrontar los gastos propios de la " +
  "actividad planificada.";

// Cambios puntuales de /educacionfisica: `antes` es el valor que tenía la base el 28/10/2026.
const CAMBIOS_EF = [
  {
    campo: "parrafo2",
    antes:
      "Los jóvenes muestran gran interés por los deportes y considerando que su práctica ofrece " +
      "espacios de articulación entre lo individual y lo social que permiten ensayar roles, " +
      "responsabilizarse, cooperar y reflexionar sobre cuestiones éticas referidas al juego limpio, " +
      "al valor de las normas, a las relaciones entre esfuerzo y resultado, éxito y fracaso, se busca " +
      "por este medio conseguir que el alumno sea una persona físicamente educada." + ORACION_EF,
    despues:
      "Los jóvenes muestran gran interés por los deportes y considerando que su práctica ofrece " +
      "espacios de articulación entre lo individual y lo social que permiten ensayar roles, " +
      "responsabilizarse, cooperar y reflexionar sobre cuestiones éticas referidas al juego limpio, " +
      "al valor de las normas, a las relaciones entre esfuerzo y resultado, éxito y fracaso, se busca " +
      "por este medio conseguir que el estudiante sea una persona físicamente educada.",
  },
  {
    campo: "cardTexto2",
    antes:
      "Encuentro Deportivo y Cultural EP.Encuentro Deportivo Secundaria.Torneo Handball femenino " +
      "Sec.Encuentro de Voley sec.Encuentros y Torneo de Handball Varones.Encuentros de Futbol, " +
      "Handball, Voley, Atletismo de la AGDS",
    despues: "Encuentros Deportivos de Natación, Handball, Voley y Atletismo.",
  },
  {
    campo: "cardTexto3",
    antes:
      "Los Campamentos se realizan según los años en distintos lugares como:SAG Polvorines, Las " +
      "Clavelinas - Ing. Maschwitz, La Paloma - Ezeiza, Encuentro con Gutemberg Mar del Plata, " +
      "Estadía en Verónica y otros lugares.",
    despues:
      "Los campamentos se realizan según los años en distintos lugares como: Verónica, Colegio " +
      "Holters en Cardales, Gutenberg en Mar del Plata, Colegio Alemán en Villa Gral. Belgrano en " +
      "Córdoba, Colegio Culmey en Misiones y por último el Inst. Primo Capraro en Bariloche.",
  },
];

// Devuelve { set, avisos } para un documento de `pages`: qué campos escribir y qué se salteó.
function calcular(doc) {
  const set = {};
  const avisos = [];
  if (doc.ruta === "/educacionfisica") {
    for (const c of CAMBIOS_EF) {
      if (doc[c.campo] === c.despues) continue;
      if (doc[c.campo] === c.antes) set[c.campo] = c.despues;
      else avisos.push(`${doc.ruta} .${c.campo}: inesperado, no se toca`);
    }
  }
  for (const [campo, valor] of Object.entries(doc)) {
    if (NO_TOCAR.has(campo) || typeof valor !== "string" || campo in set) continue;
    if (avisos.some((a) => a.startsWith(`${doc.ruta} .${campo}:`))) continue;
    const nuevo = transformar(valor);
    if (nuevo !== valor) set[campo] = nuevo;
  }
  return { set, avisos };
}

module.exports = { REGLAS, CAMBIOS_EF, transformar, calcular };

if (require.main === module) {
  (async () => {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const col = mongoose.connection.db.collection("pages");
    let campos = 0;
    for (const doc of await col.find({}).toArray()) {
      const { set, avisos } = calcular(doc);
      avisos.forEach((a) => console.log("AVISO", a));
      for (const [campo, nuevo] of Object.entries(set)) {
        console.log(`\n== ${doc.ruta} .${campo}`);
        console.log("antes:  ", JSON.stringify(doc[campo]));
        console.log("después:", JSON.stringify(nuevo));
        campos++;
      }
      if (APPLY && Object.keys(set).length) await col.updateOne({ _id: doc._id }, { $set: set });
    }
    console.log(`\n${campos} campos ${APPLY ? "escritos" : "a cambiar (dry-run, usar --apply para escribir)"}.`);
    if (!campos) console.log("Ya aplicado.");
    await mongoose.disconnect();
  })().catch((e) => { console.error(e.message); process.exit(1); });
}
