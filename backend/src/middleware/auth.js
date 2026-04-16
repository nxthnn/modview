const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.sub || payload.id || payload._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = { id: userId };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;
