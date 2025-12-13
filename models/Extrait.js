const mongoose = require("mongoose");

//définir le sous-schéma pour le livre
const livreSchema = new mongoose.Schema(
  {
    bookKey: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: "Unknown author.",
    },
    coverUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false } //pas besoin d'un _id pour ce sous-document
);

const ExtraitSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    livre: {
      type: livreSchema, //utiliser le sous-schéma
      required: true,
    },
    contenu: {
      type: String,
      minlength: 0,
      maxlength: 5000,
    },
    contientSpoiler: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Extrait", ExtraitSchema);
