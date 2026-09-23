const pagesCtrl = {};
const path = require("path");
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

  const { _id, pagina, ...rest } = req.body;
  console.log("pagina", pagina);
  console.log("req files", req.files);

  // Los encuadres (imageTopPos, cardImageNPos) se escriben en un style="" de las vistas:
  // sólo se aceptan números, acotados a 0-100.
  Object.keys(rest).forEach((campo) => {
    if (!/Pos$/.test(campo)) return;
    const n = String(rest[campo]).trim() === "" ? NaN : Number(rest[campo]);
    if (Number.isFinite(n)) rest[campo] = String(Math.min(100, Math.max(0, Math.round(n))));
    else delete rest[campo];
  });

  // multer ya guardó los archivos en disco; acá se registra su ruta pública en Mongo
  // (sin esto, un campo cardImageN vacío sigue vacío aunque se suba la foto).
  const imagenes = {};
  Object.entries(req.files || {}).forEach(([campo, archivos]) => {
    if (campo === "homeCard") return; // va a public/img/c-*.jpg, lo lee el CSS de la home
    imagenes[campo] = "/" + path.relative("public", archivos[0].path).split(path.sep).join("/");
  });

  try {
    const pageEdit = await Pages.findOneAndUpdate(
      { _id: req.body._id },
      { ...rest, ...imagenes },
      {
        new: true,
      }
    );
    if (!pageEdit) {
      return res.status(204).json({ message: "no existe el ticket" });
    } else {
      return res.status(200).render("deptoEdit", {
        message: "los datos fueron guardados",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("There was a problem editing the mate");
  }
};
module.exports = pagesCtrl;
