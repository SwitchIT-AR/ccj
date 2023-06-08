const pagesCtrl = {};
const Pages = require("../models/Pages");

pagesCtrl.getPages = async (req, res) => {
  const ticketsData = await Pages.find().lean();
  res.json(ticketsData);
};

pagesCtrl.getOnePages = async (req, res) => {
  const ticketsData = await Pages.find({ _id: req.query._id }).lean();
  res.json(ticketsData);
};

pagesCtrl.newPages = async (req, res) => {
  try {
    const {
      nivel,
      solicitante,
      tipoProblema,
      descripUser,
      datePages,
      plazoReso,
      compras,
      presupuesto,
      dateEstCompras,
      descripSist,
      dirAprobe,
      dateCompras,
      estimFin,
      dateSolved,
      status,
    } = req.body;
    const ticket = new Pages({
      nivel,
      solicitante,
      tipoProblema,
      descripUser,
      datePages,
      plazoReso,
      compras,
      presupuesto,
      dateEstCompras,
      descripSist,
      dirAprobe,
      dateCompras,
      estimFin,
      dateSolved,
      status,
    });
    await ticket.save();
    return res.status(200).send("todo okay");
  } catch (error) {
    res.status(500).send("There was a problem registering the mate");
  }
};

pagesCtrl.updatePages = async (req, res) => {
  console.log("post.body", req.body);

  const { _id, pagina, ...rest } = req.body;
  console.log("pagina", pagina);
  console.log("req files", req.files);

  // Save images to a folder on the server
  if (req.files && req.files.cardImage1) {
    const image1 = req.files.cardImage1[0];
  }

  if (req.files && req.files.cardImage2) {
    const image2 = req.files.cardImage2[0];
  }

  if (req.files && req.files.cardImage3) {
    const image3 = req.files.cardImage3[0];
  }

  if (req.files && req.files.cardImage4) {
    const image4 = req.files.cardImage4[0];
  }
  try {
    const pageEdit = await Pages.findOneAndUpdate(
      { _id: req.body._id },
      { ...rest },
      {
        new: true,
      }
    );
    if (!pageEdit) {
      return res.status(204).json({ message: "no existe el ticket" });
    } else {
      return res.status(200).render("deptoEdit", {
        message: "los datos fueron guardados",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was a problem editing the mate");
  }
};
module.exports = pagesCtrl;
