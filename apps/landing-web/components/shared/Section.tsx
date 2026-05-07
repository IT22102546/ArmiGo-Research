"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function Section({ title, subtitle, children, className = "", accent = false }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={`py-10 ${className}`}
    >
      <div className="mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold ${accent ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" : "text-gray-800"}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-gray-500 text-base">{subtitle}</p>
        )}
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
      </div>
      {children}
    </motion.section>
  );
}
