/**
 * Test de RENDERIZADO de las vistas tocadas en esta tanda. No toca la base ni levanta el
 * servidor: compila los .hbs reales con handlebars y verifica el HTML que sale.
 *
 * Existe por el bug del punto A.5: el documento de Mongo de /orientacion se actualizó bien
 * pero la vista no lo leía, así que el cambio nunca se vio. Acá se comprueba que el contenido
 * que el script carga en Mongo EFECTIVAMENTE aparece en el HTML.
 *
 * USO:  node scripts/2026-09-render-a12-a13.test.js
 */

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const {
  INFORMATICA,
  ALUMNOS_INTERCAMBIO,
  FOTO_PENDIENTE,
  FOTOS_INFORMATICA,
} = require("./2026-09-contenido-a12-a13");

const VIEWS = path.join(__dirname, "..", "views");

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

function render(vista, contexto) {
  const src = fs.readFileSync(path.join(VIEWS, vista), "utf8");
  return handlebars.compile(src)(contexto);
}

// ---------------------------------------------------------------------------
// A.12 — /informatica se renderiza con departamentos.hbs
// ---------------------------------------------------------------------------
{
  const html = render("departamentos.hbs", { textos: INFORMATICA });

  chequear(html.includes("Dpto. de Informática y Tecnología"), "A.12: sale el título");
  chequear(html.includes("La tecnología en la Gartenstadt Schule"), "A.12: sale el subtítulo 1");
  chequear(
    html.includes("formar ciudadanos digitales técnicamente competentes"),
    "A.12: sale el párrafo de intro"
  );
  chequear(html.includes("Trayectoria por Niveles Educativos"), "A.12: sale la sección roja");
  // parrafo3 va con triple llave: el HTML de los <b> tiene que salir SIN escapar.
  chequear(html.includes("<b>Nivel Secundario:</b>"), "A.12: el HTML de parrafo3 no se escapa");
  chequear(html.includes("Proyectos interdisciplinarios"), "A.12: salen los auxText");

  for (const t of ["Infraestructura y Software", "Triángulos", "Alumnos Inversores", "Sitio Web"]) {
    chequear(html.includes(t), `A.12: sale la tarjeta "${t}"`);
  }
  chequear(
    html.includes("El departamento se identifica con la iniciativa alemana"),
    "A.12: sale el bloque de cierre debajo de Actividades"
  );
  // el cierre tiene que ir DESPUÉS de las tarjetas
  chequear(
    html.indexOf("El departamento se identifica") > html.indexOf("Sitio Web"),
    "A.12: el cierre va debajo de las tarjetas, no arriba"
  );
  // A.12 ya tiene fotos reales: no debe quedar NINGÚN placeholder en la página.
  chequear(
    !html.includes("placeholder-foto-pendiente.svg"),
    "A.12: ya no queda ningún placeholder en el HTML"
  );
  // el hero sale como background-image en el style del .landing-img
  chequear(
    html.includes(`url(${FOTOS_INFORMATICA.hero})`),
    "A.12: el hero carga portada-hero.jpg como background-image"
  );
  // las 4 tarjetas, cada una con su foto
  for (const card of ["card1", "card2", "card3", "card4"]) {
    chequear(
      html.includes(`src=${FOTOS_INFORMATICA[card]}`),
      `A.12: la tarjeta ${card} carga ${FOTOS_INFORMATICA[card]}`
    );
  }
  chequear(
    (html.match(/\/img\/deptos\/informatica\//g) || []).length === 5,
    "A.12: salen las 5 fotos (portada + 4 tarjetas)"
  );
}

// ---------------------------------------------------------------------------
// departamentos.hbs SIN el campo `cierre` (las 5 páginas que ya están en producción)
// ---------------------------------------------------------------------------
{
  const sinCierre = { ...INFORMATICA };
  delete sinCierre.cierre;
  const html = render("departamentos.hbs", { textos: sinCierre });
  chequear(
    !html.includes("El departamento se identifica con la iniciativa alemana"),
    "departamentos.hbs: sin `cierre` no se dibuja el bloque nuevo (no rompe /deutsch, /english, etc.)"
  );
}

// ---------------------------------------------------------------------------
// A.13 — /alumnos-intercambio con su vista propia y 6 tarjetas
// ---------------------------------------------------------------------------
{
  const html = render("alumnos-intercambio.hbs", { textos: ALUMNOS_INTERCAMBIO });

  chequear(html.includes("Alumnos Intercambio"), "A.13: sale el título");
  chequear(
    html.includes("Un mes en Alemania: idioma, convivencia e historia"),
    "A.13: sale el saludo del hero"
  );
  chequear(html.includes("Un viaje, tres tramos"), "A.13: sale el subtítulo 1");
  chequear(html.includes("Por qué Alemania"), "A.13: sale la sección roja");
  chequear(
    html.includes("<b>Marco institucional bilateral.</b>"),
    "A.13: el HTML de los pilares no se escapa"
  );
  chequear(html.includes("Objetivos Pedagógicos"), "A.13: sale el título de las tarjetas");

  const tarjetas = [
    "Inmersión Lingüística Auténtica",
    "Convivencia Intercultural",
    "Conciencia Histórica y Ciudadana",
    "Autonomía Personal",
    "Vínculo Institucional Sostenido",
    "Continuidad del Recorrido Formativo",
  ];
  for (const t of tarjetas) chequear(html.includes(t), `A.13: sale la tarjeta "${t}"`);
  chequear(
    (html.match(/class="card"/g) || []).length === 6,
    "A.13: se dibujan exactamente 6 tarjetas"
  );
  chequear(
    (html.match(/placeholder-foto-pendiente\.svg/g) || []).length === 7,
    "A.13: las 7 imágenes (portada + 6 tarjetas) usan el placeholder"
  );
}

// ---------------------------------------------------------------------------
// A.9 — /eventos placeholder: tiene los 4 anclas que usan los menús
// ---------------------------------------------------------------------------
{
  const html = render("eventos.hbs", {});
  for (const ancla of ["concert", "expresarte", "familienfest", "musical-de-aleman"]) {
    chequear(html.includes(`id="${ancla}"`), `A.9: /eventos tiene el ancla #${ancla}`);
  }
  chequear(
    html.includes("Estamos preparando esta página"),
    "A.9: sin documento en Mongo, /eventos muestra el aviso de placeholder"
  );
}

// ---------------------------------------------------------------------------
// A.5 — el HTML de /orientacion (vista propia hardcodeada)
// ---------------------------------------------------------------------------
{
  const html = render("orientacion.hbs", { textos: { titulo: "Equipo de orientación escolar" } });
  chequear(html.includes("Convivencias"), "A.5: dice Convivencias");
  chequear(!html.includes("Convivecias"), "A.5: ya no dice Convivecias");
  chequear(html.includes("Orientación Vocacional"), "A.5: dice Orientación Vocacional");
  chequear(
    !html.includes("Orientación Vocacional:"),
    "A.5: Orientación Vocacional ya no lleva dos puntos"
  );
}

// ---------------------------------------------------------------------------
// A.11 — no quedan banderas de idioma en los navs del sitio real
// ---------------------------------------------------------------------------
{
  for (const partial of ["partials/nav.hbs", "partials/NavMenu.hbs"]) {
    const src = fs.readFileSync(path.join(VIEWS, partial), "utf8");
    chequear(!/<img[^>]*img-lang/.test(src), `A.11: ${partial} ya no tiene la imagen de banderas`);
  }
}

// ---------------------------------------------------------------------------
// A.9 — la grilla de la home.
// OJO: la grilla que se ve de verdad es partials/homeNiveles.hbs (es la que incluye
// views/home.hbs). partials/homeCuadros.hbs tiene una grilla casi igual pero NO lo
// incluye ninguna vista: es código muerto. Por eso se testea homeNiveles.
// ---------------------------------------------------------------------------
{
  const html = render("partials/homeNiveles.hbs", {});
  chequear(!html.includes("Aulas Interactivas"), "A.9: se sacó el cuadro de Aulas Interactivas");
  chequear(!html.includes("c-aulas"), "A.9: no quedó la clase c-aulas en la grilla");
  chequear(html.includes('href="/eventos"'), "A.9: el cuadro de Eventos lleva a /eventos");
  chequear(html.includes("c-evento"), "A.9: el cuadro de Eventos sigue existiendo");
  // los demás cuadros no se tocaron
  for (const c of ["c-verde", "c-intercambio", "c-violeta", "c-musica", "c-rojo", "c-fisica"]) {
    chequear(html.includes(c), `A.9: el cuadro ${c} sigue en la grilla`);
  }
}

// homeCuadros.hbs es código muerto: se deja tal cual, sin tocar.
{
  const src = fs.readFileSync(path.join(VIEWS, "partials", "homeCuadros.hbs"), "utf8");
  chequear(
    src.includes("c-aulas"),
    "homeCuadros.hbs (código muerto) queda sin modificar en este PR"
  );
}

console.log(`\n${ok} chequeos OK, ${fallos} fallas`);
process.exit(fallos ? 1 : 0);
