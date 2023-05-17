const ticketsCtrl = {};
const Tickets = require("../models/Tickets");

ticketsCtrl.getTicket = async (req, res) => {
  const ticketsData = await Tickets.find().lean();
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
  const ticketsData = await Tickets.find().lean();
  res.json(ticketsData);
};

module.exports = ticketsCtrl;
