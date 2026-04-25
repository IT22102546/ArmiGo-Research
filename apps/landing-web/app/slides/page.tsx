"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileCard } from "@/components/shared/FileCard";
import { Section } from "@/components/shared/Section";
import { motion } from "framer-motion";
import { Monitor } from "lucide-react";

function toSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-");
}

const slides = [
  {
    title: "Project Proposal Presentation",
    description: "Presentation slides from the initial project proposal review.",
  },
  {
    title: "Final Presentation",
    description: "Final defence presentation slides covering the complete research outcomes.",
  },
];

export default function SlidesPage() {
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
            Presentation Slides
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Slides
          </h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Download presentation slides from each milestone review.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container-custom pb-20 max-w-3xl mx-auto w-full px-4">
        <Section
          title="Presentation Slides"
          subtitle={`${slides.length} slide decks available`}
          accent
        >
          <div className="space-y-4">
            {slides.map((slide, i) => (
              <FileCard
                key={slide.title}
                title={slide.title}
                description={slide.description}
                filePath={`/uploads/slides/${toSlug(slide.title)}.pdf`}
                index={i}
              />
            ))}
          </div>
        </Section>

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-xl px-5 py-4 text-sm text-purple-700"
        >
          <Monitor className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Slides are provided as PDF exports. If a file is unavailable, it may not have been published yet.</p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
