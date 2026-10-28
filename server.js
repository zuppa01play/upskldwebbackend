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

// user typed text goes into the email HTML -> escape it
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// only these audience values + detail keys are accepted from the form
const AUDIENCES = ["Small Business", "Working Professionals", "Students"];
const DETAIL_KEYS = { businessType: "Type of business", jobRole: "Your role", college: "College / course" };

// "+91 98765 43210" -> "9876543210"
const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 10 && digits.startsWith("91") ? digits.slice(-10) : digits;
};

function buildThankYouMail(doc) {
  const name = escapeHtml(doc.fullName.split(" ")[0] || doc.fullName);

  const html = `
    <div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">

        <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#ffffff;">
          <div style="font-size:22px;font-weight:800;letter-spacing:1px;">
            UPSKLD
          </div>
        </div>

        <div style="padding:28px;">
          <h2 style="margin:0 0 16px;font-size:20px;">
            Thank you for reaching out to UPSKLD, ${name}!
          </h2>

          <p style="margin:0;font-size:15px;line-height:1.7;color:#3d3957;">
            Thank you for contacting UPSKLD. We have received your request,
            and our team will reach out to you shortly.
          </p>

          <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#3d3957;">
            Thank you for your interest in UPSKLD!
          </p>

          <p style="margin:18px 0 0;font-size:14px;color:#3d3957;">
            Warm regards,<br />
            <b>Team UPSKLD</b><br />
            <a href="https://upskldai.com" style="color:#4a1a9e;">
              upskldai.com
            </a>
          </p>
        </div>

      </div>
    </div>
  `;

  const text = `Thank you for reaching out to UPSKLD, ${name}!

Thank you for contacting UPSKLD. We have received your request, and our team will reach out to you shortly.

Thank you for your interest in UPSKLD!

Warm regards,
Team UPSKLD
https://upskldai.com`;

  return { html, text };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Routes ----------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Submit the "HomeCreerForm" -> saves into webstudentform collection
async function submitStudentForm(req, res) {
  try {
    const {
      fullName,
      phone,
      email,
      role,
      city,
      audience,
      detailLabel,
      detailKey,
      detail,
    } = req.body || {};

    if (!fullName || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone and email are required",
      });
    }

    const cleanPhone = normalizePhone(phone);
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

    // extra input: Type of business / Your role / College / course (depends on the header tab)
    const cleanDetailKey = Object.prototype.hasOwnProperty.call(DETAIL_KEYS, detailKey)
      ? detailKey
      : "";
    const cleanDetail = String(detail || "").trim().slice(0, 120);

    const doc = {
      fullName: String(fullName).trim().slice(0, 100),
      phone: cleanPhone,
      email: cleanEmail,
      role: String(role || "Working professional").trim().slice(0, 60),
      city: String(city || "").trim().slice(0, 80),
      audience: AUDIENCES.includes(audience) ? audience : "",
      detailLabel: cleanDetailKey ? DETAIL_KEYS[cleanDetailKey] : String(detailLabel || "").slice(0, 40),
      detail: cleanDetail,
      createdAt: new Date(),
    };
    // also keep it under its own field: businessType / jobRole / college
    if (cleanDetailKey) doc[cleanDetailKey] = cleanDetail;

    const result = await db.collection("webstudentform").insertOne(doc);

    // Emails are fire-and-forget — the request must not fail if mail fails
    // 1) notification for the UPSKLD team
    transporter
      .sendMail({
        from: `"UPSKLD Website" <${process.env.EMAIL}>`,
        to: process.env.EMAIL,
        replyTo: doc.email,
        subject: `New Free Session Request${doc.audience ? ` · ${doc.audience}` : ""}`,
        text: `New submission received:

Name: ${doc.fullName}
Phone: ${doc.phone}
Email: ${doc.email}
I am a: ${doc.role}
Tab: ${doc.audience || "-"}
${doc.detailLabel || "Detail"}: ${doc.detail || "-"}
City: ${doc.city || "-"}
Submitted at: ${doc.createdAt.toLocaleString()}`,
      })
      .catch((err) => console.error("Team email failed:", err.message));

    // 2) thank-you mail for the person who submitted the form
    const thanks = buildThankYouMail(doc);
    transporter
      .sendMail({
        from: `"UPSKLD" <${process.env.EMAIL}>`,
        to: doc.email,
        subject: "Thank you for reaching out to UPSKLD",
        text: thanks.text,
        html: thanks.html,
      })
      .catch((err) => console.error("Thank-you email failed:", err.message));

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