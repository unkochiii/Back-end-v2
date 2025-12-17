const express = require("express");
const router = express.Router();
const Review = require("../models/Reviews");
const isAuthenticated = require("../middleware/isAuthenticated");
const mongoose = require("mongoose");

// POST - Create a review for a book
router.post("/reviews", isAuthenticated, async (req, res) => {
  try {
    const { content, rating, containsSpoiler, book } = req.body;

    if (rating === undefined) {
      return res.status(400).json({ message: "Rating is required." });
    }

    if (!book || !book.bookKey) {
      return res
        .status(400)
        .json({ message: "Book information (bookKey) is required." });
    }

    const newReview = new Review({
      author: req.user._id,
      book: {
        bookKey: book.bookKey,
        title: book.title,
        author: book.author || "Unknown author.",
        coverUrl: book.coverUrl || null,
      },
      content,
      rating,
      containsSpoiler: containsSpoiler || false,
    });

    await newReview.save();
    await newReview.populate("author", "account.username account.avatar");

    res.status(201).json({
      message: "Review successfully created.",
      review: newReview,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already submitted a review for this book.",
      });
    }
    res
      .status(500)
      .json({ message: "Error creating review.", error: error.message });
  }
});

// GET - Retrieve all reviews
router.get("/reviews", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const reviews = await Review.find()
      .populate("author", "account.username account.avatar")
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Review.countDocuments();

    // Formater chaque review avec ses infos de likes
    const formattedReviews = reviews.map((review) => ({
      ...review.toObject(),
      likesCount: review.likes ? review.likes.length : 0,
    }));

    res.status(200).json({
      reviews: formattedReviews,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error retrieving reviews.", error: error.message });
  }
});
// TOGGLE LIKE - Like/Unlike a review
router.post("/reviews/:id/like", isAuthenticated, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    const userId = req.user._id;
    const hasLiked = review.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasLiked) {
      // Unlike
      review.likes = review.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      review.likes.push(userId);
    }

    await review.save();

    res.status(200).json({
      message: hasLiked ? "review unliked." : "review liked.",
      likesCount: review.likes.length,
      isLikedByUser: !hasLiked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET - Retrieve reviews for a specific book
router.get("/reviews/book", async (req, res) => {
  try {
    const { bookKey, page = 1, limit = 10, sort = "-createdAt" } = req.query;

    if (!bookKey) {
      return res.status(400).json({ message: "bookKey is required." });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const query = {
      $or: [
        { "book.bookKey": bookKey },
        { "book.bookKey": `/works/${bookKey}` },
        { "book.bookKey": bookKey.replace("/works/", "") },
      ],
    };

    const reviews = await Review.find(query)
      .populate("author", "account.username account.avatar")
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Review.countDocuments(query);

    const userId = req.user?._id;

    const formattedReviews = reviews.map((review) => ({
      ...review.toObject(),
      likesCount: review.likes ? review.likes.length : 0,
      isLikedByUser: userId
        ? review.likes?.some((id) => id.toString() === userId.toString())
        : false,
    }));

    res.status(200).json({
      bookKey,
      reviews: formattedReviews,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error retrieving book reviews.",
      error: error.message,
    });
  }
});

// GET - Retrieve statistics for a specific book
router.get("/reviews/book/:bookKey/stats", async (req, res) => {
  try {
    const { bookKey } = req.params;

    const query = {
      $or: [
        { "book.bookKey": bookKey },
        { "book.bookKey": `/works/${bookKey}` },
        { "book.bookKey": bookKey.replace("/works/", "") },
      ],
    };

    const allReviews = await Review.find(query).select("rating likes");
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution = {
      0.5: 0,
      1: 0,
      1.5: 0,
      2: 0,
      2.5: 0,
      3: 0,
      3.5: 0,
      4: 0,
      4.5: 0,
      5: 0,
    };

    allReviews.forEach((r) => {
      const rounded = Math.round(r.rating * 2) / 2;
      if (ratingDistribution.hasOwnProperty(rounded)) {
        ratingDistribution[rounded]++;
      }
    });

    // Total des likes sur toutes les reviews du livre
    const totalLikes = allReviews.reduce(
      (sum, r) => sum + (r.likes ? r.likes.length : 0),
      0
    );

    res.status(200).json({
      bookKey,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      totalLikes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error retrieving book statistics.",
      error: error.message,
    });
  }
});
// GET - Retrieve reviews for a specific user
router.get("/reviews/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Vérifier si userId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const reviews = await Review.find({ author: userId })
      .populate("author", "account.username account.avatar")
      .sort("-createdAt")
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Review.countDocuments({ author: userId });

    // Optionnel: ID de l'utilisateur connecté pour vérifier les likes
    const currentUserId = req.user?._id;

    const formattedReviews = reviews.map((review) => ({
      ...review.toObject(),
      likesCount: review.likes ? review.likes.length : 0,
      isLikedByUser: currentUserId
        ? review.likes?.some((id) => id.toString() === currentUserId.toString())
        : false,
    }));

    res.status(200).json({
      reviews: formattedReviews,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error retrieving user reviews.",
      error: error.message,
    });
  }
});

// GET - Retrieve a review by ID
router.get("/reviews/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const review = await Review.findById(req.params.id).populate(
      "author",
      "username avatar"
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error retrieving review.", error: error.message });
  }
});

// PUT - Update a review
router.put("/reviews/:id", isAuthenticated, async (req, res) => {
  try {
    const { content, rating, containsSpoiler } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this review." });
    }

    if (content !== undefined) review.content = content;
    if (rating !== undefined) review.rating = rating;
    if (containsSpoiler !== undefined) review.containsSpoiler = containsSpoiler;

    await review.save();
    await review.populate("author", "account.username account.avatar");

    res.status(200).json({
      message: "Review successfully updated.",
      review,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error updating review.", error: error.message });
  }
});

// DELETE - Delete a review
router.delete("/reviews/:id", isAuthenticated, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID." });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review." });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Review successfully deleted." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error deleting review.", error: error.message });
  }
});

module.exports = router;
