# "Alumno" pasa a "estudiante" y cambios de Educación Física (pedido 2026-10)

Pedido del colegio:

- En toda la web, "alumno" pasa a "estudiante".
- Educación Física: sacar la última oración de "Actividades deportivas" (desde "Tanto en lo
  referente…" hasta "…la actividad planificada") y reemplazar los textos de las tarjetas
  Torneos / Encuentros y Campamentos.

El texto vive en dos lugares, así que el cambio tiene dos partes.

## 1. Código (este PR)

Plantillas con texto fijo: `nuestro-colegio`, `orientacion`, `admisiones`, las 8 landings
(`matriculacion-*`, `inicial-*`), los footers (`homeFooter`, `footerPages`), `homeNiveles`
(tarjeta "Estudiantes de Intercambio") y el mail interno de matrícula en `routes/routes.js`.

Lo que **no** se cambió, a propósito:

- `id`/`for="alumno"` de los formularios y `getElementById("alumno")`: son técnicos.
- `value="Ex-Alumno"` de "¿Cómo nos conociste?": se guarda en `Matriculado` y lo lee el
  reporte de `/landing/status`. Sólo cambia el texto visible ("Ex Estudiante").
- La URL `/alumnos-intercambio` y sus links: cambiarla rompe links ya publicados.
- `deutsch.hbs`, `musica.hbs`, `homeCuadros.hbs`, `homeModals.hbs`: no se renderizan
  (/deutsch y /musica usan `departamentos.hbs` con texto de Mongo).
- Los comentarios de Handlebars que mencionan la página de intercambio.

Criterio de género: "estudiante" sirve para los dos, así que "alumnos/as", "alumnas y alumnos"
y "los alumnos y las alumnas" quedan como "estudiantes", y "ex alumna" como "ex estudiante".

## 2. MongoDB (`scripts/2026-10-estudiantes.js`)

Colección `pages` de `ccj-registros`: 56 campos en 15 páginas (dry-run del 28/10/2026).
Incluye los tres cambios de `/educacionfisica` (`parrafo2`, `cardTexto2`, `cardTexto3`) y el
título de `/alumnos-intercambio` ("Estudiantes de Intercambio"). No toca `ruta`, `pagina` ni
paths de imágenes. En `slides` no había ningún "alumno".

```bash
# en la raíz del proyecto, con el MONGODB_URI de la app
node --no-deprecation scripts/2026-10-estudiantes.js           # DRY-RUN: muestra antes/después
node --no-deprecation scripts/2026-10-estudiantes.js --apply   # escribe
node scripts/2026-10-estudiantes.test.js                       # test, sin base ni red
```

- Idempotente: la segunda corrida dice "Ya aplicado."
- Los cambios de Educación Física sólo se aplican si el campo tiene el valor esperado; si
  alguien lo editó por `/pagesEdit`, avisa "inesperado" y lo saltea.
- No hace falta reiniciar la app: el texto se lee de Mongo en cada request.
- En la Mac, correrlo con `PATH=/usr/local/bin:$PATH` (Node 16): con Node 26 el driver de
  Mongo falla con "URI malformed".
