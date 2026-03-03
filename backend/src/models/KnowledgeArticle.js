const mongoose = require("mongoose");

const knowledgeArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true }, // "maintenance", "mods", "general"
    tags: [String], // ["oil change", "engine", "reliability"]
    compatibility: {
      makeModels: [String], // e.g., ["BMW M3", "all"]
      yearRange: {
        min: Number,
        max: Number,
      },
    },
    content: { type: String, required: true },
    priority: { type: Number, default: 0 }, // for ranking in RAG results
    cost: { type: String, default: "" }, // "£", "££", "£££"
    diy: { type: Boolean, default: false },
  },
  { timestamps: true }
);

knowledgeArticleSchema.index({ category: 1 });
knowledgeArticleSchema.index({ tags: 1 });

module.exports = mongoose.model("KnowledgeArticle", knowledgeArticleSchema);
