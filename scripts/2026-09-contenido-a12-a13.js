/**
 * Pliego "Modificaciones web CCJ 2026-09" — puntos A.12 y A.13 (contenido de páginas).
 *
 *   A.12  /informatica            -> la página está vacía porque NO EXISTE el documento en
 *                                    la colección `pages`. Este script lo CREA.
 *   A.13  /alumnos-intercambio    -> página nueva, ídem.
 *
 * Igual que scripts/2026-09-textos-a1-a8.js, es IDEMPOTENTE y NO PISA NADA INESPERADO:
 *
 *   - documento que no existe        -> lo crea con todos los campos de acá abajo.
 *   - campo vacío / inexistente      -> lo completa.
 *   - campo con el valor de acá      -> lo saltea ("ya aplicado").
 *   - campo con CUALQUIER OTRA COSA  -> NO lo toca y avisa (alguien lo editó por /pagesEdit).
 *
 * Se puede correr todas las veces que haga falta: el resultado es siempre el mismo.
 *
 * USO (desde la raíz del proyecto):
 *
 *   node scripts/2026-09-contenido-a12-a13.js            # DRY-RUN: sólo muestra qué haría
 *   node scripts/2026-09-contenido-a12-a13.js --apply    # escribe en la base
 *
 * Toma la conexión de process.env.MONGODB_URI (la misma variable que usa database.js).
 * Si no está en el entorno, exportarla antes de correr; nunca hardcodearla acá.
 *
 * ---------------------------------------------------------------------------------------
 * NOMBRES DE CAMPOS — leer antes de tocar:
 * el schema de models/Pages.js declara `cardImg1..4`, pero NINGÚN documento de la base usa
 * ese nombre: los 9 documentos existentes guardan `cardImage1..4`, que es lo que además lee
 * views/departamentos.hbs ({{textos.cardImage1}}). Verificado contra la base el 21/09/2026.
 * Por eso acá se escribe `cardImage*`. Se escribe con el driver crudo (db.collection), igual
 * que el script de A.1-A.8, así que el schema no interviene.
 *
 * FOTOS QUE FALTAN:
 * las 5 fotos de Informática están en la carpeta de Drive 1o12QpLTUcKd7kvN9Q12ZI8AISiW2sPha
 * y las de Intercambio en 1HREh-D-3spdsuX5D_U7T_3Z5GTjca_TC, pero ninguna de las dos se pudo
 * bajar (la carpeta pide login). Todas las imágenes quedan apuntando a FOTO_PENDIENTE. Para
 * cambiarlas: poner el jpg en public/img/deptos/<pagina>/, editar la constante de abajo y
 * volver a correr el script con --apply (los textos ya aplicados los saltea).
 */

const mongoose = require("mongoose");

const APPLY = process.argv.includes("--apply");

// Placeholder identificable para toda foto que todavía no tenemos.
const FOTO_PENDIENTE = "/img/placeholder-foto-pendiente.svg";

// ---------------------------------------------------------------------------
// A.12 — /informatica
// Fuente del texto: /root/specs/ccj-web-modificaciones-2026-09.md, sección
// "Contenido listo — Informática", que a su vez sale del Google Doc
// "Depto. de informática" (1ARMb3PgVtW5Vh1of84cW6FpyEItVeWpLp3BDAuGb8Cw).
// ---------------------------------------------------------------------------

const INFORMATICA = {
  ruta: "/informatica",
  pagina: "/informatica",

  // [HERO]
  imageTop: FOTO_PENDIENTE, // Drive: "Portada"
  titulo: "Dpto. de Informática y Tecnología",
  saludo: "¡Bienvenidos!",

  // [SECCIÓN BLANCA — intro]
  subTitulo1: "La tecnología en la Gartenstadt Schule",
  parrafo1:
    "La propuesta educativa del departamento se define por un enfoque integral y evolutivo " +
    "que acompaña al estudiante desde el nivel inicial hasta el secundario. El objetivo " +
    "central es formar ciudadanos digitales técnicamente competentes y responsables, " +
    "priorizando la alfabetización digital, el pensamiento computacional y la resolución de " +
    "problemas reales. El departamento fomenta un marco ético riguroso, haciendo hincapié en " +
    "la ciberseguridad, la privacidad, el impacto social de la tecnología y el uso " +
    "supervisado de la Inteligencia Artificial.",

  // [SECCIÓN AMARILLA — Nuestra Propuesta]
  subTitulo2: "Nuestra Propuesta",
  auxText1: "Trayectoria pedagógica por niveles, de Inicial a Secundario",
  auxText2: "Programación, robótica y pensamiento computacional",
  auxText3: "Ciberseguridad, privacidad y uso ético de la IA",
  auxText4: "Proyectos interdisciplinarios con Matemática e Idiomas",

  // [SECCIÓN ROJA — bloque destacado]
  subTitulo3: "Trayectoria por Niveles Educativos",
  parrafo3:
    "La enseñanza se estructura de manera gradual para adaptarse a la madurez cognitiva de " +
    "los alumnos.<br><br>" +
    "<b>Nivel Inicial:</b> se introducen los fundamentos del pensamiento lógico-matemático " +
    "mediante microestructuras de bloques y actividades físicas donde los niños actúan como " +
    "“robots” siguiendo instrucciones de orientación.<br><br>" +
    "<b>Nivel Primario:</b> metodología basada en el juego y el asombro. En el primer ciclo " +
    "se trabaja con ejes cartesianos y dibujos de píxeles; en el segundo ciclo se profundiza " +
    "en estructuras algorítmicas (bucles y condicionales) mediante programación por bloques." +
    "<br><br>" +
    "<b>Nivel Secundario:</b> en los primeros años se enseñan herramientas ofimáticas y " +
    "fundamentos de programación. En 4º año, la materia NTICx analiza el impacto global de la " +
    "tecnología. En 5º año la formación se orienta al ámbito profesional y universitario, " +
    "incluyendo análisis de Big Data y lenguajes de desarrollo profesional.",

  // [SECCIÓN CELESTE — Actividades, 4 tarjetas]
  subTitulo4: "Actividades",

  cardTitulo1: "Infraestructura y Software",
  cardTexto1:
    "Dos espacios especializados: una Sala de Informática de 50 m² con 20 estaciones de " +
    "trabajo y una computadora maestra para control y proyección, y una Sala de Tecnología de " +
    "42 m² con Smart TV, placas Arduino, micro:bit y dispositivos Makey Makey. Se trabaja con " +
    "Windows 11 y Copilot+, Visual Studio Code, la librería P5 de JavaScript y Google Workspace.",
  cardImage1: FOTO_PENDIENTE, // Drive: "Infraestructura y software"

  cardTitulo2: "Triángulos",
  cardTexto2:
    "Integración de geometría con GeoGebra y programación en Scratch, en conjunto con el " +
    "departamento de Matemática.",
  cardImage2: FOTO_PENDIENTE, // Drive: "Triángulos"

  cardTitulo3: "Alumnos Inversores",
  cardTexto3:
    "Los estudiantes de 5º año gestionan carteras de acciones en tiempo real utilizando Big " +
    "Data y herramientas financieras.",
  cardImage3: FOTO_PENDIENTE, // Drive: "Alumnos inversores"

  cardTitulo4: "Sitio Web",
  cardTexto4:
    "Desarrollo de sitios en HTML, CSS y JavaScript, con contenidos traducidos por los propios " +
    "alumnos a los idiomas extranjeros que enseña el colegio.",
  cardImage4: FOTO_PENDIENTE, // Drive: "Sitio web"

  // [CIERRE, debajo de Actividades] -> campo nuevo `cierre`, ver views/departamentos.hbs
  cierre:
    "El departamento se identifica con la iniciativa alemana de certificación MINT, en línea " +
    "con los estándares internacionales de calidad educativa en ciencia y tecnología.",
};

// ---------------------------------------------------------------------------
// A.13 — /alumnos-intercambio
// Fuente: mismo spec, sección "Contenido listo — Alumnos Intercambio".
// Se renderiza con views/alumnos-intercambio.hbs (6 tarjetas).
// ---------------------------------------------------------------------------

const ALUMNOS_INTERCAMBIO = {
  ruta: "/alumnos-intercambio",
  pagina: "/alumnos-intercambio",

  // [HERO]
  imageTop: FOTO_PENDIENTE, // fotos de Intercambio: carpeta de Drive sin compartir
  titulo: "Alumnos Intercambio",
  saludo: "Un mes en Alemania: idioma, convivencia e historia",

  // [SECCIÓN BLANCA — intro]
  subTitulo1: "Un viaje, tres tramos",
  parrafo1:
    "Se trata de una experiencia de aproximadamente un mes de duración, articulada en tres " +
    "tramos: un curso de inmersión idiomática en Tübingen, la convivencia con familias " +
    "anfitrionas en la región de Münster, y un cierre cultural e histórico en Berlín. Este " +
    "viaje es la culminación visible de un proceso de preparación que se extiende durante " +
    "todo el ciclo lectivo previo, articulando idioma, cultura, convivencia e historia.",

  // [SECCIÓN AMARILLA — Nuestra Propuesta]
  subTitulo2: "Nuestra Propuesta",
  auxText1: "Curso de inmersión idiomática en Tübingen",
  auxText2: "Convivencia con familias anfitrionas en la región de Münster",
  auxText3: "Cierre cultural e histórico en Berlín",
  auxText4:
    "Vínculo con las escuelas socias Berufskolleg Rheine y " +
    "Maria-Sibylla-Merian-Gymnasium Telgte",

  // [SECCIÓN ROJA]
  subTitulo3: "Por qué Alemania",
  parrafo3:
    "El destino de este viaje no es una elección accesoria: forma parte constitutiva del " +
    "proyecto pedagógico. Un viaje escolar es siempre una decisión educativa, y en el caso de " +
    "nuestro colegio esa decisión se sostiene en cinco pilares que hacen de Alemania un " +
    "destino específico e insustituible.<br><br>" +
    "<b>Continuidad curricular.</b> Nuestras alumnas y alumnos vienen aprendiendo alemán desde " +
    "la primaria. Han transitado años de trabajo sobre gramática, comprensión, expresión oral " +
    "y contenidos culturales. El viaje es el punto de llegada natural de ese recorrido: el " +
    "lugar donde el idioma deja de ser materia escolar y se convierte en una herramienta viva, " +
    "útil y cotidiana. Un destino distinto interrumpe esa lógica.<br><br>" +
    "<b>Inmersión real.</b> La ganancia lingüística de un intercambio se juega en el tiempo " +
    "continuo de exposición al idioma. Cuatro semanas hablando alemán con familias anfitrionas, " +
    "en las aulas de las escuelas socias y en la calle producen un salto cualitativo distinto " +
    "al de cualquier experiencia más breve: es el punto en el que el idioma deja de requerir " +
    "esfuerzo consciente y empieza a funcionar como una herramienta natural. Ese umbral se " +
    "alcanza cuando la inmersión se sostiene durante suficiente tiempo y sin interrupciones." +
    "<br><br>" +
    "<b>Marco institucional bilateral.</b> El viaje se apoya en la ZfA (Zentralstelle für das " +
    "Auslandsschulwesen, Oficina Central para las Escuelas Alemanas en el Extranjero) y en " +
    "escuelas socias con las que nuestro colegio mantiene una relación de reciprocidad: nos " +
    "reciben en sus aulas y con sus familias, y nosotros hacemos lo mismo cuando ellos vienen. " +
    "Este marco no es un servicio contratado a un proveedor turístico; es una red de vínculos " +
    "institucionales sostenida en el tiempo.<br><br>" +
    "<b>Contenido histórico-cultural específico.</b> Tübingen, la región de Münster y Berlín " +
    "no son «una capital más dos ciudades»: son escenarios concretos para trabajar contenidos " +
    "que atraviesan varias materias del secundario —historia del siglo XX, memoria, democracia, " +
    "ciudadanía, arte contemporáneo—. La cúpula del Reichstag, el Museo Judío, la East Side " +
    "Gallery o el Deutschland Museum enseñan cosas que la lectura no alcanza a transmitir del " +
    "mismo modo.<br><br>" +
    "<b>Identidad institucional.</b> Somos una escuela alemana en Argentina. Nuestro nombre, " +
    "nuestra oferta educativa y nuestros programas —desde Jugend Debattiert hasta la " +
    "preparación para diplomas internacionales de alemán— existen porque el vínculo con " +
    "Alemania es constitutivo de nuestra identidad. El viaje de intercambio es uno de los " +
    "momentos donde ese vínculo se hace visible con más fuerza. Sostener el destino es " +
    "sostener el proyecto pedagógico del colegio.",

  // [SECCIÓN CELESTE — Objetivos Pedagógicos, 6 tarjetas]
  subTitulo4: "Objetivos Pedagógicos",

  cardTitulo1: "Inmersión Lingüística Auténtica",
  cardTexto1:
    "Sostener interacciones reales en alemán durante un mes —en el aula de idioma en Tübingen, " +
    "en las aulas regulares de las escuelas socias y en la convivencia cotidiana con las " +
    "familias anfitrionas—. Esta continuidad, sin interrupciones, es la que produce el salto " +
    "cualitativo que ninguna clase, por buena que sea, logra por sí sola.",
  cardImage1: FOTO_PENDIENTE,

  cardTitulo2: "Convivencia Intercultural",
  cardTexto2:
    "Vivir con familias alemanas, compartir sus rutinas y participar de una vida escolar " +
    "distinta a la propia. No hablamos de «conocer Alemania» en clave turística, sino de " +
    "habitar otra cultura durante suficiente tiempo como para dejar de mirarla desde afuera.",
  cardImage2: FOTO_PENDIENTE,

  cardTitulo3: "Conciencia Histórica y Ciudadana",
  cardTexto3:
    "Recorrer en el territorio los lugares que dan cuerpo a los grandes procesos del siglo XX " +
    "europeo: la caída del Muro, la memoria del Holocausto, la reunificación, la reconstrucción " +
    "democrática. En pocos países estos temas son tan visibles y están tan cuidadosamente " +
    "puestos en el discurso público como en Alemania. La experiencia dialoga directamente con " +
    "lo que se trabaja en Historia, Formación Ciudadana y Filosofía.",
  cardImage3: FOTO_PENDIENTE,

  cardTitulo4: "Autonomía Personal",
  cardTexto4:
    "Asumir responsabilidades concretas sobre el propio cuidado, los tiempos y los compromisos, " +
    "en un entorno seguro pero exigente. Los alumnos y las alumnas vuelven cambiados: es una de " +
    "las observaciones más frecuentes de las familias que han vivido esta experiencia con " +
    "promociones anteriores.",
  cardImage4: FOTO_PENDIENTE,

  cardTitulo5: "Vínculo Institucional Sostenido",
  cardTexto5:
    "Consolidar la relación con la ZfA y con las escuelas socias alemanas —hoy Berufskolleg " +
    "Rheine y Maria-Sibylla-Merian-Gymnasium Telgte—. Este viaje no es una experiencia aislada " +
    "de una promoción, sino un eslabón en una cadena de intercambios recíprocos: cuando " +
    "nuestros alumnos viajan, los alumnos alemanes vienen. Ese ida y vuelta es lo que da forma " +
    "a la asociación y lo que la sostiene en el tiempo.",
  cardImage5: FOTO_PENDIENTE,

  cardTitulo6: "Continuidad del Recorrido Formativo",
  cardTexto6:
    "Integrar en un mismo proyecto todo el trabajo preparatorio del año: el mini intercambio " +
    "con el Colegio Gutenberg de Mar del Plata, la participación en Jugend Debattiert, y las " +
    "actividades preparatorias de idioma y cultura. El viaje es el punto de llegada de ese " +
    "recorrido, no un evento suelto.",
  cardImage6: FOTO_PENDIENTE,
};

const PAGINAS = [
  { punto: "A.12", doc: INFORMATICA },
  { punto: "A.13", doc: ALUMNOS_INTERCAMBIO },
];

/**
 * Decide qué hacer con UN campo de un documento que ya existe.
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
 * Decide qué hacer con un documento entero. Devuelve el plan, sin tocar la base.
 */
function planificar(docExistente, deseado) {
  if (!docExistente) {
    return { accion: "crear", campos: Object.keys(deseado).length };
  }
  const aEscribir = {};
  const yaAplicados = [];
  const inesperados = [];
  for (const [campo, valor] of Object.entries(deseado)) {
    if (campo === "ruta") continue; // es el filtro, no se toca
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

  const resumen = { creados: 0, camposEscritos: 0, yaAplicados: 0, inesperados: 0 };

  for (const { punto, doc } of PAGINAS) {
    const existente = await db.collection("pages").findOne({ ruta: doc.ruta });
    const plan = planificar(existente, doc);
    console.log(`[${punto}] ${doc.ruta}`);

    if (plan.accion === "crear") {
      console.log(`   NO existe el documento. Se CREA con ${plan.campos} campos.`);
      console.log(`   titulo: ${JSON.stringify(doc.titulo)}`);
      console.log(
        `   imágenes: todas en ${FOTO_PENDIENTE} (las fotos reales todavía no están)`
      );
      if (APPLY) {
        await db.collection("pages").insertOne({ ...doc, updatedAt: new Date() });
      }
      resumen.creados++;
      console.log("");
      continue;
    }

    const nEscribir = Object.keys(plan.aEscribir).length;
    console.log(
      `   ya existe. a completar: ${nEscribir} | ya aplicados: ${plan.yaAplicados.length} | ` +
        `inesperados: ${plan.inesperados.length}`
    );
    if (nEscribir) console.log(`   se completan: ${Object.keys(plan.aEscribir).join(", ")}`);
    for (const i of plan.inesperados) {
      console.log(
        `   OJO: ${i.campo} ya tiene otro valor, NO se toca -> ` +
          `${JSON.stringify(i.actual.slice(0, 120))}`
      );
    }
    if (APPLY && nEscribir) {
      await db
        .collection("pages")
        .updateOne({ ruta: doc.ruta }, { $set: { ...plan.aEscribir, updatedAt: new Date() } });
    }
    resumen.camposEscritos += nEscribir;
    resumen.yaAplicados += plan.yaAplicados.length;
    resumen.inesperados += plan.inesperados.length;
    console.log("");
  }

  console.log("---------------------------------------------");
  console.log(
    `Documentos a crear: ${resumen.creados} | campos a completar: ${resumen.camposEscritos} | ` +
      `ya aplicados: ${resumen.yaAplicados} | inesperados: ${resumen.inesperados}`
  );
  if (!APPLY) {
    console.log(
      "Fue un dry-run. Para escribir: node scripts/2026-09-contenido-a12-a13.js --apply"
    );
  }

  await mongoose.disconnect();
}

module.exports = { INFORMATICA, ALUMNOS_INTERCAMBIO, PAGINAS, decidirCampo, planificar, FOTO_PENDIENTE };

if (require.main === module) {
  main().catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
}
