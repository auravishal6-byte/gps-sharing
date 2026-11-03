const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_KEY = process.env.ADMIN_KEY;

if (!ADMIN_KEY || ADMIN_KEY.length < 24) {
  throw new Error("Set a strong ADMIN_KEY");
}

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Map();
const TTL = 30 * 60 * 1000;

function authenticate(req, res, next) {
  const key = req.get("x-admin-key") || "";

  const a = Buffer.from(key);
  const b = Buffer.from(ADMIN_KEY);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

app.post("/api/create", authenticate, (req, res) => {
  const token = crypto.randomBytes(24).toString("hex");

  sessions.set(token, {
    expiresAt: Date.now() + TTL,
    location: null
  });

  res.json({
    shareLink: `/share.html?token=${token}`
  });
});

app.post("/api/share/:token", (req, res) => {
  const session = sessions.get(req.params.token);

  if (!session || session.expiresAt < Date.now()) {
    return res.status(404).json({ error: "Link expired" });
  }

  const { latitude, longitude, accuracy } = req.body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof accuracy !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(accuracy) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180 ||
    accuracy < 0 || accuracy > 100000
  ) {
    return res.status(400).json({ error: "Invalid location" });
  }

  session.location = {
    latitude,
    longitude,
    accuracy,
    sharedAt: new Date().toISOString()
  };

  res.json({ success: true });
});

app.get("/api/location/:token", authenticate, (req, res) => {
  const session = sessions.get(req.params.token);

  if (!session || session.expiresAt < Date.now()) {
    return res.status(404).json({ error: "Link expired" });
  }

  res.json({ location: session.location });
});

setInterval(() => {
  for (const [token, session] of sessions) {
    if (session.expiresAt < Date.now()) {
      sessions.delete(token);
    }
  }
}, 60000).unref();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});0

