# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CCJ is the institutional website for Colegio Ciudad Jardín (a German-Argentine school). Server-rendered Node/Express app using Handlebars templates and MongoDB (Mongoose). No frontend build step, no bundler, no tests — it's a classic monolithic MVC-ish app.

## Commands

- `pnpm install` — install dependencies (pnpm is the package manager per `package.json`; there's also a stale `package-lock.json` from an earlier npm setup — prefer pnpm).
- `pnpm dev` — run with nodemon (auto-restart) for local development.
- `pnpm start` — run with plain `node app.js`.
- Node version pinned via `.node-version`: **14**.
- No test suite, no lint script, no build step exist in this repo.

Required env vars (see `.env`, loaded via `dotenv`): `MONGODB_URI`, `PORT`, `CCJ_SMTP_USER`, `CCJ_SMTP_PASSWORD` (also `SENDGRID_KEY`/`SENDGRID_MAIL` present but not currently referenced in code).

## Architecture

**Entry point**: `app.js` wires everything — Express app setup, `express-handlebars` view engine (`.hbs` extension, `main` layout by default, layouts in `views/layouts`, partials in `views/partials`), sessions (`express-session`, hardcoded secret `"asd"` — not read from config), `connect-flash`, and a long list of `express.static` mounts for `public/` and its subfolders (css, fonts, img, scripts, slick, dist, plugins, views). All routing is delegated to a single router: `routes/routes.js`.

**Routing** (`routes/routes.js`): everything lives in one file.
- Static/CMS-style pages are driven by two lookup tables (`routes` and `matriculaRoutes`/`inicialRoutes` arrays) that map a URL segment to a Handlebars view name, e.g. `{ route: "admisiones", view: "admisiones" }`. For the main `routes` array, each page fetches its own content document from the `Pages` Mongo collection by `ruta` (e.g. `/admisiones`) and renders the view with that data as `textos`, using the `pages` layout. This means several distinct site sections (departamentos, niveles, etc.) reuse the *same* Handlebars view template with different DB-backed content — check the `route`→`view` mapping before assuming a view is only used by one page.
- Content editing for those pages happens through `/pagesEdit/depto/:page` and `/pagesEdit/nivel/:page` (render an edit form) and `POST /pagesEdit/.../pagesUpdate` (persist via `pagesCtrl.updatePages`, using per-purpose `multer` disk storage configs — `storageDeptos`, `storageNiveles` — that save uploaded card images into `public/img/deptos<pagina>/cards/` or `public/img/niveles/cards`, named by form field).
- `/login` and `/admin/login` don't render local views — they redirect to an external subdomain (`https://access.<mainDomain>`), computed by stripping subdomains off `req.hostname`. There's a separate admin app/service (`access.*`) this site defers to for authentication.
- Lead-gen forms (`POST /landing/matricula`, `POST /landing/consulta`) both: validate a couple of required fields, send an email via `nodemailer` (Gmail SMTP, credentials from env), persist a record (`Matriculado` / `Consulta` models — loosely typed, with a free-form `datos: Object` field), and return `{ success: boolean }` as JSON. These are called from static landing-page views (`matriculacion-*`, `inicial-*`, one per ad source: `ig`, `goo`, `fb`, `in`) rendered with `layout: false`.
- `/landing/status` and `/landing/status/datos` (+ a legacy `/datosOld` variant) expose an aggregation over `Matriculado` filtered to `datos.como: "Sitio Web"` — a small internal reporting view of web-sourced leads.
- Slideshow images (`Slide` model) and photo galleries (`Galery` model, keyed by a `title`/`slide` tag) each have their own upload routes/controllers and their own `multer` disk storage config, writing into `public/img/car` and `public/img/galery` respectively.
- Two `router.get`/`put` routes (`/tickets`, `/ticketUpdate`, `/:ticketUpdate`) exist for a `Tickets` model that looks like an internal IT-ticket tracker unrelated to the public site — likely legacy/unused, verify before touching.

**Controllers** (`controllers/*.controller.js`): thin, one file per resource (`home`, `galery`, `pages`, `tickets`) — mostly direct Mongoose calls with try/catch, no service layer or validation layer.

**Models** (`models/*.js`): plain Mongoose schemas, all with `timestamps: true`. `Pages` is the generic CMS schema backing most site sections — a flat bag of optional string fields (`titulo`, `parrafoN`, `cardTituloN`/`cardTextoN`/`cardImgN`, etc.) reused across very different pages, so a given page's view template only uses a subset of `Pages` fields. `Consulta`/`Matriculado` intentionally store form payloads as a loose `datos: Object` rather than a fixed schema.

**Views** (`views/*.hbs`): one `.hbs` per page/variant, no nested feature folders beyond `layouts/`, `partials/`, and `actos/`. Views read data through the `textos`/`Fotos`/`Slides`/`pages` locals passed in from routes/controllers — there's no client-side framework, so anything dynamic in a page is either server-rendered Handlebars or plain jQuery/vanilla JS under `public/scripts` (a `Dashboard` admin theme also lives under `public/Dashboard`).

**Static assets** (`public/`): heavily organized by page/section (`img/deptos`, `img/niveles`, `img/staff`, etc.) — uploaded content-editor images land in these same folders via the multer configs above, so asset paths in `Pages` documents are relative filenames resolved against those static-mounted directories.
