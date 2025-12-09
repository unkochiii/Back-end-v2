const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema(
  {
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    contenu: {
      type: String,
    },
    note: {
      type: Number,
      required: [true, "La note est requise"],
      min: [0.5, "La note minimum est 0.5"],
      max: [5, "La note maximum est 5"],
    },
    contientSpoiler: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Avis = mongoose.model("Avis", avisSchema);

module.exports = Avis;
