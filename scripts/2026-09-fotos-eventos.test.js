/**
 * Test del script de fotos de /eventos. NO toca la base: prueba la lógica de decisión y que
 * los archivos que el script promete existan de verdad en el repo.
 *
 * Lo que verifica:
 *   1) Los cinco archivos de FOTOS existen en public/ y son JPEG de verdad (no un placeholder
 *      vacío ni un HTML de login de Drive, que es lo que devolvía la descarga directa).
 *   2) Las cuatro fotos de tarjeta están apaisadas y parejas (mismo ancho y alto), así los
 *      bloques de eventos.hbs no quedan desalineados.
 *   3) Campo vacío o inexistente -> se completa.
 *   4) Campo con el valor esperado -> no se escribe (IDEMPOTENTE).
 *   5) Campo con otra foto (la subieron por /pagesEdit) -> NO se pisa, se avisa.
 *   6) Sin documento en la base -> el script no inventa uno.
 *   7) views/eventos.hbs lee exactamente los campos que el script escribe.
 *
 * USO:  node scripts/2026-09-fotos-eventos.test.js
 */

const fs = require("fs");
const path = require("path");

const { RUTA, FOTOS, decidirCampo, planificar } = require("./2026-09-fotos-eventos");

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

const PUBLIC = path.join(__dirname, "..", "public");

/** Alto y ancho de un JPEG, leyendo los marcadores SOFn del archivo. */
function medirJpeg(buf) {
  chequear(buf[0] === 0xff && buf[1] === 0xd8, "no arranca con la firma JPEG");
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marcador = buf[i + 1];
    // SOF0..SOF15, salteando los que no son "start of frame" (DHT c4, JPG c8, DAC cc)
    if (
      marcador >= 0xc0 &&
      marcador <= 0xcf &&
      marcador !== 0xc4 &&
      marcador !== 0xc8 &&
      marcador !== 0xcc
    ) {
      return { alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

// 1) Los archivos existen y son JPEG
const medidas = {};
for (const [campo, ruta] of Object.entries(FOTOS)) {
  const archivo = path.join(PUBLIC, ruta);
  const existe = fs.existsSync(archivo);
  chequear(existe, `${campo}: falta el archivo ${ruta}`);
  if (!existe) continue;
  const buf = fs.readFileSync(archivo);
  chequear(buf.length > 20000, `${campo}: ${ruta} pesa ${buf.length} bytes, parece vacío`);
  const m = medirJpeg(buf);
  chequear(m !== null, `${campo}: ${ruta} no es un JPEG legible`);
  if (m) medidas[campo] = m;
}

// 2) Las cuatro tarjetas, parejas y apaisadas; la portada, apaisada y más ancha
const cards = ["cardImage1", "cardImage2", "cardImage3", "cardImage4"].map((c) => medidas[c]);
chequear(
  cards.every((m) => m && m.ancho === cards[0].ancho && m.alto === cards[0].alto),
  "las cuatro fotos de tarjeta no tienen todas el mismo tamaño: " + JSON.stringify(cards)
);
chequear(
  cards.every((m) => m && m.ancho > m.alto),
  "alguna foto de tarjeta quedó vertical (se ve desproporcionada al lado del texto)"
);
chequear(
  medidas.imageTop && medidas.imageTop.ancho > medidas.imageTop.alto,
  "la portada del hero tiene que ser apaisada: " + JSON.stringify(medidas.imageTop)
);

// 3) Campo vacío o inexistente -> se completa
chequear(decidirCampo(undefined, "/a.jpg").estado === "completa", "campo inexistente");
chequear(decidirCampo("", "/a.jpg").estado === "completa", "campo vacío");
chequear(decidirCampo("   ", "/a.jpg").estado === "completa", "campo con espacios");

// 4) Idempotencia
chequear(decidirCampo("/a.jpg", "/a.jpg").estado === "ya-aplicado", "mismo valor");
const yaCargado = { ruta: RUTA, ...FOTOS };
const planSegundaVez = planificar(yaCargado, FOTOS);
chequear(
  Object.keys(planSegundaVez.aEscribir).length === 0,
  "correrlo dos veces tendría que no escribir nada"
);
chequear(planSegundaVez.yaAplicados.length === 5, "los cinco campos tendrían que dar ya-aplicados");

// 5) Foto puesta a mano por el editor -> no se pisa
const editadoAMano = { ruta: RUTA, cardImage2: "/img/otra-foto.jpg" };
const plan = planificar(editadoAMano, FOTOS);
chequear(plan.inesperados.length === 1, "tendría que avisar de un inesperado");
chequear(plan.inesperados[0].campo === "cardImage2", "el inesperado es cardImage2");
chequear(
  plan.aEscribir.cardImage2 === undefined,
  "cardImage2 NO se tiene que escribir: lo cambiaron por /pagesEdit"
);
chequear(Object.keys(plan.aEscribir).length === 4, "los otros cuatro campos sí se completan");

// 6) Sin documento, no se inventa nada
chequear(planificar(null, FOTOS).accion === "falta-documento", "sin documento tiene que abortar");

// 7) La vista lee estos mismos campos
const vista = fs.readFileSync(path.join(__dirname, "..", "views", "eventos.hbs"), "utf8");
for (const campo of Object.keys(FOTOS)) {
  chequear(vista.includes(`textos.${campo}`), `views/eventos.hbs no usa ${campo}`);
}

console.log(`\n${ok} chequeos OK, ${fallos} fallas`);
if (Object.keys(medidas).length) {
  for (const [campo, m] of Object.entries(medidas)) {
    console.log(`   ${campo}: ${m.ancho}x${m.alto}`);
  }
}
process.exit(fallos ? 1 : 0);
