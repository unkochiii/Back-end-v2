const mongoose = require("mongoose");

const letterSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required."],
    },
    content: {
      type: String,
      required: [true, "Content is required."],
      minlength: 0,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
  }
);

const Letter = mongoose.model("Letter", letterSchema);

module.exports = Letter;
