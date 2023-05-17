const { Schema, model } = require("mongoose");

const galerySchema = new Schema(
  {
    title: String,
    url: [],
  },
  {
    timestamps: true,
  }
);

module.exports = model("galery", galerySchema);
