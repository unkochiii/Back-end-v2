const express = require("express");
const router = express.Router();
const Letter = require("../models/Letter");
const isAuthenticated = require("../middleware/isAuthenticated");

// CREATE - Create a new letter
router.post("/letter", isAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Content is required.",
      });
    }

    const letter = new Letter({
      content,
      author: req.user._id,
    });

    const savedLetter = await letter.save();
    await savedLetter.populate(
      "author",
      "account.username email account.avatar"
    );

    res.status(201).json({
      success: true,
      message: "Letter created successfully",
      data: savedLetter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating the letter",
      error: error.message,
    });
  }
});

// READ ALL - Get all letters (with pagination)
router.get("/letter", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const letters = await Letter.find()
      .populate("author", "account.username email account.avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Letter.countDocuments();

    const formattedLetters = letters.map((letter) => ({
      ...letter.toObject(),
      likesCount: letter.likes ? letter.likes.length : 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedLetters,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving letters",
      error: error.message,
    });
  }
});

// READ ALL (Authenticated) - Get all letters with like status for current user
router.get("/letter/feed", isAuthenticated, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const letters = await Letter.find()
      .populate("author", "account.username email account.avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Letter.countDocuments();

    const formattedLetters = letters.map((letter) => ({
      ...letter.toObject(),
      likesCount: letter.likes ? letter.likes.length : 0,
      isLikedByUser: letter.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),
    }));

    res.status(200).json({
      success: true,
      data: formattedLetters,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving letters",
      error: error.message,
    });
  }
});

// READ ONE - Get a letter by ID
router.get("/letter/:id", async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id).populate(
      "author",
      "account.username email account.avatar"
    );

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...letter.toObject(),
        likesCount: letter.likes ? letter.likes.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving the letter",
      error: error.message,
    });
  }
});

// TOGGLE LIKE - Like/Unlike a letter
router.post("/letter/:id/like", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found.",
      });
    }

    const userId = req.user._id;
    const hasLiked = letter.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasLiked) {
      // Unlike
      letter.likes = letter.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      letter.likes.push(userId);
    }

    await letter.save();

    res.status(200).json({
      success: true,
      message: hasLiked ? "Letter unliked." : "Letter liked.",
      likesCount: letter.likes.length,
      isLikedByUser: !hasLiked,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling like",
      error: error.message,
    });
  }
});

// UPDATE - Update a letter
router.put("/letter/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found.",
      });
    }

    if (letter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Content is required.",
      });
    }

    letter.content = content;
    const updated = await letter.save();
    await updated.populate("author", "account.username email account.avatar");

    res.status(200).json({
      success: true,
      message: "Letter updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating the letter",
      error: error.message,
    });
  }
});

// DELETE - Delete a letter
router.delete("/letter/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        message: "Letter not found.",
      });
    }

    if (letter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    await Letter.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Letter deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting the letter",
      error: error.message,
    });
  }
});

module.exports = router;
