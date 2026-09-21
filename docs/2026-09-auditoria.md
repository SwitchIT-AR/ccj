# Auditoría de producción del 21/09/2026 — qué estaba roto y qué se arregló

Los PRs #1 (`60279e6`) y #2 (`d088ef2`) aplicaron el pliego "Modificaciones página web" del
Colegio Ciudad Jardín, pero dejaron el sitio con links muertos y páginas vacías. La auditoría
está en `/root/specs/ccj-auditoria-produccion-21sep.md`. Este PR cierra todos sus puntos.

## Las dos causas raíz

1. **Se dio por "bloqueado" material de Drive sin probarlo con el conector.** Se chequeó con
   curl, que no tiene sesión de Google, así que Drive devolvía la página de login y se leyó
   como "sin acceso". Los 4 Google Docs y 3 de las 4 carpetas de fotos estaban accesibles
   todo el tiempo (`/root/specs/ccj-contenido-bloqueado-DESBLOQUEADO.md`). Por eso medio
   pliego se resolvió con placeholders.
2. **Se reportaron puntos como "hechos" verificando sólo que el texto estuviera en el HTML.**
   Un ítem de menú `disabled`, un `href="#"` o un `href` a una ruta que no existe pasan ese
   chequeo y están rotos para el usuario. De ahí que se publicaran una página de Eventos a la
   que no se podía llegar, y una de Alumnos Intercambio que nadie tenía cómo encontrar.

El test nuevo (`scripts/2026-09-auditoria.test.js`) ataca justamente eso: chequea los links,
no el texto. Ningún ítem `disabled`, ningún `href` de menú a una ruta que no esté declarada en
`routes/routes.js`, ningún `href="#"`, y ningún placeholder de foto publicado.

---

## Menús y links (B.1, B.3, B.4, B.5, B.8, C.3)

En las tres barras de navegación — `nav.hbs`, `NavMenu.hbs` (que tiene el menú duplicado) y
`homeMenu.hbs`:

| Qué | Antes | Ahora |
|---|---|---|
| Menú EVENTOS, 5 ítems | `disabled` | habilitados: `/eventos` responde y tiene contenido |
| Schüleraustausch | `/intercambios` → 404, y `disabled` | `/alumnos-intercambio`, habilitado |
| Departamento de Informática | `disabled` en 2 de las 3 barras | habilitado en las tres |
| LÍDERES | `/lideres` → 404, `disabled` | página creada, habilitado |
| Escuela para Familias | `/escuela-para-familias` → 404, `disabled` | página creada, habilitado |
| Ehrentafel | `/mejorpromedio` → 404, `disabled` | **sacado del menú** |
| Exámenes Internacionales | no estaba en el menú | agregado a LA GARTENSTADT |

**Ehrentafel**: no hay página ni contenido, y el pliego no lo pide. Un ítem gris que apunta a
un 404 no aporta nada, así que se saca. Si el colegio quiere el cuadro de honor, es una página
nueva con su contenido.

En la grilla de la home (`homeNiveles.hbs`): el cuadro **Exámenes Internacionales** iba a
`href="#"` y ahora lleva a su página; **Alumnos Intercambio** iba a `href="#"` y ahora lleva a
`/alumnos-intercambio`. También se barrió el `</a>s` suelto del cuadro MINT (C.3), una "s" que
se veía en la home desde el commit `9909e44`.

## Páginas nuevas, con el contenido que ya estaba disponible

- **`/eventos` (B.2)** — tenía un placeholder de "Estamos preparando esta página". Ahora
  renderiza los cuatro eventos del Google Doc, cada uno con su ancla (`#concert`,
  `#expresarte`, `#familienfest`, `#musical-de-aleman`), que son las que usan los menús.
- **`/lideres` y `/escuela-para-familias` (B.5)** — eran 404. Las dos entran tal cual en
  `departamentos.hbs` (3 tarjetas + `cierre`).
- **`/examenes-internacionales` (B.8)** — página nueva. Vista propia porque son **9 tarjetas**
  separadas en dos grupos con subtítulo (Alemán 1-6, Inglés 7-9) y 9 bullets en la sección
  amarilla; `departamentos.hbs` dibuja 4 tarjetas y tiene 4 `auxText`. Como
  `alumnos-intercambio.hbs`, **no hardcodea texto**: lee todo de Mongo.

El contenido lo carga `scripts/2026-09-contenido-auditoria.js`, idempotente y con el mismo
criterio de siempre: crea lo que no existe, completa lo vacío, y **no pisa** nada que tenga
otro valor.

## Páginas en blanco (C.2) — arreglado de raíz

`/actividadesMint` renderizaba una página vacía: la ruta manda a `departamentos.hbs` pero no
hay documento en `pages`. Es el mismo estado en el que estuvo `/informatica` hasta A.12.

Las rutas que sacan **todo** su texto de Mongo llevan ahora `necesitaDoc: true` en el array
`routes` de `routes/routes.js`; sin documento devuelven **404** (`views/404.hbs`) en vez de
servir una página en blanco con header y footer. Las vistas con texto propio (`/mint`,
`/admisiones`, `/staff`, `/nuestrocolegio`, `/cv`, `/administracion`, `/orientacion`) **no**
llevan la marca: nunca leyeron Mongo y un guard las rompería. El test lo verifica en los dos
sentidos.

## Fotos (B.6, B.9) — el único bloqueo que queda es real

`/alumnos-intercambio` se publicó con **7 carteles de "FOTO PENDIENTE"** a la vista de las
familias. Su carpeta de Drive (`1HREh-D-3spdsuX5D_U7T_3Z5GTjca_TC`) es el único recurso que
sigue realmente sin acceso: devuelve vacío también con el conector. **Hay que pedírsela al
colegio.**

Mientras tanto, se cambió el criterio: **una foto que no tenemos no se publica**.

- Las vistas dibujan la imagen sólo si el documento trae el campo (`{{#if textos.cardImageN}}`),
  y los heros caen en una foto del propio sitio.
- En `departamentos.hbs`, además, cada tarjeta se dibuja sólo si tiene título: una página de 3
  tarjetas ya no deja una cuarta tarjeta blanca vacía.
- El script **borra** (`$unset`) los 7 campos de `/alumnos-intercambio` que valen el
  placeholder — la vista sola no alcanzaba, porque el documento que está en la base los tiene
  cargados. Sólo borra si el valor es exactamente el placeholder: una foto de verdad no se toca.

Las fotos de `/eventos`, `/lideres` y `/escuela-para-familias` **sí** están accesibles en
Drive, pero no se pueden bajar a un archivo desde el server: el conector las lee para
mostrarlas, no deja un jpg en disco, y curl contra Drive devuelve la página de login. Quedan
los IDs de las carpetas anotados en el encabezado del script; cuando los archivos estén en
`public/img/deptos/<pagina>/` alcanza con agregar los campos y correr el script de nuevo.
Los HEIC (Familienfest y las 4 de Escuela para Familias) hay que convertirlos a jpg: el
navegador no los renderiza.

Lo mismo vale para B.9 (la foto de fondo del cuadro Eventos de la home): el fondo sigue siendo
`public/img/c-evento.jpg`.

## Otros

- **B.7 — el botón de `/mint`.** Estaba publicado con `href="#"` y `disabled`: un botón que no
  hace nada es peor que no tenerlo. Se saca y queda el bloque comentado en `views/mint.hbs`
  para reponerlo cuando el colegio mande la URL del blog de Blogger.
- **C.1 — la frase colgada de `/nuestrocolegio`.** Decía "Podés conocer más sobre nuestra
  historia entrando al sitio que creó nuestra alumna Guadalupe Sogno", sin destino y sin punto
  final. Se reescribió para que cierre sola, sin perder la mención a la alumna.
- **C.4 — `Laternefest` → `Laternenfest`** en `/deutsch`. Va como corrección del script: pisa
  el valor viejo sólo si dice exactamente "Laternefest".

## Lo que NO se tocó

- `public/img/car/` — imágenes modificadas a mano en producción, fuera de git.
- Las landings `matriculacion-*.hbs` e `inicial-*.hbs`.
- `models/Pages.js` y los editores web `/pagesEdit` (los campos `cardTitulo5..9`,
  `auxText5..9`, `grupo1/2`, `parrafo3b` y `cierre` se editan por script; sigue siendo deuda).
- El código muerto ya reportado: `homeCuadros.hbs`, `deutsch.hbs`, `musica.hbs`.
- **D.1 — `www.colegiociudadjardin.edu.ar` devuelve 502** mientras el apex responde 200. Es
  Cloudflare/DNS, no el código: el registro `www` apunta a un origen que no responde. Queda
  para infraestructura.

## Tests

```bash
node scripts/2026-09-auditoria.test.js          # 261 chequeos — esta tanda (links + contenido)
node scripts/2026-09-render-a12-a13.test.js     #  55 chequeos
node scripts/2026-09-contenido-a12-a13.test.js  #  35 chequeos
node scripts/2026-09-textos-a1-a8.test.js       #  64 chequeos
```

415 chequeos, 0 fallas.

## Deploy

```bash
# en el CT 4100 "WebServer" (nodo managio), /home/sites/ccj
git pull
pm2 restart "ccj 3001"

# y el contenido, una sola vez:
export MONGODB_URI='...'
node --no-deprecation scripts/2026-09-contenido-auditoria.js          # dry-run
node --no-deprecation scripts/2026-09-contenido-auditoria.js --apply
```

**Nada de `checkout` ni `reset --hard`**: `public/img/car` tiene imágenes cambiadas a mano en
producción que no están en git y un reset las pisa.
