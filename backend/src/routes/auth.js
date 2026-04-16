const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9._]{3,20}$/.test(username);
}

router.get("/check-username", async (req, res) => {
  try {
    const username = normalizeUsername(req.query.username);

    if (!username) {
      return res.status(400).json({ message: "Username required" });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        message: "Username must be 3-20 characters and use letters, numbers, dots, or underscores",
      });
    }

    const existing = await User.findOne({ username });
    res.json({ available: !existing });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to check username" });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
      return res.status(400).json({ message: "Username required" });
    }

    if (!isValidUsername(normalizedUsername)) {
      return res.status(400).json({
        message: "Username must be 3-20 characters and use letters, numbers, dots, or underscores",
      });
    }

    if (!normalizedEmail || !password) return res.status(400).json({ message: "Email and password required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be 8+ characters" });

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) return res.status(409).json({ message: "Email already in use" });

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) return res.status(409).json({ message: "Username already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name || normalizedUsername,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token });
  } catch (err) {
    if (err && err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];
      if (duplicateField === "username") {
        return res.status(409).json({ message: "Username already in use" });
      }
      if (duplicateField === "email") {
        return res.status(409).json({ message: "Email already in use" });
      }
      return res.status(409).json({ message: "Duplicate account details" });
    }

    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed. Check server logs." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, email, password } = req.body || {};
    const loginValue = String(identifier || email || "").trim();

    if (!loginValue || !password) return res.status(400).json({ message: "Username or email and password required" });

    const lookup = loginValue.includes("@")
      ? { email: loginValue.toLowerCase() }
      : { username: normalizeUsername(loginValue) };

    const user = await User.findOne(lookup);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed. Check server logs." });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
