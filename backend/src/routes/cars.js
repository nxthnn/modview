const express = require("express");
const Car = require("../models/Car");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Get my cars
router.get("/", auth, async (req, res) => {
  const cars = await Car.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(cars);
});

// Get one of my cars
router.get("/:id", auth, async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, userId: req.user.id });
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create a car
router.post("/", auth, async (req, res) => {
  try {
    const { make, model, year, notes } = req.body || {};
    const parsedYear = Number(year);

    if (!make?.trim() || !model?.trim() || !Number.isFinite(parsedYear)) {
      return res.status(400).json({ message: "make, model, year required" });
    }

    const car = await Car.create({
      userId: req.user.id,
      make: make.trim(),
      model: model.trim(),
      year: parsedYear,
      notes: notes || "",
    });

    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create car" });
  }
});

// Update one of my cars
router.patch("/:id", auth, async (req, res) => {
  try {
    console.log(`[PATCH /api/cars/:id] User ${req.user.id} updating car ${req.params.id}`);
    console.log("[PATCH body]", req.body);

    const allowed = [
      "make",
      "model",
      "year",
      "mileage",
      "engine",
      "trim",
      "notes",
      "goals",
      "tags",
      "thumbnailUrl",
      "photoUrls",
    ];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.make !== undefined) updates.make = String(updates.make).trim();
    if (updates.model !== undefined) updates.model = String(updates.model).trim();
    if (updates.engine !== undefined) updates.engine = String(updates.engine).trim();
    if (updates.trim !== undefined) updates.trim = String(updates.trim).trim();
    if (updates.notes !== undefined) updates.notes = String(updates.notes);
    if (updates.year !== undefined) updates.year = Number(updates.year);
    if (updates.mileage !== undefined) updates.mileage = Number(updates.mileage) || 0;

    console.log("[PATCH updates]", updates);

    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!car) {
      console.log("[PATCH] Car not found for user", req.user.id);
      return res.status(404).json({ message: "Car not found" });
    }

    console.log("[PATCH] Car updated successfully", car._id);
    res.json(car);
  } catch (err) {
    console.error("[PATCH error]", err.message);
    res.status(400).json({ message: err.message });
  }
});

// Upload photos for one of my cars
router.post("/:id/photos", auth, upload.array("photos", 12), async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, userId: req.user.id });
    if (!car) return res.status(404).json({ message: "Car not found" });

    const uploadedUrls = (req.files || []).map((f) => f.path).filter(Boolean);
    if (uploadedUrls.length === 0) {
      return res.status(400).json({ message: "No photos uploaded" });
    }

    car.photoUrls = [...(car.photoUrls || []), ...uploadedUrls];

    if (!car.thumbnailUrl && car.photoUrls.length > 0) {
      car.thumbnailUrl = car.photoUrls[0];
    }

    await car.save();
    res.json(car);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to upload photos" });
  }
});

// Delete one photo from one of my cars
router.delete("/:id/photos", auth, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ message: "Photo url required" });

    const car = await Car.findOne({ _id: req.params.id, userId: req.user.id });
    if (!car) return res.status(404).json({ message: "Car not found" });

    car.photoUrls = (car.photoUrls || []).filter((photoUrl) => photoUrl !== url);
    if (car.thumbnailUrl === url) {
      car.thumbnailUrl = car.photoUrls[0] || "";
    }

    await car.save();
    res.json(car);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to delete photo" });
  }
});

// Delete a car (only if it belongs to you)
router.delete("/:id", auth, async (req, res) => {
  const car = await Car.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!car) return res.status(404).json({ message: "Car not found" });
  res.json({ ok: true });
});

module.exports = router;
