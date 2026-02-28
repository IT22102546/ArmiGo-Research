import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const METADATA_FILE = path.resolve(process.cwd(), "data/videos.json");

export async function GET(req: NextRequest) {
  try {
    // Check if metadata file exists
    if (!fs.existsSync(METADATA_FILE)) {
      return NextResponse.json([]);
    }

    const data = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"));
    
    // Get category from query params
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    
    // Filter by category if provided
    const videos = category 
      ? data.filter((v: any) => v.category === category)
      : data;
    
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
