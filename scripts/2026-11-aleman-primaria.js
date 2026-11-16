/**
 * Pedido 2026-11 ("Nuevos cambios página web"): textos de alemán en /deutsch y /primaria.
 * Toca la colección `pages` (las dos páginas se renderizan con texto de Mongo).
 *
 * Qué hace:
 *   1) /deutsch, "El Idioma": reemplaza el segundo párrafo ("A partir del Nivel Primario…").
 *   2) /deutsch, "Die Sprache": reemplaza el segundo párrafo ("Mit dem Eintreten in die
 *      Primärstufe…").
 *   3) /deutsch, "Kultur": "in der Primärstufe" -> "in der Grundschule". En la página no tiene
 *      que quedar ningún "Primärstufe", así que también se cambia en `parrafo7` (copia en texto
 *      plano que hoy no se muestra).
 *   4) /primaria, "El Idioma": agrega el bloque de alemán entre el párrafo de inglés (el que
 *      termina en "…de nivel A2.") y el de la carga horaria.
 *
 * Idempotente. Dry-run por defecto; `--apply` escribe. Usa process.env.MONGODB_URI.
 * Si un texto no está como se espera (alguien lo editó por /pagesEdit), avisa "inesperado" y
 * no toca ese campo.
 *
 *   node --no-deprecation scripts/2026-11-aleman-primaria.js
 *   node --no-deprecation scripts/2026-11-aleman-primaria.js --apply
 */
require("dotenv").config();
const mongoose = require("mongoose");

const APPLY = process.argv.includes("--apply");

const AMARILLO = (t) => `<span class="c-amarillo">${t}</span>`;
const SUBTITULO = (t) => `<h5 class="font-weight-bold mt-4">${t}</h5>`;

const IDIOMA_ES =
  "<p> En el " + AMARILLO("Nivel Primario") + ", 1.º y 2.º grado se acercan al idioma desde una " +
  "metodología lúdica, con foco en la comunicación oral. A partir de 3.er grado se trabajan de manera " +
  "intensiva las cuatro competencias lingüísticas (comprensión auditiva, expresión oral, lectura y " +
  "escritura), alineadas con el Marco Común Europeo de Referencia para las Lenguas (MCER). </p>";

const SPRACHE_DE =
  "<p> In der " + AMARILLO("Grundschule") + " steht in der 1. und 2. Klasse der spielerische Zugang zur " +
  "Sprache im Vordergrund, mit dem Schwerpunkt auf der mündlichen Kommunikation. Ab der 3. Klasse werden " +
  "die vier sprachlichen Kompetenzen (Hörverstehen, Sprechen, Lesen und Schreiben) intensiv gefördert, in " +
  "Anlehnung an den Gemeinsamen Europäischen Referenzrahmen für Sprachen (GER). </p>";

const ALEMAN_PRIMARIA =
  SUBTITULO("La enseñanza del idioma alemán en la Escuela Primaria") +
  " <p> En nuestra institución, el aprendizaje del idioma alemán constituye un pilar fundamental dentro de " +
  "nuestro proyecto educativo. Buscamos formar estudiantes capaces de comunicarse de manera efectiva y " +
  "desenvolverse con seguridad en un entorno culturalmente diverso, acompañándolos progresivamente en cada " +
  "etapa de su desarrollo escolar. </p> " +
  SUBTITULO("Primer y segundo grado: el primer contacto a través del juego") +
  " <p> En los primeros años de la educación primaria, la enseñanza del alemán se aborda desde una " +
  "metodología lúdica y dinámica. Nuestro enfoque principal está puesto en la comunicación oral, fomentando " +
  "que los niños se familiaricen de forma natural con la sonoridad y el vocabulario del idioma a través de " +
  "canciones, juegos y actividades interactivas que despiertan su curiosidad y motivación. </p> " +
  SUBTITULO("A partir de tercer grado: desarrollo de habilidades según estándares internacionales") +
  " <p> A partir de 3.er grado, el aprendizaje se profundiza y sistematiza. Trabajamos de manera intensiva " +
  "las distintas habilidades lingüísticas (comprensión auditiva, expresión oral, lectura y escritura) " +
  "alineadas con el Marco Común Europeo de Referencia para las Lenguas (MCER) y respondiendo rigurosamente " +
  "a los estándares de la enseñanza oficial alemana. </p> " +
  SUBTITULO("Evaluación y certificación de conocimientos") +
  " <p> Para asegurar un seguimiento continuo del desarrollo de cada estudiante: </p> <ul> " +
  "<li><p class=\"mb-2\"><b>4.º grado:</b> se realiza una evaluación integral de las competencias en el idioma para " +
  "diagnosticar y acompañar los avances en esta etapa intermedia.</p></li> " +
  "<li><p class=\"mb-2\"><b>6.º grado, examen Gartenstadt Diplom:</b> al finalizar el nivel primario, los estudiantes rinden " +
  "el examen interno Gartenstadt Diplom, una instancia institucional que certifica de manera formal los " +
  "conocimientos y el nivel de competencia alcanzados hasta el momento, consolidando la base para el nivel " +
  "secundario.</p></li> </ul>";

// `buscar` es el texto que tenía la base el 16/11/2026; `listo` dice si el cambio ya está.
const CAMBIOS = [
  {
    ruta: "/deutsch",
    campo: "parrafo1",
    nombre: "El Idioma, 2.º párrafo",
    buscar: /<p>\s*A partir del <span class="c-amarillo">Nivel Primario<\/span>,[\s\S]*?<\/p>/,
    por: IDIOMA_ES,
    listo: (v) => v.includes(IDIOMA_ES),
  },
  {
    ruta: "/deutsch",
    campo: "parrafo1",
    nombre: "Die Sprache, 2.º párrafo",
    buscar: /<p>\s*Mit dem Eintreten in die <span class="c-amarillo">Primärstufe<\/span>[\s\S]*?<\/p>/,
    por: SPRACHE_DE,
    listo: (v) => v.includes(SPRACHE_DE),
  },
  {
    ruta: "/deutsch",
    campo: "subTitulo4",
    nombre: "Kultur, 2.º párrafo",
    buscar: /in der\s+Primärstufe/,
    por: "in der Grundschule",
    listo: (v) => !v.includes("Primärstufe") && /Seit 2018 bieten wir in der Grundschule/.test(v),
  },
  {
    ruta: "/deutsch",
    campo: "parrafo7",
    nombre: "Kultur (texto plano)",
    buscar: /in der\s+Primärstufe/,
    por: "in der Grundschule",
    listo: (v) => !v.includes("Primärstufe"),
  },
  {
    ruta: "/primaria",
    campo: "parrafo2",
    nombre: "El Idioma, bloque de alemán",
    buscar: /de nivel A2\. <\/p>/,
    por: "de nivel A2. </p> " + ALEMAN_PRIMARIA,
    listo: (v) => v.includes(ALEMAN_PRIMARIA),
  },
];

// Devuelve { set, avisos } para un documento de `pages`: qué campos escribir y qué se salteó.
// Los cambios sobre un mismo campo se encadenan.
function calcular(doc) {
  const set = {};
  const avisos = [];
  for (const c of CAMBIOS.filter((c) => c.ruta === doc.ruta)) {
    const valor = c.campo in set ? set[c.campo] : doc[c.campo];
    if (typeof valor !== "string") avisos.push(`${doc.ruta} .${c.campo} (${c.nombre}): no existe`);
    else if (c.listo(valor)) continue;
    else if (c.buscar.test(valor)) set[c.campo] = valor.replace(c.buscar, c.por);
    else avisos.push(`${doc.ruta} .${c.campo} (${c.nombre}): inesperado, no se toca`);
  }
  return { set, avisos };
}

module.exports = { CAMBIOS, IDIOMA_ES, SPRACHE_DE, ALEMAN_PRIMARIA, calcular };

if (require.main === module) {
  (async () => {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const col = mongoose.connection.db.collection("pages");
    let campos = 0;
    for (const ruta of [...new Set(CAMBIOS.map((c) => c.ruta))]) {
      const doc = await col.findOne({ ruta });
      if (!doc) throw new Error(`No existe pages con ruta ${ruta}`);
      const { set, avisos } = calcular(doc);
      avisos.forEach((a) => console.log("AVISO", a));
      for (const [campo, nuevo] of Object.entries(set)) {
        console.log(`\n== ${ruta} .${campo}`);
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
