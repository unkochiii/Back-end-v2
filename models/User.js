const mongoose = require("mongoose");

const User = mongoose.model("User", {
  fullname: String,
  account: { username: String, avatar: Object },
  email: String,
  token: String,
  hash: String,
  salt: String,
  favBooks: {
    firstBook: { title: String, author_name: String },
    secondBook: { title: String, author_name: String },
  },
  style: { firstStyle: String, secondStyle: String, thirdStyle: String },
  birth: Date,
  genre: String,
  country: String,
  city: String,
  userDescription: String,
});

module.exports = User;
