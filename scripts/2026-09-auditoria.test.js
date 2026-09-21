/**
 * Test de la tanda de auditoría (21/09/2026). No toca la base ni levanta el servidor:
 * compila los .hbs reales con handlebars y verifica el HTML que sale.
 *
 * Existe por las DOS causas raíz de la auditoría:
 *
 *   1. Se reportaron puntos como "hechos" chequeando sólo que el texto estuviera en el HTML.
 *      Un ítem de menú `disabled`, un href="#" o un href a una ruta inexistente pasan ese
 *      chequeo y están rotos para el usuario. Por eso acá se chequean LOS LINKS: que no haya
 *      ítems disabled, que ningún href apunte a una ruta que no está en routes/routes.js, y
 *      que los destinos que el pliego pide existan.
 *   2. Se publicaron páginas vacías y placeholders de "FOTO PENDIENTE". Por eso se chequea
 *      que el contenido realmente aparezca y que no salga ningún placeholder.
 *
 * USO:  node scripts/2026-09-auditoria.test.js
 */

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const {
  EVENTOS,
  LIDERES,
  ESCUELA_PARA_FAMILIAS,
  EXAMENES_INTERNACIONALES,
  CORRECCIONES,
  LIMPIEZAS,
  PLACEHOLDER_FOTO,
  decidirCampo,
  planificarCorreccion,
  planificarLimpieza,
} = require("./2026-09-contenido-auditoria");

const RAIZ = path.join(__dirname, "..");
const VIEWS = path.join(RAIZ, "views");

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

function leerVista(vista) {
  return fs.readFileSync(path.join(VIEWS, vista), "utf8");
}

function render(vista, contexto) {
  return handlebars.compile(leerVista(vista))(contexto);
}

// Las rutas que realmente sirve la app, sacadas de routes/routes.js.
const routesSrc = fs.readFileSync(path.join(RAIZ, "routes", "routes.js"), "utf8");
const RUTAS = new Set(
  [...routesSrc.matchAll(/\{\s*route:\s*"([^"]+)"/g)].map((m) => "/" + m[1])
);
// Rutas servidas fuera del array `routes` (router.get sueltos) o externas conocidas.
const RUTAS_EXTRA = new Set(["/", "/index", "/Index", "/login", "/tickets", "/fotos"]);

const MENUS = ["partials/nav.hbs", "partials/NavMenu.hbs", "partials/homeMenu.hbs"];

// ---------------------------------------------------------------------------
// B.1 / B.3 / B.4 / B.5 — los menús: nada disabled, nada apuntando a un 404.
// ---------------------------------------------------------------------------
for (const menu of [...MENUS, "partials/homeNiveles.hbs"]) {
  const src = leerVista(menu);

  chequear(
    !/class="[^"]*\bdisabled\b/.test(src),
    `${menu}: no queda ningún ítem disabled`
  );
  chequear(
    !src.includes('href="/intercambios"'),
    `${menu}: /intercambios (404) ya no se usa; la ruta real es /alumnos-intercambio`
  );
  chequear(
    !src.includes('href="/mejorpromedio"'),
    `${menu}: Ehrentafel sacado (no existe /mejorpromedio ni hay contenido)`
  );

  // Todo href interno tiene que corresponder a una ruta que exista de verdad.
  for (const m of src.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
    const destino = m[1];
    const esRuta = RUTAS.has(destino) || RUTAS_EXTRA.has(destino);
    // /Admisiones y /Administracion: express matchea case-sensitive, pero estaban así
    // desde antes de esta tanda y responden por el redirect del server. Se acepta.
    const variante = RUTAS.has("/" + destino.slice(1).toLowerCase());
    chequear(
      esRuta || variante,
      `${menu}: href="${destino}" no corresponde a ninguna ruta de routes.js`
    );
  }

  // Un link de menú con href="#" es un link muerto (fue el caso del cuadro Eventos).
  chequear(
    !/class="dropdown-item[^"]*"[^>]*href="#"/.test(src),
    `${menu}: ningún ítem de menú queda con href="#"`
  );
}

// El menú EVENTOS tiene que estar completo y apuntando a los anclas de la vista.
for (const menu of MENUS) {
  const src = leerVista(menu);
  for (const ancla of ["#concert", "#expresarte", "#familienfest", "#musical-de-aleman"]) {
    chequear(src.includes(`/eventos${ancla}`), `${menu}: está el ítem ${ancla}`);
  }
}

// Los cuatro anclas tienen que existir como id en la vista de eventos.
{
  const src = leerVista("eventos.hbs");
  for (const id of ["concert", "expresarte", "familienfest", "musical-de-aleman"]) {
    chequear(src.includes(`id="${id}"`), `eventos.hbs: existe el ancla id="${id}"`);
  }
}

// ---------------------------------------------------------------------------
// B.8 — los cuadros de la home que estaban en href="#"
// ---------------------------------------------------------------------------
{
  const src = leerVista("partials/homeNiveles.hbs");
  chequear(
    src.includes('href="/examenes-internacionales"'),
    "B.8: el cuadro Exámenes Internacionales lleva a su página"
  );
  chequear(
    src.includes('href="/alumnos-intercambio"'),
    "B.8: el cuadro Alumnos Intercambio lleva a su página"
  );
  chequear(src.includes('href="/eventos"'), "A.9: el cuadro Eventos lleva a /eventos");
  chequear(!src.includes("</a>s"), "C.3: se barrió la 's' suelta del cuadro MINT");
}

// ---------------------------------------------------------------------------
// Las rutas nuevas tienen que estar declaradas
// ---------------------------------------------------------------------------
for (const r of [
  "/eventos",
  "/lideres",
  "/escuela-para-familias",
  "/examenes-internacionales",
  "/alumnos-intercambio",
  "/informatica",
]) {
  chequear(RUTAS.has(r), `routes.js: existe la ruta ${r}`);
}

// C.2 — las rutas que sacan todo su texto de Mongo llevan el guard `necesitaDoc`, así que
// sin documento devuelven 404 en vez de una página en blanco.
for (const r of ["actividadesMint", "eventos", "lideres", "examenes-internacionales"]) {
  const re = new RegExp(`route:\\s*"${r}"[^}]*necesitaDoc:\\s*true`);
  chequear(re.test(routesSrc), `routes.js: la ruta /${r} tiene el guard necesitaDoc`);
}
chequear(
  /necesitaDoc && !pagesData\[0\]/.test(routesSrc) && /status\(404\)/.test(routesSrc),
  "routes.js: el guard devuelve 404 cuando no hay documento"
);
chequear(fs.existsSync(path.join(VIEWS, "404.hbs")), "existe la vista 404.hbs");

// Las vistas con texto propio NO llevan el guard: nunca leyeron Mongo y romperían.
for (const r of ["mint", "admisiones", "staff", "nuestrocolegio", "cv", "orientacion"]) {
  const re = new RegExp(`route:\\s*"${r}"[^}]*necesitaDoc`);
  chequear(!re.test(routesSrc), `routes.js: /${r} NO lleva guard (tiene texto propio)`);
}

// ---------------------------------------------------------------------------
// B.2 — /eventos con contenido real
// ---------------------------------------------------------------------------
{
  const html = render("eventos.hbs", { textos: EVENTOS });

  chequear(
    !html.includes("Estamos preparando esta página"),
    "B.2: ya no sale el aviso de página en preparación"
  );
  for (const t of ["Concert", "Expresarte", "Familienfest", "Musical de Alemán"]) {
    chequear(html.includes(t), `B.2: sale el bloque "${t}"`);
  }
  chequear(
    html.includes("protagonistas de este proyecto anual en inglés"),
    "B.2: sale el texto de Concert"
  );
  chequear(html.includes("en el marco del Día de la Música"), "B.2: sale el texto de Expresarte");
  chequear(
    html.includes("los 70 años de Gartenstadt Schule"),
    "B.2: sale el texto de Familienfest"
  );
  chequear(
    html.includes("el idioma se vive en escena"),
    "B.2: sale el texto del Musical de Alemán"
  );
  chequear(html.includes("/img/c-evento.jpg"), "B.2: sin foto de Drive, el hero cae en la del sitio");
}

// ---------------------------------------------------------------------------
// B.5 — /lideres y /escuela-para-familias con departamentos.hbs
// ---------------------------------------------------------------------------
{
  const html = render("departamentos.hbs", { textos: LIDERES });

  chequear(html.includes("Taller de Líderes"), "B.5: sale el título de Líderes");
  chequear(
    html.includes("propuesta pedagógica que comparten muchas escuelas"),
    "B.5: sale el intro de Líderes"
  );
  chequear(html.includes("Acompañamiento a los estudiantes de Primaria"), "B.5: salen los auxText");
  chequear(html.includes("Qué entendemos por liderazgo"), "B.5: sale la sección roja");
  for (const t of ["Acompañamiento a Primaria", "Vida Institucional", "Proyectos Solidarios"]) {
    chequear(html.includes(t), `B.5: sale la tarjeta "${t}"`);
  }
  chequear(html.includes("aprender haciendo"), "B.5: sale el cierre");

  // Son 3 tarjetas, no 4: la cuarta no se dibuja.
  chequear(
    (html.match(/class="card"/g) || []).length === 3,
    "B.5: se dibujan exactamente 3 tarjetas, sin una cuarta vacía"
  );
}

{
  const html = render("departamentos.hbs", { textos: ESCUELA_PARA_FAMILIAS });

  chequear(html.includes("Escuela para Familias"), "B.5: sale el título de Escuela para Familias");
  chequear(
    html.includes("espacio de encuentro, reflexión y aprendizaje compartido"),
    "B.5: sale el intro"
  );
  chequear(html.includes("Grupo de WhatsApp con recursos"), "B.5: salen los auxText");
  // parrafo3 son dos párrafos unidos con <br><br> y va con triple llave: no se escapa.
  chequear(html.includes("<br><br>"), "B.5: el <br><br> de parrafo3 no se escapa");
  chequear(html.includes("pensado junto a Alejandro"), "B.5: sale la sección roja");
  for (const t of ["Temas que Trabajamos", "Modalidad y Participación", "Qué se Llevan las Familias"]) {
    chequear(html.includes(t), `B.5: sale la tarjeta "${t}"`);
  }
  chequear(html.includes("educar es una tarea colectiva"), "B.5: sale el cierre");
  chequear(
    (html.match(/class="card"/g) || []).length === 3,
    "B.5: se dibujan exactamente 3 tarjetas"
  );
}

// ---------------------------------------------------------------------------
// B.8 — /examenes-internacionales, 9 tarjetas en dos grupos
// ---------------------------------------------------------------------------
{
  const html = render("examenes-internacionales.hbs", { textos: EXAMENES_INTERNACIONALES });

  chequear(html.includes("Exámenes Internacionales"), "B.8: sale el título");
  chequear(html.includes("Certificaciones que abren puertas"), "B.8: sale el subtítulo 1");
  chequear(html.includes("comunidad global de excelencia académica"), "B.8: sale el intro");

  for (let i = 1; i <= 9; i++) {
    const t = EXAMENES_INTERNACIONALES["cardTitulo" + i];
    chequear(html.includes(t), `B.8: sale la tarjeta ${i} ("${t}")`);
  }
  chequear(
    (html.match(/class="card"/g) || []).length === 9,
    "B.8: se dibujan las 9 tarjetas"
  );

  // Los 9 bullets de la sección amarilla.
  for (let i = 1; i <= 9; i++) {
    chequear(
      html.includes(EXAMENES_INTERNACIONALES["auxText" + i]),
      `B.8: sale el bullet ${i}`
    );
  }

  // Los dos grupos, con su subtítulo.
  chequear(html.includes(">Alemán<"), "B.8: sale el subtítulo del grupo Alemán");
  chequear(html.includes(">Inglés<"), "B.8: sale el subtítulo del grupo Inglés");
  // El grupo Alemán va antes que el de Inglés, y las tarjetas de cada uno adentro.
  chequear(
    html.indexOf("IVA 1") < html.indexOf("Sede Examinadora Cambridge"),
    "B.8: las tarjetas de Alemán van antes que las de Inglés"
  );

  // parrafo3 / parrafo3b van con triple llave: el <strong> no se escapa.
  chequear(html.includes("<strong>Alemán:"), "B.8: el HTML de parrafo3 no se escapa");
  chequear(html.includes("<strong>Inglés:"), "B.8: sale el segundo bloque de la sección roja");
  chequear(html.includes("décadas de excelencia educativa"), "B.8: sale el cierre");
}

// ---------------------------------------------------------------------------
// B.6 — no se publica ningún placeholder de "FOTO PENDIENTE"
// ---------------------------------------------------------------------------
{
  const casos = [
    ["eventos.hbs", EVENTOS],
    ["departamentos.hbs", LIDERES],
    ["departamentos.hbs", ESCUELA_PARA_FAMILIAS],
    ["examenes-internacionales.hbs", EXAMENES_INTERNACIONALES],
  ];
  for (const [vista, textos] of casos) {
    const html = render(vista, { textos });
    chequear(
      !html.includes("placeholder-foto-pendiente"),
      `B.6: ${textos.ruta} no publica placeholders de foto`
    );
    chequear(!/<img src=""/.test(html), `B.6: ${textos.ruta} no deja <img> vacíos`);
    chequear(!/url\(\)/.test(html), `B.6: ${textos.ruta} no deja un hero con url() vacío`);
  }

  // /alumnos-intercambio: las fotos siguen sin llegar (único bloqueo real), así que la
  // página tiene que verse prolija SIN ellas.
  const html = render("alumnos-intercambio.hbs", {
    textos: { titulo: "Alumnos Intercambio", cardTitulo1: "x", cardTexto1: "y" },
  });
  chequear(
    !html.includes("placeholder-foto-pendiente") && !/<img src=""/.test(html),
    "B.6: /alumnos-intercambio sin fotos no muestra placeholders"
  );
  chequear(
    html.includes("/img/c-intercambio.jpg"),
    "B.6: /alumnos-intercambio cae en la foto del cuadro de la home"
  );

  // La vista sola NO alcanza: el documento que ya está en producción tiene el placeholder
  // cargado en los 7 campos, así que se seguiría viendo. El script los borra.
  const conPlaceholders = Object.fromEntries(
    LIMPIEZAS[0].campos.map((c) => [c, PLACEHOLDER_FOTO])
  );
  const htmlSucio = render("alumnos-intercambio.hbs", {
    textos: { ...conPlaceholders, cardTitulo1: "x" },
  });
  chequear(
    htmlSucio.includes("placeholder-foto-pendiente"),
    "B.6: con el doc como está hoy en prod, los placeholders SÍ se ven (por eso hay que limpiar)"
  );

  const plan = planificarLimpieza(conPlaceholders, LIMPIEZAS[0]);
  chequear(plan.borrar.length === 7, "B.6: el script borra los 7 campos con placeholder");
  chequear(
    planificarLimpieza({ ...conPlaceholders, cardImage1: "/img/real.jpg" }, LIMPIEZAS[0])
      .borrar.length === 6,
    "B.6: una foto de verdad no se borra"
  );
  chequear(
    planificarLimpieza({}, LIMPIEZAS[0]).borrar.length === 0,
    "B.6: sin campos cargados no borra nada"
  );
  chequear(
    planificarLimpieza(null, LIMPIEZAS[0]).borrar.length === 0,
    "B.6: sin documento no borra nada"
  );

  // Después de la limpieza, la página queda prolija.
  const htmlLimpio = render("alumnos-intercambio.hbs", {
    textos: { cardTitulo1: "x", cardTexto1: "y" },
  });
  chequear(
    !htmlLimpio.includes("placeholder-foto-pendiente"),
    "B.6: limpio el documento, no queda ningún placeholder"
  );
}

// ---------------------------------------------------------------------------
// B.7 — el botón muerto de /mint
// ---------------------------------------------------------------------------
{
  const src = leerVista("mint.hbs");
  const html = render("mint.hbs", {});
  chequear(
    !html.includes("VER TODAS LAS ACTIVIDADES"),
    "B.7: el botón sin destino ya no se publica"
  );
  chequear(
    src.includes("URL_DEL_BLOG"),
    "B.7: queda el bloque comentado para reponerlo cuando llegue la URL"
  );
}

// ---------------------------------------------------------------------------
// C.1 — la frase colgada de /nuestrocolegio
// ---------------------------------------------------------------------------
{
  const html = render("nuestro-colegio.hbs", {});
  chequear(
    !html.includes("entrando al sitio que creó nuestra alumna"),
    "C.1: se reescribió la invitación a un sitio inexistente"
  );
  chequear(
    html.includes("Guadalupe Sogno"),
    "C.1: se sigue nombrando a la alumna"
  );
}

// ---------------------------------------------------------------------------
// C.4 — Laternefest -> Laternenfest (lógica de la corrección)
// ---------------------------------------------------------------------------
{
  const corr = CORRECCIONES[0];
  chequear(corr.a === "Laternenfest", "C.4: el valor nuevo es Laternenfest");
  chequear(
    planificarCorreccion({ cardTitulo2: "Laternefest" }, corr).estado === "corrige",
    "C.4: con el valor viejo, corrige"
  );
  chequear(
    planificarCorreccion({ cardTitulo2: "Laternenfest" }, corr).estado === "ya-aplicado",
    "C.4: si ya está bien, no toca nada"
  );
  chequear(
    planificarCorreccion({ cardTitulo2: "Otra cosa" }, corr).estado === "distinto",
    "C.4: si alguien lo editó, no lo pisa"
  );
  chequear(
    planificarCorreccion(null, corr).estado === "sin-doc",
    "C.4: sin documento, no hace nada"
  );
}

// ---------------------------------------------------------------------------
// Idempotencia del script de contenido
// ---------------------------------------------------------------------------
{
  chequear(decidirCampo(undefined, "x").estado === "completa", "campo inexistente se completa");
  chequear(decidirCampo("", "x").estado === "completa", "campo vacío se completa");
  chequear(decidirCampo("   ", "x").estado === "completa", "campo en blanco se completa");
  chequear(decidirCampo("x", "x").estado === "ya-aplicado", "campo ya cargado se saltea");
  chequear(decidirCampo("otra", "x").estado === "inesperado", "campo editado a mano no se pisa");

  // Ninguna página trae campos de imagen: las fotos siguen en Drive.
  for (const doc of [EVENTOS, LIDERES, ESCUELA_PARA_FAMILIAS, EXAMENES_INTERNACIONALES]) {
    const conImagen = Object.keys(doc).filter((k) => /^(imageTop|cardImage\d)$/.test(k));
    chequear(
      conImagen.length === 0,
      `${doc.ruta}: no se cargan campos de imagen (las fotos no se pudieron bajar)`
    );
  }
}

console.log("");
console.log(`${ok} chequeos OK, ${fallos} fallas`);
process.exit(fallos ? 1 : 0);
