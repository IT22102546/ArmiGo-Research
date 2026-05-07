"use client";

import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";

interface FileCardProps {
  title: string;
  description?: string;
  filePath: string;
  index?: number;
}

const FILE_META: Record<string, { label: string; badgeClass: string; iconClass: string }> = {
  pdf:  { label: "PDF",  badgeClass: "text-red-600 bg-red-50",       iconClass: "text-red-500" },
  pptx: { label: "PPTX", badgeClass: "text-orange-600 bg-orange-50", iconClass: "text-orange-500" },
  docx: { label: "DOCX", badgeClass: "text-blue-600 bg-blue-50",     iconClass: "text-blue-600" },
  zip:  { label: "ZIP",  badgeClass: "text-purple-600 bg-purple-50", iconClass: "text-purple-500" },
};

export function FileCard({ title, description, filePath, index = 0 }: FileCardProps) {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const meta = FILE_META[ext] ?? {
    label: ext.toUpperCase(),
    badgeClass: "text-gray-600 bg-gray-50",
    iconClass: "text-gray-500",
  };
  const encodedPath = encodeURI(filePath);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(99,102,241,0.15)" }}
      className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm transition-shadow"
    >
      {/* Icon */}
      <div className="shrink-0 w-13 h-13 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-100 flex items-center justify-center p-3">
        <FileText className={`w-6 h-6 ${meta.iconClass}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{description}</p>
        )}
        <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
          {meta.label}
        </span>
      </div>

      {/* Download button */}
      <a
        href={encodedPath}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200 whitespace-nowrap"
        aria-label={`Download ${title}`}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </a>
    </motion.div>
  );
}
