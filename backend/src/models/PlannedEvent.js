const mongoose = require("mongoose");

const plannedEventSchema = new mongoose.Schema(
  {
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemType: { type: String, enum: ["maintenance", "mod"], required: true },
    title: { type: String, required: true, trim: true },
    priority: { type: Number, min: 1, max: 5, default: null },
    why: { type: String, default: "" },
    when: { type: String, default: "" },
    estCost: { type: String, default: "" },
    requires: [{ type: String }],
    risks: { type: String, default: "" },
    source: { type: String, default: "ai" },
    status: { type: String, enum: ["planned", "done"], default: "planned" },
    previewUrl: { type: String, default: "" },
    previewMessage: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

plannedEventSchema.index({ userId: 1, carId: 1, status: 1, date: -1 });

module.exports = mongoose.model("PlannedEvent", plannedEventSchema);
