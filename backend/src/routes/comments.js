const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// Create comment
router.post("/", auth, async (req, res) => {
  try {
    const { postId, text } = req.body || {};
    if (!postId || !text) return res.status(400).json({ message: "postId and text required" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      postId,
      authorId: req.user.id,
      text,
    });

    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // Send notification
    if (post.authorId.toString() !== req.user.id) {
      await Notification.create({
        userId: post.authorId,
        type: "comment",
        triggeredByUserId: req.user.id,
        postId,
        commentId: comment._id,
        message: "Someone commented on your post",
      });
    }

    const populated = await comment.populate("authorId", "name avatarUrl email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get comments for a post
router.get("/", async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) return res.status(400).json({ message: "postId required" });

    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .populate("authorId", "name avatarUrl email");

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete comment
router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, authorId: req.user.id });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const post = await Post.findById(comment.postId);
    if (post) {
      post.commentCount = Math.max(0, (post.commentCount || 1) - 1);
      await post.save();
    }

    await Comment.deleteOne({ _id: comment._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
