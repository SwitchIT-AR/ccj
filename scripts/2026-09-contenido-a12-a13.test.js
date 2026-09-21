/**
 * Test del script de contenido A.12 / A.13. NO toca la base: prueba sólo la lógica de
 * decisión (`decidirCampo` y `planificar`).
 *
 * Lo que verifica:
 *   1) Si el documento no existe -> se crea.
 *   2) Si el documento ya está cargado con estos valores -> no hay nada que escribir
 *      (IDEMPOTENTE: correrlo dos veces no cambia nada).
 *   3) Si un campo tiene otra cosa (lo editaron por /pagesEdit) -> NO se pisa, se avisa.
 *   4) Si un campo está vacío o falta -> se completa.
 *   5) El contenido cumple lo que pide el pliego: /informatica 4 tarjetas,
 *      /alumnos-intercambio 6 tarjetas.
 *   6) Fotos: /informatica apunta a sus 5 fotos reales y los archivos existen en el repo;
 *      /alumnos-intercambio sigue sin fotos y queda con el placeholder.
 *
 * USO:  node scripts/2026-09-contenido-a12-a13.test.js
 */

const fs = require("fs");
const path = require("path");

const {
  INFORMATICA,
  ALUMNOS_INTERCAMBIO,
  PAGINAS,
  decidirCampo,
  planificar,
  FOTO_PENDIENTE,
  FOTOS_INFORMATICA,
} = require("./2026-09-contenido-a12-a13");

let ok = 0;
let fallos = 0;

function chequear(condicion, mensaje) {
  if (condicion) {
    ok++;
  } else {
    fallos++;
    console.error("FALLA:", mensaje);
  }
}

// --- 1) documento inexistente -> crear ------------------------------------
for (const { punto, doc } of PAGINAS) {
  const plan = planificar(null, doc);
  chequear(plan.accion === "crear", `${punto}: sin documento previo se tiene que crear`);
}

// --- 2) idempotencia: ya cargado -> nada que escribir ----------------------
for (const { punto, doc } of PAGINAS) {
  const yaEnLaBase = { _id: "xxx", ...doc };
  const plan = planificar(yaEnLaBase, doc);
  chequear(plan.accion === "actualizar", `${punto}: documento existente se actualiza`);
  chequear(
    Object.keys(plan.aEscribir).length === 0,
    `${punto}: segunda corrida no debe escribir nada (idempotente)`
  );
  chequear(
    plan.inesperados.length === 0,
    `${punto}: segunda corrida no debe reportar inesperados`
  );
}

// --- 3) valor editado a mano -> no se pisa --------------------------------
{
  const editado = { ...INFORMATICA, titulo: "Informática (editado por el colegio)" };
  const plan = planificar(editado, INFORMATICA);
  chequear(
    plan.inesperados.some((i) => i.campo === "titulo"),
    "A.12: un titulo editado a mano se reporta como inesperado"
  );
  chequear(
    plan.aEscribir.titulo === undefined,
    "A.12: un titulo editado a mano NO se pisa"
  );
}

// --- 4) campo vacío o ausente -> se completa ------------------------------
{
  const incompleto = { ...INFORMATICA, parrafo1: "", cierre: undefined };
  const plan = planificar(incompleto, INFORMATICA);
  chequear(
    plan.aEscribir.parrafo1 === INFORMATICA.parrafo1,
    "A.12: un campo vacío se completa"
  );
  chequear(
    plan.aEscribir.cierre === INFORMATICA.cierre,
    "A.12: un campo ausente se completa"
  );
}
chequear(decidirCampo(undefined, "x").estado === "completa", "campo ausente -> completa");
chequear(decidirCampo("   ", "x").estado === "completa", "campo en blanco -> completa");
chequear(decidirCampo("x", "x").estado === "ya-aplicado", "campo igual -> ya-aplicado");
chequear(decidirCampo("otra", "x").estado === "inesperado", "campo distinto -> inesperado");

// --- 5) el contenido es el que pide el pliego -----------------------------
chequear(INFORMATICA.ruta === "/informatica", "A.12: la ruta es /informatica");
chequear(
  ALUMNOS_INTERCAMBIO.ruta === "/alumnos-intercambio",
  "A.13: la ruta es /alumnos-intercambio"
);
chequear(
  !!INFORMATICA.cardTitulo4 && INFORMATICA.cardTitulo5 === undefined,
  "A.12: /informatica tiene exactamente 4 tarjetas (departamentos.hbs soporta 4)"
);
chequear(
  !!ALUMNOS_INTERCAMBIO.cardTitulo6 && ALUMNOS_INTERCAMBIO.cardTitulo7 === undefined,
  "A.13: /alumnos-intercambio tiene exactamente 6 tarjetas"
);
chequear(
  !!INFORMATICA.cierre && INFORMATICA.cierre.includes("MINT"),
  "A.12: el cierre menciona la certificación MINT"
);

// Ningún documento debe usar cardImg* (el nombre muerto del schema): la base y
// views/departamentos.hbs usan cardImage*.
for (const { punto, doc } of PAGINAS) {
  const malos = Object.keys(doc).filter((k) => /^cardImg\d/.test(k));
  chequear(malos.length === 0, `${punto}: no se debe escribir cardImg* (va cardImage*)`);
}

// --- 6) fotos -------------------------------------------------------------
// A.12 YA tiene las 5 fotos reales (las entregó el colegio el 21/09/2026).
// A.13 sigue sin fotos: esas TIENEN que quedar en el placeholder.
{
  const imgs = Object.entries(INFORMATICA).filter(([k]) =>
    /^(imageTop|cardImage\d)$/.test(k)
  );
  chequear(imgs.length === 5, "A.12: hay 5 campos de imagen (portada + 4 tarjetas)");
  chequear(
    imgs.every(([, v]) => v !== FOTO_PENDIENTE),
    "A.12: ya no queda ninguna imagen en FOTO_PENDIENTE"
  );
  chequear(
    imgs.every(([, v]) => v.startsWith("/img/deptos/informatica/")),
    "A.12: todas las fotos cuelgan de /img/deptos/informatica/"
  );
  // las rutas tienen que existir de verdad en el repo, servidas por express.static(public)
  for (const [campo, ruta] of imgs) {
    const enDisco = path.join(__dirname, "..", "public", ruta);
    chequear(fs.existsSync(enDisco), `A.12: el archivo de ${campo} existe en el repo (${ruta})`);
  }
  // el hero usa el recorte apaisado, no la vertical cruda (ver comentario del script)
  chequear(
    INFORMATICA.imageTop === FOTOS_INFORMATICA.hero &&
      INFORMATICA.imageTop.includes("portada-hero"),
    "A.12: el hero usa el recorte apaisado portada-hero.jpg"
  );
  // cada tarjeta con su foto, sin repetidas
  const cards = imgs.filter(([k]) => k !== "imageTop").map(([, v]) => v);
  chequear(new Set(cards).size === 4, "A.12: las 4 tarjetas usan 4 fotos distintas");
}
{
  const imgs = Object.entries(ALUMNOS_INTERCAMBIO).filter(([k]) =>
    /^(imageTop|cardImage\d)$/.test(k)
  );
  chequear(imgs.length === 7, "A.13: hay 7 campos de imagen (portada + 6 tarjetas)");
  chequear(
    imgs.every(([, v]) => v === FOTO_PENDIENTE),
    "A.13: sigue sin fotos -> toda imagen apunta al placeholder identificable"
  );
}

console.log(`\n${ok} chequeos OK, ${fallos} fallas`);
process.exit(fallos ? 1 : 0);
