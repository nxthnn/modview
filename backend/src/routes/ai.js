const express = require("express");
const { generateAiAdvice, generateCarModPreview } = require("../services/aiService");
const auth = require("../middleware/auth");
const PlannedEvent = require("../models/PlannedEvent");
const Car = require("../models/Car");

const router = express.Router();

// Preview capability status
router.get("/preview-status", auth, async (req, res) => {
  const hfConfigured = Boolean(process.env.HF_API_KEY);
  const model = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-Kontext-dev";
  const mode = process.env.HF_IMAGE_MODE || "image-to-image";
  const provider = process.env.HF_IMAGE_PROVIDER || "auto";
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    enabled: hfConfigured && cloudinaryConfigured,
    hfConfigured,
    cloudinaryConfigured,
    model,
    mode,
    provider,
  });
});

// Get AI advice for a car
router.post("/advice", auth, async (req, res) => {
  try {
    const { carId, question, budget, goals } = req.body || {};
    if (!carId || !question) {
      return res.status(400).json({ message: "carId and question required" });
    }

    const advice = await generateAiAdvice(carId, question, budget, goals);
    res.json(advice);
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({
      message: err.message,
      summary: "Unable to generate advice",
      disclaimer: "An error occurred while processing your request.",
    });
  }
});

// Generate visual preview directly from an AI suggestion (without creating a plan)
router.post("/preview-direct", auth, async (req, res) => {
  try {
    const { carId, mod, basePhotoUrl } = req.body || {};
    if (!carId) {
      return res.status(400).json({ message: "carId required" });
    }

    if (!mod || !mod.title) {
      return res.status(400).json({ message: "mod with title required" });
    }

    const car = await Car.findOne({ _id: carId, userId: req.user.id });
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    const selectedBasePhoto = basePhotoUrl || car.photoUrls?.[0] || car.thumbnailUrl || "";
    const preview = await generateCarModPreview(
      car,
      {
        title: mod.title,
        why: mod.why || "",
        requires: Array.isArray(mod.requires) ? mod.requires : [],
        risks: mod.risks || "",
      },
      selectedBasePhoto
    );

    res.json(preview);
  } catch (err) {
    console.error("AI Direct Preview Error:", err);
    res.status(500).json({ message: err.message || "Unable to generate visual preview" });
  }
});

// Generate visual preview for a planned mod item
router.post("/preview", auth, async (req, res) => {
  try {
    const { planId, basePhotoUrl } = req.body || {};
    if (!planId) {
      return res.status(400).json({ message: "planId required" });
    }

    const plan = await PlannedEvent.findOne({ _id: planId, userId: req.user.id });
    if (!plan) {
      return res.status(404).json({ message: "Planned item not found" });
    }

    if (plan.itemType !== "mod") {
      return res.status(400).json({ message: "Visual previews are currently supported for mod items only" });
    }

    const car = await Car.findOne({ _id: plan.carId, userId: req.user.id });
    if (!car) {
      return res.status(404).json({ message: "Car not found for planned item" });
    }

    const selectedBasePhoto = basePhotoUrl || car.photoUrls?.[0] || car.thumbnailUrl || "";
    const preview = await generateCarModPreview(car, plan, selectedBasePhoto);

    plan.previewUrl = preview.previewUrl;
    plan.previewMessage = preview.previewMessage;
    await plan.save();

    res.json({
      previewUrl: plan.previewUrl,
      previewMessage: plan.previewMessage,
      plan,
    });
  } catch (err) {
    console.error("AI Preview Error:", err);
    res.status(500).json({ message: err.message || "Unable to generate visual preview" });
  }
});

module.exports = router;
