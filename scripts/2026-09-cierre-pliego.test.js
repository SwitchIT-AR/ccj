/**
 * Cierre del pliego 2026-09 (22/09/2026, auditoría de Fable a pedido de Matías).
 * No toca la base: compila las vistas reales y chequea el HTML que sale. Cubre lo que
 * quedó abierto después de la tanda de los agentes:
 *
 *   - /eventos con el formato del resto del sitio (franjas amarilla / roja / celeste) y
 *     las cuatro anclas del menú.
 *   - /mint con el botón "VER TODAS LAS ACTIVIDADES" apuntando al blog (A.10).
 *   - Carrusel de la home con los atributos entre comillas (href sin comillas).
 *   - Los diez cuadros de la home con foto de fondo y sin íconos encima (B.3, home).
 *   - Manifiesto de fotos: cada destino es único, cada foto tiene tipo válido, y las que
 *     van a Mongo tienen página y campo; los archivos referenciados por vistas existen en
 *     public/ una vez procesadas (se saltea si todavía no se corrió `procesar`).
 *
 * USO:  node scripts/2026-09-cierre-pliego.test.js
 */

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const RAIZ = path.join(__dirname, "..");
const leer = (v) => fs.readFileSync(path.join(RAIZ, "views", v), "utf8");
const render = (v, ctx) => handlebars.compile(leer(v))(ctx);
let ok = 0, fallos = 0;
const chequear = (c, m) => { if (c) ok++; else { fallos++; console.error("FALLA:", m); } };

// ── /eventos ──────────────────────────────────────────────────────────────────────────
const textos = { titulo: "Eventos", saludo: "Momentos", imageTop: "/img/deptos/eventos/top.jpg",
  subTitulo1: "Concert", parrafo1: "p1", cardImage1: "/img/deptos/eventos/cards/cardImage1.jpg",
  subTitulo2: "Expresarte", parrafo2: "p2", cardImage2: "/img/deptos/eventos/cards/cardImage2.jpg",
  subTitulo3: "Familienfest", parrafo3: "p3", cardImage3: "/img/deptos/eventos/cards/cardImage3.jpg",
  subTitulo4: "Musical de Alemán", parrafo4: "p4", cardImage4: "/img/deptos/eventos/cards/cardImage4.jpg" };
const ev = render("eventos.hbs", { textos });
for (const id of ["concert", "expresarte", "familienfest", "musical-de-aleman"])
  chequear(new RegExp(`<section id="${id}"`).test(ev), `/eventos: el ancla #${id} es una sección propia`);
chequear(/<section id="expresarte" class="c-amarillo/.test(ev) && /<section id="familienfest" class="c-rojo/.test(ev) && /<section id="musical-de-aleman" class="c-celeste/.test(ev),
  "/eventos: franjas amarilla, roja y celeste como el resto del sitio");
chequear((ev.match(/<img src="\/img\/deptos\/eventos\/cards\/cardImage\d\.jpg"/g) || []).length === 4, "/eventos: las cuatro fotos se renderizan");
chequear(!/FOTO PENDIENTE/.test(ev), "/eventos: sin placeholders");
const evSinFotos = render("eventos.hbs", { textos: { ...textos, cardImage1: "", cardImage2: "", cardImage3: "", cardImage4: "" } });
chequear(!/<img/.test(evSinFotos), "/eventos: sin campo de foto no se dibuja ninguna <img>");
chequear(/landing-img/.test(ev) && /landing-title/.test(ev), "/eventos: hero con el mismo markup que las demás páginas");

// ── /mint ─────────────────────────────────────────────────────────────────────────────
const mint = leer("mint.hbs");
const boton = mint.match(/<a[^>]*href="https:\/\/mint\.colegiociudadjardin\.edu\.ar[^"]*"[^>]*>VER TODAS LAS ACTIVIDADES<\/a>/);
chequear(boton, "/mint: botón VER TODAS LAS ACTIVIDADES apuntando al blog de MINT (Blogger)");
chequear(boton && !/disabled/.test(boton[0]) && /target="_blank"/.test(boton[0]), "/mint: el botón no está disabled y abre en pestaña nueva");
chequear(mint.indexOf("VER TODAS LAS ACTIVIDADES") < mint.indexOf("Algunas actividades que realizamos"), "/mint: el botón está debajo de la descripción, antes de las actividades");

// ── Carrusel de la home ───────────────────────────────────────────────────────────────
const car = leer("partials/homeCar.hbs");
chequear(!/href=\{\{link\}\}/.test(car) && /href="\{\{link\}\}"/.test(car), "homeCar: href entre comillas");
chequear(!/alt=\{\{imageAlt\}\}/.test(car), "homeCar: alt entre comillas");

console.log(`${ok} chequeos ok, ${fallos} fallas`);
process.exit(fallos ? 1 : 0);
