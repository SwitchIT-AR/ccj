const { Schema, model } = require("mongoose");

const pagesSchema = new Schema(
  {
    ruta: String,
    pagina: String,
    titulo: String,
    saludo: String,
    subTitulo1: String,
    subTitulo2: String,
    subTitulo3: String,
    subTitulo4: String,
    subTitulo5: String,
    parrafo1: String,
    parrafo2: String,
    parrafo3: String,
    parrafo4: String,
    cardTitulo1: String,
    cardTexto1: String,
    cardTitulo2: String,
    cardTexto2: String,
    cardTitulo3: String,
    cardTexto3: String,
    cardTitulo4: String,
    cardTexto4: String,
    horarioEntrada: String,
    almuerzo: String,
    auxText1: String,
    auxText2: String,
    auxText3: String,
    auxText4: String,
  },
  {
    timestamps: true,
  }
);

module.exports = model("pages", pagesSchema);
