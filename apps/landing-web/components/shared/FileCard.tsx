"use client";

import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";

interface FileCardProps {
  title: string;
  description?: string;
  filePath: string;
  index?: number;
}

export function FileCard({ title, description, filePath, index = 0 }: FileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(99,102,241,0.15)" }}
      className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm transition-shadow"
    >
      {/* Icon */}
      <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <FileText className="w-7 h-7 text-blue-600" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 truncate text-base">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{description}</p>
        )}
        <span className="inline-block mt-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
          PDF
        </span>
      </div>

      {/* Download button */}
      <a
        href={filePath}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
        aria-label={`Download ${title}`}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </a>
    </motion.div>
  );
}
