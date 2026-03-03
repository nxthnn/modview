const mongoose = require("mongoose");

const modEventSchema = new mongoose.Schema(
  {
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true }, // e.g., "suspension", "wheels", "engine", "interior"
    brand: { type: String, default: "" },
    part: { type: String, required: true }, // e.g., "Coilovers"
    date: { type: Date, default: Date.now },
    mileage: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    photoUrls: [String],
  },
  { timestamps: true }
);

modEventSchema.index({ carId: 1, date: -1 });
modEventSchema.index({ userId: 1 });
modEventSchema.index({ category: 1 });

module.exports = mongoose.model("ModEvent", modEventSchema);
