import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.SERVER_PORT || 8002;

// ─── Directory Paths ────────────────────────────────────────────────
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const VIDEO_UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads", "videos");
const TESTIMONIAL_UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads", "testimonials");
const TESTIMONIALS_FILE = path.join(DATA_DIR, "testimonials.json");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");

// ─── Ensure Directories Exist ───────────────────────────────────────
[DATA_DIR, VIDEO_UPLOAD_DIR, TESTIMONIAL_UPLOAD_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Initialize Data Files ──────────────────────────────────────────
if (!fs.existsSync(TESTIMONIALS_FILE)) {
  const initialTestimonials = [
    {
      id: "1",
      name: "Dr. Michael Chen",
      role: "Principal, Lincoln High School",
      content:
        "This platform has revolutionized how we manage our institution. The mutual transfer system alone saved us countless hours of paperwork. Highly recommended!",
      rating: 5,
      image: "/assets/testimonial-1.png",
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Sarah Williams",
      role: "Math Teacher, Riverside Academy",
      content:
        "The AI exam monitoring is a game-changer. I can now focus on creating better assessments instead of worrying about academic integrity. The auto-grading feature saves me hours every week.",
      rating: 5,
      image: "/assets/testimonial-2.png",
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Alex Thompson",
      role: "Student, Grade 11",
      content:
        "I love the leaderboard feature! It motivates me to study harder and compete with my friends in a healthy way. The live classes are super interactive and easy to follow.",
      rating: 5,
      image: "/assets/testimonial-3.png",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
  fs.writeFileSync(
    TESTIMONIALS_FILE,
    JSON.stringify(initialTestimonials, null, 2)
  );
}

if (!fs.existsSync(VIDEOS_FILE)) {
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify([]));
}

// ─── Helper: Read/Write JSON ────────────────────────────────────────
function readJSON(filePath: string): any[] {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function writeJSON(filePath: string, data: any[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ─── Middleware ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(PUBLIC_DIR, "uploads")));

// ─── Multer: Video Upload ───────────────────────────────────────────
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, VIDEO_UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ─── Multer: Testimonial Image Upload ───────────────────────────────
const testimonialStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TESTIMONIAL_UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`),
});

const testimonialUpload = multer({
  storage: testimonialStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF allowed."));
      return;
    }
    cb(null, true);
  },
});

// ═══════════════════════════════════════════════════════════════════
//  TESTIMONIALS API
// ═══════════════════════════════════════════════════════════════════

// GET /api/admin/testimonials — List all testimonials
app.get("/api/admin/testimonials", (_req, res) => {
  try {
    const data = readJSON(TESTIMONIALS_FILE);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

// POST /api/admin/testimonials — Create testimonial
app.post("/api/admin/testimonials", (req, res) => {
  try {
    const testimonial = req.body;
    const currentData = readJSON(TESTIMONIALS_FILE);

    const newTestimonial = {
      ...testimonial,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      active: true,
    };

    currentData.push(newTestimonial);
    writeJSON(TESTIMONIALS_FILE, currentData);

    res.json({ success: true, testimonial: newTestimonial });
  } catch {
    res.status(500).json({ error: "Failed to save testimonial" });
  }
});

// PUT /api/admin/testimonials — Update testimonial
app.put("/api/admin/testimonials", (req, res) => {
  try {
    const updatedTestimonial = req.body;
    const currentData = readJSON(TESTIMONIALS_FILE);

    const index = currentData.findIndex(
      (t: any) => t.id === updatedTestimonial.id
    );

    if (index !== -1) {
      currentData[index] = { ...currentData[index], ...updatedTestimonial };
      writeJSON(TESTIMONIALS_FILE, currentData);
      res.json({ success: true, testimonial: currentData[index] });
    } else {
      res.status(404).json({ error: "Testimonial not found" });
    }
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE /api/admin/testimonials — Delete testimonial
app.delete("/api/admin/testimonials", (req, res) => {
  try {
    const { id } = req.body;
    const currentData = readJSON(TESTIMONIALS_FILE);
    const newData = currentData.filter((t: any) => t.id !== id);
    writeJSON(TESTIMONIALS_FILE, newData);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

// POST /api/admin/testimonials/upload — Upload testimonial image
app.post(
  "/api/admin/testimonials/upload",
  testimonialUpload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      res.json({
        success: true,
        url: `/uploads/testimonials/${req.file.filename}`,
        fileName: req.file.filename,
      });
    } catch {
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
//  VIDEOS API
// ═══════════════════════════════════════════════════════════════════

// GET /api/admin/videos — List all videos (admin)
app.get("/api/admin/videos", (_req, res) => {
  try {
    const data = readJSON(VIDEOS_FILE);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// POST /api/admin/videos — Upload video with metadata
app.post("/api/admin/videos", videoUpload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const metadata = {
      id: Date.now().toString(),
      title: (req.body.title as string) || req.file.originalname,
      fileName: req.file.filename,
      url: `/uploads/videos/${req.file.filename}`,
      category: (req.body.category as string) || "General",
      size: (req.file.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadedAt: new Date().toISOString(),
    };

    const currentData = readJSON(VIDEOS_FILE);
    currentData.push(metadata);
    writeJSON(VIDEOS_FILE, currentData);

    res.json({ success: true, video: metadata });
  } catch {
    res.status(500).json({ error: "Upload failed" });
  }
});

// DELETE /api/admin/videos — Delete video
app.delete("/api/admin/videos", (req, res) => {
  try {
    const { id } = req.body;
    const currentData = readJSON(VIDEOS_FILE);
    const video = currentData.find((v: any) => v.id === id);

    if (video) {
      const filePath = path.join(VIDEO_UPLOAD_DIR, video.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const newData = currentData.filter((v: any) => v.id !== id);
      writeJSON(VIDEOS_FILE, newData);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Video not found" });
    }
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

// GET /api/videos — Public: list videos (with optional category filter)
app.get("/api/videos", (req, res) => {
  try {
    if (!fs.existsSync(VIDEOS_FILE)) {
      res.json([]);
      return;
    }

    const data = readJSON(VIDEOS_FILE);
    const category = req.query.category as string | undefined;

    const videos = category
      ? data.filter((v: any) => v.category === category)
      : data;

    res.json(videos);
  } catch {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// ─── Health Check ───────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "learn-app-backend",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ┌─────────────────────────────────────────────┐`);
  console.log(`  │  LearnApp Backend Server                     │`);
  console.log(`  │  Running on: http://localhost:${PORT}           │`);
  console.log(`  │  Health:     http://localhost:${PORT}/api/health │`);
  console.log(`  └─────────────────────────────────────────────┘\n`);
});

export default app;
