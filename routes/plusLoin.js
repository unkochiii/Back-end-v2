const express = require("express");
const router = express.Router();
const PlusLoin = require("../models/PlusLoin");
const isAuthenticated = require("../middleware/isAuthenticated");

// Créer un nouveau PlusLoin
router.post("/plusloin", isAuthenticated, async (req, res) => {
  try {
    const { livre, contenu, contientSpoiler } = req.body;

    if (!livre || !livre.bookKey || !livre.title) {
      return res.status(400).json({
        success: false,
        message: "Le livre doit contenir au moins bookKey et title",
      });
    }

    const newPlusLoin = new PlusLoin({
      author: req.user._id,
      livre: {
        bookKey: livre.bookKey,
        title: livre.title,
        author: livre.author || "Unknown author.",
        coverUrl: livre.coverUrl || null,
      },
      contenu,
      contientSpoiler: contientSpoiler ?? true,
    });

    const savedPlusLoin = await newPlusLoin.save();
    await savedPlusLoin.populate("author", "username email avatar");

    res.status(201).json({
      success: true,
      message: "PlusLoin créé avec succès",
      data: savedPlusLoin,
    });
  } catch (error) {
    console.error("Erreur création PlusLoin:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du PlusLoin",
      error: error.message,
    });
  }
});

// Récupérer tous les PlusLoin
router.get("/plusloin", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const plusLoins = await PlusLoin.find()
      .populate("author", "username email avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PlusLoin.countDocuments();

    res.status(200).json({
      success: true,
      data: plusLoins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des PlusLoin",
      error: error.message,
    });
  }
});

// Récupérer les PlusLoin par livre (bookKey)
router.get("/plusloin/livre/:bookKey", async (req, res) => {
  try {
    const { bookKey } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const plusLoins = await PlusLoin.find({ "livre.bookKey": bookKey })
      .populate("author", "username email avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PlusLoin.countDocuments({ "livre.bookKey": bookKey });

    res.status(200).json({
      success: true,
      data: plusLoins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération",
      error: error.message,
    });
  }
});

// Récupérer un PlusLoin par ID
router.get("/plusloin/:id", async (req, res) => {
  try {
    const plusLoin = await PlusLoin.findById(req.params.id).populate(
      "author",
      "username email avatar"
    );

    if (!plusLoin) {
      return res.status(404).json({
        success: false,
        message: "PlusLoin non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: plusLoin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération",
      error: error.message,
    });
  }
});

// Mettre à jour un PlusLoin
router.put("/plusloin/:id", isAuthenticated, async (req, res) => {
  try {
    const plusLoin = await PlusLoin.findById(req.params.id);

    if (!plusLoin) {
      return res.status(404).json({
        success: false,
        message: "PlusLoin non trouvé",
      });
    }

    if (plusLoin.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé",
      });
    }

    const { contenu, contientSpoiler } = req.body;
    if (contenu !== undefined) plusLoin.contenu = contenu;
    if (contientSpoiler !== undefined)
      plusLoin.contientSpoiler = contientSpoiler;

    const updated = await plusLoin.save();
    await updated.populate("author", "username email avatar");

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
});

// Supprimer un PlusLoin
router.delete("/plusloin/:id", isAuthenticated, async (req, res) => {
  try {
    const plusLoin = await PlusLoin.findById(req.params.id);

    if (!plusLoin) {
      return res.status(404).json({
        success: false,
        message: "PlusLoin non trouvé",
      });
    }

    if (plusLoin.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé",
      });
    }

    await PlusLoin.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "PlusLoin supprimé",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression",
      error: error.message,
    });
  }
});

module.exports = router;
