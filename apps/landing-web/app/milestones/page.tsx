"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TimelineItem } from "@/components/shared/TimelineItem";
import { motion } from "framer-motion";

const milestones = [
  {
    title: "Project Proposal",
    date: "August 2024",
    description: "Initial project proposal submitted covering research objectives, methodology, and scope. Approved by supervisory panel.",
    status: "completed" as const,
  },
  {
    title: "PP1 Presentation",
    date: "October 2024",
    description: "First progress presentation showcasing literature review, requirement analysis, system architecture, and early prototypes.",
    status: "completed" as const,
  },
  {
    title: "PP2 Presentation",
    date: "February 2025",
    description: "Second progress presentation covering completed modules, integration results, testing outcomes, and revised timelines.",
    status: "completed" as const,
  },
  {
    title: "Final Assessment",
    date: "May 2025",
    description: "Full system demonstration to the evaluation panel. Submission of final report, codebase, and supporting documentation.",
    status: "ongoing" as const,
  },
  {
    title: "Viva",
    date: "June 2025",
    description: "Oral defence of the research project before the examination panel.",
    status: "pending" as const,
  },
];

const stats = [
  { label: "Completed", count: milestones.filter(m => m.status === "completed").length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  { label: "Ongoing", count: milestones.filter(m => m.status === "ongoing").length, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { label: "Pending", count: milestones.filter(m => m.status === "pending").length, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
];

export default function MilestonesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Project Timeline
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Milestones
          </h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Track the progress of ArmiGo from proposal to viva.
          </p>
        </motion.div>

        {/* Status summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center gap-4 mt-8 flex-wrap"
        >
          {stats.map((s) => (
            <div key={s.label} className={`border rounded-xl px-6 py-3 ${s.bg} flex flex-col items-center min-w-[90px]`}>
              <span className={`text-3xl font-extrabold ${s.color}`}>{s.count}</span>
              <span className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <main className="flex-1 container-custom pb-20 max-w-3xl mx-auto w-full px-4">
        <div className="mt-4">
          {milestones.map((m, i) => (
            <TimelineItem
              key={m.title}
              {...m}
              index={i}
              isLast={i === milestones.length - 1}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
