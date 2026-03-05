"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
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
  Sun,
  Cloud,
  Rainbow,
  ArrowRight,
  Hospital,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Building2
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
  { icon: Hospital, color: "text-orange-300", size: 28, left: 92, top: 60, delay: 2.5 },
  { icon: Building2, color: "text-red-300", size: 26, left: 8, top: 85, delay: 3 },
  { icon: Users, color: "text-purple-300", size: 32, left: 65, top: 15, delay: 3.5 },
];

// Hospital Data
const hospitals = [
  {
    id: 1,
    name: "Peranendiya Bandaranayake Child Hospital",
    shortName: "Peranendiya Children's",
    location: "Peranendiya, Colombo",
    description: "Sri Lanka's premier children's hospital specializing in pediatric rehabilitation and therapy.",
    fullAddress: "123 Hospital Road, Peranendiya, Colombo 08",
    phone: "+94 11 2 345 678",
    email: "pediatrics@peranendiya.lk",
    website: "www.peranendiya.lk",
    image: "/assets/hospital-1.jpg",
    color: "from-blue-400 to-cyan-400",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    programs: [
      "Pediatric Rehabilitation",
      "Occupational Therapy",
      "Physical Therapy",
      "Early Intervention"
    ],
    established: "1985",
    beds: "350",
    specialists: "25+",
    emoji: "🏥",
    coordinates: { lat: 6.9271, lng: 79.8612 }
  },
  {
    id: 2,
    name: "Ayathi Centre Ragama",
    shortName: "Ayathi Ragama",
    location: "Ragama",
    description: "Specialized rehabilitation center focused on children with hemiplegia and motor disorders.",
    fullAddress: "45 Rehabilitation Avenue, Ragama, Gampaha",
    phone: "+94 11 2 987 654",
    email: "info@ayathi.lk",
    website: "www.ayathi.lk",
    image: "/assets/hospital-2.jpg",
    color: "from-purple-400 to-pink-400",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    programs: [
      "Hemiplegia Treatment",
      "Motor Skills Development",
      "Play Therapy",
      "Parent Training"
    ],
    established: "2010",
    beds: "120",
    specialists: "15+",
    emoji: "🏥",
    coordinates: { lat: 7.0312, lng: 79.9184 }
  },
  {
    id: 3,
    name: "Boralla Child Hospital",
    shortName: "Boralla Children's",
    location: "Boralla, Colombo",
    description: "Leading children's hospital with a dedicated ArmiGo rehabilitation wing.",
    fullAddress: "78 Boralla Road, Boralla, Colombo 08",
    phone: "+94 11 2 456 789",
    email: "children@borallahospital.lk",
    website: "www.borallachildren.lk",
    image: "/assets/hospital-3.jpg",
    color: "from-green-400 to-teal-400",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    programs: [
      "ArmiGo Therapy Program",
      "VR Rehabilitation",
      "IoT Device Training",
      "Family Support Groups"
    ],
    established: "1995",
    beds: "280",
    specialists: "20+",
    emoji: "🏥",
    coordinates: { lat: 6.9118, lng: 79.8752 }
  }
];

// Sub Hospitals/Clinics
const subHospitals = [
  {
    name: "Kalubowila Children's Clinic",
    location: "Kalubowila, Dehiwala",
    parentHospital: "Peranendiya Network",
    phone: "+94 11 2 111 222",
    emoji: "🏨"
  },
  {
    name: "Negombo Rehabilitation Center",
    location: "Negombo",
    parentHospital: "Ayathi Network",
    phone: "+94 31 2 333 444",
    emoji: "🏨"
  },
  {
    name: "Kandy Child Therapy Unit",
    location: "Kandy",
    parentHospital: "Boralla Network",
    phone: "+94 81 2 555 666",
    emoji: "🏨"
  },
  {
    name: "Galle Pediatric Clinic",
    location: "Galle",
    parentHospital: "Peranendiya Network",
    phone: "+94 91 2 777 888",
    emoji: "🏨"
  },
  {
    name: "Kurunegala Therapy Center",
    location: "Kurunegala",
    parentHospital: "Ayathi Network",
    phone: "+94 37 2 999 000",
    emoji: "🏨"
  },
  {
    name: "Matara Child Development Unit",
    location: "Matara",
    parentHospital: "Boralla Network",
    phone: "+94 41 2 123 456",
    emoji: "🏨"
  }
];

const programs = [
  {
    title: "Early Intervention Program",
    age: "6-8 years",
    description: "Gentle introduction to therapy through playful activities and basic motor skill development.",
    duration: "12 weeks",
    sessions: "2x per week",
    icon: Hand,
    color: "from-blue-400 to-cyan-400",
    emoji: "🐣"
  },
  {
    title: "Hero Training Program",
    age: "9-11 years",
    description: "Structured therapy sessions combining IoT devices with fun exercises to build strength.",
    duration: "16 weeks",
    sessions: "3x per week",
    icon: Target,
    color: "from-purple-400 to-pink-400",
    emoji: "🦸"
  },
  {
    title: "VR Adventure Program",
    age: "12-14 years",
    description: "Advanced rehabilitation using VR games that make therapy feel like epic quests.",
    duration: "20 weeks",
    sessions: "3x per week",
    icon: Gamepad2,
    color: "from-green-400 to-teal-400",
    emoji: "🎮"
  },
  {
    title: "Family Support Program",
    age: "All ages",
    description: "Training and resources for parents to continue therapy at home with guided exercises.",
    duration: "8 weeks",
    sessions: "1x per week",
    icon: Heart,
    color: "from-orange-400 to-red-400",
    emoji: "👨‍👩‍👧"
  }
];

export default function ProgramsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

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
                <Hospital className="w-full h-full text-blue-300 fill-blue-300" />
              ) : i % 3 === 1 ? (
                <Heart className="w-full h-full text-pink-300 fill-pink-300" />
              ) : (
                <Building2 className="w-full h-full text-purple-300 fill-purple-300" />
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
            <span className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-xl">
              <Hospital className="w-5 h-5 animate-bounce" />
              Our Partner Hospitals
              <Heart className="w-5 h-5 animate-bounce delay-100 fill-current" />
            </span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Healing Heroes
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center gap-2 mb-6"
          >
            {['🏥', '🦸', '👩‍⚕️', '👨‍⚕️', '💙'].map((emoji, i) => (
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

      {/* Partner Message Section */}
      <section className="py-16 px-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-100/50 to-pink-100/50"></div>
        
        {/* Floating Medical Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-20"
              style={{
                left: `${[5, 15, 25, 75, 85, 95, 10, 90][i]}%`,
                top: `${[10, 20, 80, 15, 85, 25, 70, 60][i]}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              {['🏥', '⚕️', '💊', '🩺', '🏨', '❤️', '🌟', '🦋'][i]}
            </motion.div>
          ))}
        </div>

        <div className="container-custom max-w-5xl mx-auto relative z-10">
          <motion.div
            className="bg-white/90 backdrop-blur-sm rounded-[60px] p-8 md:p-12 shadow-2xl border-4 border-white relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            whileHover={{ scale: 1.02 }}
          >
            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-200 to-purple-200 rounded-br-[100px] opacity-30"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-pink-200 to-orange-200 rounded-tl-[100px] opacity-30"></div>
            
            {/* Floating Hearts and Stars */}
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

            <div className="relative z-10">
              {/* Top Badge */}
              <motion.div 
                className="flex justify-center mb-8"
                variants={fadeInUp}
              >
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg">
                  <Heart className="w-4 h-4 fill-current animate-pulse" />
                  Our Promise to Families
                  <Heart className="w-4 h-4 fill-current animate-pulse" />
                </span>
              </motion.div>

              {/* Main Message with Visual Elements */}
              <div className="grid md:grid-cols-5 gap-8 items-center">
                {/* Left Visual - Map of Sri Lanka with pins */}
                <motion.div 
                  className="md:col-span-2 relative"
                  variants={fadeInLeft}
                >
                  <div className="relative aspect-square max-w-[300px] mx-auto">
                    {/* Stylized Map of Sri Lanka */}
                    <div className="relative w-full h-full">
                      {/* Map Shape */}
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        <motion.path
                          d="M100,20 C130,20 160,40 170,70 C180,100 170,140 150,160 C130,180 90,190 60,170 C30,150 20,110 40,80 C60,50 80,30 100,20"
                          fill="url(#gradient)"
                          stroke="url(#strokeGradient)"
                          strokeWidth="3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, delay: 0.5 }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#93C5FD" />
                            <stop offset="50%" stopColor="#C4B5FD" />
                            <stop offset="100%" stopColor="#F9A8D4" />
                          </linearGradient>
                          <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="50%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Hospital Pins */}
                      {[
                        { left: "35%", top: "45%", name: "Colombo", delay: 0.8 },
                        { left: "45%", top: "35%", name: "Ragama", delay: 1 },
                        { left: "55%", top: "30%", name: "Kandy", delay: 1.2 },
                        { left: "30%", top: "60%", name: "Galle", delay: 1.4 },
                        { left: "65%", top: "25%", name: "Kurunegala", delay: 1.6 },
                        { left: "25%", top: "70%", name: "Matara", delay: 1.8 },
                      ].map((pin, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          style={{ left: pin.left, top: pin.top }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: pin.delay, type: "spring" }}
                        >
                          <motion.div
                            animate={{ 
                              y: [0, -8, 0],
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                          >
                            <Hospital className="w-6 h-6 text-purple-600 drop-shadow-lg" />
                          </motion.div>
                          <motion.div 
                            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pin.delay + 0.3 }}
                          >
                            {pin.name}
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <motion.line
                        x1="35%"
                        y1="45%"
                        x2="45%"
                        y2="35%"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1 }}
                      />
                      <motion.line
                        x1="45%"
                        y1="35%"
                        x2="55%"
                        y2="30%"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                      />
                      <motion.line
                        x1="35%"
                        y1="45%"
                        x2="30%"
                        y2="60%"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 1.4 }}
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* Right Content */}
                <motion.div 
                  className="md:col-span-3 space-y-6"
                  variants={fadeInRight}
                >
                  {/* Main Message with Highlighted Text */}
                  <div className="space-y-4">
                    <motion.p 
                      className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed"
                      variants={fadeInUp}
                    >
                      <span className="text-5xl text-purple-400 block mb-2">"</span>
                      We've partnered with 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-black mx-2">
                        Sri Lanka's leading children's hospitals
                      </span>
                      to bring ArmiGo therapy to little heroes everywhere.
                    </motion.p>

                    <motion.p 
                      className="text-xl text-gray-700"
                      variants={fadeInUp}
                    >
                      <span className="text-3xl mr-2">🏥</span>
                      From major centers to local clinics, 
                      <span className="font-bold text-purple-600"> help is always nearby.</span>
                    </motion.p>
                  </div>

                  {/* Stats Row */}
                  <motion.div 
                    className="grid grid-cols-3 gap-4 py-4"
                    variants={staggerContainer}
                  >
                    {[
                      { number: "3", label: "Major Hospitals", icon: Hospital, color: "blue" },
                      { number: "6+", label: "Local Clinics", icon: Building2, color: "purple" },
                      { number: "100+", label: "Specialists", icon: Users, color: "pink" },
                    ].map((stat, i) => (
                      <motion.div 
                        key={i}
                        className="text-center"
                        variants={fadeInUp}
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className={`w-12 h-12 mx-auto bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-2`}>
                          <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                        <p className={`text-2xl font-black text-${stat.color}-600`}>{stat.number}</p>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Coverage Badge */}
                  <motion.div 
                    className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-2xl"
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Nationwide Coverage</p>
                      <p className="text-xs text-gray-600">Island-wide network of partner hospitals and clinics</p>
                    </div>
                    <motion.div
                      className="ml-auto"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity }}
                    >
                      <span className="text-2xl">🌍</span>
                    </motion.div>
                  </motion.div>

                  {/* Find Hospital Button */}
                  <motion.div variants={fadeInUp}>
                    <button className="group bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all flex items-center gap-3 w-full justify-center">
                      <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Find a Hospital Near You
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      ⚡ New clinics opening in Jaffna, Batticaloa, and Anuradhapura soon!
                    </p>
                  </motion.div>
                </motion.div>
              </div>

              {/* Bottom Decoration */}
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
        </div>
      </section>

      {/* Main Hospital Partners - WITH EQUAL SIZED CARDS */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-full text-sm font-bold mb-4">
              <Hospital className="inline w-4 h-4 mr-1" />
              Main Partner Hospitals
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Where to Find Us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our flagship centers where little heroes begin their journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hospitals.map((hospital, index) => (
              <motion.div
                key={hospital.id}
                className="relative group h-full flex"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                onClick={() => setSelectedHospital(hospital)}
              >
                <div className={`bg-gradient-to-br ${hospital.color} p-1 rounded-[40px] cursor-pointer w-full`}>
                  <div className="bg-white rounded-[40px] overflow-hidden h-full flex flex-col">
                    {/* Image Section - Fixed height */}
                    <div className="relative h-48 flex-shrink-0 overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${hospital.color} opacity-20`}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-7xl opacity-30">{hospital.emoji}</span>
                      </div>
                      {/* Hospital Badge */}
                      <motion.div 
                        className="absolute top-4 left-4 bg-white/95 px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Hospital className={`w-4 h-4 ${hospital.iconColor}`} />
                        <span className="text-xs font-bold">Main Center</span>
                      </motion.div>
                      {/* Year Badge */}
                      <motion.div 
                        className="absolute top-4 right-4 bg-white/95 px-4 py-2 rounded-full shadow-lg"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-xs font-bold">Est. {hospital.established}</span>
                      </motion.div>
                    </div>

                    {/* Content Section - Flex column with fixed layout */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Title with fixed height for 2 lines */}
                      <div className="h-14 mb-2">
                        <h3 className="text-xl font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all line-clamp-2">
                          {hospital.name}
                        </h3>
                      </div>
                      
                      {/* Description with fixed height for 2 lines */}
                      <div className="h-12 mb-4">
                        <p className="text-sm text-gray-600 line-clamp-2">{hospital.description}</p>
                      </div>

                      {/* Quick Info - Fixed height */}
                      <div className="space-y-2 mb-4 h-24">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className={`w-4 h-4 ${hospital.iconColor} flex-shrink-0`} />
                          <span className="text-gray-600 truncate">{hospital.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className={`w-4 h-4 ${hospital.iconColor} flex-shrink-0`} />
                          <span className="text-gray-600 truncate">{hospital.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className={`w-4 h-4 ${hospital.iconColor} flex-shrink-0`} />
                          <span className="text-gray-600">{hospital.specialists} Specialists</span>
                        </div>
                      </div>

                      {/* Programs Tags - Fixed height with flex wrap */}
                      <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                        {hospital.programs.slice(0, 2).map((program, i) => (
                          <span key={i} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                            {program}
                          </span>
                        ))}
                        {hospital.programs.length > 2 && (
                          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                            +{hospital.programs.length - 2} more
                          </span>
                        )}
                      </div>

                      {/* View Details Button - Always at bottom */}
                      <div className="mt-auto">
                        <motion.button 
                          className={`w-full bg-gradient-to-r ${hospital.color} text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 group/btn`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div 
                  className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg shadow-lg"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity }}
                >
                  ⭐
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital Network Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-full text-sm font-bold mb-4">
              <Building2 className="inline w-4 h-4 mr-1" />
              Our Partner Network
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Sub Hospitals & Clinics
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Smaller centers connected to our main hospitals for easier access
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subHospitals.map((clinic, index) => (
              <motion.div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ scale: 1.03, y: -5 }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{clinic.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{clinic.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{clinic.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        {clinic.parentHospital}
                      </span>
                      <span className="text-xs text-gray-400">{clinic.phone}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p 
            className="text-center text-gray-600 mt-8 bg-white/50 p-4 rounded-2xl"
            variants={fadeInUp}
          >
            <Heart className="inline w-4 h-4 text-pink-500 mr-2" />
            And more clinics opening near you soon!
          </motion.p>
        </div>
      </section>

      {/* Therapy Programs Section */}
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
              <Gamepad2 className="inline w-4 h-4 mr-1" />
              Our Programs
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Hero Training Paths
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the right adventure for your little hero
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program, index) => (
              <motion.div
                key={index}
                className="relative group h-full flex"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className={`bg-gradient-to-br ${program.color} p-1 rounded-3xl w-full`}>
                  <div className="bg-white p-6 rounded-3xl h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center text-white text-2xl`}>
                        {program.emoji}
                      </div>
                      <program.icon className={`w-6 h-6 text-${program.color.split('-')[2]}-500`} />
                    </div>
                    
                    <h3 className="text-lg font-bold mb-1">{program.title}</h3>
                    <p className="text-xs text-purple-600 font-medium mb-3">{program.age}</p>
                    <p className="text-sm text-gray-600 mb-4 flex-grow">{program.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{program.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{program.sessions}</span>
                      </div>
                    </div>

                    <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors mt-auto">
                      Learn More
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Apply Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
        <div className="container-custom max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-sm font-bold mb-4">
              <Rocket className="inline w-4 h-4 mr-1" />
              Start Your Journey
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              How to Apply
            </h2>
          </motion.div>

          <div className="bg-white rounded-[50px] p-8 shadow-2xl">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Choose a Hospital", desc: "Select the hospital closest to you from our partner network", icon: Hospital, color: "text-blue-500" },
                { step: "2", title: "Visit for Assessment", desc: "Schedule a visit for a free hero assessment with our specialists", icon: CheckCircle, color: "text-green-500" },
                { step: "3", title: "Start Your Adventure", desc: "Begin the program that's right for your little hero", icon: Rocket, color: "text-purple-500" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="text-center"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br from-${item.color.split('-')[0]}-100 to-${item.color.split('-')[0]}-200 rounded-2xl flex items-center justify-center mb-4`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <div className="relative">
                    <span className={`absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r ${item.color} text-white rounded-full flex items-center justify-center font-bold`}>
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="mt-8 text-center"
              variants={fadeInUp}
            >
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all group"
              >
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Schedule Free Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                No referral needed • Free consultation • Available at all partner hospitals
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Rainbow Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-90"></div>
        
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
            {['🏥', '🦸', '👩‍⚕️', '💙', '⭐', '🌟', '💫', '☁️'][i]}
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
              🏥
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
            Find a Hospital Near You
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            With locations across Sri Lanka, help is always close by. 
            Join our network of healing heroes today!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-400 text-purple-900 px-10 py-5 rounded-full font-black text-xl hover:bg-yellow-300 transition-all shadow-2xl flex items-center gap-3 group"
            >
              <Hospital className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Find Your Hospital
              <MapPin className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.1, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-purple-900 px-10 py-5 rounded-full font-black text-xl hover:bg-purple-100 transition-all shadow-2xl flex items-center gap-3 group"
            >
              <Heart className="w-6 h-6 text-pink-500" />
              Contact Us
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </div>

          <motion.p 
            className="text-white/80 text-sm mt-8 flex items-center justify-center gap-2"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>✨</span>
            New hospitals joining every month!
            <span>✨</span>
          </motion.p>
        </div>
      </section>

      <Footer />

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <button 
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 z-10"
              onClick={() => setSelectedHospital(null)}
            >
              ✕
            </button>

            <div className={`bg-gradient-to-br ${selectedHospital.color} p-1 rounded-t-[40px]`}>
              <div className="bg-white rounded-t-[40px] p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${selectedHospital.color} rounded-2xl flex items-center justify-center text-white text-3xl`}>
                    {selectedHospital.emoji}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedHospital.name}</h3>
                    <p className="text-gray-600">{selectedHospital.location}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-700">{selectedHospital.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold">Established</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{selectedHospital.established}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold">Specialists</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{selectedHospital.specialists}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-bold mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedHospital.fullAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedHospital.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedHospital.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-bold mb-3">Available Programs</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedHospital.programs.map((program, i) => (
                        <span key={i} className="bg-white px-3 py-1 rounded-full text-sm shadow-sm">
                          {program}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold">
                      Schedule Appointment
                    </button>
                    <button className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50">
                      Get Directions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}