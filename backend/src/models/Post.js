const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    caption: { type: String, default: "" },
    mediaUrls: [String], // images/videos from Cloudinary
    carTags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for feed queries
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ carTags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ "likes._id": 1 });

module.exports = mongoose.model("Post", postSchema);
