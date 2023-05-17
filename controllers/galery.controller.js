const galeryCtrl = {};
const Galery = require("../models/Galery");

galeryCtrl.getImages = async (req, res) => {
  try {
    const images = await Galery.find({ title: req.params.slide }).lean();
    const data = images.map(({ url }) => url);
    const url = data.flat();
    res.render("galery", { Fotos: url });
  } catch (error) {
    console.log("ups", error);
  }
};

galeryCtrl.uploadGalery = async (req, res) => {
  try {
    const images = await Galery.find().lean();
    res.render("uploadGalery", { Fotos: images });
  } catch (error) {
    console.log("ups", error);
  }
};

galeryCtrl.uploadImages = async (req, res) => {
  try {
    const url = req.files.map(({ filename }) => ({
      url: filename,
    }));
    console.log(url);
    const data = {
      url: url,
      title: req.params.slide,
    };
    console.log(data);
    const image = new Galery(data);

    await image.save();
    return false;
  } catch (error) {
    res.status(500).send("There was a problem  uploading foto");
  }
};

module.exports = galeryCtrl;
