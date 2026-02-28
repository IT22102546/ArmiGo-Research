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

const HomeSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [activeVideo, setActiveVideo] = useState(false);
  const [hoveredDevice, setHoveredDevice] = useState(null);

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

  return (
    <main className="overflow-x-hidden bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-300/20 to-purple-300/20"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              x: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Hero Section - Focus on Rehabilitation */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 pt-20 pb-12 lg:pt-28 lg:pb-20">
        {/* Animated Stars */}
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
              }}
            >
              <StarIcon size={Math.random() * 20 + 10} />
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
                <Sparkles className="w-4 h-4 animate-spin-slow" />
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

{/* Hero Image - All 4 IoT Devices - FIXED VERSION */}
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
        src="/assets/armigo-hero.png"
        width={550}
        height={550}
        alt="ArmiGo Rehabilitation Devices"
        className="relative z-20 drop-shadow-2xl"
        priority
      />
    </motion.div>
    
    {/* Device Cards - Fixed Positioning */}
    <div className="absolute inset-0">
      {/* Finger Glove Card - Top Left */}
      <motion.div 
        className="absolute -top-16 -left-16 z-30"
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
        {/* Curved Connecting Line - Fixed */}
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
        className="absolute -top-16 -right-16 z-30"
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
        {/* Curved Connecting Line - Fixed */}
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
        {/* Curved Connecting Line - Fixed */}
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
        {/* Curved Connecting Line - Fixed */}
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

    {/* Floating Character Friends - Repositioned */}
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

    {/* Achievement Badge - Repositioned */}
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

    {/* Animated Sparkles around main image - Enhanced */}
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

    {/* Floating particles for magical effect */}
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, (i % 2 === 0 ? 15 : -15), 0],
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: i * 0.3,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
</motion.div>
    
    {/* Device Cards - Better Organized */}
    <div className="absolute inset-0">
      {/* Finger Glove Card - Top Left */}
      <motion.div 
        className="absolute -top-10 -left-10 z-30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-3 border-2 border-blue-200 w-40"
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Hand className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Device 1</p>
              <p className="font-bold text-sm">Finger Hero</p>
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            {[1,2,3,4,5].map((_, i) => (
              <motion.div 
                key={i} 
                className="w-1 h-1 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
        {/* Connecting Line */}
        <svg className="absolute -bottom-8 -right-8 w-16 h-16" viewBox="0 0 50 50">
          <motion.path 
            d="M0,30 Q20,20 40,10" 
            stroke="#3B82F6" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            fill="none"
            animate={{ strokeDashoffset: [0, 50] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </motion.div>

      {/* Wrist Band Card - Top Right */}
      <motion.div 
        className="absolute -top-10 -right-10 z-30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-3 border-2 border-purple-200 w-40"
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Device 2</p>
              <p className="font-bold text-sm">Wrist Wizard</p>
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            <motion.div 
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div 
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
          </div>
        </motion.div>
        <svg className="absolute -bottom-8 -left-8 w-16 h-16 rotate-45" viewBox="0 0 50 50">
          <motion.path 
            d="M40,30 Q20,20 0,10" 
            stroke="#A855F7" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            fill="none"
            animate={{ strokeDashoffset: [0, 50] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
          />
        </svg>
      </motion.div>

      {/* Elbow Brace Card - Bottom Left */}
      <motion.div 
        className="absolute -bottom-10 -left-10 z-30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-3 border-2 border-green-200 w-40"
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Device 3</p>
              <p className="font-bold text-sm">Elbow Knight</p>
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            <motion.div 
              className="w-8 h-1 bg-green-400 rounded-full"
              animate={{ width: ["2rem", "3rem", "2rem"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
        <svg className="absolute -top-8 -right-8 w-16 h-16 -rotate-45" viewBox="0 0 50 50">
          <motion.path 
            d="M0,30 Q20,20 40,10" 
            stroke="#22C55E" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            fill="none"
            animate={{ strokeDashoffset: [0, 50] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
          />
        </svg>
      </motion.div>

      {/* Shoulder Support Card - Bottom Right */}
      <motion.div 
        className="absolute -bottom-10 -right-10 z-30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-3 border-2 border-orange-200 w-40"
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Footprints className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Device 4</p>
              <p className="font-bold text-sm">Shoulder Titan</p>
            </div>
          </div>
          <div className="mt-2 flex justify-around">
            <motion.div 
              className="w-2 h-2 bg-orange-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div 
              className="w-2 h-2 bg-orange-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div 
              className="w-2 h-2 bg-orange-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
        <svg className="absolute -top-8 -left-8 w-16 h-16 rotate-180" viewBox="0 0 50 50">
          <motion.path 
            d="M40,30 Q20,20 0,10" 
            stroke="#F97316" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            fill="none"
            animate={{ strokeDashoffset: [0, 50] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1.5 }}
          />
        </svg>
      </motion.div>
    </div>

    {/* Floating Character Friends */}
    <motion.div 
      className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-4xl"
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      🦸
    </motion.div>

    <motion.div 
      className="absolute -bottom-5 left-1/4 text-3xl"
      animate={{ 
        y: [0, 10, 0],
        x: [0, 10, 0]
      }}
      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
    >
      🧙
    </motion.div>

    <motion.div 
      className="absolute top-1/2 -right-5 text-3xl"
      animate={{ 
        scale: [1, 1.2, 1],
        rotate: [0, 360]
      }}
      transition={{ duration: 5, repeat: Infinity }}
    >
      ⭐
    </motion.div>

    <motion.div 
      className="absolute top-1/3 -left-5 text-3xl"
      animate={{ 
        y: [0, -15, 0],
        rotate: [0, -10, 10, 0]
      }}
      transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
    >
      🦄
    </motion.div>

    {/* Animated Sparkles around main image */}
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-yellow-300 rounded-full"
        style={{
          left: `${20 + i * 15}%`,
          top: `${30 + (i % 2) * 40}%`,
        }}
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.3,
        }}
      />
    ))}

    {/* Achievement Badge */}
    <motion.div 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full font-bold text-sm z-40"
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 2, -2, 0]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="flex items-center gap-1">
        <Trophy className="w-4 h-4" />
        4-in-1 System
      </span>
    </motion.div>
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

      {/* VR Gaming Section - More Playful */}
      <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white relative overflow-hidden">
        {/* Animated Clouds */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{ x: [0, 100, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(5)].map((_, i) => (
            <Cloud 
              key={i}
              className="absolute text-white/10"
              style={{
                left: `${i * 20}%`,
                top: `${Math.random() * 80}%`,
                width: Math.random() * 100 + 50,
                height: Math.random() * 60 + 30,
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
                
                {/* Game Characters floating around */}
                {["🦸", "🧙", "🦄", "🐉"].map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl"
                    style={{
                      top: `${Math.random() * 80}%`,
                      left: `${Math.random() * 80}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, 10, -10, 0],
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

      {/* Parent & Hospital Dashboard Section - Removed Booking Calendar */}
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

      {/* Rest of the sections (Testimonials, CTA) remain similar but with more playful elements */}
      {/* ... */}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
        {/* Animated Confetti */}
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                rotate: [0, 360],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              {["🎈", "✨", "⭐", "🦸", "🌈", "🎮"][Math.floor(Math.random() * 6)]}
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