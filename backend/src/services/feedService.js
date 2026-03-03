const Post = require("../models/Post");
const User = require("../models/User");

async function getFeedForUser(userId, limit = 20, cursor = null) {
  const queryLimit = Math.min(limit, 100);
  const queryDate = cursor ? new Date(cursor) : new Date();

  const user = await User.findById(userId).select("following");
  const followingIds = user.following || [];
  followingIds.push(userId); // Include own posts

  const posts = await Post.find({
    authorId: { $in: followingIds },
    createdAt: { $lt: queryDate },
  })
    .sort({ createdAt: -1 })
    .limit(queryLimit + 1)
    .populate("authorId", "name avatarUrl email")
    .populate("carTags", "make model year");

  const hasMore = posts.length > queryLimit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

  return { posts: items, nextCursor, hasMore };
}

async function getExploreFeed(limit = 20, cursor = null) {
  const queryLimit = Math.min(limit, 100);
  const queryDate = cursor ? new Date(cursor) : new Date();

  const posts = await Post.find({
    createdAt: { $lt: queryDate },
  })
    .sort({ createdAt: -1 })
    .limit(queryLimit + 1)
    .populate("authorId", "name avatarUrl email")
    .populate("carTags", "make model year");

  const hasMore = posts.length > queryLimit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

  return { posts: items, nextCursor, hasMore };
}

module.exports = {
  getFeedForUser,
  getExploreFeed,
};
