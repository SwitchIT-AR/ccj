/**
 * Test del script de alemán en /deutsch y /primaria. No toca la base: prueba `calcular` con
 * fragmentos reales de producción (leídos el 16/11/2026).
 *
 * USO:  node scripts/2026-11-aleman-primaria.test.js
 */

const { IDIOMA_ES, SPRACHE_DE, ALEMAN_PRIMARIA, calcular } = require("./2026-11-aleman-primaria");

let ok = 0;
let fallos = 0;

function igual(real, esperado, mensaje) {
  if (real === esperado) ok++;
  else {
    fallos++;
    console.log(`FALLA ${mensaje}\n  esperado: ${JSON.stringify(esperado)}\n  real:     ${JSON.stringify(real)}`);
  }
}

const sp = "                 ";
const deutsch = {
  ruta: "/deutsch",
  parrafo1:
    `<h3 class="text-center">El Idioma</h3>${sp}<p>${sp}Nuestra meta fundamental… oral.${sp}</p>${sp}` +
    `<p>${sp}A partir del <span class="c-amarillo">Nivel Primario</span>, se fomenta el desempeño de los ` +
    `estudiantes${sp}en las cuatro competencias lingüísticas, … la comprensión auditiva.${sp}</p>${sp}` +
    `<p>${sp}Con el ingreso al <span class="c-amarillo">Nivel Secundario</span>, …</p>` +
    `<h3 class="text-center">Die Sprache</h3>${sp}<p>${sp}Wir setzen uns zum Ziel …${sp}</p>${sp}` +
    `<p>${sp}Mit dem Eintreten in die <span class="c-amarillo">Primärstufe</span> werden die vier ` +
    `linguistischen${sp}Kernkompetenzen ausgebildet: … Hörverstehen.${sp}</p>${sp}` +
    `<p>${sp}In der <span class="c-amarillo">Sekundarstufe</span> rückt …</p>`,
  subTitulo4:
    `<h3 class="text-center">Kultur</h3> <p> … steht im Zentrum. Seit 2018 bieten wir in der Primärstufe ` +
    `eine zusätzliche${sp}Deutschstunde an,${sp}welche das Ziel verfolgt, …</p>`,
  parrafo7: "… steht im Zentrum. Seit 2018 bieten wir in der Primärstufe eine zusätzliche Deutschstunde an, …",
};

const { set: d, avisos: avD } = calcular(deutsch);
igual(avD.length, 0, "/deutsch sin avisos");
igual(d.parrafo1.includes(IDIOMA_ES), true, "El Idioma: párrafo nuevo");
igual(d.parrafo1.includes("A partir del <span"), false, "El Idioma: sale el párrafo viejo");
igual(d.parrafo1.includes(SPRACHE_DE), true, "Die Sprache: párrafo nuevo");
igual(d.parrafo1.includes("Con el ingreso al"), true, "El Idioma: el párrafo de Secundaria sigue");
igual(d.parrafo1.includes("Sekundarstufe"), true, "Die Sprache: el párrafo de Sekundarstufe sigue");
igual(d.subTitulo4.includes("Seit 2018 bieten wir in der Grundschule eine zusätzliche"), true, "Kultur");
igual(d.parrafo7.includes("in der Grundschule"), true, "Kultur texto plano");
igual(/Primärstufe/.test(Object.values(d).join(" ")), false, "no queda Primärstufe");
igual(Object.keys(calcular({ ...deutsch, ...d }).set).length, 0, "/deutsch idempotente");

const editado = calcular({ ...deutsch, parrafo1: "<p>otra cosa</p>" });
igual(editado.avisos.filter((a) => a.includes("inesperado")).length, 2, "parrafo1 editado a mano: avisa");
igual("parrafo1" in editado.set, false, "parrafo1 editado a mano: no se toca");

const primaria = {
  ruta: "/primaria",
  parrafo2:
    '<p> El nivel primario cuenta con … rendir un <span class="bg-white t-amarillo font-weight-bold px-2">' +
    "<i>examen internacional</i></span> de nivel A2. </p> <p> La enseñanza de idiomas acompaña … </p>",
};
const { set: p, avisos: avP } = calcular(primaria);
igual(avP.length, 0, "/primaria sin avisos");
igual(
  p.parrafo2,
  '<p> El nivel primario cuenta con … rendir un <span class="bg-white t-amarillo font-weight-bold px-2">' +
    "<i>examen internacional</i></span> de nivel A2. </p> " + ALEMAN_PRIMARIA +
    " <p> La enseñanza de idiomas acompaña … </p>",
  "bloque de alemán entre inglés y carga horaria"
);
igual(Object.keys(calcular({ ...primaria, ...p }).set).length, 0, "/primaria idempotente");

console.log(`\n${ok} ok, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
