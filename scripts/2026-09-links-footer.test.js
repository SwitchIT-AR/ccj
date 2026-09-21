/**
 * Test de la tanda de links rotos de footer y nav (21/09/2026), la que sigue a la auditoría.
 *
 * Lo que cerró esta tanda, todo verificado antes contra producción:
 *   1. /comollegar era 404 y había DIEZ botones "Como llegar" con class disabled apuntando
 *      ahí (los dos footers + las landings de campaña matriculacion-* e inicial-*).
 *   2. NavMenu.hbs tenía ADMINISTRACIÓN y ADMISIONES con href="#": desde adentro del sitio
 *      esos dos ítems no llevaban a ningún lado, aunque las páginas existen y responden 200.
 *   3. Los iconos de Facebook y LinkedIn de los dos footers tenían href="#".
 *   4. El botón "Tour 360" apuntaba a /Tour, que es 404 y no existe ni como ruta ni como
 *      asset en el repo. Se sacó (no se inventa un tour).
 *
 * Mismo criterio que 2026-09-auditoria.test.js: no toca la base ni levanta el servidor,
 * compila los .hbs reales y mira el HTML. Y chequea LOS LINKS, no que el texto esté.
 *
 * USO:  node scripts/2026-09-links-footer.test.js
 */

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const RAIZ = path.join(__dirname, "..");
const VIEWS = path.join(RAIZ, "views");

let ok = 0;
let fallos = 0;

function chequear(condicion, descripcion) {
  if (condicion) {
    ok++;
  } else {
    fallos++;
    console.log(`  FALLA: ${descripcion}`);
  }
}

const leerVista = (v) => fs.readFileSync(path.join(VIEWS, v), "utf8");

const routesSrc = fs.readFileSync(path.join(RAIZ, "routes", "routes.js"), "utf8");
const RUTAS = new Set(
  [...routesSrc.matchAll(/\{\s*route:\s*"([^"]+)"/g)].map((m) => "/" + m[1])
);
const RUTAS_EXTRA = new Set(["/", "/index", "/Index", "/login", "/tickets", "/fotos"]);

const FOOTERS = ["partials/homeFooter.hbs", "partials/footerPages.hbs"];
// Las landings de campaña tienen copias viejas del footer: el botón se tocó también ahí.
const LANDINGS = [
  "matriculacion-goo.hbs",
  "matriculacion-fb.hbs",
  "matriculacion-in.hbs",
  "matriculacion-ig.hbs",
  "inicial-goo.hbs",
  "inicial-fb.hbs",
  "inicial-in.hbs",
  "inicial-ig.hbs",
];

// ---------------------------------------------------------------------------
// 1 — /comollegar existe como ruta, con vista propia (sin guard necesitaDoc)
// ---------------------------------------------------------------------------
{
  chequear(RUTAS.has("/comollegar"), "routes.js: existe la ruta /comollegar");
  chequear(
    !/route:\s*"comollegar"[^}]*necesitaDoc/.test(routesSrc),
    "routes.js: /comollegar NO lleva guard necesitaDoc (tiene texto propio, no lee Mongo)"
  );
  chequear(
    fs.existsSync(path.join(VIEWS, "comollegar.hbs")),
    "existe la vista comollegar.hbs"
  );
}

// ---------------------------------------------------------------------------
// 2 — la página renderiza con datos de contacto reales y con mapa
// ---------------------------------------------------------------------------
{
  const html = handlebars.compile(leerVista("comollegar.hbs"))({});

  chequear(/Matienzo\s*2799/.test(html), "/comollegar: muestra la altura 2799 de Matienzo");
  chequear(
    /Ciudad Jard[íi]n Lomas del Palomar/.test(html),
    "/comollegar: muestra la localidad"
  );
  chequear(/4758-6245/.test(html), "/comollegar: muestra el teléfono 4758-6245");
  chequear(/4751-0376/.test(html), "/comollegar: muestra el teléfono 4751-0376");
  chequear(
    html.includes("administracion@colegiociudadjardin.edu.ar"),
    "/comollegar: muestra el mail de administración"
  );
  chequear(/8:00 a 16:00/.test(html), "/comollegar: muestra el horario de atención");

  // El mapa embebido, que es la razón de ser de la página.
  chequear(
    /<iframe[^>]+src="https:\/\/www\.google\.com\/maps\?q=[^"]+output=embed"/.test(html),
    "/comollegar: tiene el iframe del mapa de Google (embed público, sin API key)"
  );
  chequear(
    /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^"]+"[^>]*target="_blank"/.test(
      html
    ),
    '/comollegar: el botón "Abrir en Google Maps" abre en pestaña nueva'
  );

  // No se publican datos inventados: no hay números de línea de colectivo sin confirmar.
  chequear(
    !/l[íi]neas?\s+\d{2,3}/i.test(html),
    "/comollegar: no publica números de línea de colectivo sin confirmar"
  );

  // Lo mismo que pide el test de la auditoría para todas las páginas nuevas.
  chequear(!/FOTO PENDIENTE/i.test(html), "/comollegar: no hay placeholders de foto");
  chequear(
    !/class="[^"]*\bdisabled\b/.test(html),
    "/comollegar: no hay ningún elemento disabled"
  );
}

// ---------------------------------------------------------------------------
// 3 — ningún botón "Como llegar" queda apagado, en ninguna vista del repo
// ---------------------------------------------------------------------------
for (const archivo of fs.readdirSync(VIEWS).filter((f) => f.endsWith(".hbs"))) {
  const src = leerVista(archivo);
  if (!src.includes("/comollegar")) continue;
  chequear(
    !/class="[^"]*\bdisabled\b[^"]*"[^>]*href="\/comollegar"/.test(src),
    `${archivo}: el botón "Como llegar" ya no está disabled`
  );
}
for (const partial of FOOTERS) {
  chequear(
    leerVista(partial).includes('href="/comollegar"'),
    `${partial}: conserva el botón "Como llegar"`
  );
}
// 8 landings + 2 footers = los 10 botones que estaban apagados.
{
  const conBoton = [...FOOTERS, ...LANDINGS].filter((v) =>
    leerVista(v).includes('href="/comollegar"')
  );
  chequear(conBoton.length === 10, `los 10 botones "Como llegar" siguen en su lugar (${conBoton.length})`);
}

// ---------------------------------------------------------------------------
// 4 — los footers: nada disabled, nada con href="#", nada apuntando a un 404
// ---------------------------------------------------------------------------
for (const partial of FOOTERS) {
  const src = leerVista(partial);

  chequear(
    !/class="[^"]*\bdisabled\b/.test(src),
    `${partial}: no queda ningún botón disabled`
  );
  chequear(
    !/<a[^>]+href="#"/.test(src),
    `${partial}: ningún enlace queda con href="#"`
  );
  chequear(
    src.includes("facebook.com/colegiociudadjardin"),
    `${partial}: Facebook apunta a la página real del colegio`
  );
  chequear(
    src.includes("linkedin.com/company/gartenstadt-schule"),
    `${partial}: LinkedIn apunta al perfil real del colegio`
  );

  for (const m of src.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
    const destino = m[1];
    const variante = RUTAS.has("/" + destino.slice(1).toLowerCase());
    chequear(
      RUTAS.has(destino) || RUTAS_EXTRA.has(destino) || variante,
      `${partial}: href="${destino}" no corresponde a ninguna ruta de routes.js`
    );
  }
}

// ---------------------------------------------------------------------------
// 5 — NavMenu: ADMINISTRACIÓN y ADMISIONES con destino real
// ---------------------------------------------------------------------------
{
  const src = leerVista("partials/NavMenu.hbs");
  chequear(
    /href="\/[Aa]dministracion"[^>]*>\s*ADMINISTRACIÓN/.test(src),
    "NavMenu.hbs: ADMINISTRACIÓN apunta a la página de administración"
  );
  chequear(
    /href="\/[Aa]dmisiones"[^>]*>\s*ADMISIONES/.test(src),
    "NavMenu.hbs: ADMISIONES apunta a la página de admisiones"
  );
  chequear(
    !/<a class="nav-link" href="#">/.test(src),
    'NavMenu.hbs: ningún ítem de primer nivel queda con href="#"'
  );
}

// ---------------------------------------------------------------------------
// 6 — /Tour no existe: no puede quedar un solo link apuntando ahí
// ---------------------------------------------------------------------------
{
  chequear(!RUTAS.has("/Tour"), "routes.js: /Tour no es una ruta (por eso se sacó el botón)");
  const conTour = fs
    .readdirSync(VIEWS)
    .filter((f) => f.endsWith(".hbs"))
    .filter((f) => /href="\/Tour"/.test(leerVista(f)));
  const partialsConTour = fs
    .readdirSync(path.join(VIEWS, "partials"))
    .filter((f) => f.endsWith(".hbs"))
    .filter((f) => /href="\/Tour"/.test(leerVista(path.join("partials", f))));
  chequear(
    conTour.length === 0 && partialsConTour.length === 0,
    `ninguna vista apunta a /Tour (quedan: ${[...conTour, ...partialsConTour].join(", ")})`
  );
}

// ---------------------------------------------------------------------------
// 7 — los assets estáticos de los layouts existen en disco
//
// Un barrido de los 58 links internos de producción devolvió tres 404, los tres iconos:
// los layouts pedían /img/favicon-32x32.png y los archivos están en /img/favicon/.
// El navegador no lo muestra como error, pero el sitio servía 404 en cada página.
// ---------------------------------------------------------------------------
{
  const PUBLIC = path.join(RAIZ, "public");
  for (const layout of ["layouts/main.hbs", "layouts/pages.hbs"]) {
    const src = leerVista(layout);
    // Sólo rutas literales: las que salen de Mongo ({{textos.imageTop}}) no se pueden chequear.
    for (const m of src.matchAll(/(?:href|src)="(\/img\/[^"{}]+)"/g)) {
      const rel = m[1];
      chequear(
        fs.existsSync(path.join(PUBLIC, rel)),
        `${layout}: el asset ${rel} no existe en public/`
      );
    }
  }
}

console.log("");
console.log(`${ok} chequeos OK, ${fallos} fallas`);
process.exit(fallos ? 1 : 0);
