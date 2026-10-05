/**
 * /primaria: reemplaza el texto de idiomas (pages.parrafo2) por el que mandó el colegio.
 * Idempotente. Dry-run por defecto; `--apply` escribe. Usa process.env.MONGODB_URI.
 *
 *   node scripts/2026-10-primaria-idiomas.js
 *   node scripts/2026-10-primaria-idiomas.js --apply
 */
require("dotenv").config();
const mongoose = require("mongoose");

const APPLY = process.argv.includes("--apply");

const RESALTADO = (t) => `<span class="bg-white t-amarillo font-weight-bold px-2"><i>${t}</i></span>`;
const BTN = (href, t) =>
  `<a href="${href}" class="btn btn-lg btn-light text-warning mx-3" style="border-radius: 10px;">${t}</a>`;

// Mantiene el marcado que ya tenía Mongo (resaltados amarillos, botones de Alemán/Inglés y
// el </div> final suelto) y sólo cambia el texto.
const NUEVO =
  "<p> El nivel primario cuenta con educación " + RESALTADO("bilingüe en inglés.") +
  " Es decir, que tienen materias como lengua, literatura y ciencias en el idioma. Además, los alumnos " +
  "participan en diferentes actividades, como el Concert y obras de teatro. Los estudiantes de 6to grado " +
  "cuentan con la posibilidad de rendir un " + RESALTADO("examen internacional") + " de nivel A2. </p> " +
  "<p> La enseñanza de idiomas acompaña a los alumnos durante toda su trayectoria en el colegio, con una " +
  "carga horaria pensada para cada etapa. En el Jardín, la sala de 2 tiene 2 estímulos semanales, las " +
  "salas de 3 tienen 4, y las salas de 4 y 5 tienen 5. En Primaria, los alumnos cuentan con " +
  RESALTADO("9 horas semanales de 1º a 4º grado y 11 horas en 5º y 6º.") +
  " En Secundaria, son 8 horas semanales de 1º a 3º año y 6 horas de 4º a 6º. El objetivo es que puedan " +
  "aprenderlos con fluidez desde una edad temprana. " +
  BTN("/deutsch", "Más info de Alemán") + " " + BTN("/english", "Más info de Inglés") + " </div>";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const col = mongoose.connection.db.collection("pages");
  const doc = await col.findOne({ ruta: "/primaria" });
  if (!doc) throw new Error("No existe pages con ruta /primaria");
  if (doc.parrafo2 === NUEVO) console.log("Ya aplicado.");
  else {
    console.log("antes:", JSON.stringify(doc.parrafo2));
    console.log("después:", JSON.stringify(NUEVO));
    if (APPLY) {
      await col.updateOne({ _id: doc._id }, { $set: { parrafo2: NUEVO } });
      console.log("Escrito.");
    } else console.log("(dry-run, usar --apply para escribir)");
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
