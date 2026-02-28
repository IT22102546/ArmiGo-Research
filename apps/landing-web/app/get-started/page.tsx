"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Play,
  X,
  Clock,
  Video,
  ChevronRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

interface VideoData {
  id: string;
  title: string;
  url: string;
  category: string;
  size: string;
  uploadedAt: string;
}

const categories = [
  "All",
  "Video Conferencing",
  "Exam Features",
  "Mutual Transfer",
  "Other",
];

const categoryIcons: { [key: string]: React.ReactNode } = {
  All: <Sparkles className="w-4 h-4" />,
  "Video Conferencing": <Video className="w-4 h-4" />,
  "Exam Features": <BookOpen className="w-4 h-4" />,
  "Mutual Transfer": <Users className="w-4 h-4" />,
  Other: <GraduationCap className="w-4 h-4" />,
};

export default function GetStartedPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      setVideos(data);
    } catch {
      console.error("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos =
    activeCategory === "All"
      ? videos
      : videos.filter((v) => v.category === activeCategory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10 pt-28 pb-16 lg:pt-32 lg:pb-20">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
          </div>

          <div className="container-custom relative z-10">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-medium text-sm mb-6"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <Play className="w-4 h-4" />
                Explore Platform Features
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-main mb-6 leading-tight"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                See LearnApp <span className="text-primary">in Action</span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-body max-w-2xl mx-auto mb-8 leading-relaxed"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                Watch our demo videos to discover how LearnApp transforms
                education with powerful features for students, teachers, and
                institutions.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-4"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <Link
                  href="/download"
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  Download App
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="btn-outline flex items-center justify-center gap-2"
                >
                  Request Live Demo
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Category Filter & Videos Section */}
        <section className="py-16 lg:py-20 bg-gray-50/50">
          <div className="container-custom">
            {/* Section Header */}
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase tracking-widest mb-4">
                Demo Library
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-main mb-4">
                Explore Our Feature Demos
              </h2>
              <p className="text-body max-w-2xl mx-auto">
                Browse through our comprehensive collection of demo videos
                organized by feature category.
              </p>
            </motion.div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
                    activeCategory === category
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "bg-white text-body hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {categoryIcons[category]}
                  {category}
                </button>
              ))}
            </div>

            {/* Videos Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-body">Loading videos...</p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Video className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-main mb-2">
                  No Videos Available
                </h3>
                <p className="text-body text-center max-w-md mb-6">
                  {activeCategory === "All"
                    ? "Demo videos will be available soon. Stay tuned!"
                    : `No videos in "${activeCategory}" category yet. Check other categories or come back later.`}
                </p>
                {activeCategory !== "All" && (
                  <button
                    onClick={() => setActiveCategory("All")}
                    className="text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    View all categories
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                key={activeCategory}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {filteredVideos.map((video) => (
                  <motion.div
                    key={video.id}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                    variants={fadeInUp}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Video Thumbnail */}
                    <div
                      className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-700 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedVideo(video)}
                    >
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play
                            className="w-7 h-7 text-primary ml-1"
                            fill="currentColor"
                          />
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-primary/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                          {video.category}
                        </span>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-main mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>

                      <div className="flex items-center justify-between text-sm text-body">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {formatDate(video.uploadedAt)}
                        </div>
                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          Watch
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          className="py-16 lg:py-24 bg-gradient-to-br from-primary to-blue-600 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHY2aDR2LTJ6bTAtMTBoLTJ2Mmgydi0yem0tNCAwSDMwdjJoMnYtMnptOCAwaC0ydjJoMnYtMnptLTQgNGgtMnYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
          </div>

          <div className="container-custom relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Learning Experience?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of institutions already using LearnApp to deliver
                exceptional educational experiences.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/download"
                  className="bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-xl flex items-center justify-center gap-2"
                >
                  Download Now - It&apos;s Free
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="border-2 border-white/50 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
              <div>
                <span className="px-3 py-1 bg-primary/90 text-white text-xs font-medium rounded-full">
                  {selectedVideo.category}
                </span>
                <h3 className="text-white font-semibold mt-2 text-lg">
                  {selectedVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video">
              <video
                key={selectedVideo.id}
                src={selectedVideo.url}
                controls
                autoPlay
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
