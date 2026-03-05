"use client";

import { useState } from "react";
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
  Hand,
  Footprints,
  Brain,
  PartyPopper,
  Gem,
  Medal,
  Sun,
  ArrowRight,
  Usb,
  Cable,
  Power,
  Gamepad,
  Monitor,
  Laptop,
  Info,
  CheckCircle,
  Play,
  RotateCw,
  Move,
  Maximize,
  Minimize,
  Repeat
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

// Device Data
const devices = [
  {
    id: 1,
    name: "Finger Hero Glove",
    description: "A smart glove that tracks every finger movement with precision sensors",
    longDescription: "The Finger Hero Glove is designed to help your child master fine motor skills through play. Each finger is individually tracked, allowing for detailed assessment and engaging exercises.",
    movements: [
      { name: "Flexion", description: "Bending fingers inward", icon: Hand, color: "blue" },
      { name: "Extension", description: "Straightening fingers", icon: Move, color: "blue" },
      { name: "Abduction", description: "Spreading fingers apart", icon: Maximize, color: "blue" },
      { name: "Adduction", description: "Bringing fingers together", icon: Minimize, color: "blue" },
      { name: "Circumduction", description: "Circular finger movements", icon: RotateCw, color: "blue" }
    ],
    connection: "USB Connection to Computer",
    setup: "Plug into any USB port, launch the game, and start playing!",
    color: "from-blue-400 to-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    emoji: "🖐️",
    gameExample: "Pinch flowers, play piano, finger painting"
  },
  {
    id: 2,
    name: "Wrist Wizard Band",
    description: "Precision wrist movement tracker for flexion, extension, and more",
    longDescription: "The Wrist Wizard Band captures all wrist movements with incredible accuracy. Your child will love controlling games with natural wrist motions.",
    movements: [
      { name: "Flexion", description: "Bending wrist forward", icon: Hand, color: "purple" },
      { name: "Extension", description: "Bending wrist backward", icon: Move, color: "purple" },
      { name: "Radial Deviation", description: "Bending toward thumb side", icon: ArrowRight, color: "purple" },
      { name: "Ulnar Deviation", description: "Bending toward little finger side", icon: ArrowRight, color: "purple" }
    ],
    connection: "USB Connection to Laptop/Computer",
    setup: "Connect via USB, launch your favorite game, and watch the magic happen!",
    color: "from-purple-400 to-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    emoji: "⌚",
    gameExample: "Magic wand movements, steering wheels, painting strokes"
  },
  {
    id: 3,
    name: "Elbow Knight Brace",
    description: "Advanced elbow tracking for pronation, supination, and more",
    longDescription: "The Elbow Knight Brace helps your child develop better arm control through fun games that track every elbow movement.",
    movements: [
      { name: "Flexion", description: "Bending elbow", icon: Hand, color: "green" },
      { name: "Extension", description: "Straightening elbow", icon: Move, color: "green" },
      { name: "Pronation", description: "Rotating palm down", icon: RotateCw, color: "green" },
      { name: "Supination", description: "Rotating palm up", icon: RotateCw, color: "green" }
    ],
    connection: "USB Connection to Computer",
    setup: "Simple USB plug-and-play. Start the game and begin your adventure!",
    color: "from-green-400 to-green-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    emoji: "💪",
    gameExample: "Archery, tennis swings, drumming"
  },
  {
    id: 4,
    name: "Shoulder Titan Support",
    description: "Complete shoulder movement tracking for full arm rehabilitation",
    longDescription: "The Shoulder Titan Support tracks all shoulder movements, helping your child build strength and range of motion through engaging gameplay.",
    movements: [
      { name: "Flexion", description: "Raising arm forward", icon: Hand, color: "orange" },
      { name: "Extension", description: "Moving arm backward", icon: Move, color: "orange" },
      { name: "Abduction", description: "Raising arm sideways", icon: Maximize, color: "orange" },
      { name: "Adduction", description: "Bringing arm down to side", icon: Minimize, color: "orange" },
      { name: "Circumduction", description: "Circular arm movements", icon: RotateCw, color: "orange" }
    ],
    connection: "USB Connection to Laptop/Desktop",
    setup: "Connect to USB port, launch any ArmiGo game, and let the adventure begin!",
    color: "from-orange-400 to-orange-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    emoji: "🦾",
    gameExample: "Hero poses, flying, reaching for stars"
  }
];

const setupSteps = [
  {
    step: 1,
    title: "Connect the Device",
    description: "Simply plug the device into any available USB port on your computer",
    icon: Usb,
    color: "blue"
  },
  {
    step: 2,
    title: "Launch the Game",
    description: "Open any ArmiGo game from our collection",
    icon: Gamepad,
    color: "purple"
  },
  {
    step: 3,
    title: "Start Playing",
    description: "The device automatically syncs - no complicated setup needed!",
    icon: Play,
    color: "green"
  }
];

const faqs = [
  {
    question: "Do I need to install drivers?",
    answer: "No! All ArmiGo devices are plug-and-play. Just connect via USB and they work immediately with our games.",
    icon: Cable
  },
  {
    question: "Can multiple devices work together?",
    answer: "Yes! You can connect multiple devices simultaneously for combined therapy sessions.",
    icon: Repeat
  },
  {
    question: "How do I know if it's working?",
    answer: "The device has a small LED indicator that lights up when connected. Our games also show real-time movement feedback.",
    icon: Info
  },
  {
    question: "Is it safe for children?",
    answer: "Absolutely! All devices are FDA-registered, child-safe, and designed with input from pediatric therapists.",
    icon: Shield
  }
];

export default function ParentsPage() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 overflow-x-hidden">
      <Navbar />

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-300/20 to-purple-300/20"
            style={{
              width: 100 + (i * 20) % 150,
              height: 100 + (i * 15) % 150,
              left: `${(i * 23) % 90}%`,
              top: `${(i * 17) % 90}%`,
            }}
            animate={{
              y: [0, (i % 2 === 0 ? 30 : -30), 0],
              x: [0, (i % 2 === 0 ? -30 : 30), 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10 + i,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
  {/* Hero Section - Fixed */}
<section className="relative pt-24 pb-20 px-4 overflow-hidden">
  {/* Colorful Gradient Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"></div>
  
  {/* Animated Shapes */}
  <div className="absolute inset-0 opacity-30">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-32 h-32 md:w-48 md:h-48 bg-white rounded-full"
        style={{
          left: `${[5, 70, 85, 10, 90, 30][i]}%`,
          top: `${[10, 15, 60, 80, 30, 70][i]}%`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, (i % 2 === 0 ? 20 : -20), 0],
          y: [0, (i % 3 === 0 ? 20 : -20), 0],
        }}
        transition={{
          duration: 8 + i,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>

  {/* Floating Icons */}
  <div className="absolute inset-0 pointer-events-none">
    {['🦸', '🦸‍♀️', '💪', '🎮', '❤️', '⭐','👩‍👧'].map((emoji, i) => (
      <motion.div
        key={i}
        className="absolute text-4xl md:text-5xl"
        style={{
          left: `${[15, 80, 25, 70, 40, 60][i]}%`,
          top: `${[20, 30, 70, 80, 40, 60][i]}%`,
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

  {/* Hero Content */}
  <div className="container-custom max-w-5xl mx-auto text-center relative z-10">
    {/* Welcome Badge */}
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="inline-block mb-6"
    >
      <span className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-lg font-bold border-2 border-white/30 shadow-xl">
        <Heart className="w-5 h-5 animate-pulse fill-current" />
        For Parents & Heroes
        <Heart className="w-5 h-5 animate-pulse fill-current" />
      </span>
    </motion.div>

    {/* Main Title */}
    <motion.h1 
      className="text-5xl md:text-7xl font-black mb-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <span className="text-white drop-shadow-lg">
        Your Guide to ArmiGo
      </span>
    </motion.h1>

    {/* Emoji Row */}
   

    {/* Description Card - Fixed the white background issue */}
    <motion.div 
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="relative">
        {/* Decorative Elements */}
        <div className="absolute -top-4 -left-4 w-20 h-20 bg-yellow-300 rounded-full opacity-60 blur-xl"></div>
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-pink-300 rounded-full opacity-60 blur-xl"></div>
        
      
      </div>
    </motion.div>

    {/* Quick Stats Row */}
    <motion.div 
      className="flex flex-wrap justify-center gap-4 mt-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {[
        { icon: '🎮', text: '4 Fun Games' },
        { icon: '🖐️', text: '4 Smart Devices' },
        { icon: '⚡', text: 'Plug & Play' },
        { icon: '📈', text: 'Track Progress' },
      ].map((stat, i) => (
        <motion.div
          key={i}
          variants={fadeInUp}
          className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 text-white flex items-center gap-2"
        >
          <span>{stat.icon}</span>
          <span className="text-sm font-medium">{stat.text}</span>
        </motion.div>
      ))}
    </motion.div>
  </div>

  {/* Bottom Wave Decoration */}
  <div className="absolute bottom-0 left-0 right-0">
    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
        fill="white"
        fillOpacity="0.1"
      />
    </svg>
  </div>
</section>

      {/* Quick Setup Guide */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-400 to-teal-400 text-white rounded-full text-sm font-bold mb-4">
              <Cable className="inline w-4 h-4 mr-1" />
              Quick & Easy Setup
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Ready to Play in 3 Simple Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {setupSteps.map((step, i) => (
              <motion.div
                key={i}
                className="relative"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className={`bg-gradient-to-br from-${step.color}-400 to-${step.color}-600 p-1 rounded-3xl`}>
                  <div className="bg-white p-6 rounded-3xl text-center">
                    <div className="relative mb-4">
                      <div className={`w-16 h-16 mx-auto bg-${step.color}-100 rounded-2xl flex items-center justify-center`}>
                        <step.icon className={`w-8 h-8 text-${step.color}-600`} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mt-8 bg-yellow-50 p-4 rounded-2xl max-w-2xl mx-auto"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="text-gray-700 flex items-center justify-center gap-2">
              <Usb className="w-5 h-5 text-blue-600" />
              <span className="font-bold">Note:</span> All devices connect via USB port - no batteries or charging needed!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Devices Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full text-sm font-bold mb-4">
              <Activity className="inline w-4 h-4 mr-1" />
              Our Superhero Devices
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Meet the ArmiGo Squad
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Each device is designed to target specific movements while making therapy fun
            </p>
          </motion.div>

          <div className="space-y-12">
            {devices.map((device, index) => (
              <motion.div
                key={device.id}
                className="relative"
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className={`bg-gradient-to-br ${device.color} p-1 rounded-[50px]`}>
                  <div className="bg-white rounded-[50px] p-8 md:p-10">
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                      {/* Left Column - Device Info */}
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-20 h-20 bg-gradient-to-br ${device.color} rounded-2xl flex items-center justify-center text-white text-4xl`}>
                            {device.emoji}
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold">{device.name}</h3>
                            <p className={`text-${device.color.split('-')[2]}-600 font-medium`}>
                              {device.connection}
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-700 text-lg mb-6">{device.longDescription}</p>

                        <div className="bg-gray-50 p-6 rounded-3xl mb-6">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Gamepad className={`w-5 h-5 text-${device.color.split('-')[2]}-600`} />
                            In the Game:
                          </h4>
                          <p className="text-gray-700">{device.gameExample}</p>
                        </div>

                        <div className="bg-green-50 p-6 rounded-3xl">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Power className="w-5 h-5 text-green-600" />
                            How to Start:
                          </h4>
                          <p className="text-gray-700">{device.setup}</p>
                          <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Plug & Play - No drivers needed</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Movements */}
                      <div>
                        <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                          <Activity className={`w-6 h-6 text-${device.color.split('-')[2]}-600`} />
                          Movements Tracked:
                        </h4>
                        
                        <div className="space-y-4">
                          {device.movements.map((movement, i) => (
                            <motion.div
                              key={i}
                              className="bg-gray-50 p-4 rounded-2xl"
                              initial={{ x: -20, opacity: 0 }}
                              whileInView={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              whileHover={{ scale: 1.02, backgroundColor: 'white' }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 bg-${movement.color}-100 rounded-xl flex items-center justify-center`}>
                                  <movement.icon className={`w-5 h-5 text-${movement.color}-600`} />
                                </div>
                                <div>
                                  <h5 className="font-bold">{movement.name}</h5>
                                  <p className="text-sm text-gray-600">{movement.description}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Real-time Status Indicator */}
                        <motion.div 
                          className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl border-2 border-dashed border-purple-200"
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <motion.div 
                                className="absolute -inset-1 bg-green-500 rounded-full"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">Real-time Game Feedback</p>
                              <p className="text-sm text-gray-600">Every movement is instantly reflected in the game</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector Line between devices */}
                {index < devices.length - 1 && (
                  <div className="hidden md:block absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                    <motion.div 
                      className="w-0.5 h-12 bg-gradient-to-b from-purple-400 to-pink-400"
                      animate={{ scaleY: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gameplay Preview */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-full text-sm font-bold mb-4">
              <Gamepad2 className="inline w-4 h-4 mr-1" />
              How It Works in the Game
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              See Your Child's Progress
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "Real-time Movement Tracking",
                desc: "Every flexion, extension, and rotation is instantly detected and reflected in the game",
                icon: Activity,
                color: "blue"
              },
              {
                title: "Visual Feedback",
                desc: "Children can see their movements controlling characters and actions on screen",
                icon: Monitor,
                color: "purple"
              },
              {
                title: "Progress Indicators",
                desc: "Games show current status, achievements, and improvement over time",
                icon: Trophy,
                color: "green"
              },
              {
                title: "Adaptive Difficulty",
                desc: "Games automatically adjust to your child's ability level",
                icon: Brain,
                color: "orange"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white p-6 rounded-3xl shadow-lg"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className={`w-14 h-14 bg-${item.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
        <div className="container-custom max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-full text-sm font-bold mb-4">
              <Info className="inline w-4 h-4 mr-1" />
              Frequently Asked Questions
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Got Questions? We've Got Answers!
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg"
                variants={bounceAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <faq.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Connection Guide */}
      <section className="py-16 px-4">
        <div className="container-custom">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-[50px] p-8 md:p-12 text-white relative overflow-hidden"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Background Decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="relative z-10 text-center">
              <Usb className="w-16 h-16 mx-auto mb-6 text-white/80" />
              
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Simple USB Connection
              </h2>
              
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                All ArmiGo devices connect via standard USB ports. Just plug in and play - 
                no complicated setup, no batteries to charge, no wireless interference.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span>Plug & Play</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span>No Drivers Needed</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span>Works with All Games</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-90"></div>
        
        <div className="container-custom max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-2xl mx-auto">
              🦸
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
            Ready to Start?
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            Join hundreds of families who've discovered the magic of playful rehabilitation.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="bg-white text-purple-900 px-10 py-5 rounded-full font-black text-xl hover:bg-purple-100 transition-all shadow-2xl flex items-center gap-3 group"
            >
              <Heart className="w-6 h-6 text-pink-500" />
              Contact Us
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <p className="text-white/80 text-sm mt-8 flex items-center justify-center gap-2">
            <span>✨</span>
            Free consultation • No commitment • We're here to help
            <span>✨</span>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}