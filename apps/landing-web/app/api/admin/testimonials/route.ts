import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.resolve(process.cwd(), "data/testimonials.json");

// Ensure data file exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  const initialData = [
    { 
      id: "1",
      name: "Dr. Michael Chen",
      role: "Principal, Lincoln High School",
      content: "This platform has revolutionized how we manage our institution. The mutual transfer system alone saved us countless hours of paperwork. Highly recommended!",
      rating: 5,
      image: "/assets/testimonial-1.png",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "Sarah Williams",
      role: "Math Teacher, Riverside Academy",
      content: "The AI exam monitoring is a game-changer. I can now focus on creating better assessments instead of worrying about academic integrity. The auto-grading feature saves me hours every week.",
      rating: 5,
      image: "/assets/testimonial-2.png",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "Alex Thompson",
      role: "Student, Grade 11",
      content: "I love the leaderboard feature! It motivates me to study harder and compete with my friends in a healthy way. The live classes are super interactive and easy to follow.",
      rating: 5,
      image: "/assets/testimonial-3.png",
      active: true,
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

export async function GET() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const testimonial = await req.json();
    const currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    
    const newTestimonial = {
      ...testimonial,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      active: true
    };
    
    currentData.push(newTestimonial);
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));
    
    return NextResponse.json({ success: true, testimonial: newTestimonial });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save testimonial" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updatedTestimonial = await req.json();
    const currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    
    const index = currentData.findIndex((t: any) => t.id === updatedTestimonial.id);
    if (index !== -1) {
      currentData[index] = { ...currentData[index], ...updatedTestimonial };
      fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2));
      return NextResponse.json({ success: true, testimonial: currentData[index] });
    }
    
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    
    const newData = currentData.filter((t: any) => t.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
