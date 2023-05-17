const { Schema, model } = require("mongoose");

const slideSchema = new Schema(
  {
    link: String,
    imagenAlt: String,
    text: String,
    order: String,
    imageFhd: String,
    imageHd: String,
    image: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("slide", slideSchema);
