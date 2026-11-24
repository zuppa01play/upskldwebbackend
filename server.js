// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from "url";
// import { MongoClient, ObjectId } from "mongodb";
// import jwt from "jsonwebtoken";
// import nodemailer from "nodemailer";
// import Razorpay from "razorpay";
// import crypto from "crypto";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 4002;

// // ---------- CORS ----------
// const allowedOrigins = [
//   "https://upskldai.com",
//   "https://www.upskldai.com",
//   "http://localhost:4200",
//   "http://127.0.0.1:4200",
//   // local development
//   "http://localhost:3000",
//   "http://localhost:5173",
//   "http://127.0.0.1:3000",
//   "http://127.0.0.1:5173",
// ];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // origin illa na (Postman / server-to-server) allow
//       if (!origin || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       return callback(null, false);
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ---------- MongoDB ----------
// const client = new MongoClient(process.env.DB);
// let db;

// async function connectDB() {
//   await client.connect();
//   db = client.db("UPSKLD");
//   console.log("MongoDB connected -> UPSKLD");
// }

// // ---------- Nodemailer ----------
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAILPASSWORD,
//   },
// });

// // ---------- Helpers ----------
// function verifyToken(req, res, next) {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({ success: false, message: "No token provided" });
//   }
//   jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//     if (err) return res.status(403).json({ success: false, message: "Invalid token" });
//     req.user = decoded;
//     next();
//   });
// }

// const PHONE_REGEX = /^[0-9]{10}$/;
// const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// // user typed text goes into the email HTML -> escape it
// const escapeHtml = (value) =>
//   String(value ?? "")
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#39;");

// // only these audience values + detail keys are accepted from the form
// const AUDIENCES = ["Small Business", "Working Professionals", "Students"];
// const DETAIL_KEYS = { businessType: "Type of business", jobRole: "Your role", college: "College / course" };

// // "+91 98765 43210" -> "9876543210"
// const normalizePhone = (value) => {
//   const digits = String(value || "").replace(/\D/g, "");
//   return digits.length > 10 && digits.startsWith("91") ? digits.slice(-10) : digits;
// };

// // one aligned row for the bootcamp mails (value must be escaped by the caller)
// const mailRow = (label, value) => `
//           <tr>
//             <td style="padding:10px 14px 10px 0;width:130px;vertical-align:top;font-size:14px;color:#6b6685;border-bottom:1px solid #efedf7;">${label}</td>
//             <td style="padding:10px 0;vertical-align:top;font-size:14px;font-weight:600;color:#0f0a2a;border-bottom:1px solid #efedf7;word-break:break-word;">${value}</td>
//           </tr>`;

// // "Thank you for reaching out" mail that goes to the person who filled the form
// function buildThankYouMail(doc) {
//   const name = escapeHtml(doc.fullName.split(" ")[0] || doc.fullName);
//   const detailRow = doc.detail
//     ? `<tr><td style="padding:4px 12px 4px 0;color:#6b6685;">${escapeHtml(doc.detailLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.detail)}</td></tr>`
//     : "";

//   const html = `
//   <div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
//     <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(64,21,159,.12);">
//       <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#ffffff;">
//         <div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div>
//         <div style="font-size:12px;opacity:.85;margin-top:2px;">AI for growth</div>
//       </div>
//       <div style="padding:28px;">
//         <h2 style="margin:0 0 12px;font-size:20px;">Thank you for reaching out to UPSKLD, ${name}!</h2>
//         <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3d3957;">
//           We have received your request for a <b>free 15-minute session</b>.
//           Our team will reach out to you shortly on WhatsApp, email or phone to schedule it.
//         </p>
//         <table style="font-size:14px;margin:0 0 18px;border-collapse:collapse;">
//           <tr><td style="padding:4px 12px 4px 0;color:#6b6685;">Name</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.fullName)}</td></tr>
//           <tr><td style="padding:4px 12px 4px 0;color:#6b6685;">Phone</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.phone)}</td></tr>
//           <tr><td style="padding:4px 12px 4px 0;color:#6b6685;">I am a</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.role)}</td></tr>
//           ${detailRow}
//         </table>
//         <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#3d3957;">
//           No pitch, no pressure. Just a short call to map your AI roadmap.
//         </p>
//         <p style="margin:18px 0 0;font-size:14px;color:#3d3957;">Warm regards,<br /><b>Team UPSKLD</b><br />
//           <a href="https://upskldai.com" style="color:#4a1a9e;">upskldai.com</a></p>
//       </div>
//       <div style="padding:14px 28px;background:#faf7ff;font-size:11.5px;color:#8a86a0;">
//         You are receiving this email because you submitted the free session form on upskldai.com.
//         A brand of Impactree Data Technologies.
//       </div>
//     </div>
//   </div>`;

//   const text = `Thank you for reaching out to UPSKLD, ${doc.fullName}!

// We have received your request for a free 15-minute session. Our team will reach out to you shortly on WhatsApp, email or phone to schedule it.

// No pitch, no pressure. Just a short call to map your AI roadmap.

// Warm regards,
// Team UPSKLD
// https://upskldai.com`;

//   return { html, text };
// }

// // ---------- Bootcamp config ----------
// const BOOTCAMP_DATE = "05 December 2026"; // exact date theriyum pothu maathikonga

// // Thank-you mail that goes to the student after bootcamp registration
// function buildBootcampThankYouMail(doc) {
//   const name = escapeHtml(doc.fullName.split(" ")[0] || doc.fullName);

//   const html = `
//   <div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
//     <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(64,21,159,.12);">
//       <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#ffffff;">
//         <div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div>
//         <div style="font-size:12px;opacity:.85;margin-top:2px;">AI for growth</div>
//       </div>
//       <div style="padding:28px;">
//         <h2 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Thank you for registering, ${name}!</h2>
//         <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#3d3957;">
//           Your registration for the <b>UPSKLD AI Bootcamp</b> is received.
//           Our team will reach out to you <b>shortly</b> on WhatsApp, email or phone with the next steps.
//         </p>
//         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
//           ${mailRow("Name", escapeHtml(doc.fullName))}
//           ${mailRow("Phone", escapeHtml(doc.phone))}
//           ${mailRow("College", escapeHtml(doc.college))}
//           ${mailRow("Bootcamp date", escapeHtml(BOOTCAMP_DATE))}
//         </table>
//         <p style="margin:0;font-size:14px;line-height:1.6;color:#3d3957;">Warm regards,<br /><b>Team UPSKLD</b><br />
//           <a href="https://upskldai.com" style="color:#4a1a9e;">upskldai.com</a></p>
//       </div>
//       <div style="padding:14px 28px;background:#faf7ff;font-size:11.5px;line-height:1.5;color:#8a86a0;">
//         You are receiving this email because you registered for the bootcamp on upskldai.com.
//         A brand of Impactree Data Technologies.
//       </div>
//     </div>
//   </div>`;

//   const text = `Thank you for registering, ${doc.fullName}!

// Your registration for the UPSKLD AI Bootcamp is received. Our team will reach out to you shortly on WhatsApp, email or phone with the next steps.

// Name: ${doc.fullName}
// Phone: ${doc.phone}
// College: ${doc.college}
// Bootcamp date: ${BOOTCAMP_DATE}

// Warm regards,
// Team UPSKLD
// https://upskldai.com`;

//   return { html, text };
// }

// // Notification mail that goes to the UPSKLD team for every bootcamp registration
// function buildBootcampTeamMail(doc) {
//   const submittedAt = doc.createdAt.toLocaleString("en-IN", {
//     timeZone: "Asia/Kolkata",
//     dateStyle: "medium",
//     timeStyle: "short",
//   });
//   const emailLink = `<a href="mailto:${escapeHtml(doc.email)}" style="color:#4a1a9e;text-decoration:none;">${escapeHtml(doc.email)}</a>`;

//   const html = `
//   <div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
//     <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(64,21,159,.12);">
//       <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#ffffff;">
//         <div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div>
//         <div style="font-size:12px;opacity:.85;margin-top:2px;">AI Bootcamp</div>
//       </div>
//       <div style="padding:28px;">
//         <h2 style="margin:0 0 8px;font-size:20px;line-height:1.3;">New bootcamp registration received</h2>
//         <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#6b6685;">
//           A new student has registered for the UPSKLD AI Bootcamp. Details are below.
//         </p>
//         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
//           ${mailRow("Name", escapeHtml(doc.fullName))}
//           ${mailRow("Email", emailLink)}
//           ${mailRow("Phone", escapeHtml(doc.phone))}
//           ${mailRow("College", escapeHtml(doc.college))}
//           ${mailRow("Bootcamp date", escapeHtml(doc.bootcampDate))}
//           ${mailRow("Submitted at", escapeHtml(submittedAt) + " IST")}
//         </table>
//         <p style="margin:0;font-size:13px;line-height:1.6;color:#6b6685;">
//           Tip: hit <b>Reply</b> to write directly to the student.
//         </p>
//       </div>
//       <div style="padding:14px 28px;background:#faf7ff;font-size:11.5px;line-height:1.5;color:#8a86a0;">
//         Automated notification from upskldai.com/bootcamp.
//       </div>
//     </div>
//   </div>`;

//   const text = `New bootcamp registration received

// Name: ${doc.fullName}
// Email: ${doc.email}
// Phone: ${doc.phone}
// College: ${doc.college}
// Bootcamp date: ${doc.bootcampDate}
// Submitted at: ${submittedAt} IST`;

//   return { html, text };
// }

// // ---------- Routes ----------

// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({ success: true, message: "Server is running" });
// });

// // Submit the "HomeCreerForm" -> saves into webstudentform collection
// async function submitStudentForm(req, res) {
//   try {
//     const {
//       fullName,
//       phone,
//       email,
//       role,
//       city,
//       audience,
//       detailLabel,
//       detailKey,
//       detail,
//     } = req.body || {};

//     if (!fullName || !phone || !email) {
//       return res.status(400).json({
//         success: false,
//         message: "Full name, phone and email are required",
//       });
//     }

//     const cleanPhone = normalizePhone(phone);
//     const cleanEmail = String(email).trim().toLowerCase();

//     if (!PHONE_REGEX.test(cleanPhone)) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number must be exactly 10 digits",
//       });
//     }

//     if (!EMAIL_REGEX.test(cleanEmail)) {
//       return res.status(400).json({
//         success: false,
//         message: "Enter a valid email address",
//       });
//     }

//     // extra input: Type of business / Your role / College / course (depends on the header tab)
//     const cleanDetailKey = Object.prototype.hasOwnProperty.call(DETAIL_KEYS, detailKey)
//       ? detailKey
//       : "";
//     const cleanDetail = String(detail || "").trim().slice(0, 120);

//     const doc = {
//       fullName: String(fullName).trim().slice(0, 100),
//       phone: cleanPhone,
//       email: cleanEmail,
//       role: String(role || "Working professional").trim().slice(0, 60),
//       city: String(city || "").trim().slice(0, 80),
//       audience: AUDIENCES.includes(audience) ? audience : "",
//       detailLabel: cleanDetailKey ? DETAIL_KEYS[cleanDetailKey] : String(detailLabel || "").slice(0, 40),
//       detail: cleanDetail,
//       createdAt: new Date(),
//     };
//     // also keep it under its own field: businessType / jobRole / college
//     if (cleanDetailKey) doc[cleanDetailKey] = cleanDetail;

//     const result = await db.collection("webstudentform").insertOne(doc);

//     // Emails are fire-and-forget — the request must not fail if mail fails
//     // 1) notification for the UPSKLD team
//     transporter
//       .sendMail({
//         from: `"UPSKLD Website" <${process.env.EMAIL}>`,
//         to: process.env.EMAIL,
//         replyTo: doc.email,
//         subject: `New Free Session Request${doc.audience ? ` · ${doc.audience}` : ""}`,
//         text: `New submission received:

// Name: ${doc.fullName}
// Phone: ${doc.phone}
// Email: ${doc.email}
// I am a: ${doc.role}
// Tab: ${doc.audience || "-"}
// ${doc.detailLabel || "Detail"}: ${doc.detail || "-"}
// City: ${doc.city || "-"}
// Submitted at: ${doc.createdAt.toLocaleString()}`,
//       })
//       .catch((err) => console.error("Team email failed:", err.message));

//     // 2) thank-you mail for the person who submitted the form
//     const thanks = buildThankYouMail(doc);
//     transporter
//       .sendMail({
//         from: `"UPSKLD" <${process.env.EMAIL}>`,
//         to: doc.email,
//         subject: "Thank you for reaching out to UPSKLD",
//         text: thanks.text,
//         html: thanks.html,
//       })
//       .catch((err) => console.error("Thank-you email failed:", err.message));

//     res.status(201).json({ success: true, id: result.insertedId });
//   } catch (err) {
//     console.error("Form submit error:", err);
//     res.status(500).json({ success: false, message: "Server error. Please try again." });
//   }
// }

// // rendu path-um work aagum (nginx /api strip pannalum pannalum problem illa)
// app.post(["/student-form", "/api/student-form"], submitStudentForm);

// // ---------- Bootcamp registration -> webbootcamp collection ----------
// async function submitBootcampRegistration(req, res) {
//   try {
//     const { fullName, email, phone, college } = req.body || {};

//     if (!fullName || !email || !phone || !college) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const cleanPhone = normalizePhone(phone);
//     const cleanEmail = String(email).trim().toLowerCase();

//     if (!PHONE_REGEX.test(cleanPhone)) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number must be exactly 10 digits",
//       });
//     }

//     if (!EMAIL_REGEX.test(cleanEmail)) {
//       return res.status(400).json({
//         success: false,
//         message: "Enter a valid email address",
//       });
//     }

//     // same email la already register panniruntha
//     const existing = await db.collection("webbootcamp").findOne({ email: cleanEmail });
//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "This email is already registered for the bootcamp",
//       });
//     }

//     const doc = {
//       fullName: String(fullName).trim().slice(0, 100),
//       email: cleanEmail,
//       phone: cleanPhone,
//       college: String(college).trim().slice(0, 150),
//       bootcampDate: BOOTCAMP_DATE,
//       createdAt: new Date(),
//     };

//     const result = await db.collection("webbootcamp").insertOne(doc);

//     // Emails are fire-and-forget — the request must not fail if mail fails
//     // 1) registration details -> UPSKLD team
//     const teamMail = buildBootcampTeamMail(doc);
//     transporter
//       .sendMail({
//         from: `"UPSKLD Website" <${process.env.EMAIL}>`,
//         to: process.env.EMAIL,
//         replyTo: doc.email,
//         subject: "New bootcamp registration received",
//         text: teamMail.text,
//         html: teamMail.html,
//       })
//       .catch((err) => console.error("Bootcamp team email failed:", err.message));

//     // 2) thank-you mail -> student
//     const thanks = buildBootcampThankYouMail(doc);
//     transporter
//       .sendMail({
//         from: `"UPSKLD" <${process.env.EMAIL}>`,
//         to: doc.email,
//         subject: "Thank you for registering · UPSKLD AI Bootcamp",
//         text: thanks.text,
//         html: thanks.html,
//       })
//       .catch((err) => console.error("Bootcamp thank-you email failed:", err.message));

//     res.status(201).json({ success: true, id: result.insertedId });
//   } catch (err) {
//     console.error("Bootcamp register error:", err);
//     res.status(500).json({ success: false, message: "Server error. Please try again." });
//   }
// }

// app.post(["/bootcamp-register", "/api/bootcamp-register"], submitBootcampRegistration);

// // ---------- Footer "Enquire" popup (EnquirePage) -> webenquiries collection ----------
// async function submitEnquiry(req, res) {
//   try {
//     const { fullName, phone, email, role, city, audience, detailLabel, detailKey, detail, question } =
//       req.body || {};

//     if (!fullName || !phone || !email) {
//       return res.status(400).json({ success: false, message: "Full name, phone and email are required" });
//     }
//     const cleanPhone = normalizePhone(phone);
//     const cleanEmail = String(email).trim().toLowerCase();
//     if (!PHONE_REGEX.test(cleanPhone)) {
//       return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" });
//     }
//     if (!EMAIL_REGEX.test(cleanEmail)) {
//       return res.status(400).json({ success: false, message: "Enter a valid email address" });
//     }

//     const cleanDetailKey = Object.prototype.hasOwnProperty.call(DETAIL_KEYS, detailKey) ? detailKey : "";
//     const doc = {
//       type: "enquiry",
//       fullName: String(fullName).trim().slice(0, 100),
//       phone: cleanPhone,
//       email: cleanEmail,
//       role: String(role || "Student").trim().slice(0, 60),
//       city: String(city || "").trim().slice(0, 80),
//       audience: AUDIENCES.includes(audience) ? audience : "",
//       detailLabel: cleanDetailKey ? DETAIL_KEYS[cleanDetailKey] : String(detailLabel || "").slice(0, 40),
//       detail: String(detail || "").trim().slice(0, 120),
//       question: String(question || "").trim().slice(0, 1000),
//       createdAt: new Date(),
//     };
//     if (cleanDetailKey) doc[cleanDetailKey] = doc.detail;

//     const result = await db.collection("webenquiries").insertOne(doc);

//     // fire-and-forget emails
//     transporter
//       .sendMail({
//         from: `"UPSKLD Website" <${process.env.EMAIL}>`,
//         to: process.env.EMAIL,
//         replyTo: doc.email,
//         subject: `New Enquiry${doc.audience ? ` · ${doc.audience}` : ""}`,
//         text: `New enquiry received:

// Name: ${doc.fullName}
// Phone: ${doc.phone}
// Email: ${doc.email}
// I am a: ${doc.role}
// Tab: ${doc.audience || "-"}
// ${doc.detailLabel || "Detail"}: ${doc.detail || "-"}
// City: ${doc.city || "-"}
// Question: ${doc.question || "-"}
// Submitted at: ${doc.createdAt.toLocaleString()}`,
//       })
//       .catch((err) => console.error("Enquiry team email failed:", err.message));

//     const name = escapeHtml(doc.fullName.split(" ")[0] || doc.fullName);
//     const questionRow = doc.question
//       ? `<p style="margin:0 0 14px;font-size:14px;color:#3d3957;"><b>Your question:</b><br/>${escapeHtml(doc.question).replace(/\n/g, "<br/>")}</p>`
//       : "";
//     transporter
//       .sendMail({
//         from: `"UPSKLD" <${process.env.EMAIL}>`,
//         to: doc.email,
//         subject: "We received your enquiry · UPSKLD",
//         text: `Thank you for reaching out to UPSKLD, ${doc.fullName}!\n\nWe have received your enquiry and will reply within 24 hours on WhatsApp, email or phone.\n\nWarm regards,\nTeam UPSKLD\nhttps://upskldai.com`,
//         html: `<div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
//   <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
//     <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#fff;"><div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div></div>
//     <div style="padding:28px;">
//       <h2 style="margin:0 0 12px;font-size:20px;">Thank you for reaching out to UPSKLD, ${name}!</h2>
//       <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3d3957;">We have received your enquiry. Our team will reply <b>within 24 hours</b> on WhatsApp, email or phone.</p>
//       ${questionRow}
//       <p style="margin:18px 0 0;font-size:14px;color:#3d3957;">Warm regards,<br/><b>Team UPSKLD</b><br/><a href="https://upskldai.com" style="color:#4a1a9e;">upskldai.com</a></p>
//     </div>
//   </div></div>`,
//       })
//       .catch((err) => console.error("Enquiry thank-you email failed:", err.message));

//     res.status(201).json({ success: true, id: result.insertedId });
//   } catch (err) {
//     console.error("Enquiry submit error:", err);
//     res.status(500).json({ success: false, message: "Server error. Please try again." });
//   }
// }
// app.post(["/enquiry", "/api/enquiry"], submitEnquiry);


// // ---------- Razorpay ----------
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Create order
// app.post(["/payment/create-order", "/api/payment/create-order"], async (req, res) => {
//   try {
//     const { amount, currency = "INR", receipt } = req.body || {};
//     if (!amount || isNaN(amount) || Number(amount) < 1) {
//       return res.status(400).json({ success: false, message: "Minimum order amount is ₹1" });
//     }
//     const order = await razorpay.orders.create({
//       amount: Math.round(Number(amount) * 100),  // convert ₹ -> paise
//       currency,
//       receipt: receipt || `rcpt_${Date.now()}`,
//     });
//     res.json({ success: true, order });
//   } catch (err) {
//     console.error("Razorpay create-order error:", err);
//     res.status(500).json({ success: false, message: "Could not create order" });
//   }
// });

// // Verify payment signature
// app.post(["/payment/verify", "/api/payment/verify"], (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
//   if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//     return res.status(400).json({ success: false, message: "Missing payment fields" });
//   }
//   const expected = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//     .digest("hex");
//   if (expected !== razorpay_signature) {
//     return res.status(400).json({ success: false, message: "Payment verification failed" });
//   }
//   res.json({ success: true, message: "Payment verified" });
// });

// // TODO: replace this with a real admin user check (DB-backed, hashed password)
// app.post("/api/admin/login", (req, res) => {
//   const { username, password } = req.body;
//   if (username === "admin" && password === "changeme") {
//     const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "8h" });
//     return res.json({ success: true, token });
//   }
//   res.status(401).json({ success: false, message: "Invalid credentials" });
// });

// // List submissions (protected)
// app.get("/api/admin/submissions", verifyToken, async (req, res) => {
//   try {
//     const submissions = await db
//       .collection("webstudentform")
//       .find()
//       .sort({ createdAt: -1 })
//       .toArray();
//     res.json({ success: true, data: submissions });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // Delete a submission (protected)
// app.delete("/api/admin/submissions/:id", verifyToken, async (req, res) => {
//   try {
//     const result = await db
//       .collection("webstudentform")
//       .deleteOne({ _id: new ObjectId(req.params.id) });

//     if (result.deletedCount === 0) {
//       return res.status(404).json({ success: false, message: "Not found" });
//     }
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// // ---------- Frontend build (React) ----------
// // API routes ellam MELA irukku. Static + catch-all ALWAYS kadaisila.
// // Server file backend/ folder la irundha: ../frontend/build
// // Vera location na .env la FRONTEND_BUILD_PATH set pannunga
// const buildPath =
//   process.env.FRONTEND_BUILD_PATH || path.join(__dirname, "..", "frontend", "build");

// if (fs.existsSync(path.join(buildPath, "index.html"))) {
//   // robots.txt, sitemap.xml, llms.txt + react-snap prerendered pages inga irundhu serve aagum
//   app.use(express.static(buildPath));

//   // react-snap 200.html create pannum (empty SPA shell). Illana index.html use pannum
//   const spaFallback = fs.existsSync(path.join(buildPath, "200.html"))
//     ? path.join(buildPath, "200.html")
//     : path.join(buildPath, "index.html");

//   // SPA fallback: unknown GET routes -> React app. /api paths ku JSON 404
//   app.use((req, res, next) => {
//     if (req.method !== "GET" && req.method !== "HEAD") return next();
//     if (req.path.startsWith("/api/")) {
//       return res.status(404).json({ success: false, message: "Not found" });
//     }
//     res.sendFile(spaFallback);
//   });

//   console.log("Serving frontend build from:", buildPath);
// } else {
//   console.log("Frontend build not found at:", buildPath, "(API-only mode, nginx serving frontend na idhu normal)");
// }

// // ---------- Start ----------
// connectDB()
//   .then(() => {
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch((err) => {
//     console.error("Failed to connect to MongoDB:", err.message);
//     process.exit(1);
//   });





import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4002;

app.disable("x-powered-by");
// nginx oru hop irukku -> real visitor IP kedaikkum (rate limit-ku venum)
// Cloudflare-um front-la irundha 2 nu maathunga
app.set("trust proxy", 1);

// ---------- Env checks ----------
if (!process.env.DB) {
  console.error("Missing required env: DB");
  process.exit(1);
}
if (!process.env.EMAIL || !process.env.EMAILPASSWORD) {
  console.warn("EMAIL / EMAILPASSWORD not set -> mails will fail");
}
if (!process.env.JWT_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
  console.warn("Admin login disabled: set JWT_SECRET, ADMIN_USERNAME and ADMIN_PASSWORD_HASH in .env");
}

// ---------- CORS ----------
const prodOrigins = ["https://upskldai.com", "https://www.upskldai.com"];
const devOrigins = [
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];
// production-la local dev origins venaam
const allowedOrigins =
  process.env.NODE_ENV === "production" ? prodOrigins : [...prodOrigins, ...devOrigins];

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

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// ---------- MongoDB ----------
const client = new MongoClient(process.env.DB);
let db;

async function connectDB() {
  await client.connect();
  db = client.db("UPSKLD");
  console.log("MongoDB connected -> UPSKLD");

  // same email 2 thadavai register aagaama DB level-la block (race condition fix)
  try {
    await db.collection("webbootcamp").createIndex({ email: 1 }, { unique: true });
  } catch (err) {
    console.warn("webbootcamp unique email index not created (duplicates irukkalaam):", err.message);
  }
}

// ---------- Nodemailer ----------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAILPASSWORD,
  },
});

// ---------- Rate limit (simple, in-memory, no extra package) ----------
// RATE_LIMIT_DISABLED=1 -> off (nginx X-Forwarded-For set aagala na emergency switch)
function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    if (process.env.RATE_LIMIT_DISABLED === "1") return next();
    const now = Date.now();
    let entry = hits.get(req.ip);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(req.ip, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ success: false, message });
    }
    return next();
  };
}

// college lab / office Wi-Fi-la neraya per same IP-la irukkalaam -> generous limit
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many submissions. Please try again after some time.",
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
});

// ---------- Helpers ----------
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] }, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// timing-safe string compare
const safeEqual = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a ?? "")).digest();
  const hb = crypto.createHash("sha256").update(String(b ?? "")).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// ADMIN_PASSWORD_HASH = "saltHex:hashHex" (scrypt)
function verifyAdminPassword(password) {
  const stored = process.env.ADMIN_PASSWORD_HASH || "";
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(String(password ?? ""), Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// Indian mobile: 10 digits, 6-9 la start aaganum (frontend rule-oda match)
const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ERROR = "Enter a valid 10 digit Indian mobile number";

// user typed text goes into the email HTML -> escape it
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// team mails-la IST time
const istTime = (date) =>
  date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST";

// only these audience values + detail keys are accepted from the form
const AUDIENCES = ["Small Business", "Working Professionals", "Students"];
const DETAIL_KEYS = { businessType: "Type of business", jobRole: "Your role", college: "College / course" };

// "+91 98765 43210" -> "9876543210"
const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 10 && digits.startsWith("91") ? digits.slice(-10) : digits;
};

// one aligned row for the bootcamp mails (value must be escaped by the caller)
const mailRow = (label, value) => `
          <tr>
            <td style="padding:10px 14px 10px 0;width:130px;vertical-align:top;font-size:14px;color:#6b6685;border-bottom:1px solid #efedf7;">${label}</td>
            <td style="padding:10px 0;vertical-align:top;font-size:14px;font-weight:600;color:#0f0a2a;border-bottom:1px solid #efedf7;word-break:break-word;">${value}</td>
          </tr>`;

// "Thank you for reaching out" mail that goes to the person who filled the form
function buildThankYouMail(doc) {
  const name = escapeHtml(doc.fullName.split(" ")[0] || doc.fullName);
  const detailRow = doc.detail
    ? `<tr><td style="padding:4px 12px 4px 0;color:#6b6685;">${escapeHtml(doc.detailLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.detail)}</td></tr>`
    : "";

  const html = `
  <div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(64,21,159,.12);">
      <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#ffffff;">
        <div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div>
        <div style="font-size:12px;opacity:.85;margin-top:2px;">AI for growth</div>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 12px;font-size:20px;">Thank you for reaching out to UPSKLD, ${name}!</h2>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3d3957;">
          We have received your request for a <b>free 15-minute session</b>.
          Our team will reach out to you shortly on WhatsApp, email or phone to schedule it.
        </p>
        <table style="font-size:14px;margin:0 0 18px;border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#6b6685;">Name</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.fullName)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b6685;">Phone</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.phone)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b6685;">I am a</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(doc.role)}</td></tr>
          ${detailRow}
        </table>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.6;color:#3d3957;">
          No pitch, no pressure. Just a short call to map your AI roadmap.
        </p>
        <p style="margin:18px 0 0;font-size:14px;color:#3d3957;">Warm regards,<br /><b>Team UPSKLD</b><br />
          <a href="https://upskldai.com" style="color:#4a1a9e;">upskldai.com</a></p>
      </div>
      <div style="padding:14px 28px;background:#faf7ff;font-size:11.5px;color:#8a86a0;">
        You are receiving this email because you submitted the free session form on upskldai.com.
        A brand of Impactree Data Technologies.
      </div>
    </div>
  </div>`;

  const text = `Thank you for reaching out to UPSKLD, ${doc.fullName}!

We have received your request for a free 15-minute session. Our team will reach out to you shortly on WhatsApp, email or phone to schedule it.

No pitch, no pressure. Just a short call to map your AI roadmap.

Warm regards,
Team UPSKLD
https://upskldai.com`;

  return { html, text };
}

// ---------- Bootcamp config ----------
const BOOTCAMP_DATE = "05 December 2026"; // exact date theriyum pothu maathikonga
// Frontend BootCamp.js-la irukkura BOOTCAMP_PRICE-oda SAME aaganum (server-la payment amount check pannum)
const BOOTCAMP_PRICE_INR = Number(process.env.BOOTCAMP_PRICE_INR || 99);
const BOOTCAMP_CATEGORIES = ["Student", "Company", "Business"];

// Thank-you mail that goes to the student after bootcamp registration
function buildBootcampThankYouMail(doc) {
  const name = escapeHtml(doc.fullName.split(" ")[0] || doc.fullName);

  const html = `
  <div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(64,21,159,.12);">
      <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#ffffff;">
        <div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div>
        <div style="font-size:12px;opacity:.85;margin-top:2px;">AI for growth</div>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Thank you for registering, ${name}!</h2>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#3d3957;">
          Your registration for the <b>UPSKLD AI Bootcamp</b> is received.
          Our team will reach out to you <b>shortly</b> on WhatsApp, email or phone with the next steps.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
          ${mailRow("Name", escapeHtml(doc.fullName))}
          ${mailRow("Phone", escapeHtml(doc.phone))}
          ${mailRow("College", escapeHtml(doc.college))}
          ${mailRow("Bootcamp date", escapeHtml(BOOTCAMP_DATE))}
        </table>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#3d3957;">Warm regards,<br /><b>Team UPSKLD</b><br />
          <a href="https://upskldai.com" style="color:#4a1a9e;">upskldai.com</a></p>
      </div>
      <div style="padding:14px 28px;background:#faf7ff;font-size:11.5px;line-height:1.5;color:#8a86a0;">
        You are receiving this email because you registered for the bootcamp on upskldai.com.
        A brand of Impactree Data Technologies.
      </div>
    </div>
  </div>`;

  const text = `Thank you for registering, ${doc.fullName}!

Your registration for the UPSKLD AI Bootcamp is received. Our team will reach out to you shortly on WhatsApp, email or phone with the next steps.

Name: ${doc.fullName}
Phone: ${doc.phone}
College: ${doc.college}
Bootcamp date: ${BOOTCAMP_DATE}

Warm regards,
Team UPSKLD
https://upskldai.com`;

  return { html, text };
}

// Notification mail that goes to the UPSKLD team for every bootcamp registration
function buildBootcampTeamMail(doc) {
  const submittedAt = doc.createdAt.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const emailLink = `<a href="mailto:${escapeHtml(doc.email)}" style="color:#4a1a9e;text-decoration:none;">${escapeHtml(doc.email)}</a>`;

  const html = `
  <div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(64,21,159,.12);">
      <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#ffffff;">
        <div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div>
        <div style="font-size:12px;opacity:.85;margin-top:2px;">AI Bootcamp</div>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 8px;font-size:20px;line-height:1.3;">New bootcamp registration received</h2>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#6b6685;">
          A new student has registered for the UPSKLD AI Bootcamp. Details are below.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;">
          ${mailRow("Name", escapeHtml(doc.fullName))}
          ${mailRow("Email", emailLink)}
          ${mailRow("Phone", escapeHtml(doc.phone))}
          ${mailRow("College", escapeHtml(doc.college))}
          ${mailRow("I am a", escapeHtml(doc.category || "-"))}
          ${mailRow("Payment", escapeHtml(doc.payment ? `Paid ₹${doc.amountPaid} (${doc.paymentId})` : "Not paid"))}
          ${mailRow("Bootcamp date", escapeHtml(doc.bootcampDate))}
          ${mailRow("Submitted at", escapeHtml(submittedAt) + " IST")}
        </table>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b6685;">
          Tip: hit <b>Reply</b> to write directly to the student.
        </p>
      </div>
      <div style="padding:14px 28px;background:#faf7ff;font-size:11.5px;line-height:1.5;color:#8a86a0;">
        Automated notification from upskldai.com/bootcamp.
      </div>
    </div>
  </div>`;

  const text = `New bootcamp registration received

Name: ${doc.fullName}
Email: ${doc.email}
Phone: ${doc.phone}
College / company: ${doc.college}
I am a: ${doc.category || "-"}
Payment: ${doc.payment ? `Paid Rs.${doc.amountPaid} (${doc.paymentId})` : "Not paid"}
Bootcamp date: ${doc.bootcampDate}
Submitted at: ${submittedAt} IST`;

  return { html, text };
}

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
      return res.status(400).json({ success: false, message: PHONE_ERROR });
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
Submitted at: ${istTime(doc.createdAt)}`,
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
app.post(["/student-form", "/api/student-form"], formLimiter, submitStudentForm);

// ---------- Bootcamp registration -> webbootcamp collection ----------
// Flow:
//   1) "Reserve my seat" click   -> POST /api/bootcamp-register          -> saved with payment:false
//   2) Razorpay payment success  -> POST /api/bootcamp-register/confirm  -> payment:true (+ mails)
// Payment pannala na record payment:false-la (Not paid) appadiye irukkum.

// findOneAndUpdate: driver version-ku ettha result shape maarum ({value} vs document)
const unwrap = (r) => (r && Object.prototype.hasOwnProperty.call(r, "value") ? r.value : r);

function isValidRazorpaySignature(orderId, paymentId, signature) {
  const expected = Buffer.from(
    crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex"),
    "hex"
  );
  const received = Buffer.from(String(signature), "hex");
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
}

async function submitBootcampRegistration(req, res) {
  try {
    const { fullName, email, phone, college, category } = req.body || {};

    if (!fullName || !email || !phone || !college) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanPhone = normalizePhone(phone);
    const cleanEmail = String(email).trim().toLowerCase();

    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: PHONE_ERROR });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    // category optional (pazhaya frontend anuppaadhu), aana anuppina valid-a irukkanum
    const cleanCategory = category ? String(category) : "";
    if (cleanCategory && !BOOTCAMP_CATEGORIES.includes(cleanCategory)) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const col = db.collection("webbootcamp");

    // already paid (illa pazhaya flow-la payment-ku apram register aana record) -> block
    const alreadyRegistered = await col.findOne({ email: cleanEmail, payment: { $ne: false } });
    if (alreadyRegistered) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered for the bootcamp",
      });
    }

    // payment:false record irundha adhaye update pannum (payment cancel panni thirumba try pannina duplicate aagaadhu)
    const now = new Date();
    let saved;
    try {
      saved = unwrap(
        await col.findOneAndUpdate(
          { email: cleanEmail, payment: false },
          {
            $set: {
              fullName: String(fullName).trim().slice(0, 100),
              phone: cleanPhone,
              college: String(college).trim().slice(0, 150),
              category: cleanCategory,
              bootcampDate: BOOTCAMP_DATE,
              payment: false,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true, returnDocument: "after" }
        )
      );
    } catch (err) {
      // rendu request same neram vandha unique index duplicate error tharum -> pending record-a eduthuko
      if (err && err.code === 11000) {
        saved = await col.findOne({ email: cleanEmail });
        if (!saved || saved.payment !== false) {
          return res.status(409).json({
            success: false,
            message: "This email is already registered for the bootcamp",
          });
        }
      } else {
        throw err;
      }
    }

    res.status(201).json({ success: true, id: saved._id });
  } catch (err) {
    console.error("Bootcamp register error:", err);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}

async function confirmBootcampPayment(req, res) {
  try {
    if (!razorpay) {
      return res.status(503).json({ success: false, message: "Payments are not configured" });
    }
    const { id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!id || !ObjectId.isValid(id) || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    const col = db.collection("webbootcamp");
    const reg = await col.findOne({ _id: new ObjectId(id) });
    if (!reg) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    if (reg.payment === true) {
      return res.json({ success: true, alreadyPaid: true });
    }

    // signature anuppina adhu correct-a irukkanum
    if (razorpay_signature && !isValidRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Razorpay-kitta direct-a kekkurom: payment real-a, indha order-ku, correct amount-a?
    let payment;
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (err) {
      console.error("Razorpay fetch payment error:", err);
      return res.status(400).json({ success: false, message: "Payment could not be verified" });
    }
    const statusOk = ["captured", "authorized"].includes(payment.status);
    const orderOk = payment.order_id === razorpay_order_id;
    const amountOk = payment.currency === "INR" && Number(payment.amount) >= BOOTCAMP_PRICE_INR * 100;
    if (!statusOk || !orderOk || !amountOk) {
      return res.status(400).json({ success: false, message: "Payment could not be verified" });
    }

    // oru payment id vechi 2 registration paid aagakoodathu
    const reused = await col.findOne({ paymentId: razorpay_payment_id, _id: { $ne: reg._id } });
    if (reused) {
      return res.status(409).json({ success: false, message: "This payment is already used" });
    }

    const updated = unwrap(
      await col.findOneAndUpdate(
        { _id: reg._id, payment: { $ne: true } },
        {
          $set: {
            payment: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paymentStatus: payment.status,
            amountPaid: Number(payment.amount) / 100,
            paidAt: new Date(),
          },
        },
        { returnDocument: "after" }
      )
    );

    // rendu confirm request same neram vandhalum mail oru thadavai dhaan
    if (!updated) return res.json({ success: true, alreadyPaid: true });

    // Emails are fire-and-forget — the request must not fail if mail fails
    const teamMail = buildBootcampTeamMail(updated);
    transporter
      .sendMail({
        from: `"UPSKLD Website" <${process.env.EMAIL}>`,
        to: process.env.EMAIL,
        replyTo: updated.email,
        subject: "New bootcamp registration (paid)",
        text: teamMail.text,
        html: teamMail.html,
      })
      .catch((err) => console.error("Bootcamp team email failed:", err.message));

    const thanks = buildBootcampThankYouMail(updated);
    transporter
      .sendMail({
        from: `"UPSKLD" <${process.env.EMAIL}>`,
        to: updated.email,
        subject: "Thank you for registering · UPSKLD AI Bootcamp",
        text: thanks.text,
        html: thanks.html,
      })
      .catch((err) => console.error("Bootcamp thank-you email failed:", err.message));

    res.json({ success: true });
  } catch (err) {
    console.error("Bootcamp confirm error:", err);
    res.status(500).json({ success: false, message: "Server error. Please contact support." });
  }
}

const confirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many requests. Please try again after some time.",
});

app.post(["/bootcamp-register", "/api/bootcamp-register"], formLimiter, submitBootcampRegistration);
app.post(["/bootcamp-register/confirm", "/api/bootcamp-register/confirm"], confirmLimiter, confirmBootcampPayment);

// ---------- Footer "Enquire" popup (EnquirePage) -> webenquiries collection ----------
async function submitEnquiry(req, res) {
  try {
    const { fullName, phone, email, role, city, audience, detailLabel, detailKey, detail, question } =
      req.body || {};

    if (!fullName || !phone || !email) {
      return res.status(400).json({ success: false, message: "Full name, phone and email are required" });
    }
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = String(email).trim().toLowerCase();
    if (!PHONE_REGEX.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: PHONE_ERROR });
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    const cleanDetailKey = Object.prototype.hasOwnProperty.call(DETAIL_KEYS, detailKey) ? detailKey : "";
    const doc = {
      type: "enquiry",
      fullName: String(fullName).trim().slice(0, 100),
      phone: cleanPhone,
      email: cleanEmail,
      role: String(role || "Student").trim().slice(0, 60),
      city: String(city || "").trim().slice(0, 80),
      audience: AUDIENCES.includes(audience) ? audience : "",
      detailLabel: cleanDetailKey ? DETAIL_KEYS[cleanDetailKey] : String(detailLabel || "").slice(0, 40),
      detail: String(detail || "").trim().slice(0, 120),
      question: String(question || "").trim().slice(0, 1000),
      createdAt: new Date(),
    };
    if (cleanDetailKey) doc[cleanDetailKey] = doc.detail;

    const result = await db.collection("webenquiries").insertOne(doc);

    // fire-and-forget emails
    transporter
      .sendMail({
        from: `"UPSKLD Website" <${process.env.EMAIL}>`,
        to: process.env.EMAIL,
        replyTo: doc.email,
        subject: `New Enquiry${doc.audience ? ` · ${doc.audience}` : ""}`,
        text: `New enquiry received:

Name: ${doc.fullName}
Phone: ${doc.phone}
Email: ${doc.email}
I am a: ${doc.role}
Tab: ${doc.audience || "-"}
${doc.detailLabel || "Detail"}: ${doc.detail || "-"}
City: ${doc.city || "-"}
Question: ${doc.question || "-"}
Submitted at: ${istTime(doc.createdAt)}`,
      })
      .catch((err) => console.error("Enquiry team email failed:", err.message));

    const name = escapeHtml(doc.fullName.split(" ")[0] || doc.fullName);
    const questionRow = doc.question
      ? `<p style="margin:0 0 14px;font-size:14px;color:#3d3957;"><b>Your question:</b><br/>${escapeHtml(doc.question).replace(/\n/g, "<br/>")}</p>`
      : "";
    transporter
      .sendMail({
        from: `"UPSKLD" <${process.env.EMAIL}>`,
        to: doc.email,
        subject: "We received your enquiry · UPSKLD",
        text: `Thank you for reaching out to UPSKLD, ${doc.fullName}!\n\nWe have received your enquiry and will reply within 24 hours on WhatsApp, email or phone.\n\nWarm regards,\nTeam UPSKLD\nhttps://upskldai.com`,
        html: `<div style="background:#f6f1ff;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#0f0a2a;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(100deg,#40159f,#7a1fc4);padding:22px 28px;color:#fff;"><div style="font-size:22px;font-weight:800;letter-spacing:1px;">UPSKLD</div></div>
    <div style="padding:28px;">
      <h2 style="margin:0 0 12px;font-size:20px;">Thank you for reaching out to UPSKLD, ${name}!</h2>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3d3957;">We have received your enquiry. Our team will reply <b>within 24 hours</b> on WhatsApp, email or phone.</p>
      ${questionRow}
      <p style="margin:18px 0 0;font-size:14px;color:#3d3957;">Warm regards,<br/><b>Team UPSKLD</b><br/><a href="https://upskldai.com" style="color:#4a1a9e;">upskldai.com</a></p>
    </div>
  </div></div>`,
      })
      .catch((err) => console.error("Enquiry thank-you email failed:", err.message));

    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error("Enquiry submit error:", err);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}
app.post(["/enquiry", "/api/enquiry"], formLimiter, submitEnquiry);


// ---------- Razorpay ----------
// keys illa na server crash aagaadhu, payment routes mattum 503 tharum
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// Create order
// NOTE: amount client-la irundhu varudhu -> yaarum 1 rupee anuppalaam.
// Payment live aagumbodhu server-la course/plan id -> amount map pannunga.
app.post(["/payment/create-order", "/api/payment/create-order"], async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, message: "Payments are not configured" });
  }
  try {
    const { amount, currency = "INR", receipt } = req.body || {};
    if (!amount || isNaN(amount) || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: "Minimum order amount is ₹1" });
    }
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100), // convert ₹ -> paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });
    res.json({ success: true, order });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ success: false, message: "Could not create order" });
  }
});

// Verify payment signature
app.post(["/payment/verify", "/api/payment/verify"], (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ success: false, message: "Payments are not configured" });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing payment fields" });
  }
  const expected = Buffer.from(
    crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex"),
    "hex"
  );
  const received = Buffer.from(String(razorpay_signature), "hex");
  const valid = received.length === expected.length && crypto.timingSafeEqual(expected, received);
  if (!valid) {
    return res.status(400).json({ success: false, message: "Payment verification failed" });
  }
  res.json({ success: true, message: "Payment verified" });
});

// ---------- Admin ----------
// Credentials .env-la irundhu: ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET
app.post("/api/admin/login", loginLimiter, (req, res) => {
  if (!process.env.JWT_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
    return res.status(503).json({ success: false, message: "Admin login is not configured" });
  }
  const { username, password } = req.body || {};
  // rendayum evaluate pannanum (timing leak varaama)
  const userOk = safeEqual(username, process.env.ADMIN_USERNAME);
  const passOk = verifyAdminPassword(password);
  if (userOk && passOk) {
    const token = jwt.sign({ username: process.env.ADMIN_USERNAME }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "8h",
    });
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
      .limit(1000)
      .toArray();
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a submission (protected)
app.delete("/api/admin/submissions/:id", verifyToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
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

// Bootcamp registrations list (protected) -> BootCampAdmin page
app.get("/api/admin/bootcamp", verifyToken, async (req, res) => {
  try {
    const rows = await db.collection("webbootcamp").find().sort({ createdAt: -1 }).limit(2000).toArray();
    const data = rows.map((r) => ({
      id: r._id,
      fullName: r.fullName || "",
      email: r.email || "",
      phone: r.phone || "",
      category: r.category || "",
      organization: r.college || "",
      payment: r.payment === true, // true = Done, false = Not paid
      paymentId: r.paymentId || "",
      paidAt: r.paidAt || null,
      createdAt: r.createdAt || null,
    }));
    res.json({
      success: true,
      total: data.length,
      paid: data.filter((r) => r.payment).length,
      data,
    });
  } catch (err) {
    console.error("Bootcamp admin list error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// /api/... la theriyaadha edhuvum -> JSON 404 (ella methods-kum)
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

// ---------- Frontend build (React) ----------
// API routes ellam MELA irukku. Static + 404 ALWAYS kadaisila.
// Server file backend/ folder la irundha: ../frontend/build
// Vera location na .env la FRONTEND_BUILD_PATH set pannunga
const buildPath = path.resolve(
  process.env.FRONTEND_BUILD_PATH || path.join(__dirname, "..", "frontend", "build")
);

// prerender-la illaadha, aana React-la irukkura real pages (200 kudukkanum, 404 illa)
// App.js-la puthu route add pannina inga-um add pannunga
const CLIENT_ONLY_ROUTES = ["/bootcamp"];

if (fs.existsSync(path.join(buildPath, "index.html"))) {
  // robots.txt, sitemap.xml, llms.txt + prerendered pages inga irundhu serve aagum
  // redirect:false -> /aboutus  ->  /aboutus/ (301) redirect varaadhu, canonical-oda match aagum
  app.use(
    express.static(buildPath, {
      redirect: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}static${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // hashed files
        } else if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // react-snap 200.html create pannum (empty SPA shell). Illana index.html use pannum
  const spaFallback = fs.existsSync(path.join(buildPath, "200.html"))
    ? path.join(buildPath, "200.html")
    : path.join(buildPath, "index.html");
  const notFoundPage = path.join(buildPath, "404.html");

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();

    let rel;
    try {
      rel = decodeURIComponent(req.path);
    } catch (e) {
      return res.status(400).send("Bad request");
    }

    // 1) prerendered page: /aboutus -> build/aboutus/index.html (200, redirect illa)
    const prerendered = path.join(buildPath, rel, "index.html");
    if (prerendered.startsWith(buildPath + path.sep) && fs.existsSync(prerendered)) {
      return res.sendFile(prerendered);
    }

    // 2) React-only route (prerender illa) -> SPA shell, 200
    const normalized = rel.toLowerCase().replace(/\/+$/, "") || "/";
    if (CLIENT_ONLY_ROUTES.includes(normalized)) {
      return res.sendFile(spaFallback);
    }

    // 3) theriyaadha URL -> real 404 status (soft-404 illa)
    res.status(404);
    if (fs.existsSync(notFoundPage)) return res.sendFile(notFoundPage);
    return res.sendFile(spaFallback); // React-oda PageNotFound render aagum, status 404
  });

  console.log("Serving frontend build from:", buildPath);
} else {
  console.log("Frontend build not found at:", buildPath, "(API-only mode, nginx serving frontend na idhu normal)");
}

// ---------- Error handler (kadaisila) ----------
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON" });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request too large" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Server error. Please try again." });
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