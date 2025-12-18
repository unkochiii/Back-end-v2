const express = require("express");
const router = express.Router();

const isAuthenticated = require("../middleware/isAuthenticated");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const normalizeMembers = (a, b) => [a, b].map((x) => x.trim()).sort();

// GET conversations for current user
router.get("/conversations", isAuthenticated, async (req, res) => {
  try {
    // selon ton User model: account.username
    const me = req.user.account?.username;
    const convs = await Conversation.find({ members: me }).sort({
      lastMessageAt: -1,
      updatedAt: -1,
    });
    res.json(convs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// CREATE (or return existing) conversation with another user
router.post("/conversations", isAuthenticated, async (req, res) => {
  try {
    const me = req.user.account?.username;
    const { otherUsername } = req.body;

    if (!otherUsername || otherUsername === me) {
      return res.status(400).json({ message: "Invalid otherUsername" });
    }

    const members = normalizeMembers(me, otherUsername);

    const conv = await Conversation.findOneAndUpdate(
      { members },
      { $setOnInsert: { members, lastMessage: "", lastMessageAt: null } },
      { new: true, upsert: true }
    );

    res.status(201).json(conv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET messages of a conversation
router.get("/conversations/:id/messages", isAuthenticated, async (req, res) => {
  try {
    const me = req.user.account?.username;
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    if (!conv.members.includes(me)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const msgs = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST message in a conversation
router.post("/conversations/:id/messages", isAuthenticated, async (req, res) => {
  try {
    const me = req.user.account?.username;
    const { text } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "Missing text" });

    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    if (!conv.members.includes(me)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const msg = await Message.create({
      conversationId: conv._id,
      senderUsername: me,
      text: text.trim(),
    });

    conv.lastMessage = msg.text;
    conv.lastMessageAt = msg.createdAt;
    await conv.save();

    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
