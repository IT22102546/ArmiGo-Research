import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads/videos");
const METADATA_FILE = path.resolve(process.cwd(), "data/videos.json");

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(path.dirname(METADATA_FILE))) {
  fs.mkdirSync(path.dirname(METADATA_FILE), { recursive: true });
}

if (!fs.existsSync(METADATA_FILE)) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify([]));
}

export async function GET() {
  try {
    const data = fs.readFileSync(METADATA_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;
    const title = formData.get("title") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file size (100MB limit)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    // Save metadata
    const metadata = {
      id: Date.now().toString(),
      title: title || file.name,
      fileName,
      url: `/uploads/videos/${fileName}`,
      category: category || "General",
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadedAt: new Date().toISOString(),
    };

    const currentData = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
    currentData.push(metadata);
    fs.writeFileSync(METADATA_FILE, JSON.stringify(currentData, null, 2));

    return NextResponse.json({ success: true, video: metadata });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const currentData = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
    const video = currentData.find((v: any) => v.id === id);

    if (video) {
      const filePath = path.join(UPLOAD_DIR, video.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const newData = currentData.filter((v: any) => v.id !== id);
      fs.writeFileSync(METADATA_FILE, JSON.stringify(newData, null, 2));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
