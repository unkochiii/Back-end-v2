const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

const isAuthenticated = require("../middleware/isAuthenticated");
const User = require("../models/User");
const convertToBase64 = require("../utils/convertToBase64");

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
    // FIND USER BY USER ID
    const userUpdate = await User.findById(userID);

    // UPDATE USER INFO
    if (fullname) userUpdate.fullname = fullname;

    if (email) userUpdate.email = email;

    if (firstBookTitle) userUpdate.favBooks.firstBook.title = firstBookTitle;

    if (firstBookTitle) userUpdate.favBooks.firstBook.title = firstBookTitle;

    if (secondBookTitle) userUpdate.favBooks.secondBook.title = firstBookTitle;

    if (firstBookAuthor)
      userUpdate.favBooks.firstBook.author_name = firstBookAuthor;

    if (secondBookAuthor)
      userUpdate.favBooks.secondBook.author_name = secondBookAuthor;

    if (firstStyle) userUpdate.style.firstStyle = firstStyle;

    if (secondStyle) userUpdate.style.secondStyle = secondStyle;

    if (thirdStyle) userUpdate.style.thirdStyle = thirdStyle;

    if (birth) userUpdate.birth = birth;

    if (genre) userUpdate.genre = genre;

    if (country) userUpdate.country = genre;

    if (city) userUpdate.city = city;

    if (description) userUpdate.description = description;

    await userUpdate.save();

    res.status(201).json({
      message: "User successfully updated.",
      user: { account: { username: userUpdate.account.username } },
    });
  } catch (error) {
    res.status(500).json({
      message: "User hasn't been updated...",
      errorMessage: error.message,
    });
  }
});

// USER AVATAR UPLOAD
router.post(
  "/user/avatar/upload",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    const userID = req.user._id;
    try {
      // FIND USER BY USER ID
      const userAvatarUpload = await User.findById(userID);

      // GET AVATAR & UPLOAD ON CLOUDINARY
      if (req.files) {
        const fileToString = convertToBase64(req.files.image);
        const cloudinaryResponse = await cloudinary.uploader.upload(
          fileToString,
          { asset_folder: `/${userAvatarUpload.account.username}/avatar` }
        );
        // UPDATE AVATAR ON USER ACCOUNT
        if (cloudinaryResponse)
          userAvatarUpload.account.avatar = cloudinaryResponse;
      } else {
        return res.status(406).json({ message: "Please upload an image !" });
      }

      await userAvatarUpload.save();

      res.status(201).json({
        message: "Avatar has been updated !",
        user: {
          account: {
            username: userAvatarUpload.account.username,
            avatar: userAvatarUpload.account.avatar,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Avatar hasn't been updated...",
        errorMessage: error.message,
      });
    }
  }
);

module.exports = router;
