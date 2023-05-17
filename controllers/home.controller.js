const homeCtrl = {};
const Slide = require("../models/Slide");

homeCtrl.getData = async (req, res) => {
  try {
    const slide = await Slide.find().lean();
    res.render("home", { Slides: slide });
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
