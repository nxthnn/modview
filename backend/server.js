require("dotenv").config();
const express = require("express");
const cors = require("cors");
console.log("MONGO_URI =", process.env.MONGO_URI);
const mongoose = require("mongoose");

const authRoutes = require("./src/routes/auth");
const carRoutes = require("./src/routes/cars");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: false,
  })
);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/cars", carRoutes);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`✅ API running on http://localhost:${process.env.PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
