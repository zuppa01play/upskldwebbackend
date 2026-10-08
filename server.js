import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const app = express();
const PORT = process.env.PORT || 4002;

// ---------- CORS ----------
const allowedOrigins = [
  "https://upskldai.com",
  "https://www.upskldai.com",
  // local development
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // origin illa na (Postman / server-to-server) allow
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- MongoDB ----------
const client = new MongoClient(process.env.DB);
let db;

async function connectDB() {
  await client.connect();
  db = client.db("UPSKLD");
  console.log("MongoDB connected -> UPSKLD");
}

// ---------- Nodemailer ----------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAILPASSWORD,
  },
});

// ---------- Helpers ----------
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Routes ----------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Submit the "HomeCreerForm" -> saves into webstudentform collection
async function submitStudentForm(req, res) {
  try {
    const { fullName, phone, email, role } = req.body || {};

    if (!fullName || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone and email are required",
      });
    }

    const cleanPhone = String(phone).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    const doc = {
      fullName: String(fullName).trim(),
      phone: cleanPhone,
      email: cleanEmail,
      role: role || "Working professional",
      createdAt: new Date(),
    };

    const result = await db.collection("webstudentform").insertOne(doc);

    // Fire-and-forget notification email — don't fail the request if this errors
    transporter
      .sendMail({
        from: `"UPSKLD Website" <${process.env.EMAIL}>`,
        to: process.env.EMAIL,
        subject: "New Career Counselling Request",
        text: `New submission received:

Name: ${doc.fullName}
Phone: ${doc.phone}
Email: ${doc.email}
Role: ${doc.role}
Submitted at: ${doc.createdAt.toLocaleString()}`,
      })
      .catch((err) => console.error("Email send failed:", err.message));

    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error("Form submit error:", err);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}

// rendu path-um work aagum (nginx /api strip pannalum pannalum problem illa)
app.post(["/student-form", "/api/student-form"], submitStudentForm);

// --- Admin (optional, uses JWT_SECRET) ---

// TODO: replace this with a real admin user check (DB-backed, hashed password)
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "changeme") {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "8h" });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
});

// List submissions (protected)
app.get("/api/admin/submissions", verifyToken, async (req, res) => {
  try {
    const submissions = await db
      .collection("webstudentform")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a submission (protected)
app.delete("/api/admin/submissions/:id", verifyToken, async (req, res) => {
  try {
    const result = await db
      .collection("webstudentform")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------- Start ----------
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });