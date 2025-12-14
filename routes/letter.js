const express = require("express");
const router = express.Router();
const Letter = require("../models/Letter");
const isAuthenticated = require("../middleware/isAuthenticated");

// CREATE - Create a new letter
router.post("/post", isAuthenticated, async (req, res) => {
  try {
    const letter = new Letter({
      content: req.body.content,
      author: req.user._id,
    });
    const result = await letter.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ ALL - Get all letters
router.get("/posts", isAuthenticated, async (req, res) => {
  try {
    const letters = await Letter.find().populate("author");
    res.status(200).json(letters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ ONE - Get a letter by ID
router.get("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id).populate("author");
    if (!letter) {
      return res.status(404).json({ message: "Letter not found." });
    }
    res.status(200).json(letter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE - Update a letter
router.put("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: "Letter not found." });
    }

    // Check if the user is the author
    if (letter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Update only the content (not the author)
    letter.content = req.body.content;
    const result = await letter.save();

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Delete a letter
router.delete("/post/:id", isAuthenticated, async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: "Letter not found." });
    }

    // Check if the user is the author
    if (letter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    await Letter.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Letter deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
