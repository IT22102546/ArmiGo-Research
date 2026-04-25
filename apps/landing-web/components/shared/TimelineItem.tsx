"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Circle } from "lucide-react";

type Status = "completed" | "ongoing" | "pending";

interface TimelineItemProps {
  title: string;
  date: string;
  description?: string;
  status: Status;
  index: number;
  isLast?: boolean;
}

const statusConfig: Record<Status, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100 border-emerald-300",
    label: "Completed",
  },
  ongoing: {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-100 border-blue-300",
    label: "Ongoing",
  },
  pending: {
    icon: Circle,
    color: "text-gray-400",
    bg: "bg-gray-100 border-gray-300",
    label: "Pending",
  },
};

export function TimelineItem({ title, date, description, status, index, isLast = false }: TimelineItemProps) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative flex gap-6"
    >
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-purple-100" />
      )}

      {/* Dot */}
      <div className={`shrink-0 mt-1 w-10 h-10 rounded-full border-2 flex items-center justify-center ${cfg.bg} z-10`}>
        <Icon className={`w-5 h-5 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">{date}</p>
          {description && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
