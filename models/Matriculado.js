const { Schema, model } = require("mongoose");

const matriculadoSchema = new Schema(
  {
    red: String,
    datos: Object,
  },
  {
    timestamps: true,
  }
);

module.exports = model("matriculado", matriculadoSchema);
