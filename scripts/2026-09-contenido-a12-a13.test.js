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
 *      /alumnos-intercambio 6 tarjetas, y ninguna foto real (todas placeholder).
 *
 * USO:  node scripts/2026-09-contenido-a12-a13.test.js
 */

const {
  INFORMATICA,
  ALUMNOS_INTERCAMBIO,
  PAGINAS,
  decidirCampo,
  planificar,
  FOTO_PENDIENTE,
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

// Todas las imágenes tienen que ser el placeholder mientras no tengamos las fotos.
for (const { punto, doc } of PAGINAS) {
  const imgs = Object.entries(doc).filter(([k]) => /^(imageTop|cardImage\d)$/.test(k));
  chequear(imgs.length > 0, `${punto}: hay campos de imagen declarados`);
  chequear(
    imgs.every(([, v]) => v === FOTO_PENDIENTE),
    `${punto}: toda imagen sin foto real apunta al placeholder identificable`
  );
}

console.log(`\n${ok} chequeos OK, ${fallos} fallas`);
process.exit(fallos ? 1 : 0);
