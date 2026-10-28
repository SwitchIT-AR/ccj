/**
 * Test del script alumno -> estudiante. No toca la base: prueba `transformar` y `calcular`
 * con textos reales de producción (leídos el 28/10/2026).
 *
 * USO:  node scripts/2026-10-estudiantes.test.js
 */

const { CAMBIOS_EF, transformar, calcular } = require("./2026-10-estudiantes");

let ok = 0;
let fallos = 0;

function igual(real, esperado, mensaje) {
  if (real === esperado) ok++;
  else {
    fallos++;
    console.log(`FALLA ${mensaje}\n  esperado: ${JSON.stringify(esperado)}\n  real:     ${JSON.stringify(real)}`);
  }
}

// Reemplazos de texto, incluidos los casos de género.
igual(transformar("concientizando a los alumnos/as en el cuidado"), "concientizando a los estudiantes en el cuidado", "alumnos/as");
igual(transformar("</b> Nuestras alumnas y alumnos vienen aprendiendo"), "</b> Nuestros estudiantes vienen aprendiendo", "alumnas y alumnos");
igual(transformar("exigente. Los alumnos y las alumnas vuelven cambiados"), "exigente. Los estudiantes vuelven cambiados", "los alumnos y las alumnas");
igual(transformar("y ex alumna de la institución."), "y ex estudiante de la institución.", "ex alumna");
igual(transformar("Grupo de alumno de la ES que se capacitaron"), "Grupo de estudiantes de la ES que se capacitaron", "grupo de alumno");
igual(transformar("para que el alumno disfrute"), "para que el estudiante disfrute", "el alumno");
igual(transformar("Alumnos Inversores"), "Estudiantes Inversores", "título con mayúscula");
igual(transformar("Alumnos Intercambio"), "Estudiantes de Intercambio", "título de la página de intercambio");

// No se tocan paths ni rutas.
igual(transformar("/img/deptos/informatica/alumnos-inversores"), "/img/deptos/informatica/alumnos-inversores", "path de imagen");
igual(transformar('<a href="/alumnos-intercambio">'), '<a href="/alumnos-intercambio">', "link a la ruta");

// Educación Física: con el valor viejo aplica, con el nuevo no hace nada.
const ef = { ruta: "/educacionfisica" };
for (const c of CAMBIOS_EF) ef[c.campo] = c.antes;
const r1 = calcular(ef);
for (const c of CAMBIOS_EF) igual(r1.set[c.campo], c.despues, `EF ${c.campo} se aplica`);
igual(r1.set.parrafo2.includes("Tanto en lo referente"), false, "EF parrafo2 sin la última oración");
igual(r1.avisos.length, 0, "EF sin avisos");

const ef2 = { ruta: "/educacionfisica" };
for (const c of CAMBIOS_EF) ef2[c.campo] = c.despues;
igual(Object.keys(calcular(ef2).set).length, 0, "EF idempotente");

// Si alguien lo editó, no se pisa.
const r3 = calcular({ ...ef, cardTexto2: "editado a mano por el colegio" });
igual(r3.set.cardTexto2, undefined, "EF editado no se pisa");
igual(r3.avisos.length, 1, "EF editado avisa");

// Campos técnicos intactos.
const r4 = calcular({ ruta: "/alumnos-intercambio", pagina: "/alumnos-intercambio", titulo: "Alumnos Intercambio" });
igual(JSON.stringify(r4.set), JSON.stringify({ titulo: "Estudiantes de Intercambio" }), "ruta y pagina intactas");

console.log(`${ok} ok, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
