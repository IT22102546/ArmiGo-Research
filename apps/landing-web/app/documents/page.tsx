"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileCard } from "@/components/shared/FileCard";
import { Section } from "@/components/shared/Section";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

const documentGroups = [
  {
    heading: "Project Charter",
    subtitle: "1 document",
    items: [
      {
        title: "Project Charter",
        description: "Formal project charter defining team roles, responsibilities, scope, and deliverables for the ArmiGo research project.",
        filePath: "/uploads/documents/CHARTER.pdf",
      },
    ],
  },
  {
    heading: "Proposal Drafts",
    subtitle: "4 individual member proposals",
    items: [
      {
        title: "Individual Proposal Draft — IT22102546",
        description: "Research proposal draft submitted by team member IT22102546.",
        filePath: "/uploads/documents/ProposalDraft-IT22102546.pdf",
      },
      {
        title: "Individual Proposal Draft — IT22115720",
        description: "Research proposal draft submitted by team member IT22115720.",
        filePath: "/uploads/documents/Proposal Draft - IT22115720.pdf",
      },
      {
        title: "Individual Proposal Draft — IT22119230",
        description: "Research proposal draft submitted by team member IT22119230.",
        filePath: "/uploads/documents/Praposal_Draft _IT22119230.pdf",
      },
      {
        title: "Individual Proposal Draft — IT22557292",
        description: "Research proposal draft submitted by team member IT22557292.",
        filePath: "/uploads/documents/Proposal-draft-IT22557292.pdf",
      },
    ],
  },
  {
    heading: "Checklists",
    subtitle: "2 assessment checklists",
    items: [
      {
        title: "Checklist 1",
        description: "Assessment checklist for the first evaluation phase.",
        filePath: "/uploads/documents/CheckList1.zip",
      },
      {
        title: "Checklist 2",
        description: "Assessment checklist for the second evaluation phase.",
        filePath: "/uploads/documents/checklist2.zip",
      },
      {
        title: "Checklist 3",
        description: "Assessment checklist for the third evaluation phase.",
        filePath: "/uploads/documents/checklist3.pdf",
      },
    ],
  },
  {
    heading: "Final Reports",
    subtitle: "Group thesis and 4 individual draft reports",
    items: [
      {
        title: "Group Thesis Draft — ArmiGo",
        description: "25-26j-472: Thesis draft — ArmiGo Gamified VR-Based Therapy System for Upper Limb Rehabilitation in Children with Hemiplegia.",
        filePath: "/uploads/documents/FINAL DOC/25-26j-472 -Thesis - Draft ARMIGO Gamified VR-Based Therapy System for Upper Limb Rehabilation in Children with Hemiplegia (1).docx",
      },
      {
        title: "Final Individual Report — IT22102546",
        description: "Final individual draft report submitted by team member IT22102546.",
        filePath: "/uploads/documents/FINAL DOC/FINAL INDIVIDUAL DRAFT REPORT_IT22102546.pdf",
      },
      {
        title: "Final Individual Report — IT22119230",
        description: "Final individual draft report submitted by team member IT22119230.",
        filePath: "/uploads/documents/FINAL DOC/Final Individual Report Draft IT22119230.pdf",
      },
      {
        title: "Final Individual Report — IT22557292",
        description: "Final individual draft report submitted by team member IT22557292.",
        filePath: "/uploads/documents/FINAL DOC/Final_Individual_Draft_Report_IT22557292.docx",
      },
      {
        title: "Final Individual Report — IT22115720",
        description: "Final individual draft report submitted by team member IT22115720.",
        filePath: "/uploads/documents/FINAL DOC/IT22115720_Final_Individual_Report_Draft.docx",
      },
    ],
  },
];

const totalDocuments = documentGroups.reduce((sum, g) => sum + g.items.length, 0);

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

      <main className="flex-1 container-custom pb-20 max-w-3xl mx-auto w-full px-4 space-y-4">

        {documentGroups.map((group) => (
          <Section
            key={group.heading}
            title={group.heading}
            subtitle={group.subtitle}
            accent
          >
            <div className="space-y-3">
              {group.items.map((doc, i) => (
                <FileCard
                  key={doc.filePath}
                  title={doc.title}
                  description={doc.description}
                  filePath={doc.filePath}
                  index={i}
                />
              ))}
            </div>
          </Section>
        ))}

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm text-blue-700"
        >
          <FolderOpen className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            {totalDocuments} documents available across {documentGroups.length} categories. Files are served directly from the project repository. If a download fails, the document may not have been uploaded yet.
          </p>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
}
