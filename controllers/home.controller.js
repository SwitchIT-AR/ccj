const homeCtrl = {};
const fs = require("fs");
const path = require("path");
const Slide = require("../models/Slide");

// Tarjetas de la home que tienen foto (ver HOME_CARDS en routes/routes.js). Si el archivo existe,
// el partial no muestra el ícono encima.
const TARJETAS_CON_FOTO = ["mint", "orientacion", "english", "deutsch", "examenes", "classroom"];
const ARCHIVOS_TARJETA = {
  mint: "c-mint.jpg",
  orientacion: "c-orientacion.jpg",
  english: "c-english.jpg",
  deutsch: "c-deutsch.jpg",
  examenes: "c-examenes.jpg",
  classroom: "c-classroom.jpg",
};
function fotosHome() {
  const fotos = {};
  TARJETAS_CON_FOTO.forEach((key) => {
    fotos[key] = fs.existsSync(path.join(__dirname, "../public/img", ARCHIVOS_TARJETA[key]));
  });
  return fotos;
}

homeCtrl.getData = async (req, res) => {
  try {
    const slide = await Slide.find().lean();
    res.render("home", { Slides: slide, fotosHome: fotosHome() });
  } catch (error) {
    console.log("ups", error);
  }
};
homeCtrl.uploadSlide = async (req, res) => {
  res.render("uploadSlide");
};

homeCtrl.editSlide = async (req, res) => {
  const { link, text, imagenAlt, order } = req.body;
  try {
    const slide = {
      link,
      text,
      imagenAlt,
      order,
      imageFhd: req.files[0].filename,
      imageHd: req.files[1].filename,
      image: req.files[2].filename,
    };

    const slideEdited = await Slide.updateOne({ order: order }, slide);
    if (!slideEdited) {
      return res.status(204).json({ message: "slide not found" });
    } else {
      return res
        .status(201)
        .render("uploadSlide", { message: "slide actualizada correctamente" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).render("uploadSlide", { message: "hubo un error" });
  }
};

module.exports = homeCtrl;
