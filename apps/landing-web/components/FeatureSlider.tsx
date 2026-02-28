"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const features = [
  {
    title: "Live Smart Classes",
    subtitle: "LIVE LEARNING",
    description:
      "Engage students with interactive live sessions featuring real-time collaboration, whiteboard tools, and HD video streaming.",
    image: "/assets/live-class-ui.png",
    gradient: "from-[#4E89FF] via-[#5F7FFF] to-[#BC4BFF]",
    shadow: "shadow-blue-500/20",
    tag: "Live Now",
  },
  {
    title: "Smart Exam System",
    subtitle: "SMART TESTING",
    description:
      "Advanced examination platform with AI-powered monitoring and comprehensive assessment tools. MCQ, upload, and matching exams.",
    image: "/assets/exam-system.png",
    gradient: "from-[#8B5CF6] via-[#A78BFA] to-[#EC4899]",
    shadow: "shadow-purple-500/20",
    tag: "Auto-Grading",
  },
  {
    title: "Mutual Transfer System",
    subtitle: "TRANSFER MANAGEMENT",
    description:
      "Streamline teacher transfers with our intelligent mutual transfer system. Match preferences and ensure smooth transitions.",
    image: "/assets/transfer-showcase.png",
    gradient: "from-[#3B82F6] via-[#2DD4BF] to-[#2563EB]",
    shadow: "shadow-indigo-500/20",
    tag: "Compliant",
  },
];

const FeatureSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Function to start or reset auto-slide
  const startAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) =>
        prev === features.length - 1 ? 0 : prev + 1
      );
    }, 5000);
  };

  // Start auto-slide on mount
  useEffect(() => {
    startAutoSlide();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const slideChange = (index: number) => {
    setActiveIndex(index);
    startAutoSlide();
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev === features.length - 1 ? 0 : prev + 1));
    startAutoSlide();
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? features.length - 1 : prev - 1));
    startAutoSlide();
  };

  return (
    <div className="w-full relative px-4 lg:px-0 select-none">
      {/* Container with overflow-visible to see neighbors */}
      <div className="max-w-7xl mx-auto overflow-visible relative">
        <div className="relative overflow-visible">
          <motion.div
            className="flex"
            animate={{ 
              x: isMobile 
                ? `calc(-${activeIndex * 85}% + 7.5%)` 
                : `calc(-${activeIndex * 100}% )`
            }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 20,
              mass: 0.8
            }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="w-[85%] lg:w-full shrink-0 pr-4 lg:pr-8 last:pr-0"
              >
                <motion.div
                  animate={{
                    scale: activeIndex === index ? 1 : 0.85,
                    opacity: activeIndex === index ? 1 : 0.5,
                    y: activeIndex === index ? 0 : 40,
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 400,
                    damping: 17,
                    mass: 1
                  }}
                  className={`h-auto lg:h-[500px] relative group rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden bg-gradient-to-b ${feature.gradient} p-6 sm:p-10 lg:p-16 text-white shadow-2xl ${feature.shadow}`}
                >
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 h-full">
                    <div className="flex flex-col justify-center text-center lg:text-left">
                      <span className="inline-block px-4 lg:px-6 py-1.5 lg:py-2 bg-white rounded-full text-[10px] lg:text-sm font-extrabold text-[#4E89FF] w-fit mb-4 tracking-wide mx-auto lg:mx-0">
                        {feature.subtitle}
                      </span>
                      <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white tracking-tight leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-white/90 text-sm sm:text-xl lg:text-2xl mb-8 max-w-xl leading-relaxed font-medium">
                        {feature.description} Make learning immersive and effective.
                      </p>
                    </div>

                    <div className="relative flex justify-center items-center h-full pt-4 lg:pt-0">
                      {/* Laptop Mockup Container */}
                      <div className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-3xl w-full max-w-2xl relative overflow-hidden">
                        <div className="relative aspect-[16/10]">
                          <Image
                            src={feature.image}
                            fill
                            alt={feature.title}
                            className="object-cover"
                          />
                        </div>
                      </div>

                      {/* Floating Notification */}
                      <div className="absolute -bottom-4 -left-2 sm:left-6 lg:left-6 bg-white rounded-xl lg:rounded-2xl p-3 lg:p-6 shadow-2xl flex items-center gap-3 lg:gap-5 min-w-[160px] lg:min-w-[220px] border border-gray-100/50">
                        <div className="w-10 h-10 lg:w-16 lg:h-16 bg-[#00D261] rounded-full flex items-center justify-center shadow-lg shadow-[#00D261]/30">
                          <Image
                            src="/assets/live.png"
                            alt="Live Indicator"
                            width={32}
                            height={32}
                            className="rounded-full"
                            />
                        </div>
                        <div className="text-left">
                          <div className="text-[#1A1D1F] font-bold text-sm lg:text-xl">
                            {feature.tag}
                          </div>
                          <div className="text-[#6F767E] text-[10px] lg:text-sm font-medium">
                            24 students joined
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 lg:w-12 lg:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-xl lg:-left-16"
        >
          <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 lg:w-12 lg:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-xl lg:-right-16"
        >
          <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
        </button>
      </div>

      {/* Pagination Indicators */}
      <div className="flex justify-center gap-3 mt-12">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => slideChange(index)}
            className={`transition-all duration-500 rounded-full ${
              activeIndex === index
                ? "w-12 h-2.5 bg-[#0061ff] shadow-md shadow-blue-500/20"
                : "w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureSlider;
