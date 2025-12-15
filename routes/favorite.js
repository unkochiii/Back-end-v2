const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");
const mongoose = require("mongoose");

// ➕ Ajouter un livre aux favoris
router.post("/favorite", async (req, res) => {
  try {
    const { user, book } = req.body;

    // Validation
    if (!user) {
      return res.status(400).json({ error: "user is required" });
    }

    if (!book || !book.key || !book.title) {
      return res
        .status(400)
        .json({ error: "Book data (key, title) is required" });
    }

    // Vérifier si l'ID user est valide
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Vérifier si le livre est déjà dans les favoris
    const existingFavorite = await Favorite.findOne({
      user: user,
      bookKey: book.key,
    });

    if (existingFavorite) {
      return res.status(409).json({
        error: "Book already in favorites",
        favorite: existingFavorite,
      });
    }

    // Créer le nouveau favori
    const favorite = new Favorite({
      user: user,
      bookKey: book.key,
      title: book.title,
      author: book.author || "Unknown author",
      firstPublishYear: book.firstPublishYear || null,
      coverId: book.coverId || null,
      coverUrl: book.coverUrl || null,
    });

    const savedFavorite = await favorite.save();

    res.status(201).json({
      message: "Book added to favorites successfully",
      favorite: savedFavorite,
    });
  } catch (error) {
    console.error("Error adding favorite:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({ error: "Book already in favorites" });
    }

    res.status(500).json({ error: "Error adding book to favorites" });
  }
});

// 📚 Obtenir tous les favoris d'un utilisateur
router.get("/favorite/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, sort = "-addedAt" } = req.query;

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const favorites = await Favorite.find({ user: userId })
      .populate("user", "username email") // Optionnel : récupère les infos du user
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Favorite.countDocuments({ user: userId });

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      favorites,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error.message);
    res.status(500).json({ error: "Error fetching favorites" });
  }
});

// 🗑️ Supprimer un favori par ID du favori
router.delete("/favorite/:favoriteId", async (req, res) => {
  try {
    const { favoriteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
      return res.status(400).json({ error: "Invalid favorite ID" });
    }

    const deletedFavorite = await Favorite.findByIdAndDelete(favoriteId);

    if (!deletedFavorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({
      message: "Book removed from favorites successfully",
      deletedFavorite,
    });
  } catch (error) {
    console.error("Error deleting favorite:", error.message);
    res.status(500).json({ error: "Error removing book from favorites" });
  }
});

// 🗑️ Supprimer un favori par userId et bookKey
router.delete("/favorite/user/:userId/book/:bookKey", async (req, res) => {
  try {
    const { userId, bookKey } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const deletedFavorite = await Favorite.findOneAndDelete({
      user: userId,
      bookKey: decodeURIComponent(bookKey),
    });

    if (!deletedFavorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({
      message: "Book removed from favorites successfully",
      deletedFavorite,
    });
  } catch (error) {
    console.error("Error deleting favorite:", error.message);
    res.status(500).json({ error: "Error removing book from favorites" });
  }
});

// 🗑️ Supprimer tous les favoris d'un utilisateur
router.delete("/favorite/user/:userId/all", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await Favorite.deleteMany({ user: userId });

    res.json({
      message: "All favorites removed successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all favorites:", error.message);
    res.status(500).json({ error: "Error removing all favorites" });
  }
});

module.exports = router;
