"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Heart, 
  Activity, 
  Shield, 
  Gamepad2, 
  Trophy,
  Target,
  Users,
  Sparkles,
  Rocket,
  Smile,
  Star,
  Award,
  Clock,
  Globe,
  BookOpen,
  Hand,
  Footprints,
  Brain,
  PartyPopper,
  Gem,
  Medal,
  Hospital,
  Sun,
  Cloud,
  Rainbow,
  ArrowRight
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
       type: "spring" as const,
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
  { icon: Gem, color: "text-orange-300", size: 22, left: 92, top: 60, delay: 2.5 },
  { icon: Medal, color: "text-red-300", size: 28, left: 8, top: 85, delay: 3 },
  { icon: Sun, color: "text-yellow-300", size: 34, left: 65, top: 15, delay: 3.5 },
];

const teamMembers = [
  {
    name: "Mr. Didula Chamara",
    role: "Supervisor",
    bio: "Guiding the ArmiGo research project with expertise in software engineering and healthcare technology innovation.",
    image: "/assets/supervisor.jpeg",
    color: "from-blue-400 to-purple-400",
    emoji: "👨‍🏫"
  },
  {
    name: "Mr. Eishan Weerasinghe",
    role: "Co-Supervisor",
    bio: "Providing expert guidance and mentorship in IoT healthcare solutions and rehabilitation technology research.",
    image: "/assets/cosupervisor.jpeg",
    color: "from-green-400 to-teal-400",
    emoji: "👨‍🏫"
  },
  {
    name: "Dr. Buddika Senewirathna",
    role: "External Supervisor - Head of Physiotherapy, Sirimavo Bandaranaike Children's Hospital",
    bio: "Leading expert in pediatric physiotherapy providing clinical guidance and domain expertise for the ArmiGo rehabilitation system.",
    image: "/assets/doctor.jpeg",
    color: "from-pink-400 to-red-400",
    emoji: "👨‍⚕️"
  },
];

const developers = [
  {
    name: "Sanjana Nimesh",
    role: "Developer - Finger Rehabilitation",
    bio: "Designed and developed the finger rehabilitation IoT device and interactive VR game for finger therapy exercises.",
    image: "/assets/member1.jpeg",
    color: "from-indigo-400 to-purple-400",
    emoji: "👨‍💻"
  },
  {
    name: "Asanka Wikramasurendra",
    role: "Developer - Shoulder Rehabilitation",
    bio: "Designed and developed the shoulder rehabilitation IoT device and interactive VR game for shoulder therapy exercises.",
    image: "/assets/member2.jpeg",
    color: "from-orange-400 to-yellow-400",
    emoji: "👨‍💻"
  },
  {
    name: "Dinithi Weerasinghe",
    role: "Developer - Elbow Rehabilitation",
    bio: "Designed and developed the elbow rehabilitation IoT device and interactive VR game for elbow therapy exercises.",
    image: "/assets/member3 .jpeg",
    color: "from-teal-400 to-cyan-400",
    emoji: "👩‍💻"
  },
  {
    name: "Anushka Siyambalapitiya",
    role: "Developer - Wrist Rehabilitation",
    bio: "Designed and developed the wrist rehabilitation IoT device and interactive VR game for wrist therapy exercises.",
    image: "/assets/member4.jpeg",
    color: "from-rose-400 to-pink-400",
    emoji: "👨‍💻"
  },
];

const milestones = [
  { year: "Aug 2025", title: "Project Initiated", desc: "ArmiGo research project kicked off at SLIIT to revolutionize pediatric rehabilitation", icon: Star, color: "text-yellow-500" },
  { year: "Sep 2025", title: "Clinical Partnership", desc: "Partnership established with Sirimavo Bandaranaike Children's Hospital for clinical guidance", icon: Hospital, color: "text-blue-500" },
  { year: "Oct 2025", title: "Data Collection", desc: "Clinical data gathered from patients at the hospital to guide device and game design", icon: Activity, color: "text-green-500" },
  { year: "Dec 2025", title: "First Version Implemented", desc: "Initial prototypes of IoT rehabilitation devices built and tested", icon: Hand, color: "text-blue-500" },
  { year: "Jan 2026", title: "Development & Refinement", desc: "Full development cycle — firmware, mobile app, web dashboard and desktop app built out", icon: Globe, color: "text-purple-500" },
  { year: "Feb 2026", title: "Game Development", desc: "Unreal Engine VR rehabilitation games designed and developed for each device", icon: Gamepad2, color: "text-orange-500" },
  { year: "Feb 2026", title: "WiFi Integration", desc: "Devices connected wirelessly via WiFi for seamless real-time gameplay", icon: Activity, color: "text-green-500" },
  { year: "Apr 2026", title: "Full System Release", desc: "Complete ArmiGo platform released — 4 devices, VR games, mobile app, desktop app and web dashboard", icon: Trophy, color: "text-yellow-500" },
];

const stats = [
  { number: "5000+", label: "Happy Heroes", icon: Smile, color: "text-green-500", bg: "bg-green-100" },
  { number: "50+", label: "Partner Hospitals", icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
  { number: "100K+", label: "Therapy Sessions", icon: Activity, color: "text-purple-500", bg: "bg-purple-100" },
  { number: "98%", label: "Parent Satisfaction", icon: Heart, color: "text-pink-500", bg: "bg-pink-100" },
  { number: "15", label: "Countries", icon: Globe, color: "text-yellow-500", bg: "bg-yellow-100" },
  { number: "10+", label: "Clinical Studies", icon: Award, color: "text-orange-500", bg: "bg-orange-100" },
];

const values = [
  {
    title: "Play First",
    desc: "We believe therapy should feel like play. Every device and game is designed to bring smiles, not tears.",
    icon: Gamepad2,
    color: "from-blue-400 to-blue-600",
    bgColor: "bg-blue-50",
    emoji: "🎮"
  },
  {
    title: "Family Centered",
    desc: "Parents are superheroes too. We empower families with tools to track, celebrate, and support their child's journey.",
    icon: Heart,
    color: "from-pink-400 to-pink-600",
    bgColor: "bg-pink-50",
    emoji: "👨‍👩‍👧"
  },
  {
    title: "Science Backed",
    desc: "Every product is developed with leading researchers and tested in clinical settings. Fun meets evidence-based care.",
    icon: Brain,
    color: "from-purple-400 to-purple-600",
    bgColor: "bg-purple-50",
    emoji: "🔬"
  },
  {
    title: "Innovation Always",
    desc: "We're constantly pushing boundaries with IoT, VR, and AI to create the future of pediatric rehabilitation.",
    icon: Rocket,
    color: "from-orange-400 to-orange-600",
    bgColor: "bg-orange-50",
    emoji: "🚀"
  },
];

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 overflow-x-hidden">
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

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Rainbow Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-yellow-200 via-green-200 via-blue-200 to-purple-200 opacity-30"></div>
        
        {/* Animated Shapes */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-16 md:w-24 md:h-24"
              style={{
                left: `${[5, 15, 25, 75, 85, 95, 10, 90][i]}%`,
                top: `${[10, 20, 80, 15, 85, 25, 70, 60][i]}%`,
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 10 + i,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {i % 3 === 0 ? (
                <Star className="w-full h-full text-yellow-300 fill-yellow-300" />
              ) : i % 3 === 1 ? (
                <Heart className="w-full h-full text-pink-300 fill-pink-300" />
              ) : (
                <Gem className="w-full h-full text-purple-300 fill-purple-300" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="container-custom max-w-4xl mx-auto text-center relative z-10">
          {/* Welcome Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-block mb-6"
          >
            <span className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-xl">
              <PartyPopper className="w-5 h-5 animate-bounce" />
              Welcome to Our Superhero Academy!
              <PartyPopper className="w-5 h-5 animate-bounce delay-100" />
            </span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Our Story
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center gap-2 mb-6"
          >
            {['🦸', '🦸‍♀️', '🌈', '⭐', '🎮'].map((emoji, i) => (
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

          {/* Decorative Dots */}
          <motion.div 
            className="flex justify-center gap-2 mt-8"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  background: `hsl(${i * 36}, 80%, 60%)`,
                }}
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className={`${stat.bg} rounded-3xl p-6 text-center hover:shadow-xl transition-all group cursor-pointer`}
                variants={bounceAnimation}
                whileHover={{ y: -8, scale: 1.05 }}
              >
                <div className="flex justify-center mb-3">
                  <stat.icon className={`w-8 h-8 ${stat.color} group-hover:scale-110 transition-transform`} />
                </div>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.number}</p>
                <p className="text-xs text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story Section - REDESIGNED */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100"></div>
        
        {/* Floating Story Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              style={{
                left: `${[10, 20, 80, 90, 30, 70][i]}%`,
                top: `${[20, 70, 30, 80, 50, 40][i]}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              {['🦸', '🦄', '🌈', '⭐', '🎮', '🦋'][i]}
            </motion.div>
          ))}
        </div>

        <div className="container-custom max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-lg font-bold mb-4 shadow-lg">
              <Sparkles className="inline w-5 h-5 mr-2 animate-pulse" />
              Our Magical Beginning
              <Sparkles className="inline w-5 h-5 ml-2 animate-pulse" />
            </span>
          </motion.div>

          {/* Main Story Card */}
          <motion.div
            className="bg-white/90 backdrop-blur-sm rounded-[50px] p-8 md:p-12 shadow-2xl border-4 border-white relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
          >
            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-br-[100px] opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-200 to-purple-200 rounded-tl-[100px] opacity-50"></div>
            
            {/* Floating Hearts */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-pink-300"
                style={{
                  left: `${[10, 90, 5, 95][i]}%`,
                  top: `${[10, 15, 90, 85][i]}%`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                <Heart size={24} className="fill-current" />
              </motion.div>
            ))}

            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              {/* Left Side - Visual Story */}
              <div className="relative">
                <motion.div
                  className="relative rounded-[40px] overflow-hidden shadow-2xl"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Image
                    src="/assets/logo.png"
                    width={600}
                    height={600}
                    alt="ArmiGo Story"
                    className="w-full object-cover"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent"></div>
                  
                  {/* Floating Badges */}
                  <motion.div 
                    className="absolute top-4 left-4 bg-white/95 p-4 rounded-2xl shadow-xl flex items-center gap-2"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-2xl">✨</span>
                    <div>
                      <p className="text-xs text-gray-500">Founded with</p>
                      <p className="font-bold text-sm">Love & Science</p>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="absolute bottom-4 right-4 bg-white/95 p-4 rounded-2xl shadow-xl flex items-center gap-2"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-xs text-gray-500">Helping</p>
                      <p className="font-bold text-sm">5000+ Heroes</p>
                    </div>
                  </motion.div>

                  {/* Animated Circles */}
                  <motion.div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-5xl">🦸</span>
                  </motion.div>
                </motion.div>

                {/* Achievement Strip */}
                <motion.div 
                  className="absolute -bottom-6 -left-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2"
                  initial={{ x: -50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Trophy className="w-5 h-5" />
                  <span className="font-bold">10+ Clinical Studies</span>
                </motion.div>
              </div>

              {/* Right Side - Story Content */}
              <div className="space-y-6">
                {/* Main Quote */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-6xl text-purple-300 block mb-2">"</span>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed">
                    Therapy should be an 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block my-2">
                      adventure, not a chore.
                    </span>
                  </p>
                </motion.div>

                {/* Mission Statement with Icons */}
                <motion.div 
                  className="space-y-4"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                >
                  {[
                    { icon: Heart, text: "We're on a mission to help little heroes build strength, confidence, and smiles through play.", color: "text-pink-500" },
                    { icon: Star, text: "Every device and game is crafted with love, backed by science, and tested by real superheroes.", color: "text-yellow-500" },
                    { icon: Rocket, text: "From our first prototype to helping thousands of children worldwide, the adventure continues!", color: "text-purple-500" },
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      className="flex items-start gap-4 bg-white/50 p-4 rounded-2xl"
                      variants={fadeInRight}
                      whileHover={{ scale: 1.02, backgroundColor: "white" }}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${item.color.replace('text', 'from')} to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <p className="text-gray-700">{item.text}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Founder Quote Card */}
                <motion.div 
                  className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-3xl border-2 border-white shadow-lg"
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src="/assets/doctor.jpeg"
                          width={64}
                          height={64}
                          alt="Dr. Buddika Senewirathna"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <motion.div 
                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <p className="text-gray-700 italic text-lg">
                        "Every child deserves the chance to reach their full potential. At ArmiGo, we're combining technology with therapy to make rehabilitation engaging and effective for children."
                      </p>
                      <div className="mt-3">
                        <p className="font-bold text-gray-800">Dr. Buddika Senewirathna</p>
                        <p className="text-sm text-gray-500">Head of Physiotherapy, Sirimavo Bandaranaike Children's Hospital</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Call to Action */}
                <motion.div 
                  className="flex gap-3 mt-4"
                  variants={fadeInUp}
                >
                  <Link
                    href="/contact"
                    className="group bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:shadow-xl transition-all"
                  >
                    <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Join Our Mission
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/stories"
                    className="group bg-white text-purple-600 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:shadow-xl transition-all border-2 border-purple-200"
                  >
                    <Star className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                    Hero Stories
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-full text-sm font-bold mb-4">
              <Sparkles className="inline w-4 h-4 mr-1" />
              What Drives Us
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Our Superpowers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four core values that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                className="relative group"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className={`bg-gradient-to-br ${value.color} p-1 rounded-3xl`}>
                  <div className={`${value.bgColor} p-6 rounded-3xl h-full`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center text-white text-2xl`}>
                        {value.emoji}
                      </div>
                      <value.icon className={`w-6 h-6 text-${value.color.split('-')[2]}-500`} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                    <p className="text-sm text-gray-600">{value.desc}</p>
                    
                    {/* Hover Effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-3xl"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full text-sm font-bold mb-4">
              <Users className="inline w-4 h-4 mr-1" />
              Meet the Heroes
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Our Super Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The amazing people behind the magic
            </p>
          </motion.div>

          {/* Top Row - Supervisors */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                className="relative group"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className={`bg-gradient-to-br ${member.color} p-1 rounded-3xl`}>
                  <div className="bg-white p-6 rounded-3xl text-center">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden">
                        <Image
                          src={member.image}
                          width={96}
                          height={96}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <motion.div 
                        className="absolute -top-2 -right-2 text-2xl"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity }}
                      >
                        ⭐
                      </motion.div>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                    <p className="text-xs text-purple-600 font-medium mb-3">{member.role}</p>
                    <p className="text-xs text-gray-600">{member.bio}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Row - Developers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {developers.map((member, i) => (
              <motion.div
                key={i}
                className="relative group"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className={`bg-gradient-to-br ${member.color} p-1 rounded-3xl`}>
                  <div className="bg-white p-6 rounded-3xl text-center">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden">
                        <Image
                          src={member.image}
                          width={96}
                          height={96}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <motion.div 
                        className="absolute -top-2 -right-2 text-2xl"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity }}
                      >
                        ⭐
                      </motion.div>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                    <p className="text-xs text-purple-600 font-medium mb-3">{member.role}</p>
                    <p className="text-xs text-gray-600">{member.bio}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Timeline */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full text-sm font-bold mb-4">
              <Clock className="inline w-4 h-4 mr-1" />
              Our Journey
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Milestone Moments
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every step of our adventure so far
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>

            <div className="space-y-12">
              {milestones.map((item, i) => (
                <motion.div
                  key={i}
                  className={`relative flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {/* Timeline Dot */}
                  <motion.div 
                    className={`absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center text-white z-10`}
                    whileHover={{ scale: 1.2 }}
                  >
                    <item.icon className="w-4 h-4" />
                  </motion.div>

                  {/* Content */}
                  <div className={`w-5/12 ${i % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                    <motion.div 
                      className="bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className={`inline-block px-3 py-1 bg-gradient-to-r ${item.color} text-white rounded-full text-sm font-bold mb-2`}>
                        {item.year}
                      </span>
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Rainbow Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 opacity-90"></div>
        
        {/* Floating Balloons */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-5xl"
            style={{
              left: `${[5, 15, 25, 75, 85, 95, 10, 90][i]}%`,
              top: `${[10, 20, 80, 15, 85, 25, 70, 60][i]}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, (i % 2 === 0 ? 30 : -30), 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {['🎈', '🎈', '🎈', '✨', '⭐', '🌟', '💫', '☁️'][i]}
          </motion.div>
        ))}

        <div className="container-custom max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-2xl mx-auto">
              🦸
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
            Join Our Mission!
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            Whether you're a parent, therapist, or hospital, we'd love to have you in our superhero community.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-400 text-purple-900 px-10 py-5 rounded-full font-black text-xl hover:bg-yellow-300 transition-all shadow-2xl flex items-center gap-3 group"
            >
              <Heart className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Become a Hero
              <Rocket className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-purple-900 px-10 py-5 rounded-full font-black text-xl hover:bg-purple-100 transition-all shadow-2xl flex items-center gap-3 group"
            >
              <Activity className="w-6 h-6 text-green-500" />
              Partner With Us
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </div>

          <motion.p 
            className="text-white/80 text-sm mt-8 flex items-center justify-center gap-2"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>✨</span>
            Together, we can make therapy an adventure!
            <span>✨</span>
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
}