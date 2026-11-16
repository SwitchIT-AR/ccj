# Textos de alemán en /deutsch y /primaria (pedido 2026-11)

Pedido del colegio ("Nuevos cambios página web"):

- **Dpto. de Alemán** (`/deutsch`):
  - "El Idioma": nuevo segundo párrafo ("En el Nivel Primario, 1.º y 2.º grado…").
  - "Die Sprache": nuevo segundo párrafo ("In der Grundschule steht in der 1. und 2. Klasse…").
  - "Kultur": "in der Primärstufe" pasa a "in der Grundschule". En la página no tiene que quedar
    ningún "Primärstufe".
- **Nivel Primario** (`/primaria`), "El Idioma": bloque nuevo sobre alemán (cuatro subtítulos,
  párrafos y la lista de 4.º y 6.º grado), entre el párrafo de inglés ("…de nivel A2.") y el de
  la carga horaria ("La enseñanza de idiomas acompaña…").

Todo el texto vive en Mongo (`/deutsch` y `/primaria` usan `departamentos.hbs` y `niveles.hbs`),
así que no hay cambios de plantillas.

## MongoDB (`scripts/2026-11-aleman-primaria.js`)

Colección `pages` de `ccj-registros`, 4 campos (dry-run del 16/11/2026):

| Página | Campo | Cambio |
|--------|-------|--------|
| `/deutsch` | `parrafo1` | 2.º párrafo de "El Idioma" y de "Die Sprache" |
| `/deutsch` | `subTitulo4` | "Kultur": Primärstufe -> Grundschule |
| `/deutsch` | `parrafo7` | lo mismo en la copia en texto plano (no se muestra) |
| `/primaria` | `parrafo2` | bloque de alemán |

Marcado: los nuevos párrafos de `/deutsch` mantienen el resaltado amarillo del nivel
(`<span class="c-amarillo">`), como los demás. En `/primaria` los subtítulos van en
`<h5 class="font-weight-bold mt-4">` y cada ítem de la lista lleva un `<p>` adentro: el CSS
agranda los `<p>` (22px en desktop) y no los `<li>`, que sin eso quedaban más chicos.

```bash
# en la raíz del proyecto, con el MONGODB_URI de la app
node --no-deprecation scripts/2026-11-aleman-primaria.js           # DRY-RUN: muestra antes/después
node --no-deprecation scripts/2026-11-aleman-primaria.js --apply   # escribe
node scripts/2026-11-aleman-primaria.test.js                       # test, sin base ni red
```

- Idempotente: la segunda corrida dice "Ya aplicado."
- Si un texto no está como se espera (editado por `/pagesEdit`), avisa "inesperado" y no toca
  ese campo.
- No hace falta reiniciar la app.
- `views/deutsch.hbs` todavía dice "Primärstufe", pero no se renderiza (/deutsch usa
  `departamentos.hbs`). No se tocó.
