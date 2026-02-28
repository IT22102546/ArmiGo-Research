"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { 
  Heart, 
  Activity, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle,
  Send,
  Users,
  Sparkles,
  ArrowRight,
  Smile,
  Star,
  Rocket,
  PartyPopper,
  Gift,
  Candy,
  Balloon,
  Sun,
  Cloud,
  Rainbow,
  Gem,
  MessageSquare,
  MessageCircleHeart,
  MessagesSquare
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

export default function ContactPage() {
  const whatsappNumber = "94711484037";
  const [formHover, setFormHover] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hi! I'm interested in learning more about ArmiGo for my child. 🦸‍♂️");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100" ref={containerRef}>
      <Navbar />

      <main className="pt-20 pb-0 overflow-x-hidden">
        {/* Super Colorful Floating Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Rainbow circles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 200 + 100,
                height: Math.random() * 200 + 100,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, ${
                  ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#D4A5A5'][i % 6]
                }20, transparent)`,
              }}
              animate={{
                y: [0, Math.random() * 100 - 50],
                x: [0, Math.random() * 100 - 50],
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
          
          {/* Floating Emojis */}
          {['🦸‍♂️', '🦸‍♀️', '🌈', '⭐', '🎈', '🦄', '🐉', '🧸', '🎨', '🎮'].map((emoji, i) => (
            <motion.div
              key={`emoji-${i}`}
              className="absolute text-4xl md:text-5xl"
              initial={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%`,
                opacity: 0.3
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, (i % 2 === 0 ? 30 : -30), 0],
                rotate: [0, 20, -20, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        {/* Header Section - Super Colorful */}
        <section className="relative pt-24 pb-20 px-4 overflow-hidden">
          {/* Rainbow Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-yellow-200 via-green-200 via-blue-200 to-purple-200 opacity-30"></div>
          
          {/* Animated Shapes */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-16 h-16 md:w-24 md:h-24"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
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
            {/* Animated Welcome Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="inline-block mb-6"
            >
              <span className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-xl">
                <PartyPopper className="w-5 h-5 animate-bounce" />
                🎉 We're Super Excited to Hear From You! 🎉
                <PartyPopper className="w-5 h-5 animate-bounce delay-100" />
              </span>
            </motion.div>

            <motion.h1 
              className="text-6xl md:text-7xl font-black mb-6"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent inline-block animate-rainbow">
                Let's Be Friends!
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center gap-2 mb-6"
            >
              {['😊', '🌟', '🌈', '🦸', '🎮'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="text-3xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>

            {/* REDESIGNED MESSAGE SECTION - More attractive */}
            <motion.div 
              className="relative max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Main Message Card */}
              <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-[50px] shadow-2xl border-4 border-white overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-br-[100px] opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-200 to-purple-200 rounded-tl-[100px] opacity-50"></div>
                
                {/* Floating Hearts */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${[5, 90, 10, 85][i]}%`,
                      top: `${[10, 15, 80, 85][i]}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  >
                    <Heart className="w-5 h-5 text-pink-300 fill-pink-300/30" />
                  </motion.div>
                ))}

                {/* Content */}
                <div className="relative z-10">
                  {/* Quote Icon */}
                  <motion.div 
                    className="text-6xl text-purple-300 mb-2"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    "
                  </motion.div>

                  {/* Main Text with Emojis */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <MessageCircleHeart className="w-8 h-8 text-purple-500" />
                      </motion.div>
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      >
                        <MessagesSquare className="w-8 h-8 text-pink-500" />
                      </motion.div>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      >
                        <MessageSquare className="w-8 h-8 text-blue-500" />
                      </motion.div>
                    </div>

                    <p className="text-2xl md:text-3xl font-bold text-gray-800 leading-relaxed">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        Got a question?
                      </span>
                    </p>

                    <p className="text-2xl md:text-3xl font-bold text-gray-800">
                      Want to share your 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 mx-2">
                        superhero story
                      </span>
                      ?
                    </p>

                    <div className="flex items-center justify-center gap-3 my-4">
                      <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                      </motion.div>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
                    </div>

                    <p className="text-xl text-gray-700">
                      <span className="font-bold text-purple-600">We're all ears</span> 
                      <span className="mx-2">👂</span>
                      and
                    </p>

                    <p className="text-2xl md:text-3xl font-black bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                      can't wait to chat with you!
                    </p>

                    {/* Fun Emoji Row */}
                    <div className="flex justify-center gap-3 mt-4">
                      {['😊', '🎉', '💬', '💭', '✨'].map((emoji, i) => (
                        <motion.span
                          key={i}
                          className="text-2xl"
                          animate={{ 
                            y: [0, -8, 0],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: i * 0.2 
                          }}
                        >
                          {emoji}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Decorative Dots */}
                  <div className="flex justify-center gap-1 mt-6">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: `hsl(${i * 72}, 70%, 60%)` }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Fun Decorative Line */}
            <motion.div 
              className="flex justify-center gap-2 mt-8"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 rounded-full"
                  style={{
                    background: `hsl(${i * 36}, 80%, 60%)`,
                  }}
                  animate={{
                    y: [0, -10, 0],
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

        {/* Contact Grid Section - Extra Colorful */}
        <section className="container-custom py-16 px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Contact Form - Super Playful */}
            <motion.div
              className="bg-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -5 }}
            >
              {/* Fun Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-400 rounded-full -translate-x-1/2 translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-36 h-36 bg-blue-400 rounded-full translate-x-1/2 translate-y-1/2"></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Send className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Send Us a Message
                    </h2>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Smile className="w-4 h-4 text-yellow-500" />
                      We promise to write back with a smile!
                    </p>
                  </div>
                </div>

                <form className="space-y-5">
                  {[
                    { id: 'name', label: 'Your name', type: 'text', placeholder: "e.g., Sarah's Mom", icon: Smile, color: 'blue' },
                    { id: 'email', label: 'Email address', type: 'email', placeholder: 'hello@example.com', icon: Mail, color: 'purple' },
                    { id: 'phone', label: 'Phone number', type: 'tel', placeholder: '071 148 4037', icon: Phone, color: 'green' },
                  ].map((field) => (
                    <motion.div 
                      key={field.id}
                      className="relative"
                      whileHover={{ scale: 1.02 }}
                      onHoverStart={() => setActiveField(field.id)}
                      onHoverEnd={() => setActiveField(null)}
                    >
                      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <span className={`w-2 h-2 bg-${field.color}-500 rounded-full animate-pulse`}></span>
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-base"
                          onFocus={() => setActiveField(field.id)}
                          onBlur={() => setActiveField(null)}
                        />
                        <field.icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                          activeField === field.id ? `text-${field.color}-500 scale-110` : 'text-gray-400'
                        }`} />
                      </div>
                    </motion.div>
                  ))}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                      Child's age (tell us about your little hero!)
                    </label>
                    <select className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all text-base text-gray-600 bg-white">
                      <option>🌟 Select age group 🌟</option>
                      <option>6-8 years (Junior Hero)</option>
                      <option>9-11 years (Super Hero)</option>
                      <option>12-14 years (Mega Hero)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      Your message (tell us your story!)
                    </label>
                    <textarea
                      placeholder="Hi ArmiGo team! I'd love to know more about..."
                      rows={5}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all text-base resize-none"
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl transition-all group"
                    onHoverStart={() => setFormHover(true)}
                    onHoverEnd={() => setFormHover(false)}
                  >
                    <Send className={`w-5 h-5 transition-all duration-300 ${formHover ? 'translate-x-1 rotate-12' : ''}`} />
                    Send Message with Love ❤️
                    <PartyPopper className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>

                  <motion.div 
                    className="flex items-center justify-center gap-2 text-sm text-gray-500"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Mail className="w-4 h-4" />
                    <span>We reply faster than a superhero! ⚡</span>
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* Right: Contact Info - Extra Playful */}
            <motion.div
              className="space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInRight}
              transition={{ duration: 0.6 }}
            >
              {/* WhatsApp Card - Super Hero Theme */}
              <motion.div 
                className="bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 rounded-[40px] p-8 shadow-2xl cursor-pointer relative overflow-hidden group"
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsAppClick}
                variants={bounceAnimation}
                onHoverStart={() => setHoveredCard('whatsapp')}
                onHoverEnd={() => setHoveredCard(null)}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-20">
                  <motion.div 
                    className="absolute w-40 h-40 bg-white rounded-full -top-20 -right-20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute w-32 h-32 bg-white rounded-full -bottom-16 -left-16"
                    animate={{ scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <MessageCircle className="w-10 h-10 text-white" />
                      </motion.div>
                      <div>
                        <p className="text-white/90 text-lg">Chat with us on</p>
                        <h3 className="text-4xl font-black text-white">WhatsApp</h3>
                      </div>
                    </div>
                    <motion.div
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <MessageCircle className="w-12 h-12 text-white/40" />
                    </motion.div>
                  </div>
                  
                  <motion.p 
                    className="text-white text-3xl font-black mt-4"
                    animate={{ scale: hoveredCard === 'whatsapp' ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    071 148 4037
                  </motion.p>
                  
                  <p className="text-white/90 text-lg mt-2 flex items-center gap-2">
                    <span>⬇️ Tap to start chatting</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </p>

                  {/* Active Status */}
                  <div className="mt-6 flex items-center gap-3 bg-white/20 backdrop-blur-sm p-3 rounded-2xl w-fit">
                    <div className="flex -space-x-3">
                      {[1,2,3].map((i) => (
                        <motion.div 
                          key={i} 
                          className="w-10 h-10 bg-white/40 rounded-full border-3 border-white flex items-center justify-center text-xl"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        >
                          {['🦸', '👩‍⚕️', '🧑‍🔧'][i-1]}
                        </motion.div>
                      ))}
                    </div>
                    <div>
                      <p className="text-white font-bold">Superhero Team Online</p>
                      <p className="text-white/80 text-sm">Replies in &lt; 5 min ⚡</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Cards - Colorful Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Phone, label: "Call us", value: "+94 71 148 4037", color: "blue", bg: "bg-blue-400", emoji: "📞", delay: 0 },
                  { icon: Mail, label: "Email", value: "hello@armigo.com", color: "purple", bg: "bg-purple-400", emoji: "✉️", delay: 0.2 },
                  { icon: MapPin, label: "Visit us", value: "Colombo 07", color: "pink", bg: "bg-pink-400", emoji: "📍", delay: 0.4 },
                  { icon: Clock, label: "Open hours", value: "Mon-Fri, 9-6", color: "green", bg: "bg-green-400", emoji: "⏰", delay: 0.6 },
                ].map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.icon === Phone ? `tel:+94711484037` : item.icon === Mail ? `mailto:${item.value}` : '#'}
                    className={`${item.bg} rounded-3xl p-5 hover:shadow-2xl transition-all group relative overflow-hidden`}
                    whileHover={{ y: -8, scale: 1.02 }}
                    variants={bounceAnimation}
                    custom={i}
                    onHoverStart={() => setHoveredCard(`contact-${i}`)}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    {/* Animated Background */}
                    <motion.div 
                      className="absolute inset-0 bg-white/20"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 45, 0],
                      }}
                      transition={{ duration: 3, repeat: Infinity, delay: item.delay }}
                    />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{item.emoji}</span>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-white/90 text-xs">{item.label}</p>
                      <p className="text-white font-bold text-sm mt-1">{item.value}</p>
                      
                      {/* Hover Sparkle */}
                      <motion.div
                        className="absolute -top-2 -right-2 text-2xl"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={hoveredCard === `contact-${i}` ? { opacity: 1, scale: 1, rotate: 360 } : {}}
                      >
                        ✨
                      </motion.div>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Fun Map Card */}
              <motion.div 
                className="rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative h-56 group"
                whileHover={{ scale: 1.02 }}
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.20017129188!2d79.8516086871582!3d6.9085189!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2596ad7cf2f97%3A0x86134b266395e26!2sColombo%2007%2C%20Colombo!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                
                {/* Playful Map Overlay */}
                <motion.div 
                  className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl"
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">ArmiGo Headquarters</p>
                        <p className="text-xs text-gray-600">Colombo 07, Sri Lanka 🇱🇰</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="text-2xl"
                    >
                      🌍
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Open now
                    </span>
                    <span className="text-purple-600 font-bold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Come say hi!
                    </span>
                  </div>
                </motion.div>

                {/* Floating Hearts on Map */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + i * 10}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.3,
                      repeat: Infinity,
                    }}
                  >
                    {['❤️', '💛', '💚', '💙', '💜'][i]}
                  </motion.div>
                ))}
              </motion.div>

              {/* Super Trust Badge */}
              <motion.div 
                className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 rounded-3xl p-5 flex items-center justify-between shadow-xl"
                variants={bounceAnimation}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1,2,3].map((i) => (
                      <motion.div 
                        key={i} 
                        className="w-12 h-12 bg-white rounded-full border-3 border-white shadow-lg flex items-center justify-center text-2xl"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      >
                        {['🦸', '👧', '👦'][i-1]}
                      </motion.div>
                    ))}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-gray-800">500+</p>
                    <p className="text-sm text-gray-700">Happy little heroes</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                    >
                      ⭐
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Super Fun CTA Section */}
        <section className="py-20 px-4 relative overflow-hidden">
          {/* Crazy Rainbow Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 animate-gradient-x opacity-90"></div>
          
          {/* Floating Balloons */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-5xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
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

          <motion.div 
            className="container-custom max-w-4xl mx-auto text-center relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
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
            
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
              Ready for an Adventure?
            </h2>
            
            <p className="text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
              Join 500+ families who've discovered the magic of playful rehabilitation!
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-yellow-400 text-purple-900 px-10 py-5 rounded-full font-black text-xl hover:bg-yellow-300 transition-all shadow-2xl flex items-center gap-3 group"
              >
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Start Free Assessment
                <Rocket className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsAppClick}
                className="bg-white text-purple-900 px-10 py-5 rounded-full font-black text-xl hover:bg-purple-100 transition-all shadow-2xl flex items-center gap-3 group"
              >
                <MessageCircle className="w-6 h-6 text-green-500" />
                Chat on WhatsApp
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </div>

            {/* Super Stats */}
            <motion.div 
              className="flex flex-wrap justify-center gap-8 mt-12 bg-white/20 backdrop-blur-sm p-6 rounded-3xl"
              variants={staggerContainer}
            >
              {[
                { value: "500+", label: "Happy Heroes", emoji: "🦸" },
                { value: "24/7", label: "Super Support", emoji: "⚡" },
                { value: "100%", label: "Fun Guaranteed", emoji: "🎮" },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  className="text-center"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-3xl mb-2 block">{stat.emoji}</span>
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-white/90">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Fun Footer Note */}
            <motion.p 
              className="text-white/80 text-sm mt-8 flex items-center justify-center gap-2"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span>✨</span>
              No pressure, just superhero vibes!
              <span>✨</span>
            </motion.p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}