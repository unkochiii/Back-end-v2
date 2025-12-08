const express = require("express");
const router = express.Router();

const isAuthenticated = require("../middleware/isAuthenticated");
const User = require("../models/User");

// READ USER INFO
router.get("/user/profile", isAuthenticated, (req, res) => {
  const getUser = req.user;
  //   console.log("USER", getUser);
  return res.status(201).json({ user: getUser });
});

// UPDATE USER INFO
router.post("/user/update", isAuthenticated, async (req, res) => {
  const {
    fullname,
    email,
    firstBookTitle,
    firstBookAuthor,
    secondBookTitle,
    secondBookAuthor,
    firstStyle,
    secondStyle,
    thirdStyle,
    birth,
    genre,
    country,
    city,
    description,
  } = req.body;
  const userID = req.user._id;

  try {
    const userUpdate = await User.findById(userID);

    if (fullname) {
      userUpdate.fullname = fullname;
    }
    if (email) {
      userUpdate.email = email;
    }
    if (firstBookTitle) {
      userUpdate.favBooks.firstBook.title = firstBookTitle;
    }
    if (firstBookTitle) {
      userUpdate.favBooks.firstBook.title = firstBookTitle;
    }
    if (secondBookTitle) {
      userUpdate.favBooks.secondBook.title = firstBookTitle;
    }
    if (firstBookAuthor) {
      userUpdate.favBooks.firstBook.author_name = firstBookAuthor;
    }
    if (secondBookAuthor) {
      userUpdate.favBooks.secondBook.author_name = secondBookAuthor;
    }
    if (firstStyle) {
      userUpdate.style.firstStyle = firstStyle;
    }
    if (secondStyle) {
      userUpdate.style.secondStyle = secondStyle;
    }
    if (thirdStyle) {
      userUpdate.style.thirdStyle = thirdStyle;
    }
    if (birth) {
      userUpdate.birth = birth;
    }
    if (genre) {
      userUpdate.genre = genre;
    }
    if (country) {
      userUpdate.country = genre;
    }
    if (city) {
      userUpdate.city = city;
    }
    if (description) {
      userUpdate.description = description;
    }

    await userUpdate.save();

    res.status(201).json(userUpdate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
