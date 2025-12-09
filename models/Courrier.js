const mongoose = require("mongoose");

const courrierSchema = new mongoose.Schema(
  {
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'auteur est requis"],
    },
    contenu: {
      type: String,
      required: [true, "Le contenu est requis"],
    },
  },
  {
    timestamps: true,
  }
);

const Courrier = mongoose.model("Courrier", courrierSchema);

module.exports = Courrier;
