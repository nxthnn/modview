const express = require("express");
const auth = require("../middleware/auth");
const PlannedEvent = require("../models/PlannedEvent");

const router = express.Router();

// Create a planned item from AI recommendations
router.post("/", auth, async (req, res) => {
  try {
    const {
      carId,
      itemType,
      title,
      priority,
      why,
      when,
      estCost,
      requires,
      risks,
      source,
      previewUrl,
      previewMessage,
    } = req.body || {};

    if (!carId || !itemType || !title) {
      return res.status(400).json({ message: "carId, itemType, and title are required" });
    }

    if (!["maintenance", "mod"].includes(itemType)) {
      return res.status(400).json({ message: "itemType must be maintenance or mod" });
    }

    const planned = await PlannedEvent.create({
      carId,
      userId: req.user.id,
      itemType,
      title,
      priority: Number.isFinite(priority) ? priority : null,
      why: why || "",
      when: when || "",
      estCost: estCost || "",
      requires: Array.isArray(requires) ? requires.filter(Boolean) : [],
      risks: risks || "",
      source: source || "ai",
      previewUrl: previewUrl || "",
      previewMessage: previewMessage || "",
      status: "planned",
    });

    const populated = await planned.populate(["carId"]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to create planned event" });
  }
});

// Get planned items for a car
router.get("/", auth, async (req, res) => {
  try {
    const { carId, status = "planned" } = req.query;
    if (!carId) return res.status(400).json({ message: "carId required" });

    const filter = {
      carId,
      userId: req.user.id,
    };

    if (["planned", "done"].includes(status)) {
      filter.status = status;
    }

    const plans = await PlannedEvent.find(filter)
      .sort({ date: -1 })
      .populate("carId");

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load planned events" });
  }
});

// Mark a planned item as done
router.patch("/:id/done", auth, async (req, res) => {
  try {
    const planned = await PlannedEvent.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!planned) {
      return res.status(404).json({ message: "Planned item not found" });
    }

    planned.status = "done";
    await planned.save();

    const populated = await planned.populate("carId");
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to mark planned item as done" });
  }
});

module.exports = router;
