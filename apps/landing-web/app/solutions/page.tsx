"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

export default function SolutionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <div className=" flex-1 pt-18 ">
          <div className=" mx-auto pt-2">
            <motion.div
              className="flex flex-col bg-gradient-to-br from-[#90DCFF] to-white items-center py-25 text-center mb-10"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold  pb-4 text-[#0a1128]">
                Solutions for Every Education Role
              </h1>
              <p className="text-lg md:text-xl text-[#0a1128]/70 max-w-2xl">
                Built to support institutions, teachers, students, and
                authorities.
              </p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto px-6 md:px-12 mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
            >
              {/* For Schools & Institutes */}
              <motion.div
                className="rounded-3xl p-8 md:p-10 shadow-lg bg-gradient-to-br from-[#9333EA] to-[#005CFF] text-white flex flex-col min-h-[280px]"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div className="w-14 h-14 bg-[#DBEAFE] backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                  <Image
                    src="/assets/1.png"
                    width={32}
                    height={32}
                    alt="Schools & Institutes"
                  />
                </div>
                <h2 className="text-2xl text-white font-bold mb-4">
                  For Schools & Institutes
                </h2>
                <ul className="space-y-3 text-base font-medium">
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Online classrooms
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Student management
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Exam automation
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Fee tracking
                  </li>
                </ul>
              </motion.div>

              {/* For Teachers */}
              <motion.div
                className="rounded-3xl p-8 md:p-10 shadow-lg bg-gradient-to-br from-[#81B62C] to-[#22C55E] text-white flex flex-col min-h-[280px]"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div className="w-14 h-14 bg-[#DCFCE7] backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                  <Image
                    src="/assets/2.png"
                    width={32}
                    height={32}
                    alt="Teachers"
                  />
                </div>
                <h2 className="text-2xl text-white font-bold mb-4">
                  For Teachers
                </h2>
                <ul className="space-y-3 text-base font-medium">
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Start live classes
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Upload notes & exams
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Track attendance
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Provide feedback
                  </li>
                </ul>
              </motion.div>

              {/* For Students */}
              <motion.div
                className="rounded-3xl p-8 md:p-10 shadow-lg bg-gradient-to-br from-[#9333EA] to-[#DC18B8] text-white flex flex-col min-h-[280px]"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div className="w-14 h-14 bg-[#F3E8FF] backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                  <Image
                    src="/assets/3.png"
                    width={32}
                    height={32}
                    alt="Students"
                  />
                </div>
                <h2 className="text-2xl text-white font-bold mb-4">
                  For Students
                </h2>
                <ul className="space-y-3 text-base font-medium">
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Join live classes
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Take secure exams
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    View rankings
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Access materials anytime
                  </li>
                </ul>
              </motion.div>

              {/* For Education Authorities */}
              <motion.div
                className="rounded-3xl p-8 md:p-10 shadow-lg bg-gradient-to-br from-[#FACC15] to-[#EA580C] text-white flex flex-col min-h-[280px]"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div className="w-14 h-14 bg-[#FFEDD5] backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                  <Image
                    src="/assets/4.png"
                    width={32}
                    height={32}
                    alt="Education Authorities"
                  />
                </div>
                <h2 className="text-2xl text-white font-bold mb-4">
                  For Education Authorities
                </h2>
                <ul className="space-y-3 text-base font-medium">
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Mutual transfer portal
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Verified teacher data
                  </li>
                  <li className="flex items-center gap-3">
                    <Image
                      src="/assets/point.png"
                      width={18}
                      height={18}
                      alt="Check Icon"
                    />
                    Secure communication
                  </li>
                </ul>
              </motion.div>
            </motion.div>
            <motion.div
              className="bg-[#0047CC] w-full py-20 px-6 md:px-16 flex flex-col items-center text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-6xl md:text-3xl font-bold text-white mb-6">
                Ready to Transform Your Education?
              </h2>
              <p className="text-xl text-blue-50/80 mb-6 max-w-3xl mx-auto">
                Join thousands of institutions already using LearnApp
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <button className="bg-white text-[#2563EB] font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-50 transition">
                  Start Free Trial
                </button>
                <button className="bg-transparent text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-[#1d3e99] transition border-[2px] border-white">
                  Schedule Demo
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
