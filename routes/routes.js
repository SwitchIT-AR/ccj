const { Router } = require("express");
const router = Router();
const nodemailer = require("nodemailer");
const path = require("path");
const Matriculado = require("../models/Matriculado");
const Consulta = require("../models/Consulta");
const homeCtrl = require("../controllers/home.controller");
const galeryCtrl = require("../controllers/galery.controller");
const Pages = require("../models/Pages");
const ticketCtrl = require("../controllers/tickets.controller");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/img/car");
  },

  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const storageGalery = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/img/galery");
  },

  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});
const uploadGalery = multer({ storage: storageGalery });

const ruta = path.join(__dirname, "../public/views/");

// rutas del colegio

router.get("/", homeCtrl.getData);
router.get("/index", homeCtrl.getData);
router.get("/api/uploadSlide", homeCtrl.uploadSlide);
router.get("/api/uploadGalery", galeryCtrl.uploadGalery);

//router.post("/api/newSlide", upload.array("images", 3), homeCtrl.createSlide);

router.post(
  "/api/newSlide/:order",
  upload.array("images", 3),
  homeCtrl.editSlide
);

router.get("/fotos/:slide", galeryCtrl.getImages);

router.post(
  "/api/fotos/:slide",
  uploadGalery.array("images", 10),
  galeryCtrl.uploadImages
);

router.get("/login", function (req, res) {
  res.redirect("https://familias.colegiociudadjardin.edu.ar");
});

const routes = [
  { route: "admisiones", view: "admisiones" },
  { route: "deutsch", view: "deutsch" },
  { route: "administracion", view: "administracion" },
  { route: "galeria", view: "galeria" },
  { route: "tour", view: "tour" },
  { route: "cv", view: "curriculum" },
  { route: "orientacion", view: "orientacion" },
  { route: "inicial", view: "inicial" },
  { route: "primaria", view: "primaria" },
  { route: "secundaria", view: "secundaria" },
  { route: "nuestrocolegio", view: "nuestro-colegio" },
  { route: "informatica", view: "informatica" },
  { route: "english", view: "english" },
  { route: "musica", view: "musica" },
  { route: "educacionfisica", view: "ed-fisica" },
  { route: "inicial/actividades", view: "i-actividades" },
  { route: "primaria/actividades", view: "p-actividades" },
  { route: "secundaria/actividades", view: "s-actividades" },
  { route: "covid", view: "covid" },
  { route: "ActoInicial", view: "acto-inicial" },
  { route: "ActoPrimaria", view: "acto-primaria" },
  { route: "ActoSecundaria", view: "acto-secundaria" },
];

routes.forEach((route) => {
  router.get("/" + route.route, async (req, res) => {
    const pagesData = await Pages.find({ ruta: "/" + route.route }).lean();
    res.render(route.view, { textos: pagesData[0], layout: "pages" });
  });
});

router.get("/tickets", ticketCtrl.getTicket);

router.post("/newTicket", ticketCtrl.newTicket);
router.get("/ticketUpdate", ticketCtrl.getOneTicket);
router.put("/:ticketUpdate", ticketCtrl.updateTicket);

const matriculaRoutes = [
  { route: "ig", view: "matriculacion-ig" },
  { route: "goo", view: "matriculacion-goo" },
  { route: "fb", view: "matriculacion-fb" },
  { route: "in", view: "matriculacion-in" },
];

matriculaRoutes.forEach((route) => {
  router.get("/landing/matricula/" + route.route, (req, res) => {
    res.render(route.view, { layout: false });
  });
});

const inicialRoutes = [
  { route: "ig", view: "inicial-ig" },
  { route: "goo", view: "inicial-goo" },
  { route: "fb", view: "inicial-fb" },
  { route: "in", view: "inicial-in" },
];

inicialRoutes.forEach((route) => {
  router.get("/landing/inicial/" + route.route, (req, res) => {
    res.render(route.view, { layout: false });
  });
});

router.post("/landing/matricula", async (req, res) => {
  const {
    nombreApellido,
    nivelEducativo,
    edad,
    institucionProveniente,
    nombrePadre,
    apellidoPadre,
    nombreMadre,
    apellidoMadre,
    direccion,
    telefono,
    mail,
    mensaje,
    como,
    cual,
    red,
  } = req.body;

  if (nombreApellido && mail && edad) {
    contentHtml = `
    <h4>Este es un mensaje autogenerado por el formulario de admisiones, a continuación se detallan los datos del mismo:</h4>
    <p>Nombre del alumno entrante: ${nombreApellido}</p>
    <p>Edad: ${edad}</p>
    <p>Nivel educativo: ${nivelEducativo}</p>
    <p>Institución proveniente: ${institucionProveniente}</p>
    <p>Nombre del Padre: ${nombrePadre + " " + apellidoPadre}</p>
    <p>Nombre de la Madre: ${nombreMadre + " " + apellidoMadre}</p>
    <p>Dirección: ${direccion}</p>
    <p>telefono: ${telefono}</p>
    <p>Correo: ${mail}</p>
    <p>¿Cómo nos conociste?: ${como != "Otro" ? como : "otro, " + cual}</p>
    <p>¿Porque eligieron la institución?: ${mensaje}</p>
    <p>Origen del formulario: ${red}</p>
    `;
    asunto = "Formulario de matriculación - " + nombreApellido;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.CCJ_SMTP_USER,
        pass: process.env.CCJ_SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: "web-form@colegiociudadjardin.edu.ar",
      to: "admision@colegiociudadjardin.edu.ar",
      subject: asunto,
      html: contentHtml,
    });

    await grabarDatos(req.body);

    res.json({
      success: true,
    });
  } else {
    res.json({
      success: false,
    });
  }

  async function grabarDatos(data) {
    const {
      nombreApellido,
      nivelEducativo,
      edad,
      institucionProveniente,
      nombrePadre,
      apellidoPadre,
      nombreMadre,
      apellidoMadre,
      direccion,
      telefono,
      mail,
      mensaje,
      como,
      cual,
      red,
    } = data;

    const datos = {
      nombreApellido,
      nivelEducativo,
      edad,
      institucionProveniente,
      nombrePadre,
      apellidoPadre,
      nombreMadre,
      apellidoMadre,
      direccion,
      telefono,
      mail,
      mensaje,
      como,
      cual,
    };

    const matriculado = new Matriculado({
      red,
      datos,
    });

    await matriculado.save();
  }
});

router.post("/landing/consulta", async (req, res) => {
  const { nombre, tel, mail, red, nivel } = req.body;
  if (nombre && mail && nivel) {
    const contentHtml = `
    <h4>Este es un mensaje autogenerado por los formularios de contacto,
    a continuación se detallan los datos del mismo:</h4>
    <p>Nombre del contacto: ${nombre}</p>
    <p>Correo: ${mail}</p>
    <p>Telefono: ${tel}</p>
    <p>Origen del formulario: ${red}</p>
    <p>Nivel del cual fue enviado: ${nivel}</p>
    `;

    const asunto = "Formulario de consulta - " + nombre;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.CCJ_SMTP_USER,
        pass: process.env.CCJ_SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: "web-form@colegiociudadjardin.edu.ar",
      to: "admision@colegiociudadjardin.edu.ar",
      subject: asunto,
      html: contentHtml,
    });

    await grabarConsulta(req.body);
    res.json({
      success: true,
    });
  } else {
    res.json({
      success: false,
    });
  }

  async function grabarConsulta(data) {
    const { nombre, tel, mail, red, nivel } = data;

    const datos = {
      nombre,
      tel,
      mail,
      nivel,
    };

    const consulta = new Consulta({
      red,
      datos,
    });

    await consulta.save();
  }
});

router.get("/landing/status", (req, res) => {
  res.render("status", { layout: "pages" });
});

router.get("/landing/status/datos", async (req, res) => {
  const datos = await Matriculado.find(
    {},
    {
      _id: 0,
      datos: {
        apellidoMadre: 0,
        apellidoPadre: 0,
        direccion: 0,
        mail: 0,
        mensaje: 0,
        nombreMadre: 0,
        nombrePadre: 0,
        telefono: 0,
        nivelEducativo: 0,
        edad: 0,
      },
    }
  );
  //Comparer Function
  function GetSortOrder(prop) {
    return function (a, b) {
      if (a[prop] > b[prop]) {
        return 1;
      } else if (a[prop] < b[prop]) {
        return -1;
      }
      return 0;
    };
  }
  res.send(datos.sort(GetSortOrder("red")));
});

module.exports = router;
