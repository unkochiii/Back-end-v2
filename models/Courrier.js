const mongoose = require("mongoose");

const courrierSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "The author is required."],
    },
    contenu: {
      type: String,
      required: [true, "The content is required."],
      minlength: 0,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
  }
);

const Courrier = mongoose.model("Courrier", courrierSchema);

module.exports = Courrier;
