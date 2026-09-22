/**
 * Fotos de /eventos (A.9) — carga los campos de imagen del documento `pages` con
 * ruta "/eventos".
 *
 * El texto de la página ya está en la base (lo cargó scripts/2026-09-contenido-auditoria.js
 * con el Google Doc "Eventos"), pero el doc traía un marcador `[foto]` en cada bloque y las
 * fotos estaban sólo en Drive: por eso los cinco campos de imagen quedaron sin cargar y
 * views/eventos.hbs, que muestra cada foto sólo si el campo existe, renderizaba la página
 * entera sin una sola imagen.
 *
 * Las cinco fotos ya están versionadas en public/img/deptos/eventos/ (ver FOTOS). Este script
 * sólo escribe las rutas en Mongo.
 *
 * Es IDEMPOTENTE y NO PISA NADA INESPERADO, igual que los otros scripts del pliego:
 *
 *   - campo vacío / inexistente      -> lo completa.
 *   - campo con el valor de acá      -> lo saltea ("ya aplicado").
 *   - campo con CUALQUIER OTRA COSA  -> NO lo toca y avisa (alguien subió otra foto por
 *                                       /pagesEdit y esa gana).
 *
 * USO (desde la raíz del proyecto):
 *
 *   node --no-deprecation scripts/2026-09-fotos-eventos.js            # DRY-RUN
 *   node --no-deprecation scripts/2026-09-fotos-eventos.js --apply    # escribe
 *
 * Toma la conexión de process.env.MONGODB_URI (la misma que usa database.js). El
 * --no-deprecation es para que el warning de mongoose 5 no escupa la cadena de conexión
 * completa en los logs.
 *
 * ---------------------------------------------------------------------------------------
 * POR QUÉ LAS FOTOS VIVEN EN public/img/deptos/eventos/:
 * el editor web de páginas (/pagesEdit/depto/eventos, routes/routes.js) guarda los uploads en
 * `./public/img/deptos<ruta>/cards/<campo>.jpg` y NO crea el directorio. Usando esa misma
 * convención y esos mismos nombres de archivo, el día que el colegio quiera cambiar una foto
 * la sube por el editor, el archivo cae encima del que está y la ruta en Mongo sigue siendo
 * válida: no hay que volver a correr nada.
 *
 * ENCUADRE:
 * las cuatro fotos de las tarjetas son de celular y tres venían verticales (4000x2252 con el
 * flag EXIF de rotación) y una en HEIC (Familienfest, iPhone). Se convirtieron y recortaron
 * todas a 1600x1200 (4:3 apaisado) con el sujeto centrado, para que los cuatro bloques de
 * eventos.hbs — que son col-md-5 con img-fluid, sin alto fijo — queden parejos entre sí y no
 * estiren la página. La portada va apaisada 1920x1081 porque es el fondo del hero
 * (#landing .landing-img, background-size: cover).
 */

const mongoose = require("mongoose");

const APPLY = process.argv.includes("--apply");

const RUTA = "/eventos";

// Las cinco fotos, ya optimizadas y versionadas en el repo. El orden de las tarjetas es el
// del Google Doc "Eventos" y el de views/eventos.hbs:
//   1 Concert · 2 Expresarte · 3 Familienfest · 4 Musical de Alemán
const FOTOS = {
  imageTop: "/img/deptos/eventos/top.jpg",
  cardImage1: "/img/deptos/eventos/cards/cardImage1.jpg",
  cardImage2: "/img/deptos/eventos/cards/cardImage2.jpg",
  cardImage3: "/img/deptos/eventos/cards/cardImage3.jpg",
  cardImage4: "/img/deptos/eventos/cards/cardImage4.jpg",
};

/**
 * Decide qué hacer con UN campo.
 *   ya-aplicado : el valor ya es el que queremos.
 *   completa    : el campo está vacío o no existe -> se puede escribir.
 *   inesperado  : tiene otra cosa -> NO se toca.
 */
function decidirCampo(actual, deseado) {
  if (actual === undefined || actual === null || String(actual).trim() === "") {
    return { estado: "completa", valor: deseado };
  }
  if (String(actual) === String(deseado)) return { estado: "ya-aplicado" };
  return { estado: "inesperado", actual: String(actual) };
}

/**
 * Arma el plan para el documento, sin tocar la base.
 */
function planificar(docExistente, deseado) {
  if (!docExistente) return { accion: "falta-documento" };
  const aEscribir = {};
  const yaAplicados = [];
  const inesperados = [];
  for (const [campo, valor] of Object.entries(deseado)) {
    const r = decidirCampo(docExistente[campo], valor);
    if (r.estado === "completa") aEscribir[campo] = r.valor;
    else if (r.estado === "ya-aplicado") yaAplicados.push(campo);
    else inesperados.push({ campo, actual: r.actual });
  }
  return { accion: "actualizar", aEscribir, yaAplicados, inesperados };
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

  const existente = await db.collection("pages").findOne({ ruta: RUTA });
  const plan = planificar(existente, FOTOS);

  console.log(`[A.9 fotos] ${RUTA}`);

  if (plan.accion === "falta-documento") {
    console.error(
      `   NO existe el documento ${RUTA} en la colección pages. Correr primero ` +
        "scripts/2026-09-contenido-auditoria.js --apply (carga el texto)."
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const nEscribir = Object.keys(plan.aEscribir).length;
  console.log(
    `   a completar: ${nEscribir} | ya aplicados: ${plan.yaAplicados.length} | ` +
      `inesperados: ${plan.inesperados.length}`
  );
  for (const [campo, valor] of Object.entries(plan.aEscribir)) {
    console.log(`   ${campo} -> ${valor}`);
  }
  for (const i of plan.inesperados) {
    console.log(
      `   OJO: ${i.campo} ya tiene otra foto, NO se toca -> ${JSON.stringify(i.actual)}`
    );
  }

  if (APPLY && nEscribir) {
    await db
      .collection("pages")
      .updateOne(
        { ruta: RUTA },
        { $set: { ...plan.aEscribir, updatedAt: new Date() } }
      );
  }

  console.log("");
  console.log("---------------------------------------------");
  console.log(
    `Campos ${APPLY ? "escritos" : "a completar"}: ${nEscribir} | ` +
      `ya aplicados: ${plan.yaAplicados.length} | inesperados: ${plan.inesperados.length}`
  );
  if (!APPLY) {
    console.log(
      "Fue un dry-run. Para escribir: node --no-deprecation scripts/2026-09-fotos-eventos.js --apply"
    );
  }

  await mongoose.disconnect();
}

module.exports = { RUTA, FOTOS, decidirCampo, planificar };

if (require.main === module) {
  main().catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
}
