# Cambios que NO están en el código (viven en MongoDB) — pliego 2026-09, puntos A.1 a A.6

Los textos de las páginas de nivel y departamento, y los slides de la home, no están en las
plantillas: están en MongoDB Atlas, base `ccj-registros`, colecciones `pages` y `slides`.
Por eso los puntos A.1, A.3, A.4, A.5 y A.6 del pliego no se resuelven con un cambio de código.

Hay dos caminos, y **cualquiera de los dos alcanza**: el script o el editor web. Ninguno de los
dos se ejecutó todavía: este PR sólo deja el cambio de código y el script listo para correr.

---

## Camino 1 (recomendado) — script idempotente

```bash
# en el server donde corre la web, parado en la raíz del proyecto
export MONGODB_URI='...'                                   # la misma que usa la app
node --no-deprecation scripts/2026-09-textos-a1-a8.js           # DRY-RUN: no escribe nada
node --no-deprecation scripts/2026-09-textos-a1-a8.js --apply   # escribe
```

- Sin `--apply` no toca la base: sólo imprime qué cambiaría.
- Es idempotente: si ya se corrió, la segunda vez dice "ya aplicado" y no escribe.
- Si alguien editó un texto por `/pagesEdit` desde que se armó el PR, el script **no lo pisa**:
  avisa "no tiene el valor esperado" y lo saltea.
- Usar `--no-deprecation`: Node imprime un warning que incluye la cadena de conexión completa
  (con usuario y contraseña) y no conviene que eso quede en los logs.
- Los cambios no requieren reiniciar la app: los textos se leen de Mongo en cada request.

Test de la lógica (no necesita base ni red):

```bash
node scripts/2026-09-textos-a1-a8.test.js
```

## Camino 2 — a mano, por los editores web

- `/pagesEdit/nivel/inicial`, `/pagesEdit/nivel/primaria`, `/pagesEdit/nivel/secundaria`
- `/pagesEdit/depto/deutsch`, `/pagesEdit/depto/orientacion`
- Los slides de la home no tienen editor de texto: el A.1 se hace sí o sí por script/base.

---

## Detalle de cada cambio

| Punto | Colección | Documento | Campo | Dice hoy | Tiene que decir |
|---|---|---|---|---|---|
| A.1 | `slides` | `_id 62c6fa1e06fccc835e170550` (el slide "Recorre el colegio", `order: 1`) | `link` | `https://youtu.be/_GkA_9xwtIE?feature=shared` | `https://youtu.be/pdT2uUJKkRk` |
| A.3 | `pages` | `ruta: /inicial` | `parrafo1` | `...enseñar con profesionalismo.”` | `...enseñar con profesionalismo”.` |
| A.4 | `pages` | `ruta: /primaria` | `parrafo2` | "En cuanto al alemán... **seis horas semanales**" | "En cuanto a la carga horaria de idiomas... **9 horas semanales de 1º a 4º grado y 11 horas semanales en 5º y 6º**" |
| A.4 | `pages` | `ruta: /inicial` | `parrafo2` | (sin carga horaria) | se agrega: 5 estímulos en salas de 5 y 4, 4 estímulos en salas de 3, 2 estímulos en sala de 2 |
| A.4 | `pages` | `ruta: /secundaria` | `parrafo2` | (sin carga horaria) | se agrega: 8 hs semanales de 1º a 3er año y 6 hs de 4to a 6to |
| A.5 | `pages` | `ruta: /orientacion` | `cardTitulo1` | `Orientación Vocacional:` | `Orientación Vocacional` |
| A.5 | `pages` | `ruta: /orientacion` | `cardTitulo2` | `Convivecias` | `Convivencias` |
| A.6 | `pages` | `ruta: /deutsch` | `cardTitulo1` | `ExpoAlemania` | `Musical de Alemán` |
| A.6 | `pages` | `ruta: /deutsch` | `cardTitulo3` | `Schüler Austausch ` | `Schüleraustausch` |
| A.6 | `pages` | `ruta: /deutsch` | `cardTitulo4` | `Schüler Austausch ` (repetida) | `Familienfest` |

Los valores de la columna "Dice hoy" se leyeron de la base el 21/09/2026 con una consulta de
sólo lectura, y el dry-run del script los confirmó uno por uno (12 cambios, 0 inesperados).

---

## Fotos de /eventos — hecho el 22/09/2026

Las cinco fotos que Camila dejó en la carpeta de Drive "Eventos" ya están en el repo
(`public/img/deptos/eventos/`) y sus rutas cargadas en el documento `pages` de `/eventos`:

```bash
export MONGODB_URI='...'
node --no-deprecation scripts/2026-09-fotos-eventos.js            # dry-run
node --no-deprecation scripts/2026-09-fotos-eventos.js --apply    # escribe
```

5 campos escritos (`imageTop`, `cardImage1..4`), 0 inesperados; la segunda pasada devuelve
"ya aplicados: 5". El script es idempotente y no pisa una foto que hayan subido por
`/pagesEdit`.

Las fotos están en `public/img/deptos/eventos/` (no en `public/img/eventos/`) a propósito:
es la ruta donde escribe el editor web `/pagesEdit/depto/eventos`, con los mismos nombres de
archivo, así el colegio puede cambiar cualquiera de las cuatro sin tocar la base.

---

## Pendientes / a confirmar con el colegio

1. **A.4 — a qué corresponden las horas.** El pedido dice "horas de inglés/alemán" y da 9 hs
   (1º a 4º) y 11 hs (5º y 6º) para primaria, contra las "seis horas semanales" que hoy figuran
   **sólo para alemán**. Se redactó como carga horaria de **idiomas (alemán + inglés)**. Si el
   colegio confirma que son horas de alemán solas, hay que cambiar la redacción en el script
   antes de correrlo.
2. **A.6 — fotos.** Las tarjetas nuevas de `/deutsch` (Musical de Alemán, Familienfest) siguen
   con las imágenes viejas (`cardImage1` y `cardImage4`). Las fotos en original están en la
   carpeta de Drive "Actualizar fotos" / subcarpeta *Dpto. Alemán*, pero no se descargaron
   todavía. Cuando estén: convertir el HEIC de Familienfest a jpg/webp y subirlas por
   `/pagesEdit/depto/deutsch`, que ya hace el upload de `cardImage1..4`.
3. **A.6 — `cardTitulo2` dice `Laternefest`** y debería ser `Laternenfest` (así figura en el
   inventario de Drive). No está pedido en el pliego, así que no se tocó.
