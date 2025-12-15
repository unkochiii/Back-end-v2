const express = require("express");
const axios = require("axios");
const router = express.Router();

// Mots-clés pour identifier les packs/collections (à mettre en dehors des routes)
const packKeywords = [
  "box set",
  "boxed set",
  "collection",
  "complete works",
  "omnibus",
  "anthology",
  "bundle",
  "series set",
  "book set",
  "books set",
  "volumes",
  "coffret",
  "intégrale",
  "complete series",
  "3-in-1",
  "2-in-1",
  "4-in-1",
  "5-in-1",
  "trilogy",
  "duology",
  "compendium",
  "collected",
  "complete collection",
  "ultimate collection",
  "set of",
  "pack",
];

// Fonction pour vérifier si c'est un pack (à mettre en dehors des routes)
const isPack = (book) => {
  const title = (book.title || "").toLowerCase();
  const subtitle = (book.subtitle || "").toLowerCase();
  const fullTitle = `${title} ${subtitle}`;

  // Vérifie les mots-clés dans le titre
  const hasPackKeyword = packKeywords.some((keyword) =>
    fullTitle.includes(keyword.toLowerCase())
  );

  // Vérifie si le titre contient des patterns comme "Books 1-3", "Tomes 1 à 5"
  const hasMultipleBooksPattern =
    /books?\s*\d+\s*[-–à&]\s*\d+/i.test(fullTitle) ||
    /tomes?\s*\d+\s*[-–à&]\s*\d+/i.test(fullTitle) ||
    /vol(ume)?s?\s*\d+\s*[-–à&]\s*\d+/i.test(fullTitle) ||
    /$\d+\s*books?$/i.test(fullTitle) ||
    /\d+\s*book\s*set/i.test(fullTitle);

  return hasPackKeyword || hasMultipleBooksPattern;
};

// Route de recherche
router.get("/books", async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ error: "The search parameter 'q' is required." });
    }

    const response = await axios.get("https://openlibrary.org/search.json", {
      params: {
        q: q,
        page: page,
        limit: parseInt(limit) + 30, // On demande plus pour compenser le filtrage
      },
    });

    // Filtrer pour garder uniquement les livres individuels
    const individualBooks = response.data.docs
      .filter((book) => !isPack(book))
      .slice(0, parseInt(limit))
      .map((book) => ({
        key: book.key,
        title: book.title,
        author: book.author_name ? book.author_name[0] : "Unknown author.",
        firstPublishYear: book.first_publish_year,
        isbn: book.isbn ? book.isbn[0] : null,
        coverId: book.cover_i,
        coverUrl: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : null,
      }));

    res.json({
      total: response.data.numFound,
      page: parseInt(page),
      books: individualBooks,
    });
  } catch (error) {
    console.error("Error Open Library:", error.message);
    res.status(500).json({ error: "Error while retrieving the books." });
  }
});

// Route pour obtenir les livres par sujet/catégorie
router.get("/books/subject/:subject", async (req, res) => {
  try {
    const { subject } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // On demande plus de résultats pour compenser le filtrage
    const response = await axios.get(
      `https://openlibrary.org/subjects/${subject}.json`,
      {
        params: {
          limit: parseInt(limit) + 30,
          offset: offset,
        },
      }
    );

    // Filtrer pour garder uniquement les livres individuels
    const individualBooks = response.data.works
      .filter((book) => !isPack(book))
      .slice(0, parseInt(limit))
      .map((book) => ({
        key: book.key,
        title: book.title,
        authors: book.authors?.map((a) => a.name) || [],
        coverId: book.cover_id,
        coverUrl: book.cover_id
          ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
          : null,
      }));

    res.json({
      subject: response.data.name,
      total: response.data.work_count,
      books: individualBooks,
    });
  } catch (error) {
    console.error("Erreur Open Library:", error.message);
    res.status(500).json({ error: "Error while retrieving the books." });
  }
}); // Route pour les livres populaires
router.get("/books/trending", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const isPack = (book) => {
      if (!book.title) return false;
      const packKeywords = /(\bset\b|\bbox\b|\bcollection\b|\bvolumes?\s*\d)/i;
      return packKeywords.test(book.title);
    };

    // Endpoint trending - SANS paramètres dans l'URL
    const response = await axios.get(
      "https://openlibrary.org/trending/daily.json",
      {
        timeout: 15000,
        headers: {
          "User-Agent": "MyBookApp/1.0", // Open Library préfère un User-Agent
          Accept: "application/json",
        },
      }
    );

    // Debug : voir la structure de la réponse
    console.log("Response keys:", Object.keys(response.data));

    const works = response.data.works || [];

    const individualBooks = works
      .filter((book) => book && !isPack(book))
      .slice(0, parseInt(limit))
      .map((work) => ({
        key: work.key,
        title: work.title,
        author:
          work.author_name?.[0] || work.authors?.[0]?.name || "Unknown author",
        firstPublishYear: work.first_publish_year,
        coverId: work.cover_i || work.cover_id,
        coverUrl:
          work.cover_i || work.cover_id
            ? `https://covers.openlibrary.org/b/id/${
                work.cover_i || work.cover_id
              }-M.jpg`
            : null,
      }));

    res.json({
      total: works.length,
      books: individualBooks,
    });
  } catch (error) {
    // Log détaillé pour comprendre l'erreur
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
    });

    res.status(500).json({
      error: "Error while retrieving trending books.",
      details: error.message,
    });
  }
});

// Route pour obtenir les détails d'un livre
router.get("/books/:workId", async (req, res) => {
  try {
    const { workId } = req.params;

    const response = await axios.get(
      `https://openlibrary.org/works/${workId}.json`
    );

    res.json(response.data);
  } catch (error) {
    console.error("Erreur Open Library:", error.message);
    res.status(500).json({ error: "Error while retrieving the book." });
  }
});

module.exports = router;
