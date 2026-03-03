const express = require("express");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Create post
router.post("/", auth, upload.array("media", 10), async (req, res) => {
  try {
    const { caption, carTags } = req.body || {};
    const mediaUrls = (req.files || []).map((f) => f.path);

    const post = await Post.create({
      authorId: req.user.id,
      caption: caption || "",
      mediaUrls,
      carTags: carTags ? JSON.parse(carTags) : [],
    });

    const populated = await post.populate(["authorId", "carTags"]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get feed (posts from users you follow)
router.get("/feed", auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : new Date();

    // Get user's following list
    const user = await require("../models/User").findById(req.user.id).select("following");
    const followingIds = user.following || [];
    followingIds.push(req.user.id); // Include own posts

    const posts = await Post.find({
      authorId: { $in: followingIds },
      createdAt: { $lt: cursor },
    })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("authorId", "name avatarUrl email")
      .populate("carTags", "make model year");

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

    res.json({ posts: items, nextCursor, hasMore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get explore feed (global posts)
router.get("/explore", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : new Date();

    const posts = await Post.find({
      createdAt: { $lt: cursor },
    })
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("authorId", "name avatarUrl email")
      .populate("carTags", "make model year");

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

    res.json({ posts: items, nextCursor, hasMore });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("authorId", "name avatarUrl email")
      .populate("carTags", "make model year")
      .populate("likes", "name avatarUrl");

    if (!post) return res.status(404).json({ message: "Post not found" });

    // Get comments
    const comments = await Comment.find({ postId: post._id })
      .sort({ createdAt: -1 })
      .populate("authorId", "name avatarUrl email");

    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, authorId: req.user.id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    await Post.deleteOne({ _id: post._id });
    await Comment.deleteMany({ postId: post._id });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like post
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const hasLiked = post.likes.some((id) => id.toString() === req.user.id);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
      // Create notification
      if (post.authorId.toString() !== req.user.id) {
        await Notification.create({
          userId: post.authorId,
          type: "like",
          triggeredByUserId: req.user.id,
          postId: post._id,
          message: `Someone liked your post`,
        });
      }
    }

    await post.save();
    res.json({ ok: true, likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unlike post
router.delete("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    await post.save();

    res.json({ ok: true, likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
