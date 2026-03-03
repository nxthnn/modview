const express = require("express");
const Follow = require("../models/Follow");
const User = require("../models/User");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// Follow a user
router.post("/:userId", auth, async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Check if already following
    const existing = await Follow.findOne({
      followerId: req.user.id,
      followingId: req.params.userId,
    });

    if (existing) return res.status(409).json({ message: "Already following" });

    // Create follow record
    const follow = await Follow.create({
      followerId: req.user.id,
      followingId: req.params.userId,
    });

    // Update user arrays
    const follower = await User.findById(req.user.id);
    if (!follower.following) follower.following = [];
    if (!follower.following.includes(req.params.userId)) {
      follower.following.push(req.params.userId);
      await follower.save();
    }

    if (!targetUser.followers) targetUser.followers = [];
    if (!targetUser.followers.includes(req.user.id)) {
      targetUser.followers.push(req.user.id);
      await targetUser.save();
    }

    // Send notification
    await Notification.create({
      userId: req.params.userId,
      type: "follow",
      triggeredByUserId: req.user.id,
      message: "Someone followed you",
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Unfollow a user
router.delete("/:userId", auth, async (req, res) => {
  try {
    const follow = await Follow.findOneAndDelete({
      followerId: req.user.id,
      followingId: req.params.userId,
    });

    if (!follow) return res.status(404).json({ message: "Not following" });

    // Update user arrays
    const follower = await User.findById(req.user.id);
    if (follower.following) {
      follower.following = follower.following.filter(
        (id) => id.toString() !== req.params.userId
      );
      await follower.save();
    }

    const targetUser = await User.findById(req.params.userId);
    if (targetUser && targetUser.followers) {
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== req.user.id
      );
      await targetUser.save();
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get followers of a user
router.get("/:userId/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("followers")
      .populate("followers", "name avatarUrl email");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ followers: user.followers || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get following of a user
router.get("/:userId/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("following")
      .populate("following", "name avatarUrl email");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ following: user.following || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
