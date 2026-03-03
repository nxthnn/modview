const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

const router = express.Router();

// Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-passwordHash")
      .populate("followers", "name avatarUrl")
      .populate("following", "name avatarUrl");

    if (!user) return res.status(404).json({ message: "User not found" });

    const postCount = await Post.countDocuments({ authorId: user._id });

    res.json({
      ...user.toObject(),
      postCount,
      followerCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash")
      .populate("followers", "name avatarUrl")
      .populate("following", "name avatarUrl");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Get post count
    const postCount = await Post.countDocuments({ authorId: user._id });

    res.json({
      ...user.toObject(),
      postCount,
      followerCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "Cannot update other users" });
    }

    const { name, bio, avatarUrl } = req.body || {};
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, avatarUrl },
      { new: true }
    ).select("-passwordHash");

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user's posts
router.get("/:id/posts", async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("authorId", "name avatarUrl email")
      .populate("carTags", "make model year");

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
