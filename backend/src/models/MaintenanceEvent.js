const mongoose = require("mongoose");

const maintenanceEventSchema = new mongoose.Schema(
  {
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // e.g., "oil change", "brake inspection", "tire rotation"
    date: { type: Date, default: Date.now },
    mileage: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    receiptUrls: [String],
  },
  { timestamps: true }
);

maintenanceEventSchema.index({ carId: 1, date: -1 });
maintenanceEventSchema.index({ userId: 1 });

module.exports = mongoose.model("MaintenanceEvent", maintenanceEventSchema);
