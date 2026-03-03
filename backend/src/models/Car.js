const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    mileage: { type: Number, default: 0 },
    engine: { type: String, default: "" }, // e.g., "2.0L Turbo"
    trim: { type: String, default: "" },
    notes: { type: String, default: "" },
    goals: [String], // e.g., ["comfort", "performance", "show", "track"]
    tags: [String], // custom tags
    thumbnailUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes for queries
carSchema.index({ userId: 1, createdAt: -1 });
carSchema.index({ tags: 1 });

module.exports = mongoose.model("Car", carSchema);
