/**
 * Auditoría de producción del 21/09/2026 — contenido que faltaba cargar.
 *
 * Los PRs #1 y #2 dejaron cuatro páginas del pliego sin contenido porque se dio por
 * "bloqueado" material de Drive que en realidad estaba accesible: se había chequeado con
 * curl (sin sesión de Google) en vez de con el conector de Drive. Ver
 * /root/specs/ccj-contenido-bloqueado-DESBLOQUEADO.md.
 *
 * Este script carga ese contenido:
 *
 *   /eventos                    -> existía la ruta con un placeholder ("estamos preparando
 *                                  esta página") y los 5 ítems del menú EVENTOS disabled.
 *   /lideres                    -> el menú LA GARTENSTADT apuntaba acá y era 404.
 *   /escuela-para-familias      -> ídem.
 *   /examenes-internacionales   -> el cuadro de la home iba a href="#". Página nueva.
 *
 * Y corrige C.4: /deutsch decía "Laternefest" en vez de "Laternenfest".
 *
 * Mismo criterio que scripts/2026-09-contenido-a12-a13.js: IDEMPOTENTE y NO PISA NADA
 * INESPERADO.
 *
 *   - documento que no existe        -> lo crea.
 *   - campo vacío / inexistente      -> lo completa.
 *   - campo con el valor de acá      -> lo saltea ("ya aplicado").
 *   - campo con CUALQUIER OTRA COSA  -> NO lo toca y avisa.
 *
 * Las CORRECCIONES son distintas: ahí sí se pisa un valor, pero sólo si el valor actual es
 * exactamente el que esperamos ("de"). Si alguien ya lo arregló o lo cambió, no se toca.
 *
 * USO (desde la raíz del proyecto):
 *
 *   export MONGODB_URI='...'                                     # la misma que usa la app
 *   node --no-deprecation scripts/2026-09-contenido-auditoria.js           # DRY-RUN
 *   node --no-deprecation scripts/2026-09-contenido-auditoria.js --apply   # escribe
 *
 * Usar --no-deprecation: Node imprime un warning que incluye la cadena de conexión completa.
 *
 * ---------------------------------------------------------------------------------------
 * FOTOS — por qué no hay ningún campo de imagen acá:
 * las fotos de estas páginas están en Drive y no se pueden bajar a un archivo desde el
 * server (Drive pide sesión de Google). En vez de cargar placeholders de "FOTO PENDIENTE"
 * —que es lo que dejó /alumnos-intercambio con 7 carteles a la vista en producción, defecto
 * B.6 de la auditoría— los campos de imagen NO se escriben: las vistas ahora renderizan la
 * foto sólo si el campo existe, y los heros caen en una imagen del propio sitio.
 * CUANDO LLEGUEN LAS FOTOS: poner los jpg en public/img/deptos/<pagina>/, agregar
 * imageTop/cardImageN al objeto de la página acá abajo y volver a correr con --apply. Los
 * textos ya cargados los saltea.
 *
 * Carpetas de Drive, por si se bajan a mano:
 *   /eventos                  1RdD8XTwP-rFhL6JygqiYGtzrCIosbR4g  (5 archivos, 1 HEIC)
 *   /lideres                  124d4aQvT5vnJ3nNOkNWdg4cAjk-VP5FU  (4 archivos)
 *   /escuela-para-familias    1kxnYqhWGWj8JQMs54XZkwTJ-ilgHdbmL  (4 archivos, los 4 HEIC)
 *   /examenes-internacionales portada 1ttiuDMxCJ5JYRMxWsOgYArqgVUYZtUZF
 * Los HEIC hay que convertirlos a jpg antes de subirlos: el navegador no los renderiza.
 */

const mongoose = require("mongoose");

const APPLY = process.argv.includes("--apply");

// ---------------------------------------------------------------------------
// /eventos — vista views/eventos.hbs (4 bloques con ancla, uno por evento).
// Fuente: Google Doc "Eventos" 1F3zaWhR5AtKnkZUdN2RjcTvhdxjyow_EXQXVrB_knAg.
// Los subTitulo1..4 son los títulos de los 4 eventos, en el mismo orden que los anclas
// del menú (#concert, #expresarte, #familienfest, #musical-de-aleman): NO reordenar.
// ---------------------------------------------------------------------------

const EVENTOS = {
  ruta: "/eventos",
  titulo: "Eventos",
  saludo: "Momentos que construyen comunidad",

  subTitulo1: "Concert",
  parrafo1:
    "Los alumnos de 6° grado son los protagonistas de este proyecto anual en inglés, " +
    "acompañados por 4° y 5° en coreografías y canciones, con la banda del nivel secundario " +
    "tocando en vivo. Una jornada de música, baile y trabajo en equipo que, año tras año, se " +
    "convierte en un evento inolvidable para toda la comunidad.",

  subTitulo2: "Expresarte",
  parrafo2:
    "Cada año, en el marco del Día de la Música, el colegio abre sus puertas a toda la " +
    "comunidad para celebrar el Expresarte: una muestra que reúne producciones musicales y " +
    "trabajos de Plástica de nivel primario, secundario y egresados. Coros, solistas y " +
    "ensambles suben al escenario, mientras se exponen las obras plásticas del año: una " +
    "celebración de la música y el arte como parte esencial de la formación de nuestros alumnos.",

  subTitulo3: "Familienfest",
  parrafo3:
    "El Familienfest es el gran encuentro de familias del colegio: una jornada de convivencia, " +
    "alegría y comunidad que reúne a generaciones enteras de la institución. En 2025 fue el " +
    "marco elegido para celebrar los 70 años de Gartenstadt Schule y los 200 años de amistad " +
    "entre Alemania y Argentina. Vivir este evento es sentirte un rato en Alemania, rodeado de " +
    "su cultura, música, bailes, comida típica y juegos. Es un día muy especial para toda la " +
    "comunidad.",

  subTitulo4: "Musical de Alemán",
  parrafo4:
    "Los alumnos de 1°, 2° y 3er grado son los protagonistas de este musical íntegramente en " +
    "alemán, acompañados por compañeros de grados superiores en las canciones. Un espectáculo " +
    "donde la música y el cuerpo cuentan una historia, y el idioma se vive en escena.",
};

// ---------------------------------------------------------------------------
// /lideres — vista views/departamentos.hbs (3 de las 4 tarjetas) + campo `cierre`.
// Fuente: Google Doc "Líderes" 1z0dv922dZDfJsFi-DU_d0rlunNqwhNa6mcvuG6sHFd8.
// ---------------------------------------------------------------------------

const LIDERES = {
  ruta: "/lideres",
  titulo: "Taller de Líderes",
  saludo: "Crecer, comprometerse y acompañar a los demás",

  subTitulo1: "¿Qué es el Taller de Líderes?",
  parrafo1:
    "El Taller de Líderes es una propuesta pedagógica que comparten muchas escuelas de la " +
    "Comunidad Alemana. Es un espacio de formación y participación destinado a estudiantes de " +
    "5º y 6º año del Nivel Secundario, de carácter optativo. Su propósito es brindarles la " +
    "oportunidad de desarrollar herramientas y vivir experiencias que les permitan crecer como " +
    "personas dentro de la institución, asumiendo responsabilidades y poniendo sus capacidades " +
    "al servicio de los demás, mientras participan activamente de la vida de la comunidad " +
    "educativa.",

  subTitulo2: "Nuestra Propuesta",
  auxText1: "Trabajo en equipo, organización y toma de decisiones",
  auxText2: "Acompañamiento a los estudiantes de Primaria",
  auxText3: "Participación en actos y jornadas institucionales",
  auxText4: "Proyectos solidarios y campañas de donación",

  subTitulo3: "Qué entendemos por liderazgo",
  parrafo3:
    "A lo largo del año, los estudiantes participan en diferentes propuestas que los invitan a " +
    "trabajar en equipo, organizar actividades, tomar decisiones, acompañar a otros, resolver " +
    "situaciones y asumir compromisos. Entendemos el liderazgo no solamente como la capacidad " +
    "de estar al frente de un grupo, sino también como la posibilidad de escuchar, acompañar, " +
    "cuidar, colaborar y generar espacios en los que otros puedan crecer.",

  subTitulo4: "Actividades",

  cardTitulo1: "Acompañamiento a Primaria",
  cardTexto1:
    "Los estudiantes líderes participan en actividades recreativas y deportivas, así como en " +
    "campamentos, junto a los alumnos de la escuela primaria. En estas experiencias colaboran " +
    "en diferentes propuestas y, en distintas ocasiones, asumen el rol de referentes y " +
    "acompañantes de los más chicos, desarrollando empatía, comunicación, responsabilidad y la " +
    "capacidad de trabajar con grupos de diferentes edades.",

  cardTitulo2: "Vida Institucional",
  cardTexto2:
    "Participan y colaboran en actos y jornadas especiales, donde tienen la oportunidad de " +
    "involucrarse en la organización, asumir tareas y responsabilidades, y aportar activamente " +
    "a la vida cotidiana de la institución.",

  cardTitulo3: "Proyectos Solidarios",
  cardTexto3:
    "Los estudiantes identifican necesidades y llevan adelante acciones concretas orientadas a " +
    "ayudar a otros: recolectan y clasifican las donaciones que se reciben durante las campañas " +
    "solidarias —alimentos, juguetes, ropa y otros elementos— que luego son entregados a " +
    "quienes los necesitan.",

  cierre:
    "En todas estas propuestas, buscamos que los estudiantes puedan aprender haciendo, " +
    "reflexionar sobre sus experiencias y descubrir sus propias fortalezas, así como también " +
    "aquellos aspectos que pueden seguir desarrollando. El Taller de Líderes es un espacio para " +
    "crecer, compartir, asumir desafíos y aprender a poner las propias capacidades al servicio " +
    "de los demás. A través de estas experiencias, buscamos acompañar a nuestros estudiantes en " +
    "el desarrollo de un liderazgo responsable, comprometido, empático y solidario, que puedan " +
    "llevar no solo a las actividades del colegio, sino también a los distintos ámbitos de sus " +
    "vidas.",
};

// ---------------------------------------------------------------------------
// /escuela-para-familias — vista views/departamentos.hbs + campo `cierre`.
// Fuente: Google Doc "Escuela para Familias" 1NolF3B8QZJceaCyQDcAhBy3UYyNwjjRUDmZUk33Ll74.
// parrafo3 son dos párrafos del doc: van separados con <br><br> porque la vista los
// renderiza con triple llave ({{{textos.parrafo3}}}), o sea sin escapar el HTML.
// ---------------------------------------------------------------------------

const ESCUELA_PARA_FAMILIAS = {
  ruta: "/escuela-para-familias",
  titulo: "Escuela para Familias",
  saludo: "Construyendo juntos el camino de educar",

  subTitulo1: "¿Qué es Escuela para Familias?",
  parrafo1:
    "Escuela para Familias es un espacio de encuentro, reflexión y aprendizaje compartido entre " +
    "la escuela y las familias. Surge con el propósito de fortalecer los vínculos, acompañar " +
    "los desafíos de la crianza y generar herramientas que permitan afrontar, de manera " +
    "conjunta, las distintas situaciones que atraviesan niños, niñas y adolescentes en su " +
    "desarrollo.",

  subTitulo2: "Nuestra Propuesta",
  auxText1:
    "Encuentros con profesionales especializados sobre crianza, límites, emociones y vínculos.",
  auxText2: "Modalidad presencial y virtual, abierta a los tres niveles.",
  auxText3: "Grupo de WhatsApp con recursos, notas y recomendaciones.",
  auxText4: "Espacio pensado junto a la Dirección General del colegio.",

  subTitulo3: "¿Por qué existe este espacio?",
  parrafo3:
    "Este proyecto fue pensado junto a Alejandro, Director General de la institución, con la " +
    "convicción de volver a acercar a las familias a la escuela y fortalecer el trabajo en " +
    "equipo. Creemos que educar es una tarea compartida: la escuela no puede sola sin las " +
    "familias, así como las familias tampoco pueden solas sin el acompañamiento de la escuela. " +
    "Por eso, buscamos generar espacios de diálogo, escucha y construcción conjunta que " +
    "permitan acompañar mejor a nuestros estudiantes en cada etapa de su crecimiento." +
    "<br><br>" +
    "Porque cuando familia y escuela trabajan de manera articulada, los chicos reciben mensajes " +
    "coherentes, se sienten más acompañados y encuentran adultos disponibles para orientarlos. " +
    "Estos espacios permiten compartir preocupaciones, intercambiar experiencias, encontrar " +
    "respuestas a desafíos cotidianos y fortalecer una comunidad educativa basada en el " +
    "respeto, la confianza y el compromiso mutuo.",

  subTitulo4: "Actividades",

  cardTitulo1: "Temas que Trabajamos",
  cardTexto1:
    "Los encuentros abordan temáticas actuales y significativas para las familias: crianza y " +
    "acompañamiento de los hijos, límites y normas, regulación emocional, la importancia del " +
    "juego, convivencia y vínculos saludables, acoso escolar, consumos problemáticos, uso de " +
    "pantallas y tecnoadicciones, entre otros temas vinculados al bienestar integral. Para cada " +
    "temática se convocan profesionales especializados y referentes destacados, quienes aportan " +
    "herramientas, conocimientos y propuestas de reflexión.",

  cardTitulo2: "Modalidad y Participación",
  cardTexto2:
    "Escuela para Familias está destinada a las familias de los tres niveles de la institución. " +
    "Los encuentros se realizan tanto en formato presencial como virtual para facilitar la " +
    "participación de todos. Además, contamos con un grupo de WhatsApp a través del cual " +
    "compartimos información de interés, reels educativos, notas periodísticas, recomendaciones " +
    "de libros, películas y otros recursos que complementan los temas trabajados.",

  cardTitulo3: "Qué se Llevan las Familias",
  cardTexto3:
    "Nuestro deseo es que cada familia se retire con nuevas herramientas para acompañar a sus " +
    "hijos, con la tranquilidad de saber que no están solos en los desafíos de la crianza y con " +
    "la certeza de que escuela y familia forman un mismo equipo. Queremos que cada encuentro " +
    "sea una oportunidad para reflexionar, aprender, compartir experiencias y fortalecer una " +
    "red de apoyo que beneficie a toda la comunidad educativa.",

  cierre:
    "Porque educar es una tarea colectiva y, cuando trabajamos juntos, podemos brindar a " +
    "nuestros estudiantes las mejores oportunidades para crecer y desarrollarse plenamente.",
};

// ---------------------------------------------------------------------------
// /examenes-internacionales — vista propia views/examenes-internacionales.hbs.
// Fuente: Google Doc "Exámenes Internacionales" 1DzaIi6BhH3pl3ngacCuRQsHetyBk3WgWLTb0pbusPrM.
// Son 9 tarjetas separadas en dos grupos (Alemán 1-6, Inglés 7-9) y 9 bullets en la sección
// amarilla: por eso auxText1..9 y cardTitulo1..9, campos que departamentos.hbs no tiene.
// ---------------------------------------------------------------------------

const EXAMENES_INTERNACIONALES = {
  ruta: "/examenes-internacionales",
  titulo: "Exámenes Internacionales",
  saludo: "Certificaciones que abren puertas en el mundo",

  subTitulo1: "Certificaciones que abren puertas",
  parrafo1:
    "¿Qué significa estudiar en una escuela alemana? No es solo aprender un idioma: es ingresar " +
    "a una comunidad global de excelencia académica, acceder a certificaciones reconocidas en " +
    "las mejores universidades del mundo, y desarrollar una forma de pensar rigurosa y crítica " +
    "en más de un idioma. En Gartenstadt Schule, nuestros estudiantes rinden exámenes " +
    "internacionales tanto en inglés como en alemán a lo largo de toda su escolaridad: un " +
    "camino que comienza en primaria y se profundiza durante toda la Secundaria, hasta culminar " +
    "con certificaciones que abren puertas que otras propuestas bilingües no pueden abrir.",

  subTitulo2: "Nuestra Propuesta",
  auxText1: "Inglés: A2 Key for Schools (Cambridge) — 6° grado de Primaria",
  auxText2: "Inglés: B1 Preliminary for Schools — 2° año de Secundaria",
  auxText3: "Inglés: B2 First for Schools — 4° año de Secundaria",
  auxText4: "Inglés: C1 Advanced — 6° año de Secundaria",
  auxText5: "Alemán: IVA 1 — Primaria (9-10 años)",
  auxText6: "Alemán: Gartenstadt Diplom — 6° grado de Primaria",
  auxText7: "Alemán: Sprachdiplom A2 — 1er año de Secundaria",
  auxText8: "Alemán: Sprachdiplom B1 — 3er año de Secundaria",
  auxText9: "Alemán: Sprachdiplom B2/C1 — 6° año de Secundaria (agosto-septiembre)",

  subTitulo3: "Dos certificaciones, un mismo camino de excelencia",
  parrafo3:
    "<strong>Alemán: ¿Qué es el Sprachdiplom?</strong> Desde la primaria hasta el sexto año, " +
    "nuestros alumnos transitan un camino de inmersión sostenida en la lengua alemana: seis " +
    "horas semanales durante los doce años de escolaridad. Este es el fundamento sobre el que " +
    "construimos el Sprachdiplom der Kultusministerkonferenz (KMK), el diploma oficial de " +
    "competencia en alemán certificado por la Conferencia de Ministros de Educación de " +
    "Alemania. A diferencia de otros certificados, es un examen riguroso que evalúa " +
    "competencias lingüísticas de nivel académico: nuestros alumnos rinden nivel A2 al " +
    "finalizar primer año, B1 en tercer año, y B2/C1 entre agosto y septiembre de sexto año. " +
    "Cada examen es diseñado y validado directamente por organismos alemanes.",
  parrafo3b:
    "<strong>Inglés: Cambridge en la Secundaria.</strong> La enseñanza del inglés incluye la " +
    "preparación para los exámenes internacionales de la Universidad de Cambridge, como parte " +
    "del recorrido académico del Nivel Secundario. A lo largo de la Secundaria, los alumnos se " +
    "preparan para B1 Preliminary for Schools en 2° año, B2 First for Schools en 4° año, y C1 " +
    "Advanced en 6° año. Cada examen se aborda a lo largo de dos años de preparación, en los " +
    "que los estudiantes desarrollan y consolidan progresivamente las habilidades necesarias " +
    "para alcanzar el nivel correspondiente.",

  subTitulo4: "Actividades",
  grupo1: "Alemán",
  grupo2: "Inglés",

  cardTitulo1: "IVA 1",
  cardTexto1:
    "Es una evaluación estandarizada elaborada por la Zentralstelle für das Auslandsschulwesen " +
    "(ZfA) de Alemania, diseñada especialmente para alumnos de escuela primaria entre 9 y 10 " +
    "años que aprenden alemán como lengua extranjera. Evalúa el dominio del idioma en un nivel " +
    "equivalente al A1 / A1+ del Marco Común Europeo de Referencia, bajo parámetros " +
    "internacionales y pedagógicos unificados. Es el primer paso, cercano y amigable, en la " +
    "trayectoria de certificaciones internacionales de alemán, y fortalece la confianza de los " +
    "chicos al rendir exámenes.",

  cardTitulo2: "Gartenstadt Diplom",
  cardTexto2:
    "Es una instancia clave para los alumnos de 6to grado, alcanzada al finalizar la escuela " +
    "primaria. Funciona como cierre pedagógico del nivel y como puente directo hacia los " +
    "exámenes internacionales del nivel secundario, como el Deutsches Sprachdiplom (DSD I). Es " +
    "un examen interno, diseñado y preparado por nuestro equipo docente del Departamento de " +
    "Alemán, para evaluar el nivel de idioma alcanzado por los alumnos al concluir la educación " +
    "primaria.",

  cardTitulo3: "Red de Escuelas Alemanas de Élite",
  cardTexto3:
    "Gartenstadt Schule forma parte de AGDS (Arbeitsgemeinschaft Deutscher Schulen), la red de " +
    "escuelas alemanas en Argentina. Esta comunidad integra instituciones que responden a " +
    "criterios de calidad establecidos por la ZfA (Zentrale Stelle für Auslandsschulwesen), la " +
    "agencia del Ministerio Federal de Educación Alemán que supervisa y acompaña a las escuelas " +
    "alemanas en el extranjero. No es una opción disponible en cualquier colegio: el " +
    "Sprachdiplom es el sello de calidad que define a las escuelas alemanas genuinas y las " +
    "distingue radicalmente de otras propuestas bilingües.",

  cardTitulo4: "Currículo y Docentes DaF",
  cardTexto4:
    "Nuestra propuesta pedagógica se estructura en torno a la construcción progresiva de " +
    "competencias lingüísticas y culturales. El currículo es diseñado por especialistas que " +
    "dosifican complejidad, integran contenidos académicos con dominio idiomático, y respetan " +
    "ritmos de adquisición lingüística documentados, respondiendo a marcos europeos de " +
    "referencia validados internacionalmente. Docentes enviados desde Alemania por la ZfA " +
    "—formados en metodologías DaF (Alemán como Lengua Extranjera)— aplican enfoques " +
    "comunicativos y reflexivos que transforman el idioma en instrumento de pensamiento crítico.",

  cardTitulo5: "Supervisión Internacional",
  cardTexto5:
    "Un asesor especializado enviado por ZfA para la Argentina realiza supervisión pedagógica " +
    "permanente, acompañamiento curricular y evaluación de la enseñanza del alemán en nuestras " +
    "aulas. Su mirada crítica y sus recomendaciones garantizan que nuestra propuesta responde a " +
    "estándares alemanes inquebrantables y se ajusta continuamente a criterios internacionales.",

  cardTitulo6: "Doce Años de Inmersión",
  cardTexto6:
    "Los doce años de inmersión construyen una relación profunda con el idioma, su cultura y " +
    "sus contextos académicos. Los alumnos desarrollan la capacidad de pensar, argumentar y " +
    "crear en alemán, herramienta que abre puertas en universidades de élite en Alemania, " +
    "Austria, Suiza y más allá. Intercambios con escuelas alemanas, competencias académicas y " +
    "proyectos en lengua alemana complementan esta experiencia, transformando el aprendizaje en " +
    "una vivencia global.",

  cardTitulo7: "Grupos Reducidos y Preparación Personalizada",
  cardTexto7:
    "Las clases de preparación se organizan en grupos reducidos, lo que permite un trabajo " +
    "personalizado y un seguimiento cercano de cada estudiante. Los docentes trabajan con " +
    "materiales de examen actualizados, recursos tecnológicos y diversas propuestas de práctica " +
    "que permiten desarrollar las distintas habilidades lingüísticas y afianzar los " +
    "conocimientos adquiridos.",

  cardTitulo8: "Práctica y Estrategia de Examen",
  cardTexto8:
    "Durante el último año de preparación, los estudiantes realizan prácticas específicas de " +
    "examen para familiarizarse con los distintos tipos de actividades, consignas y formatos, y " +
    "para desarrollar estrategias que les permitan desenvolverse con mayor seguridad y " +
    "administrar adecuadamente los tiempos. La decisión de que un estudiante se presente a " +
    "rendir se toma en conjunto entre la escuela y la familia, teniendo en cuenta su " +
    "trayectoria, desempeño y nivel de preparación.",

  cardTitulo9: "Sede Examinadora Cambridge",
  cardTexto9:
    "Nuestra institución es sede abierta de los exámenes internacionales de Cambridge desde " +
    "hace varios años. Esto permite que nuestros estudiantes puedan rendir en su propia " +
    "escuela, en un espacio conocido y con el acompañamiento de la institución durante todo el " +
    "proceso.",

  cierre:
    "Es el privilegio de pertenecer a una comunidad internacional de aprendizaje respaldada por " +
    "décadas de excelencia educativa. Las certificaciones de Cambridge y el Sprachdiplom " +
    "constituyen una forma de acreditar internacionalmente el nivel de dominio del idioma " +
    "alcanzado por los estudiantes, y son una herramienta valiosa para futuras instancias " +
    "académicas y profesionales.",
};

const PAGINAS = [
  { punto: "B.2", doc: EVENTOS },
  { punto: "B.5", doc: LIDERES },
  { punto: "B.5", doc: ESCUELA_PARA_FAMILIAS },
  { punto: "B.8", doc: EXAMENES_INTERNACIONALES },
];

// Correcciones de un valor ya cargado. Sólo se pisa si el valor actual es EXACTAMENTE `de`.
const CORRECCIONES = [
  {
    punto: "C.4",
    ruta: "/deutsch",
    campo: "cardTitulo2",
    de: "Laternefest",
    a: "Laternenfest",
  },
];

// B.6 — /alumnos-intercambio se publicó con 7 carteles de "FOTO PENDIENTE" a la vista.
// Las vistas ahora dibujan la foto sólo si el campo existe, pero eso no alcanza: el
// documento que ya está en la base TIENE el placeholder cargado en los 7 campos, así que
// se seguiría viendo. Acá se borran esos campos ($unset), y SÓLO si valen exactamente el
// placeholder: si alguien ya cargó una foto de verdad, no se toca.
const PLACEHOLDER_FOTO = "/img/placeholder-foto-pendiente.svg";

const LIMPIEZAS = [
  {
    punto: "B.6",
    ruta: "/alumnos-intercambio",
    campos: [
      "imageTop",
      "cardImage1",
      "cardImage2",
      "cardImage3",
      "cardImage4",
      "cardImage5",
      "cardImage6",
    ],
    valor: PLACEHOLDER_FOTO,
  },
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

/**
 * Una corrección pisa un valor existente, pero SÓLO si es exactamente el que esperamos.
 *   corrige    : está el valor viejo -> se reemplaza.
 *   ya-aplicado: ya dice lo nuevo.
 *   distinto   : dice otra cosa (alguien lo editó) -> no se toca.
 *   sin-doc    : no existe el documento.
 */
function planificarCorreccion(docExistente, { campo, de, a }) {
  if (!docExistente) return { estado: "sin-doc" };
  const actual = docExistente[campo];
  if (String(actual) === String(a)) return { estado: "ya-aplicado" };
  if (String(actual) === String(de)) return { estado: "corrige", valor: a };
  return { estado: "distinto", actual: String(actual) };
}

/**
 * Devuelve los campos a borrar: los que valen exactamente el placeholder. Un campo que ya
 * no está, o que tiene una foto de verdad, queda afuera.
 */
function planificarLimpieza(docExistente, { campos, valor }) {
  if (!docExistente) return { borrar: [], conservar: [] };
  const borrar = [];
  const conservar = [];
  for (const campo of campos) {
    const actual = docExistente[campo];
    if (actual === undefined || actual === null) continue;
    if (String(actual) === String(valor)) borrar.push(campo);
    else conservar.push({ campo, actual: String(actual) });
  }
  return { borrar, conservar };
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

  const resumen = {
    creados: 0,
    camposEscritos: 0,
    yaAplicados: 0,
    inesperados: 0,
    corregidos: 0,
    limpiados: 0,
  };

  for (const { punto, doc } of PAGINAS) {
    const existente = await db.collection("pages").findOne({ ruta: doc.ruta });
    const plan = planificar(existente, doc);
    console.log(`[${punto}] ${doc.ruta}`);

    if (plan.accion === "crear") {
      console.log(
        `   NO existe el documento. Se CREA con ${plan.campos} campos.`
      );
      console.log(`   titulo: ${JSON.stringify(doc.titulo)}`);
      console.log(
        "   sin campos de imagen: las fotos están en Drive y no se pudieron bajar"
      );
      if (APPLY) {
        await db
          .collection("pages")
          .insertOne({ ...doc, updatedAt: new Date() });
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
    if (nEscribir)
      console.log(`   se completan: ${Object.keys(plan.aEscribir).join(", ")}`);
    for (const i of plan.inesperados) {
      console.log(
        `   OJO: ${i.campo} ya tiene otro valor, NO se toca -> ` +
          `${JSON.stringify(i.actual.slice(0, 120))}`
      );
    }
    if (APPLY && nEscribir) {
      await db
        .collection("pages")
        .updateOne(
          { ruta: doc.ruta },
          { $set: { ...plan.aEscribir, updatedAt: new Date() } }
        );
    }
    resumen.camposEscritos += nEscribir;
    resumen.yaAplicados += plan.yaAplicados.length;
    resumen.inesperados += plan.inesperados.length;
    console.log("");
  }

  for (const corr of CORRECCIONES) {
    const existente = await db.collection("pages").findOne({ ruta: corr.ruta });
    const plan = planificarCorreccion(existente, corr);
    console.log(`[${corr.punto}] ${corr.ruta} . ${corr.campo}`);
    if (plan.estado === "corrige") {
      console.log(`   ${JSON.stringify(corr.de)} -> ${JSON.stringify(corr.a)}`);
      if (APPLY) {
        await db.collection("pages").updateOne(
          { ruta: corr.ruta },
          { $set: { [corr.campo]: corr.a, updatedAt: new Date() } }
        );
      }
      resumen.corregidos++;
    } else if (plan.estado === "ya-aplicado") {
      console.log("   ya aplicado");
      resumen.yaAplicados++;
    } else if (plan.estado === "sin-doc") {
      console.log("   OJO: no existe el documento, no se toca");
      resumen.inesperados++;
    } else {
      console.log(
        `   OJO: dice otra cosa, NO se toca -> ${JSON.stringify(plan.actual)}`
      );
      resumen.inesperados++;
    }
    console.log("");
  }

  for (const limp of LIMPIEZAS) {
    const existente = await db.collection("pages").findOne({ ruta: limp.ruta });
    const plan = planificarLimpieza(existente, limp);
    console.log(`[${limp.punto}] ${limp.ruta} — placeholders de foto`);
    if (!existente) {
      console.log("   no existe el documento, nada que limpiar");
    } else if (!plan.borrar.length) {
      console.log("   no hay placeholders cargados");
    } else {
      console.log(`   se BORRAN ${plan.borrar.length} campos: ${plan.borrar.join(", ")}`);
      if (APPLY) {
        const unset = Object.fromEntries(plan.borrar.map((c) => [c, ""]));
        await db
          .collection("pages")
          .updateOne(
            { ruta: limp.ruta },
            { $unset: unset, $set: { updatedAt: new Date() } }
          );
      }
      resumen.limpiados += plan.borrar.length;
    }
    for (const c of plan.conservar) {
      console.log(`   se conserva ${c.campo}: ${JSON.stringify(c.actual.slice(0, 80))}`);
    }
    console.log("");
  }

  console.log("---------------------------------------------");
  console.log(
    `Documentos a crear: ${resumen.creados} | campos a completar: ${resumen.camposEscritos} | ` +
      `correcciones: ${resumen.corregidos} | placeholders borrados: ${resumen.limpiados} | ` +
      `ya aplicados: ${resumen.yaAplicados} | inesperados: ${resumen.inesperados}`
  );
  if (!APPLY) {
    console.log(
      "Fue un dry-run. Para escribir: node scripts/2026-09-contenido-auditoria.js --apply"
    );
  }

  await mongoose.disconnect();
}

module.exports = {
  EVENTOS,
  LIDERES,
  ESCUELA_PARA_FAMILIAS,
  EXAMENES_INTERNACIONALES,
  PAGINAS,
  CORRECCIONES,
  LIMPIEZAS,
  PLACEHOLDER_FOTO,
  decidirCampo,
  planificar,
  planificarCorreccion,
  planificarLimpieza,
};

if (require.main === module) {
  main().catch((e) => {
    console.error("ERROR:", e.message);
    process.exit(1);
  });
}
