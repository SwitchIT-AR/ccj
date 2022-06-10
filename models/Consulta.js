const { Schema, model } = require("mongoose");

const consultaSchema = new Schema(
  {
    red: String,
    datos: Object,
  },
  {
    timestamps: true,
  }
);

module.exports = model("consulta", consultaSchema);
