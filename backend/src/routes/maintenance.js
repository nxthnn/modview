const express = require("express");
const MaintenanceEvent = require("../models/MaintenanceEvent");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Create maintenance event
router.post("/", auth, upload.array("receipts", 5), async (req, res) => {
  try {
    const { carId, type, date, mileage, cost, notes } = req.body || {};
    if (!carId || !type) return res.status(400).json({ message: "carId and type required" });

    const receiptUrls = (req.files || []).map((f) => f.path);

    const event = await MaintenanceEvent.create({
      carId,
      userId: req.user.id,
      type,
      date: date ? new Date(date) : new Date(),
      mileage: parseInt(mileage) || 0,
      cost: parseFloat(cost) || 0,
      notes: notes || "",
      receiptUrls,
    });

    const populated = await event.populate(["carId"]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get maintenance events for a car
router.get("/", async (req, res) => {
  try {
    const { carId } = req.query;
    if (!carId) return res.status(400).json({ message: "carId required" });

    const events = await MaintenanceEvent.find({ carId })
      .sort({ date: -1 })
      .populate("carId");

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single maintenance event
router.get("/:id", async (req, res) => {
  try {
    const event = await MaintenanceEvent.findById(req.params.id).populate("carId");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete maintenance event
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await MaintenanceEvent.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });

    await MaintenanceEvent.deleteOne({ _id: event._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
