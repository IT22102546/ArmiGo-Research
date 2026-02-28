"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Activity, 
  Brain, 
  Heart, 
  Shield, 
  Gamepad2, 
  TrendingUp,
  Calendar,
  Hospital,
  Smartphone,
  Watch,
  Trophy,
  Target,
  Users,
  ArrowRight,
  Star,
  Award,
  Clock,
  BarChart3,
  Sparkles,
  Hand,
  Footprints,
  Globe,
  Video,
  Bell,
  Gem,
  Medal,
  Smile,
  Rocket,
  Cloud,
  Sun,
  Moon,
  Star as StarIcon,
  PartyPopper
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

const bounceAnimation = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const floatAnimation = {
  hidden: { y: 0 },
  visible: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const spinAnimation = {
  hidden: { rotate: 0 },
  visible: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Predefined values for floating elements to avoid hydration mismatch
const floatingElements = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  width: 80 + (i * 7) % 100,
  height: 70 + (i * 9) % 100,
  left: (i * 23) % 90 + 5,
  top: (i * 17) % 90 + 5,
  yOffset: (i * 3) % 50,
  xOffset: (i * 5) % 50,
  scale1: 1,
  scale2: 1.2,
}));

const starElements = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: (i * 31) % 95 + 2,
  top: (i * 27) % 95 + 2,
  scale1: 1,
  scale2: 1.5,
  size: 10 + (i * 3) % 20,
  delay: (i * 0.1) % 3,
}));

const cloudElements = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  left: i * 20,
  top: (i * 13) % 70 + 10,
  width: 70 + (i * 15) % 50,
  height: 40 + (i * 12) % 40,
}));

const gameCharacters = ['🦸', '🧙', '🦄', '🐉'];
const confettiEmojis = ['🎈', '✨', '⭐', '🦸', '🌈', '🎮'];

const HomeSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [activeVideo, setActiveVideo] = useState(false);
  const [hoveredDevice, setHoveredDevice] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/admin/testimonials");
        const data = await res.json();
        setTestimonials(data.filter((t) => t.active));
      } catch (error) {
        console.error("Failed to fetch testimonials", error);
      }
    };
    fetchTestimonials();
  }, []);

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <main className="overflow-x-hidden bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* Floating Background Elements - Using deterministic values */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingElements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute rounded-full bg-gradient-to-r from-blue-300/20 to-purple-300/20"
            style={{
              width: el.width,
              height: el.height,
              left: `${el.left}%`,
              top: `${el.top}%`,
            }}
            animate={{
              y: [0, el.yOffset - 25, 0],
              x: [0, el.xOffset - 25, 0],
              scale: [el.scale1, el.scale2, el.scale1],
            }}
            transition={{
              duration: 10 + (el.id % 10),
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Hero Section - Focus on Rehabilitation */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 pt-20 pb-12 lg:pt-28 lg:pb-20">
        {/* Animated Stars - Using deterministic values */}
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        >
          {starElements.map((star) => (
            <motion.div
              key={star.id}
              className="absolute text-white/20"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
              }}
              animate={{
                scale: [star.scale1, star.scale2, star.scale1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: star.delay,
              }}
            >
              <StarIcon size={star.size} />
            </motion.div>
          ))}
        </motion.div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              className="relative z-10 space-y-6 lg:space-y-8 text-center lg:text-left text-white"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium text-sm border border-white/30"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
              >
                <Heart className="w-4 h-4 fill-current animate-pulse" />
                <span>Specialized Care for Hemiplegic Heroes (Ages 6-14)</span>
                <Sparkles className="w-4 h-4 animate-spin" />
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl lg:text-7xl leading-tight tracking-tight font-bold"
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span className="inline-block">Turn Rehab into</span>{" "}
                <motion.span 
                  className="inline-block text-yellow-300 relative"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Adventure
                  <motion.span
                    className="absolute -top-6 -right-8"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🦸‍♂️
                  </motion.span>
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-lg sm:text-xl text-blue-50 leading-relaxed max-w-xl mx-auto lg:mx-0"
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Four smart devices + magical VR games that make therapy feel like play. 
                Watch your child smile while they build strength and coordination.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 pt-4"
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/assessment"
                    className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-lg flex items-center gap-2 group"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Start Your Hero's Journey
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/demo"
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all flex items-center gap-2 group"
                  >
                    <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    See the Magic
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6"
                variants={fadeInUp}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.div 
                  className="flex items-center gap-2 text-blue-50 bg-white/10 px-4 py-2 rounded-full"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <Medal className="w-5 h-5" />
                  <span>FDA Registered</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-blue-50 bg-white/10 px-4 py-2 rounded-full"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <Award className="w-5 h-5" />
                  <span>10+ Clinical Studies</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-blue-50 bg-white/10 px-4 py-2 rounded-full"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                >
                  <Smile className="w-5 h-5" />
                  <span>500+ Happy Heroes</span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Hero Image - All 4 IoT Devices */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <div className="relative flex items-center justify-center min-h-[600px]">
                {/* Main Device Image with Glow */}
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-20"
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full blur-3xl scale-150"></div>
                  <Image
                    src="/assets/logo.png"
                    width={550}
                    height={550}
                    alt="ArmiGo Rehabilitation Devices"
                    className="relative z-20 drop-shadow-2xl"
                    priority
                  />
                </motion.div>
                
                {/* Device Cards */}
                <div className="absolute inset-0">
                  {/* Finger Glove Card - Top Left */}
                  <motion.div 
                    className="absolute -top-10 -left-16 z-30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-blue-200 w-44"
                      animate={{ 
                        y: [0, -8, 0],
                        boxShadow: [
                          "0 20px 25px -5px rgba(0,0,0,0.1)",
                          "0 25px 30px -5px rgba(59,130,246,0.3)",
                          "0 20px 25px -5px rgba(0,0,0,0.1)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                      whileHover={{ scale: 1.1, zIndex: 50 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Hand className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Device 01</p>
                          <p className="font-bold text-base">Finger Hero</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        {[1,2,3,4,5].map((_, i) => (
                          <motion.div 
                            key={i} 
                            className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                            animate={{ scale: [1, 1.8, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                    {/* Connecting Line */}
                    <svg className="absolute -bottom-16 -right-12 w-24 h-24" viewBox="0 0 100 100">
                      <motion.path 
                        d="M20,60 C40,40 60,30 80,20" 
                        stroke="#3B82F6" 
                        strokeWidth="3" 
                        strokeDasharray="6,6"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, delay: 0.5 }}
                      />
                      <motion.circle
                        cx="80"
                        cy="20"
                        r="4"
                        fill="#3B82F6"
                        animate={{ 
                          cx: [80, 40, 80],
                          cy: [20, 40, 20],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </svg>
                  </motion.div>

                  {/* Wrist Band Card - Top Right */}
                  <motion.div 
                    className="absolute -top-10 -right-16 z-30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div 
                      className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-purple-200 w-44"
                      animate={{ 
                        y: [0, -8, 0],
                        boxShadow: [
                          "0 20px 25px -5px rgba(0,0,0,0.1)",
                          "0 25px 30px -5px rgba(168,85,247,0.3)",
                          "0 20px 25px -5px rgba(0,0,0,0.1)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      whileHover={{ scale: 1.1, zIndex: 50 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Device 02</p>
                          <p className="font-bold text-base">Wrist Wizard</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 justify-center">
                        <motion.div 
                          className="w-2 h-2 bg-purple-400 rounded-full"
                          animate={{ scale: [1, 1.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-purple-400 rounded-full"
                          animate={{ scale: [1, 1.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-purple-400 rounded-full"
                          animate={{ scale: [1, 1.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                        />
                      </div>
                    </motion.div>
                    {/* Connecting Line */}
                    <svg className="absolute -bottom-16 -left-12 w-24 h-24 rotate-45" viewBox="0 0 100 100">
                      <motion.path 
                        d="M80,20 C60,30 40,40 20,60" 
                        stroke="#A855F7" 
                        strokeWidth="3" 
                        strokeDasharray="6,6"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, delay: 0.7 }}
                      />
                      <motion.circle
                        cx="20"
                        cy="60"
                        r="4"
                        fill="#A855F7"
                        animate={{ 
                          cx: [20, 50, 20],
                          cy: [60, 40, 60],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      />
                    </svg>
                  </motion.div>

                  {/* Elbow Brace Card - Bottom Left */}
                  <motion.div 
                    className="absolute -bottom-16 -left-16 z-30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.div 
                      className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-green-200 w-44"
                      animate={{ 
                        y: [0, 8, 0],
                        boxShadow: [
                          "0 20px 25px -5px rgba(0,0,0,0.1)",
                          "0 25px 30px -5px rgba(34,197,94,0.3)",
                          "0 20px 25px -5px rgba(0,0,0,0.1)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      whileHover={{ scale: 1.1, zIndex: 50 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Target className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Device 03</p>
                          <p className="font-bold text-base">Elbow Knight</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <motion.div 
                          className="h-1.5 bg-green-400 rounded-full"
                          animate={{ width: ["60%", "90%", "60%"] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </motion.div>
                    {/* Connecting Line */}
                    <svg className="absolute -top-16 -right-12 w-24 h-24 -rotate-45" viewBox="0 0 100 100">
                      <motion.path 
                        d="M20,80 C40,70 60,60 80,40" 
                        stroke="#22C55E" 
                        strokeWidth="3" 
                        strokeDasharray="6,6"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, delay: 0.9 }}
                      />
                      <motion.circle
                        cx="80"
                        cy="40"
                        r="4"
                        fill="#22C55E"
                        animate={{ 
                          cx: [80, 50, 80],
                          cy: [40, 60, 40],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      />
                    </svg>
                  </motion.div>

                  {/* Shoulder Support Card - Bottom Right */}
                  <motion.div 
                    className="absolute -bottom-16 -right-16 z-30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <motion.div 
                      className="bg-white rounded-2xl shadow-2xl p-4 border-2 border-orange-200 w-44"
                      animate={{ 
                        y: [0, 8, 0],
                        boxShadow: [
                          "0 20px 25px -5px rgba(0,0,0,0.1)",
                          "0 25px 30px -5px rgba(249,115,22,0.3)",
                          "0 20px 25px -5px rgba(0,0,0,0.1)"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                      whileHover={{ scale: 1.1, zIndex: 50 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Footprints className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Device 04</p>
                          <p className="font-bold text-base">Shoulder Titan</p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-around">
                        <motion.div 
                          className="w-2.5 h-2.5 bg-orange-400 rounded-full"
                          animate={{ scale: [1, 1.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <motion.div 
                          className="w-2.5 h-2.5 bg-orange-400 rounded-full"
                          animate={{ scale: [1, 1.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div 
                          className="w-2.5 h-2.5 bg-orange-400 rounded-full"
                          animate={{ scale: [1, 1.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                        <motion.div 
                          className="w-2.5 h-2.5 bg-orange-400 rounded-full"
                          animate={{ scale: [1, 1.8, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                        />
                      </div>
                    </motion.div>
                    {/* Connecting Line */}
                    <svg className="absolute -top-16 -left-12 w-24 h-24 rotate-180" viewBox="0 0 100 100">
                      <motion.path 
                        d="M80,80 C60,70 40,60 20,40" 
                        stroke="#F97316" 
                        strokeWidth="3" 
                        strokeDasharray="6,6"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, delay: 1.1 }}
                      />
                      <motion.circle
                        cx="20"
                        cy="40"
                        r="4"
                        fill="#F97316"
                        animate={{ 
                          cx: [20, 50, 20],
                          cy: [40, 60, 40],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                      />
                    </svg>
                  </motion.div>
                </div>

                {/* Floating Character Friends - Fixed positions */}
                <motion.div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-5xl"
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, 8, -8, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🦸‍♂️
                </motion.div>

                <motion.div 
                  className="absolute -bottom-8 left-8 text-4xl"
                  animate={{ 
                    y: [0, 15, 0],
                    x: [0, 10, 0]
                  }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                  🧙‍♀️
                </motion.div>

                <motion.div 
                  className="absolute top-1/3 -right-10 text-4xl"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 6, repeat: Infinity }}
                >
                  ⭐
                </motion.div>

                <motion.div 
                  className="absolute bottom-1/3 -left-10 text-4xl"
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, -15, 15, 0]
                  }}
                  transition={{ duration: 4.5, repeat: Infinity, delay: 2 }}
                >
                  🦄
                </motion.div>

                {/* Achievement Badge */}
                <motion.div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white px-6 py-3 rounded-full font-bold text-base z-40 shadow-xl"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 3, -3, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Complete Rehabilitation System
                    <Sparkles className="w-4 h-4" />
                  </span>
                </motion.div>

                {/* Animated Sparkles around main image - Fixed positions */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full"
                    style={{
                      left: `${15 + (i % 4) * 25}%`,
                      top: `${20 + Math.floor(i / 4) * 50}%`,
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Animated Wave */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0"
          animate={{ 
            backgroundPosition: ["0% 0%", "100% 0%"]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            height: "100px",
            background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 20px, transparent 20px, transparent 40px)"
          }}
        />
      </section>

      {/* 4 IoT Devices Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <motion.div
          className="container-custom"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <motion.span 
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold mb-4"
              whileHover={{ scale: 1.05 }}
              animate={{ 
                boxShadow: ["0 0 0 0 rgba(59,130,246,0.5)", "0 0 0 10px rgba(59,130,246,0)", "0 0 0 0 rgba(59,130,246,0.5)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="inline w-4 h-4 mr-2" />
              MEET THE ARMIGO SQUAD
              <Sparkles className="inline w-4 h-4 ml-2" />
            </motion.span>
            
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                4 Superhero Devices
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each device is a superhero sidekick, helping your child master movements through play
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Finger Glove */}
            <motion.div 
              className="relative group"
              variants={bounceAnimation}
              whileHover={{ y: -10 }}
            >
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-1 rounded-3xl">
                <div className="bg-white p-6 rounded-3xl">
                  <motion.div 
                    className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Hand className="w-12 h-12 text-blue-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-center mb-2">Finger Hero</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Tracks each finger's superpowers
                  </p>
                  <div className="space-y-2">
                    {["Individual finger tracking", "Grip strength", "Pinch precision"].map((feature, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-2 text-sm"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div 
                    className="mt-4 text-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                      ⭐ 5+ exercises
                    </span>
                  </motion.div>
                </div>
              </div>
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                🦸
              </motion.div>
            </motion.div>

            {/* Wrist Band */}
            <motion.div 
              className="relative group"
              variants={bounceAnimation}
              whileHover={{ y: -10 }}
            >
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-1 rounded-3xl">
                <div className="bg-white p-6 rounded-3xl">
                  <motion.div 
                    className="w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                    animate={{ 
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                  >
                    <Activity className="w-12 h-12 text-purple-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-center mb-2">Wrist Wizard</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Masters wrist movements & rotation
                  </p>
                  <div className="space-y-2">
                    {["Flexion & extension", "Rotation tracking", "Wrist strength"].map((feature, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-2 text-sm"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div 
                    className="mt-4 text-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                      ⭐ 360° motion
                    </span>
                  </motion.div>
                </div>
              </div>
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
              >
                🧙
              </motion.div>
            </motion.div>

            {/* Elbow Brace */}
            <motion.div 
              className="relative group"
              variants={bounceAnimation}
              whileHover={{ y: -10 }}
            >
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-1 rounded-3xl">
                <div className="bg-white p-6 rounded-3xl">
                  <motion.div 
                    className="w-24 h-24 bg-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  >
                    <Target className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-center mb-2">Elbow Knight</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Guards elbow movements & angles
                  </p>
                  <div className="space-y-2">
                    {["Flexion tracking", "Extension range", "Rotation angles"].map((feature, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-2 text-sm"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div 
                    className="mt-4 text-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
                      ⭐ Precision to 1°
                    </span>
                  </motion.div>
                </div>
              </div>
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 4 }}
              >
                🛡️
              </motion.div>
            </motion.div>

            {/* Shoulder Support */}
            <motion.div 
              className="relative group"
              variants={bounceAnimation}
              whileHover={{ y: -10 }}
            >
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-1 rounded-3xl">
                <div className="bg-white p-6 rounded-3xl">
                  <motion.div 
                    className="w-24 h-24 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 mx-auto"
                    animate={{ 
                      rotate: [0, -15, 15, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                  >
                    <Footprints className="w-12 h-12 text-orange-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-center mb-2">Shoulder Titan</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">
                    Masters big arm movements
                  </p>
                  <div className="space-y-2">
                    {["Abduction/Adduction", "Flexion/Extension", "3D tracking"].map((feature, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-2 text-sm"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div 
                    className="mt-4 text-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  >
                    <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                      ⭐ Full range
                    </span>
                  </motion.div>
                </div>
              </div>
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 6 }}
              >
                🦍
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* VR Gaming Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white relative overflow-hidden">
        {/* Animated Clouds - Using deterministic values */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{ x: [0, 100, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {cloudElements.map((cloud) => (
            <Cloud 
              key={cloud.id}
              className="absolute text-white/10"
              style={{
                left: `${cloud.left}%`,
                top: `${cloud.top}%`,
                width: cloud.width,
                height: cloud.height,
              }}
            />
          ))}
        </motion.div>

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInLeft}
            >
              <motion.div 
                className="inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-6 border border-white/30"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
              >
                <Gamepad2 className="inline w-4 h-4 mr-2 animate-pulse" />
                MAGIC REALM ADVENTURES
              </motion.div>
              
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="inline-block">Where Therapy Becomes</span>{" "}
                <motion.span 
                  className="inline-block text-yellow-300"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Epic Quests
                </motion.span>
              </h2>
              
              <p className="text-xl text-white/90 mb-8">
                Your child becomes the hero in our Unreal Engine games. Each movement powers their character through magical worlds!
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Trophy, text: "Earn Rewards", color: "yellow" },
                  { icon: TrendingUp, text: "Level Up", color: "green" },
                  { icon: Brain, text: "Smart Learning", color: "purple" },
                  { icon: Gem, text: "Collect Gems", color: "pink" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <item.icon className={`w-6 h-6 text-${item.color}-300 mb-2`} />
                    <p className="text-sm font-bold">{item.text}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/games"
                  className="inline-flex items-center gap-2 bg-yellow-400 text-purple-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition-all shadow-xl group"
                >
                  <PartyPopper className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Explore the Game World
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInRight}
            >
              <motion.div 
                className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30"
                animate={{ 
                  boxShadow: ["0 0 20px rgba(255,255,255,0.3)", "0 0 40px rgba(255,255,255,0.6)", "0 0 20px rgba(255,255,255,0.3)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Image
                  src="/assets/vr-game-preview.png"
                  width={600}
                  height={400}
                  alt="VR Game Preview"
                  className="w-full"
                />
                
                {/* Game Characters floating around - Fixed positions */}
                {gameCharacters.map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl"
                    style={{
                      top: `${20 + i * 15}%`,
                      left: `${10 + i * 20}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, i % 2 === 0 ? 10 : -10, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 5,
                      delay: i * 0.5,
                      repeat: Infinity,
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Parent & Hospital Dashboard Section */}
      <section className="py-20 bg-white">
        <motion.div
          className="container-custom"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <motion.span 
              className="inline-block px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full text-sm font-bold mb-4"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <Heart className="inline w-4 h-4 mr-2" />
              FOR PARENTS & HEROES
            </motion.span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Your Child's Journey,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Always in View
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track progress, celebrate wins, and stay connected - all from your phone or computer
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Parent Mobile App */}
            <motion.div 
              className="relative group"
              variants={bounceAnimation}
              whileHover={{ y: -5 }}
            >
              <div className="bg-gradient-to-br from-pink-400 to-purple-500 p-1 rounded-3xl h-full">
                <div className="bg-white p-8 rounded-3xl h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div 
                      className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Smartphone className="w-8 h-8 text-pink-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold">Parent's Magic Mirror</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    Your window into your child's progress, available anywhere
                  </p>
                  
                  <div className="space-y-4">
                    {[
                      { icon: TrendingUp, text: "Real-time progress updates", color: "green" },
                      { icon: Trophy, text: "Celebrate every milestone", color: "yellow" },
                      { icon: Calendar, text: "Track therapy journey", color: "blue" },
                      { icon: Bell, text: "Daily encouragement notifications", color: "purple" },
                      { icon: Video, text: "Connect with therapists", color: "pink" }
                    ].map((item, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className={`w-8 h-8 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                          <item.icon className={`w-4 h-4 text-${item.color}-600`} />
                        </div>
                        <span className="text-gray-700">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating Badges */}
              <motion.div 
                className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⭐ Free for parents
              </motion.div>
            </motion.div>

            {/* Hospital Desktop Dashboard */}
            <motion.div 
              className="relative group"
              variants={bounceAnimation}
              whileHover={{ y: -5 }}
            >
              <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-1 rounded-3xl h-full">
                <div className="bg-white p-8 rounded-3xl h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div 
                      className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, -5, 5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Hospital className="w-8 h-8 text-blue-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold">Hospital Command Center</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6">
                    Complete view of all your young heroes' progress
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { number: "500+", label: "Children", color: "blue" },
                      { number: "50+", label: "Hospitals", color: "purple" },
                      { number: "10K+", label: "Sessions", color: "green" },
                      { number: "94%", label: "Success Rate", color: "pink" }
                    ].map((stat, i) => (
                      <motion.div 
                        key={i}
                        className="bg-gray-50 p-3 rounded-xl text-center"
                        whileHover={{ scale: 1.05 }}
                      >
                        <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.number}</p>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      "Multi-hospital network management",
                      "Detailed progress analytics",
                      "Staff coordination tools",
                      "Automated report generation",
                      "Secure data compliance"
                    ].map((feature, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-2"
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating Badges */}
              <motion.div 
                className="absolute -top-4 -left-4 bg-green-400 text-green-900 px-4 py-2 rounded-full font-bold text-sm"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🏥 HIPAA Compliant
              </motion.div>
            </motion.div>
          </div>

          {/* Progress Tracker Preview */}
          <motion.div 
            className="mt-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-3xl"
            variants={fadeInUp}
          >
            <div className="bg-white p-8 rounded-3xl">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-purple-600" />
                    Today's Adventure Progress
                  </h3>
                  <div className="space-y-4">
                    {["Finger Fun", "Wrist Wizardry", "Elbow Quests", "Shoulder Strength"].map((exercise, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{exercise}</span>
                          <span className="text-sm text-purple-600">{70 + i * 5}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${70 + i * 5}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  {["🏆", "⭐", "🎮", "🦸", "🌈"].map((emoji, i) => (
                    <motion.div 
                      key={i}
                      className="w-16 h-16 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-2xl flex items-center justify-center text-3xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        delay: i * 0.3,
                        repeat: Infinity 
                      }}
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

   {/* Testimonials Section - Enhanced */}
<section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
  {/* Decorative Background Elements */}
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-200/30 rounded-full blur-3xl"></div>
    <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl"></div>
  </div>

  <div className="container-custom relative z-10">
    {/* Section Header */}
    <motion.div 
      className="text-center mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      <span className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold mb-6 shadow-lg">
        <Heart className="inline w-4 h-4 mr-2 fill-current animate-pulse" />
        REAL STORIES, REAL HEROES
        <Heart className="inline w-4 h-4 ml-2 fill-current animate-pulse" />
      </span>
      
      <h2 className="text-5xl md:text-6xl font-black mb-4">
        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          What Parents Say
        </span>
      </h2>
      
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Hear from families who've watched their little heroes transform through play
      </p>

      {/* Decorative Quote Marks */}
      <motion.div 
        className="flex justify-center gap-4 mt-4"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-4xl text-purple-300">"</span>
        <span className="text-4xl text-pink-300">"</span>
      </motion.div>
    </motion.div>

    {/* Testimonials Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Testimonial 1 */}
      <motion.div
        className="relative group"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={bounceAnimation}
        whileHover={{ y: -10 }}
      >
        <div className="bg-gradient-to-br from-blue-400 to-purple-400 p-1 rounded-[40px]">
          <div className="bg-white rounded-[40px] p-8 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-bl-[100px] opacity-30"></div>
            
            {/* Quote Icon */}
            <motion.div 
              className="absolute top-4 left-4 text-6xl text-purple-200"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              "
            </motion.div>

            {/* Rating Stars */}
            <div className="flex gap-1 mb-4 relative z-10">
              {[1,2,3,4,5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: star * 0.1 }}
                >
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </div>

            {/* Testimonial Content */}
            <p className="text-gray-700 mb-6 relative z-10 text-lg leading-relaxed">
              "ArmiGo has been a game-changer for our daughter. The VR games make her forget she's doing therapy. We've seen amazing progress in just 3 months!"
            </p>

            {/* Parent Info */}
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl">
                  👩
                </div>
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">Sarah's Mom</h4>
                <p className="text-sm text-gray-500">Parent of 7-year-old</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                    ✓ Verified Parent
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Emoji */}
            <motion.div 
              className="absolute bottom-4 right-4 text-3xl opacity-30"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity }}
            >
              🦸‍♀️
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Testimonial 2 */}
      <motion.div
        className="relative group"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={bounceAnimation}
        whileHover={{ y: -10 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-gradient-to-br from-green-400 to-teal-400 p-1 rounded-[40px]">
          <div className="bg-white rounded-[40px] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-200 to-teal-200 rounded-bl-[100px] opacity-30"></div>
            
            <motion.div 
              className="absolute top-4 left-4 text-6xl text-green-200"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              "
            </motion.div>

            <div className="flex gap-1 mb-4 relative z-10">
              {[1,2,3,4,5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: star * 0.1 }}
                >
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </div>

            <p className="text-gray-700 mb-6 relative z-10 text-lg leading-relaxed">
              "The smart glove device is incredible! Our son loves the finger exercises, and we can actually see his grip strength improving. Thank you ArmiGo!"
            </p>

            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white text-2xl">
                  👨
                </div>
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">Michael's Dad</h4>
                <p className="text-sm text-gray-500">Parent of 9-year-old</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                    ✓ Verified Parent
                  </span>
                </div>
              </div>
            </div>

            <motion.div 
              className="absolute bottom-4 right-4 text-3xl opacity-30"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity }}
            >
              🦸‍♂️
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Testimonial 3 */}
      <motion.div
        className="relative group"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={bounceAnimation}
        whileHover={{ y: -10 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-gradient-to-br from-orange-400 to-red-400 p-1 rounded-[40px]">
          <div className="bg-white rounded-[40px] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-200 to-red-200 rounded-bl-[100px] opacity-30"></div>
            
            <motion.div 
              className="absolute top-4 left-4 text-6xl text-orange-200"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              "
            </motion.div>

            <div className="flex gap-1 mb-4 relative z-10">
              {[1,2,3,4,5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: star * 0.1 }}
                >
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </div>

            <p className="text-gray-700 mb-6 relative z-10 text-lg leading-relaxed">
              "As a therapist, I've recommended ArmiGo to all my families. The progress tracking is amazing, and the kids actually look forward to their sessions!"
            </p>

            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-2xl">
                  👩‍⚕️
                </div>
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">Dr. Jennifer Lee</h4>
                <p className="text-sm text-gray-500">Pediatric Therapist</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                    ⚕️ Medical Professional
                  </span>
                </div>
              </div>
            </div>

            <motion.div 
              className="absolute bottom-4 right-4 text-3xl opacity-30"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity }}
            >
              🏥
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Stats Row */}
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {[
        { number: "500+", label: "Happy Families", icon: "👨‍👩‍👧" },
        { number: "98%", label: "Would Recommend", icon: "⭐" },
        { number: "4.9/5", label: "Average Rating", icon: "🌟" },
        { number: "50+", label: "Therapist Approved", icon: "👩‍⚕️" },
      ].map((stat, i) => (
        <motion.div 
          key={i}
          className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl text-center shadow-lg"
          variants={bounceAnimation}
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-3xl mb-2 block">{stat.icon}</span>
          <p className="text-2xl font-bold text-gray-800">{stat.number}</p>
          <p className="text-xs text-gray-600">{stat.label}</p>
        </motion.div>
      ))}
    </motion.div>

    {/* Call to Action */}
    <motion.div 
      className="text-center mt-16"
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <Link
        href="/stories"
        className="group inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all"
      >
        <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Read More Hero Stories
        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
      </Link>
      <p className="text-sm text-gray-500 mt-4">
        ✨ Join 500+ families sharing their superhero journeys ✨
      </p>
    </motion.div>
  </div>
</section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
        {/* Animated Confetti - Fixed positions */}
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: (i * 17) % 95 + 2,
            top: (i * 23) % 95 + 2,
            emoji: confettiEmojis[i % confettiEmojis.length],
            delay: (i * 0.1) % 2,
            duration: 4 + (i % 4),
          })).map((item) => (
            <motion.div
              key={item.id}
              className="absolute text-2xl"
              style={{
                left: `${item.left}%`,
                top: `${item.top}%`,
              }}
              animate={{
                y: [0, -80, 0],
                rotate: [0, 360],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                delay: item.delay,
              }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="container-custom text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Heart className="w-20 h-20 mx-auto mb-6 text-red-400 fill-current" />
          </motion.div>
          
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Ready to Start Your Child's
            <motion.span 
              className="block text-yellow-300"
              animate={{ 
                textShadow: ["0 0 10px yellow", "0 0 20px orange", "0 0 10px yellow"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Superhero Journey?
            </motion.span>
          </h2>
          
          <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto">
            Join hundreds of families who've turned therapy into the most fun part of the day!
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/parent-signup"
                className="bg-yellow-400 text-purple-900 px-10 py-5 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <Smile className="w-5 h-5" />
                Start Free Trial
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/hospital-signup"
                className="border-2 border-white text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Hospital className="w-5 h-5" />
                For Hospitals
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex justify-center gap-8 mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {["No credit card needed", "Setup in 5 minutes", "Cancel anytime"].map((text, i) => (
              <motion.div 
                key={i}
                className="flex items-center gap-2 text-white/70 text-sm"
                whileHover={{ scale: 1.05, color: "white" }}
              >
                <span className="text-green-400">✓</span>
                {text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
};

export default HomeSection;