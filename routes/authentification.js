const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

// SIGNUP

router.post("/auth/signup", async (req, res) => {
  const {
    fullname,
    username,
    email,
    password,
    firstBookTitle,
    firstBookAuthor,
    secondBookTitle,
    secondBookAuthor,
    firstStyle,
    secondStyle,
    thirdStyle,
    birth,
    genre,
  } = req.body;
  try {
    // Check des infos
    if (!email) {
      return res.status(403).json({ message: "An email is needed" });
    } else if (!fullname) {
      return res.status(403).json({ message: "A name is needed" });
    } else if (!username || username.length < 5) {
      return res.status(403).json({ message: "Invalid username" });
    } else if (!password || password.length < 6) {
      return res.status(403).json({ message: "Invalid password" });
    }

    // Recherche USER
    const userToCheck = await User.findOne({ email: email });
    if (userToCheck) {
      return res.status(401).json({
        message: "Check email or password !",
      });
    }
    const usernameToCheck = await User.findOne({
      account: { username: username },
    });
    if (usernameToCheck) {
      return res.status(401).json({ message: "Username unavailable !" });
    }

    // Password encryption
    const salt = uid2(16);

    const passwordSalt = password + salt;

    const hash = SHA256(passwordSalt).toString(encBase64);

    const token = uid2(64);

    // créa USER
    const newUser = new User({
      fullname: fullname,
      account: { username: username },
      email: email,
      token: token,
      hash: hash,
      salt: salt,
      favBooks: {
        firstBook: { title: firstBookTitle, author_name: firstBookAuthor },
        secondBook: { title: secondBookTitle, author_name: secondBookAuthor },
      },
      style: {
        firstStyle: firstStyle,
        secondStyle: secondStyle,
        thirdStyle: thirdStyle,
      },
      birth: birth,
      genre: genre,
    });

    await newUser.save();
    res.status(201).json({
      message: "Account successfully created.",
      user: {
        _id: newUser._id,
        token: newUser.token,
        account: { username: newUser.account.username },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userLogin = await User.findOne({ email: email });
    if (!userLogin) {
      return res.json({ message: "Unauthorized" });
    }

    const passwordSaltLogin = password + userLogin.salt;
    const hashLogin = SHA256(passwordSaltLogin).toString(encBase64);

    if (hashLogin === userLogin.hash) {
      res.json({
        _id: userLogin._id,
        token: userLogin.token,
        account: { username: userLogin.account.username },
      });
    } else {
      return res.status(401).json({ message: "Check email or password !" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
