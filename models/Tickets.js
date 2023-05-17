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
    descripSist: String,
    dirAprobe: Boolean,
    dateCompras: Date,
    estimFin: Date,
    dateSolved: String,
    status: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("tickets", ticketsSchema);
