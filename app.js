require("dotenv").config();
require("./database");
const morgan = require("morgan");
const cors = require("cors");
const config = require("./config");
const express = require("express");
const app = express();
const path = require("path");
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");

app.set("PORT", config.PORT || 3000);
app.set("secret", config.SK);
app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  exphbs.engine({
    layoutsDir: path.join(app.get("views"), "layouts"),
    partials: path.join(app.get("views"), "partials"),
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      // Textarea del editor, un ítem por línea -> lista de textos (ver views/mint.hbs).
      lineas: (texto) =>
        String(texto || "")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean),
      // Igual, pero cada línea es "Título: texto" -> [{ titulo, texto }].
      entradas: (texto) =>
        String(texto || "")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => {
            const i = l.indexOf(":");
            return i === -1
              ? { titulo: "", texto: l }
              : { titulo: l.slice(0, i).trim(), texto: l.slice(i + 1).trim() };
          }),
    },
  })
);
app.set("view engine", ".hbs");

app.use(
  session({
    secret: "asd",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// global
app.use((req, res, next) => {
  res.locals.logData = req.flash("logData");
  next();
});

// rutas estaticas
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/views")));
app.use(express.static(path.join(__dirname, "public/css")));
app.use(express.static(path.join(__dirname, "public/fonts")));
app.use(express.static(path.join(__dirname, "public/img")));
app.use(express.static(path.join(__dirname, "public/scripts")));
app.use(express.static(path.join(__dirname, "public/slick")));
app.use(express.static(path.join(__dirname, "public/dist")));
app.use(express.static(path.join(__dirname, "public/plugins")));
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

// Routes
app.use(require("./routes/routes"));

app.listen(app.get("PORT"), () => {
  console.log(`Server on port: http://localhost:${app.get("PORT")}`);
});
