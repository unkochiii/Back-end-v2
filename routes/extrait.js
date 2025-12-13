const express = require("express");
const router = express.Router();
const Extrait = require("../models/Extrait");
const authMiddleware = require("../middleware/isAuthenticated");

// Créer un extrait
router.post("/extrait", authMiddleware, async (req, res) => {
  try {
    const { livre, contenu } = req.body;

    if (!livre || !livre.bookKey || !livre.title) {
      return res.status(400).json({
        success: false,
        message: "The book must contain at least bookKey and title.",
      });
    }

    const newExtrait = new Extrait({
      author: req.user._id,
      livre: {
        bookKey: livre.bookKey,
        title: livre.title,
        author: livre.author || "Unknown author.",
        coverUrl: livre.coverUrl || null,
      },
      contenu,
    });

    const savedExtrait = await newExtrait.save();
    await savedExtrait.populate("author", "username email avatar");

    res.status(201).json({
      success: true,
      message: "Excerpt created successfully",
      data: savedExtrait,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating the excerpt",
      error: error.message,
    });
  }
});

// Récupérer tous les extraits
router.get("/extrait", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const extraits = await Extrait.find()
      .populate("author", "username email avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Extrait.countDocuments();

    res.status(200).json({
      success: true,
      data: extraits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving excerpts",
      error: error.message,
    });
  }
});

// Récupérer les extraits par livre (bookKey)
router.get("/extrait/livre/:bookKey", async (req, res) => {
  try {
    const { bookKey } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const extraits = await Extrait.find({ "livre.bookKey": bookKey })
      .populate("author", "username email avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Extrait.countDocuments({ "livre.bookKey": bookKey });

    res.status(200).json({
      success: true,
      data: extraits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving excerpts",
      error: error.message,
    });
  }
});

// Récupérer un extrait par ID
router.get("/extrait/:id", async (req, res) => {
  try {
    const extrait = await Extrait.findById(req.params.id).populate(
      "author",
      "username email avatar"
    );

    if (!extrait) {
      return res.status(404).json({
        success: false,
        message: "Excerpt not found",
      });
    }

    res.status(200).json({
      success: true,
      data: extrait,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving the excerpt",
      error: error.message,
    });
  }
});

// Modifier un extrait
router.put("/extrait/:id", authMiddleware, async (req, res) => {
  try {
    const extrait = await Extrait.findById(req.params.id);

    if (!extrait) {
      return res.status(404).json({
        success: false,
        message: "Excerpt not found",
      });
    }

    if (extrait.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { contenu } = req.body;
    if (contenu !== undefined) extrait.contenu = contenu;

    const updated = await extrait.save();
    await updated.populate("author", "username email avatar");

    res.status(200).json({
      success: true,
      message: "Excerpt modified successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error modifying the excerpt",
      error: error.message,
    });
  }
});

// Supprimer un extrait
router.delete("/extrait/:id", authMiddleware, async (req, res) => {
  try {
    const extrait = await Extrait.findById(req.params.id);

    if (!extrait) {
      return res.status(404).json({
        success: false,
        message: "Excerpt not found",
      });
    }

    if (extrait.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await Extrait.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Excerpt deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting the excerpt",
      error: error.message,
    });
  }
});

module.exports = router;
