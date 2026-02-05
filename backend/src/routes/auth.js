const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  if (password.length < 8) return res.status(400).json({ message: "Password must be 8+ characters" });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name || "", email: email.toLowerCase(), passwordHash });

  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

module.exports = router;
