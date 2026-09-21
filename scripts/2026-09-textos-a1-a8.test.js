/**
 * Test del script de textos A.1-A.6. No toca la base: prueba sólo la lógica de
 * decisión (`calcular`) con los valores reales que hoy tiene producción.
 *
 * Lo que verifica:
 *   1) Con el valor viejo, cada cambio se aplica.
 *   2) Con el valor ya cambiado, cada cambio dice "ya-aplicado" -> es IDEMPOTENTE.
 *   3) Con un valor cualquiera, no toca nada y avisa "inesperado".
 *
 * USO:  node scripts/2026-09-textos-a1-a8.test.js
 */

const { CAMBIOS, calcular } = require("./2026-09-textos-a1-a8");

// Valores tal como estaban en la base el 21/09/2026 (leídos con una consulta de sólo
// lectura a la colección correspondiente).
const VALORES_ACTUALES = {
  "A.1|slides|link":
    "https://youtu.be/_GkA_9xwtIE?feature=shared",
  "A.3|pages|parrafo1":
    "Nuestra propuesta pedagógica contempla una educación integral, ofreciendo una amplia " +
    "variedad de actividades que preparan a nuestros alumnos para afrontar un mundo en " +
    "permanente cambio. - “Cuidar con dedicación, estimular con entusiasmo y enseñar con " +
    "profesionalismo.”",
  "A.4|pages|parrafo2|/primaria":
    "  <p>       El nivel primario cuenta con educación       " +
    '<span class="bg-white t-amarillo font-weight-bold px-2"><i> bilingüe en inglés.</i></span> ' +
    "Es decir, que tienen materias como lengua, literatura ciencias en el idioma.     </p>     <p>" +
    "       En cuanto al alemán, los alumnos tienen       " +
    '<span class="bg-white t-amarillo font-weight-bold px-2"><i>seis horas semanales,</i></span> ' +
    "con el       objetivo de poder aprenderlo       fluidamente, desde una edad temprana.     </div>",
  "A.4|pages|parrafo2|/inicial":
    "En esta etapa, los niños no aprenden un idioma, sino que lo adquieren. Es por esta razón " +
    "que, desde Sala de 3, nuestros alumnos tienen clases de alemán y de inglés.",
  "A.4|pages|parrafo2|/secundaria":
    "En el nivel secundario nuestros alumnos reciben una sólida formación lingüística y " +
    "cultural en los idiomas alemán e inglés.",
  "A.5|pages|cardTitulo1": "Orientación Vocacional:",
  "A.5|pages|cardTitulo2": "Convivecias",
  "A.6|pages|cardTitulo1": "ExpoAlemania",
  "A.6|pages|cardTitulo3": "Schüler Austausch ",
  "A.6|pages|cardTitulo4": "Schüler Austausch ",
};

function valorActual(c) {
  const ruta = c.filtro.ruta;
  return (
    VALORES_ACTUALES[`${c.punto}|${c.coleccion}|${c.campo}|${ruta}`] !== undefined
      ? VALORES_ACTUALES[`${c.punto}|${c.coleccion}|${c.campo}|${ruta}`]
      : VALORES_ACTUALES[`${c.punto}|${c.coleccion}|${c.campo}`]
  );
}

let ok = 0;
let fallos = 0;

function chequear(condicion, mensaje) {
  if (condicion) {
    ok++;
  } else {
    fallos++;
    console.error("  FALLA: " + mensaje);
  }
}

// Los cambios de /primaria se encadenan sobre el mismo campo: se aplican en orden.
const encadenado = {};

for (const c of CAMBIOS) {
  const clave = `${c.coleccion}|${c.campo}|${c.filtro.ruta}`;
  const partida =
    encadenado[clave] !== undefined ? encadenado[clave] : valorActual(c);

  console.log(`[${c.punto}] ${c.que}`);
  chequear(partida !== undefined, "no hay valor de partida para el cambio");
  if (partida === undefined) continue;

  // 1) se aplica sobre el valor viejo
  const primera = calcular(partida, c);
  chequear(
    primera.estado === "cambia",
    `esperaba "cambia" sobre el valor actual y dio "${primera.estado}"`
  );
  if (primera.estado !== "cambia") continue;
  chequear(
    primera.valor.includes(c.nuevo.trim()) || primera.valor === c.nuevo,
    "el valor resultante no contiene el texto nuevo"
  );

  // 2) idempotencia: volver a correrlo no cambia nada
  const segunda = calcular(primera.valor, c);
  chequear(
    segunda.estado === "ya-aplicado",
    `no es idempotente: al reaplicar dio "${segunda.estado}"`
  );

  // 3) valor ajeno (alguien editó el texto por /pagesEdit):
  //    - "set" y "reemplazo" no tocan nada y avisan;
  //    - "append" sí agrega la frase al final, que es justamente lo que tiene que hacer,
  //      y sigue siendo idempotente.
  const ajeno = calcular("cualquier otra cosa que escribió el colegio", c);
  if (c.modo === "append") {
    chequear(
      ajeno.estado === "cambia" && ajeno.valor.includes(c.nuevo.trim()),
      "append sobre un texto reescrito debería agregar la frase igual"
    );
    chequear(
      calcular(ajeno.valor, c).estado === "ya-aplicado",
      "append no es idempotente sobre un texto reescrito"
    );
    chequear(
      calcular("", c).estado === "inesperado",
      "append sobre un campo vacío debería avisar en vez de escribir"
    );
  } else {
    chequear(
      ajeno.estado === "inesperado",
      `con un valor ajeno esperaba "inesperado" y dio "${ajeno.estado}"`
    );
  }

  encadenado[clave] = primera.valor;
}

console.log("");
console.log(`Chequeos OK: ${ok} | fallas: ${fallos}`);
process.exit(fallos === 0 ? 0 : 1);
