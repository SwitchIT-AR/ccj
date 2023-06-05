const { Schema, model } = require("mongoose");

const ticketsSchema = new Schema(
  {
    nivel: String,
    solicitante: String,
    tipoProblema: String,
    descripUser: String,
    dateTicket: Date,
    plazoReso: Date,
    compras: Boolean,
    presupuesto: Number,
    dateEstCompras: Date,
    descripSist: String,
    dirAprobe: Boolean,
    dateCompras: Date,
    estimFin: Date,
    dateSolved: Date,
    status: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("tickets", ticketsSchema);
