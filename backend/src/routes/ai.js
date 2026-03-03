const express = require("express");
const { generateAiAdvice } = require("../services/aiService");
const auth = require("../middleware/auth");

const router = express.Router();

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

module.exports = router;
