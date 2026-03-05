"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  Heart, 
  Activity, 
  Sparkles,
  Rocket,
  Smile,
  Star,
  PartyPopper,
  Gem,
  Medal,
  Sun,
  Clock,
  Construction,
  Hammer,
  Wrench,
  Paintbrush,
  Bell
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Predefined floating elements
const floatingElements = [
  { icon: Heart, color: "text-pink-300", size: 24, left: 5, top: 10, delay: 0 },
  { icon: Star, color: "text-yellow-300", size: 28, left: 85, top: 20, delay: 0.5 },
  { icon: Smile, color: "text-blue-300", size: 32, left: 15, top: 70, delay: 1 },
  { icon: Sparkles, color: "text-purple-300", size: 26, left: 75, top: 80, delay: 1.5 },
  { icon: Activity, color: "text-green-300", size: 30, left: 45, top: 40, delay: 2 },
  { icon: Gem, color: "text-orange-300", size: 28, left: 92, top: 60, delay: 2.5 },
  { icon: Medal, color: "text-red-300", size: 26, left: 8, top: 85, delay: 3 },
  { icon: Sun, color: "text-yellow-300", size: 32, left: 65, top: 15, delay: 3.5 },
];

const constructionEmojis = ['🏗️', '🚧', '🔨', '🛠️', '⛏️', '🔧', '🧰', '🎨', '✏️', '📐'];

export default function StoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 overflow-x-hidden">
      <Navbar />

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingElements.map((el, i) => (
          <motion.div
            key={i}
            className={`absolute ${el.color}`}
            style={{
              left: `${el.left}%`,
              top: `${el.top}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, (i % 2 === 0 ? 20 : -20), 0],
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: el.delay,
            }}
          >
            <el.icon size={el.size} />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <section className="relative min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-20">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/50 via-orange-100/50 to-pink-100/50"></div>
        
        {/* Floating Construction Emojis */}
        <div className="absolute inset-0 pointer-events-none">
          {constructionEmojis.map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl md:text-5xl opacity-30"
              style={{
                left: `${[5, 15, 25, 75, 85, 95, 10, 90, 30, 70][i]}%`,
                top: `${[10, 20, 80, 15, 85, 25, 70, 60, 40, 50][i]}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="container-custom max-w-4xl mx-auto relative z-10">
          {/* Main Card */}
          <motion.div
            className="bg-white/90 backdrop-blur-sm rounded-[60px] p-8 md:p-16 shadow-2xl border-4 border-white relative overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-br-[100px] opacity-30"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-blue-200 to-purple-200 rounded-tl-[100px] opacity-30"></div>
            
            {/* Floating Hearts */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${[5, 90, 10, 85, 20, 80][i]}%`,
                  top: `${[10, 15, 80, 85, 40, 60][i]}%`,
                }}
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                {i % 2 === 0 ? (
                  <Heart className="w-6 h-6 text-pink-300 fill-pink-300/30" />
                ) : (
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300/30" />
                )}
              </motion.div>
            ))}

            <div className="relative z-10 text-center">
              {/* Construction Icons Row */}
              <motion.div 
                className="flex justify-center gap-4 mb-8"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {[Construction, Hammer, Wrench, Paintbrush].map((Icon, i) => (
                  <motion.div
                    key={i}
                    variants={bounceAnimation}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center text-white"
                  >
                    <Icon className="w-8 h-8" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Coming Soon Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="inline-block mb-6"
              >
                <span className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-xl">
                  <Clock className="w-6 h-6 animate-spin-slow" />
                  Coming Soon!
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </span>
              </motion.div>

              {/* Main Title */}
              <motion.h1 
                className="text-5xl md:text-7xl font-black mb-6"
                variants={fadeInUp}
              >
                <span className="bg-gradient-to-r from-orange-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Hero Stories
                </span>
              </motion.h1>

              {/* Emoji Row */}
              <motion.div
                variants={fadeInUp}
                className="flex justify-center gap-3 mb-6"
              >
                {['🦸', '🦸‍♀️', '🌟', '⭐', '✨'].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="text-4xl"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </motion.div>

              {/* Description */}
              <motion.p 
                className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed"
                variants={fadeInUp}
              >
                We're collecting amazing stories from little heroes just like yours! 
                Soon you'll be able to read about their incredible journeys, 
                celebrate their victories, and be inspired by their courage.
              </motion.p>

              {/* Progress Bar */}
              <motion.div 
                className="max-w-md mx-auto mb-8"
                variants={fadeInUp}
              >
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Stories being prepared</span>
                  <span className="font-bold text-purple-600">80%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: "80%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* Fun Stats Preview */}
              <motion.div 
                className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8"
                variants={staggerContainer}
              >
                {[
                  { number: "50+", label: "Stories Coming", icon: "📚" },
                  { number: "100+", label: "Heroes Featured", icon: "🦸" },
                  { number: "30+", label: "Hospitals Sharing", icon: "🏥" },
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    className="bg-white/50 p-4 rounded-2xl"
                    variants={bounceAnimation}
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-3xl mb-2 block">{stat.icon}</span>
                    <p className="text-xl font-bold text-gray-800">{stat.number}</p>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Notify Me Button */}
              <motion.div variants={fadeInUp}>
                <button className="group bg-gradient-to-r from-blue-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all inline-flex items-center gap-3">
                  <Bell className="w-5 h-5 group-hover:animate-ring" />
                  Notify Me When Stories Launch
                  <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  ✨ We'll send you a superhero signal when we're ready! ✨
                </p>
              </motion.div>

              {/* Decorative Dots */}
              <motion.div 
                className="flex justify-center gap-2 mt-8"
                variants={fadeInUp}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: `hsl(${i * 72}, 70%, 60%)` }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Preview Cards (Grayscale) */}
          <motion.div 
            className="grid md:grid-cols-3 gap-6 mt-12"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[1, 2, 3].map((_, i) => (
              <motion.div
                key={i}
                className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 opacity-50 grayscale"
                variants={bounceAnimation}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div>
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded mt-1"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex gap-1 mt-3">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-4 h-4 text-gray-300 fill-gray-300" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}