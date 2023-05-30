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
  try {
    const pageEdit = await Pages.findOneAndUpdate(
      { _id: req.body._id },
      req.body,
      {
        new: true,
      }
    );
    if (!pageEdit) {
      return res.status(204).json({ message: "no existe el ticket" });
    } else {
      return res.status(200).render("pages", {
        message: "los datos fueron guardados",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was a problem editing the mate");
  }
};

module.exports = pagesCtrl;
