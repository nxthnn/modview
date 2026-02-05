const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
