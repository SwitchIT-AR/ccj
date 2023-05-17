const ticketsCtrl = {};
const Tickets = require("../models/Tickets");

ticketsCtrl.getTicket = async (req, res) => {
  const ticketsData = await Tickets.find().lean();
  res.json(ticketsData);
};

ticketsCtrl.getOneTicket = async (req, res) => {
  const ticketsData = await Tickets.find({ _id: req.query._id }).lean();
  res.json(ticketsData);
};

ticketsCtrl.newTicket = async (req, res) => {
  try {
    const {
      nivel,
      solicitante,
      tipoProblema,
      descripUser,
      dateTicket,
      plazoReso,
      compras,
      presupuesto,
      descripSist,
      dirAprobe,
      dateCompras,
      estimFin,
      dateSolved,
      status,
    } = req.body;
    const ticket = new Tickets({
      nivel,
      solicitante,
      tipoProblema,
      descripUser,
      dateTicket,
      plazoReso,
      compras,
      presupuesto,
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

ticketsCtrl.updateTicket = async (req, res) => {
  try {
    console.log(req.query);

    const ticketEdit = await Tickets.findOneAndUpdate(
      { _id: req.query._id },
      req.query,
      {
        new: true,
      }
    );
    if (!ticketEdit) {
      return res.status(204).json({ message: "no existe el ticket" });
    } else {
      return res.json(ticketEdit);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was a problem editing the mate");
  }
};

module.exports = ticketsCtrl;
