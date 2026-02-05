const express = require("express");
const Car = require("../models/Car");
const auth = require("../middleware/auth");

const router = express.Router();

// Get my cars
router.get("/", auth, async (req, res) => {
  const cars = await Car.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(cars);
});

// Create a car
router.post("/", auth, async (req, res) => {
  const { make, model, year, notes } = req.body || {};
  if (!make || !model || !year) return res.status(400).json({ message: "make, model, year required" });

  const car = await Car.create({
    userId: req.user.id,
    make,
    model,
    year: Number(year),
    notes: notes || "",
  });

  res.status(201).json(car);
});

// Delete a car (only if it belongs to you)
router.delete("/:id", auth, async (req, res) => {
  const car = await Car.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!car) return res.status(404).json({ message: "Car not found" });
  res.json({ ok: true });
});

module.exports = router;
