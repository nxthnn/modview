require("dotenv").config();
console.log("✅ Dotenv loaded");

const express = require("express");
const cors = require("cors");
console.log("MONGO_URI =", process.env.MONGO_URI);
const mongoose = require("mongoose");

console.log("✅ Loading routes...");
const authRoutes = require("./src/routes/auth");
const carRoutes = require("./src/routes/cars");
const postRoutes = require("./src/routes/posts");
const commentRoutes = require("./src/routes/comments");
const followRoutes = require("./src/routes/follows");
const maintenanceRoutes = require("./src/routes/maintenance");
const modRoutes = require("./src/routes/mods");
const aiRoutes = require("./src/routes/ai");
const userRoutes = require("./src/routes/users");
console.log("✅ Routes loaded successfully");

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
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/mods", modRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);

async function start() {
  // Try MongoDB Atlas first
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if can't connect
    });
    console.log("✅ MongoDB Atlas connected");
  } catch (atlasErr) {
    console.error("⚠️ MongoDB Atlas failed:", atlasErr.message);
    console.log("🔄 Trying local MongoDB fallback...");
    
    // Fallback to local MongoDB
    try {
      const localUri = "mongodb://localhost:27017/modview";
      await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("✅ Local MongoDB connected (fallback mode)");
    } catch (localErr) {
      console.error("⚠️ Local MongoDB also failed:", localErr.message);
      console.log("⚠️ Starting server WITHOUT database (some features won't work)");
      console.log("💡 Make sure MongoDB service is running:");
      console.log("   Run: net start MongoDB");
    }
  }
  
  // Start server regardless of DB connection
  app.listen(process.env.PORT, () => {
    console.log(`✅ API running on http://localhost:${process.env.PORT}`);
    console.log(`🌐 Test it: http://localhost:${process.env.PORT}/api/health`);
  });
}

start();
