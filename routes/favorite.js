const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");
const mongoose = require("mongoose");
const isAuthenticated = require("../middleware/isAuthenticated");

// Ajouter un livre aux favoris
router.post("/favorite", isAuthenticated, async (req, res) => {
  try {
    const { book } = req.body;
    const userId = req.user._id;

    // Validation
    if (!book || !book.key || !book.title) {
      return res.status(400).json({
        success: false,
        message: "Book data (key, title) is required",
      });
    }

    // Vérifier si le livre est déjà dans les favoris
    const existingFavorite = await Favorite.findOne({
      user: userId,
      bookKey: book.key,
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: "Book already in favorites",
        data: existingFavorite,
      });
    }

    // Créer le nouveau favori
    const favorite = new Favorite({
      user: userId,
      bookKey: book.key,
      title: book.title,
      author: book.author || "Unknown author",
      firstPublishYear: book.firstPublishYear || null,
      coverId: book.coverId || null,
      coverUrl: book.coverUrl || null,
    });

    const savedFavorite = await favorite.save();

    res.status(201).json({
      success: true,
      message: "Book added to favorites successfully",
      data: savedFavorite,
    });
  } catch (error) {
    console.error("Error adding favorite:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Book already in favorites",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error adding book to favorites",
      error: error.message,
    });
  }
});

// Vérifier si un livre est en favori
router.get("/favorite/check/:bookKey", isAuthenticated, async (req, res) => {
  try {
    const { bookKey } = req.params;
    const userId = req.user._id;

    const favorite = await Favorite.findOne({
      user: userId,
      bookKey: decodeURIComponent(bookKey),
    });

    res.status(200).json({
      success: true,
      isFavorite: !!favorite,
      data: favorite || null,
    });
  } catch (error) {
    console.error("Error checking favorite:", error.message);
    res.status(500).json({
      success: false,
      message: "Error checking favorite status",
      error: error.message,
    });
  }
});

// Obtenir tous les favoris de l'utilisateur connecté
router.get("/favorite", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, sort = "-addedAt" } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const favorites = await Favorite.find({ user: userId })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Favorite.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: favorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching favorites:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching favorites",
      error: error.message,
    });
  }
});

// Obtenir tous les favoris d'un utilisateur (route publique)
router.get("/favorite/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, sort = "-addedAt" } = req.query;

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const favorites = await Favorite.find({ user: userId })
      .populate("user", "account.username account.avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Favorite.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: favorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("Error fetching favorites:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching favorites",
      error: error.message,
    });
  }
});

// Supprimer un favori par ID du favori
router.delete("/favorite/:favoriteId", isAuthenticated, async (req, res) => {
  try {
    const { favoriteId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid favorite ID",
      });
    }

    // Vérifier que le favori appartient à l'utilisateur
    const favorite = await Favorite.findById(favoriteId);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    if (favorite.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await Favorite.findByIdAndDelete(favoriteId);

    res.status(200).json({
      success: true,
      message: "Book removed from favorites successfully",
    });
  } catch (error) {
    console.error("Error deleting favorite:", error.message);
    res.status(500).json({
      success: false,
      message: "Error removing book from favorites",
      error: error.message,
    });
  }
});

// Supprimer un favori par bookKey (pour l'utilisateur connecté)
router.delete("/favorite/book/:bookKey", isAuthenticated, async (req, res) => {
  try {
    const { bookKey } = req.params;
    const userId = req.user._id;

    const deletedFavorite = await Favorite.findOneAndDelete({
      user: userId,
      bookKey: decodeURIComponent(bookKey),
    });

    if (!deletedFavorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book removed from favorites successfully",
    });
  } catch (error) {
    console.error("Error deleting favorite:", error.message);
    res.status(500).json({
      success: false,
      message: "Error removing book from favorites",
      error: error.message,
    });
  }
});

// Supprimer tous les favoris de l'utilisateur connecté
router.delete("/favorite/all", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Favorite.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "All favorites removed successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all favorites:", error.message);
    res.status(500).json({
      success: false,
      message: "Error removing all favorites",
      error: error.message,
    });
  }
});

// Toggle favori (ajouter si absent, supprimer si présent)
router.post("/favorite/toggle", isAuthenticated, async (req, res) => {
  try {
    const { book } = req.body;
    const userId = req.user._id;

    if (!book || !book.key || !book.title) {
      return res.status(400).json({
        success: false,
        message: "Book data (key, title) is required",
      });
    }

    // Vérifier si le livre est déjà dans les favoris
    const existingFavorite = await Favorite.findOne({
      user: userId,
      bookKey: book.key,
    });

    if (existingFavorite) {
      // Supprimer des favoris
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return res.status(200).json({
        success: true,
        message: "Book removed from favorites",
        isFavorite: false,
      });
    } else {
      // Ajouter aux favoris
      const favorite = new Favorite({
        user: userId,
        bookKey: book.key,
        title: book.title,
        author: book.author || "Unknown author",
        firstPublishYear: book.firstPublishYear || null,
        coverId: book.coverId || null,
        coverUrl: book.coverUrl || null,
      });

      const savedFavorite = await favorite.save();

      return res.status(201).json({
        success: true,
        message: "Book added to favorites",
        isFavorite: true,
        data: savedFavorite,
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error.message);
    res.status(500).json({
      success: false,
      message: "Error toggling favorite",
      error: error.message,
    });
  }
});

module.exports = router;
