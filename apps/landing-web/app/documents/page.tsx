"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileCard } from "@/components/shared/FileCard";
import { Section } from "@/components/shared/Section";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

function toSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-");
}

const documents = [
  {
    title: "Project Proposal",
    description: "Initial research proposal outlining objectives, scope, and methodology.",
    slug: "project-proposal",
  },
  {
    title: "Project Charter",
    description: "Formal project charter defining roles, responsibilities, and deliverables.",
    slug: "project-charter",
  },
  {
    title: "Checklist 1",
    description: "Assessment checklist for the first evaluation phase.",
    slug: "checklist-1",
  },
  {
    title: "Checklist 2",
    description: "Assessment checklist for the second evaluation phase.",
    slug: "checklist-2",
  },
  {
    title: "Checklist 3",
    description: "Assessment checklist for the third evaluation phase.",
    slug: "checklist-3",
  },
  {
    title: "PP1 Presentation",
    description: "Progress presentation 1 document — literature review, architecture, and early prototypes.",
    slug: "pp1-presentation",
  },
  {
    title: "PP2 Presentation",
    description: "Progress presentation 2 document — completed modules, integration, and testing results.",
    slug: "pp2-presentation",
  },
  {
    title: "Final Report",
    description: "Complete research report including findings, evaluation, and conclusions.",
    slug: "final-report",
  },
];

export default function DocumentsPage() {
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
            Research Documents
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Documents
          </h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Download all official project documents related to ArmiGo.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container-custom pb-20 max-w-3xl mx-auto w-full px-4">
        <Section
          title="Project Documents"
          subtitle={`${documents.length} documents available for download`}
          accent
        >
          <div className="space-y-4">
            {documents.map((doc, i) => (
              <FileCard
                key={doc.title}
                title={doc.title}
                description={doc.description}
                filePath={`/uploads/documents/${doc.slug}.pdf`}
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
          className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm text-blue-700"
        >
          <FolderOpen className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Files are served directly from the project repository. If a download fails, the document may not have been uploaded yet.</p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
