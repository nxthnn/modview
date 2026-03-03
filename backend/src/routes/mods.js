const express = require("express");
const ModEvent = require("../models/ModEvent");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Create mod event
router.post("/", auth, upload.array("photos", 10), async (req, res) => {
  try {
    const { carId, category, brand, part, date, mileage, cost, notes } = req.body || {};
    if (!carId || !category || !part)
      return res.status(400).json({ message: "carId, category, and part required" });

    const photoUrls = (req.files || []).map((f) => f.path);

    const event = await ModEvent.create({
      carId,
      userId: req.user.id,
      category,
      brand: brand || "",
      part,
      date: date ? new Date(date) : new Date(),
      mileage: parseInt(mileage) || 0,
      cost: parseFloat(cost) || 0,
      notes: notes || "",
      photoUrls,
    });

    const populated = await event.populate(["carId"]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get mod events for a car
router.get("/", async (req, res) => {
  try {
    const { carId } = req.query;
    if (!carId) return res.status(400).json({ message: "carId required" });

    const events = await ModEvent.find({ carId })
      .sort({ date: -1 })
      .populate("carId");

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single mod event
router.get("/:id", async (req, res) => {
  try {
    const event = await ModEvent.findById(req.params.id).populate("carId");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete mod event
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await ModEvent.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });

    await ModEvent.deleteOne({ _id: event._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
