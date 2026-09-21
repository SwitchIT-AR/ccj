/**
 * Pliego "Modificaciones web CCJ 2026-09" — puntos A.1, A.3, A.4, A.5 y A.6.
 *
 * Estos textos NO están en el código: viven en MongoDB Atlas (base `ccj-registros`,
 * colecciones `pages` y `slides`). Este script los actualiza de forma IDEMPOTENTE:
 *
 *   - Si el campo ya tiene el valor nuevo  -> lo saltea ("ya aplicado").
 *   - Si el campo tiene el valor viejo     -> lo reemplaza.
 *   - Si tiene cualquier otra cosa         -> NO lo toca y avisa (alguien lo editó
 *                                             por /pagesEdit desde que se armó el PR).
 *
 * Se puede correr todas las veces que haga falta: el resultado es siempre el mismo.
 *
 * USO (desde la raíz del proyecto, en el server donde corre la web):
 *
 *   node scripts/2026-09-textos-a1-a8.js            # DRY-RUN: sólo muestra qué haría
 *   node scripts/2026-09-textos-a1-a8.js --apply    # escribe en la base
 *
 * Toma la conexión de process.env.MONGODB_URI (la misma variable que usa database.js).
 * Si no está en el entorno, exportarla antes de correr; nunca hardcodearla acá.
 *
 * Alternativa sin script: los mismos cambios se pueden hacer a mano desde los editores
 * web /pagesEdit/nivel/:page y /pagesEdit/depto/:page — ver docs/2026-09-cambios-mongo.md
 */

const mongoose = require("mongoose");

const APPLY = process.argv.includes("--apply");

// ---------------------------------------------------------------------------
// A.4 — Carga horaria de idiomas (inglés / alemán)
// ---------------------------------------------------------------------------
// OJO: el pedido del colegio dice "horas de inglés/alemán" y da 9 hs (1º a 4º) y
// 11 hs (5º y 6º) para primaria, contra las "seis horas semanales" que hoy figuran
// sólo para alemán. Se redactó como carga horaria de IDIOMAS (alemán + inglés).
// Si el colegio confirma que son horas de alemán solamente, cambiar la redacción.

// El HTML guardado en Mongo viene con los saltos de línea colapsados en espacios, así que
// los reemplazos se hacen sobre fragmentos cortos y contiguos, no sobre el párrafo entero.

const INICIAL_IDIOMAS_EXTRA =
  " La carga semanal de idiomas es de 5 estímulos en las salas de 5 y de 4 años, " +
  "4 estímulos en las salas de 3 años y 2 estímulos en la sala de 2 años.";

const SECUNDARIA_IDIOMAS_EXTRA =
  " La carga horaria de idiomas es de 8 horas semanales de 1º a 3er año y de " +
  "6 horas semanales de 4to a 6to año.";

/**
 * Cada cambio declara:
 *   punto     : punto del pliego
 *   coleccion : colección de Mongo
 *   filtro    : cómo encontrar el documento
 *   campo     : campo a tocar
 *   modo      : "set" (valor completo) | "reemplazo" (subcadena) | "append" (agrega al final)
 */
const CAMBIOS = [
  // --- A.1 — Home, slide "Recorre el colegio" -> video nuevo --------------
  {
    punto: "A.1",
    que: 'Slide "Recorre el colegio" de la home apunta al video nuevo',
    coleccion: "slides",
    filtro: { _id: new mongoose.Types.ObjectId("62c6fa1e06fccc835e170550") },
    campo: "link",
    modo: "set",
    viejo: "https://youtu.be/_GkA_9xwtIE?feature=shared",
    nuevo: "https://youtu.be/pdT2uUJKkRk",
  },

  // --- A.3 — /inicial, comilla antes del punto -----------------------------
  {
    punto: "A.3",
    que: '/inicial "Nuestra Propuesta": la comilla va ANTES del punto',
    coleccion: "pages",
    filtro: { ruta: "/inicial" },
    campo: "parrafo1",
    modo: "reemplazo",
    viejo: "enseñar con profesionalismo.”",
    nuevo: "enseñar con profesionalismo”.",
  },

  // --- A.4 — Horas de idiomas ---------------------------------------------
  {
    punto: "A.4",
    que: '/primaria: el bloque de horas deja de ser sólo "alemán" y pasa a ser idiomas',
    coleccion: "pages",
    filtro: { ruta: "/primaria" },
    campo: "parrafo2",
    modo: "reemplazo",
    viejo: "En cuanto al alemán, los alumnos tienen",
    nuevo: "En cuanto a la carga horaria de idiomas, los alumnos tienen",
  },
  {
    punto: "A.4",
    que: "/primaria: 9 hs semanales de 1º a 4º grado y 11 hs en 5º y 6º",
    coleccion: "pages",
    filtro: { ruta: "/primaria" },
    campo: "parrafo2",
    modo: "reemplazo",
    viejo: "<i>seis horas semanales,</i>",
    nuevo: "<i>9 horas semanales de 1º a 4º grado y 11 horas semanales en 5º y 6º,</i>",
  },
  {
    punto: "A.4",
    que: "/primaria: concordancia (los idiomas, en plural)",
    coleccion: "pages",
    filtro: { ruta: "/primaria" },
    campo: "parrafo2",
    modo: "reemplazo",
    viejo: "objetivo de poder aprenderlo",
    nuevo: "objetivo de poder aprenderlos",
  },
  {
    punto: "A.4",
    que: "/inicial: estímulos semanales de idiomas por sala",
    coleccion: "pages",
    filtro: { ruta: "/inicial" },
    campo: "parrafo2",
    modo: "append",
    nuevo: INICIAL_IDIOMAS_EXTRA,
  },
  {
    punto: "A.4",
    que: "/secundaria: 8 hs de 1º a 3er año, 6 hs de 4to a 6to",
    coleccion: "pages",
    filtro: { ruta: "/secundaria" },
    campo: "parrafo2",
    modo: "append",
    nuevo: SECUNDARIA_IDIOMAS_EXTRA,
  },

  // --- A.5 — /orientacion --------------------------------------------------
  {
    punto: "A.5",
    que: '/orientacion: sacar los dos puntos de "Orientación Vocacional:"',
    coleccion: "pages",
    filtro: { ruta: "/orientacion" },
    campo: "cardTitulo1",
    modo: "set",
    viejo: "Orientación Vocacional:",
    nuevo: "Orientación Vocacional",
  },
  {
    punto: "A.5",
    que: '/orientacion: "Convivecias" -> "Convivencias"',
    coleccion: "pages",
    filtro: { ruta: "/orientacion" },
    campo: "cardTitulo2",
    modo: "set",
    viejo: "Convivecias",
    nuevo: "Convivencias",
  },

  // --- A.6 — /deutsch ------------------------------------------------------
  {
    punto: "A.6",
    que: '/deutsch: tarjeta "ExpoAlemania" -> "Musical de Alemán"',
    coleccion: "pages",
    filtro: { ruta: "/deutsch" },
    campo: "cardTitulo1",
    modo: "set",
    viejo: "ExpoAlemania",
    nuevo: "Musical de Alemán",
  },
  {
    punto: "A.6",
    que: '/deutsch: "Schüler Austausch" -> "Schüleraustausch" (todo junto)',
    coleccion: "pages",
    filtro: { ruta: "/deutsch" },
    campo: "cardTitulo3",
    modo: "set",
    viejo: "Schüler Austausch ",
    nuevo: "Schüleraustausch",
  },
  {
    punto: "A.6",
    que: '/deutsch: la segunda tarjeta repetida pasa a ser "Familienfest"',
    coleccion: "pages",
    filtro: { ruta: "/deutsch" },
    campo: "cardTitulo4",
    modo: "set",
    viejo: "Schüler Austausch ",
    nuevo: "Familienfest",
  },
];

function calcular(actual, c) {
  const texto = actual === undefined || actual === null ? "" : String(actual);

  if (c.modo === "set") {
    if (texto === c.nuevo) return { estado: "ya-aplicado" };
    if (texto !== c.viejo) return { estado: "inesperado", actual: texto };
    return { estado: "cambia", valor: c.nuevo };
  }

  if (c.modo === "reemplazo") {
    if (texto.includes(c.nuevo)) return { estado: "ya-aplicado" };
    if (!texto.includes(c.viejo)) return { estado: "inesperado", actual: texto };
    return { estado: "cambia", valor: texto.replace(c.viejo, c.nuevo) };
  }

  if (c.modo === "append") {
    if (texto.includes(c.nuevo.trim())) return { estado: "ya-aplicado" };
    if (!texto.trim()) return { estado: "inesperado", actual: texto };
    return { estado: "cambia", valor: texto.trimEnd() + c.nuevo };
  }

  throw new Error("modo desconocido: " + c.modo);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "Falta MONGODB_URI en el entorno. Exportala antes de correr el script."
    );
    process.exit(1);
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = mongoose.connection.db;
  console.log("Conectado a la base:", mongoose.connection.name);
  console.log(APPLY ? "MODO: --apply (escribe)" : "MODO: dry-run (no escribe)");
  console.log("");

  const resumen = { cambiados: 0, yaAplicados: 0, inesperados: 0, sinDoc: 0 };

  for (const c of CAMBIOS) {
    const etiqueta = `[${c.punto}] ${c.que}`;
    const doc = await db.collection(c.coleccion).findOne(c.filtro);

    if (!doc) {
      console.log(`${etiqueta}\n   SIN DOCUMENTO para el filtro indicado. No se toca.\n`);
      resumen.sinDoc++;
      continue;
    }

    const r = calcular(doc[c.campo], c);

    if (r.estado === "ya-aplicado") {
      console.log(`${etiqueta}\n   ya aplicado, no hace falta tocar nada.\n`);
      resumen.yaAplicados++;
      continue;
    }

    if (r.estado === "inesperado") {
      console.log(
        `${etiqueta}\n   OJO: ${c.coleccion}.${c.campo} no tiene el valor esperado. NO se toca.\n` +
          `   valor actual: ${JSON.stringify(String(r.actual).slice(0, 200))}\n`
      );
      resumen.inesperados++;
      continue;
    }

    console.log(`${etiqueta}\n   ${c.coleccion}.${c.campo}: se actualiza.`);
    if (c.modo === "set") {
      console.log(`   antes: ${JSON.stringify(c.viejo)}`);
      console.log(`   ahora: ${JSON.stringify(r.valor)}`);
    }
    console.log("");

    if (APPLY) {
      await db
        .collection(c.coleccion)
        .updateOne(c.filtro, { $set: { [c.campo]: r.valor } });
    }
    resumen.cambiados++;
  }

  console.log("---------------------------------------------");
  console.log(
    `A cambiar: ${resumen.cambiados} | ya aplicados: ${resumen.yaAplicados} | ` +
      `inesperados: ${resumen.inesperados} | sin documento: ${resumen.sinDoc}`
  );
  if (!APPLY && resumen.cambiados > 0) {
    console.log("Fue un dry-run. Para escribir: node scripts/2026-09-textos-a1-a8.js --apply");
  }

  await mongoose.disconnect();
}

module.exports = { CAMBIOS, calcular };

if (require.main === module) {
  main().catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
}
