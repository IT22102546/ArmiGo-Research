"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-20 ">
        {/* Hero Section */}
        <motion.section
          className="w-full bg-gradient-to-br pt-10 from-[#EFF6FF] to-white text-center mb-10 pb-12"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-primary rounded-full text-xs font-bold tracking-widest mb-8 border border-blue-100">
            <Image
              src="/assets/step-icon.png"
              width={16}
              height={16}
              alt="Step Icon"
            />
            Simple 4-Step Process
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-main mb-8 leading-tight">
            How Learn App <br /> LMS Works
          </h1>
          <p className="text-lg text-body max-w-2xl mx-auto leading-relaxed">
            Get started with our comprehensive learning management system in
            just four simple steps. From download to full management control.
          </p>
        </motion.section>

        {/* Steps Section */}
        <section className="container-custom relative">
          {/* Horizontal Line for Desktop */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-blue-100 -z-10 mx-24"></div>

          {/* Section 1: Step Headers (Icon + Number + Title + Description) */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-8 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {/* Step 1 Header */}
            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                  <Image
                    src="/assets/download.svg"
                    width={36}
                    height={36}
                    alt="Download Icon"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 lg:w-8 lg:h-8 bg-white border-2 border-primary rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-base lg:text-xl font-black mb-2">
                Download the App
              </h3>
              <p className="text-xs lg:text-sm text-body leading-relaxed px-2">
                Get started by downloading our app on your preferred platform
              </p>
            </motion.div>

            {/* Step 2 Header */}
            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                  <Image
                    src="/assets/create-account-icon.png"
                    width={45}
                    height={36}
                    alt="Create Account Icon"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 lg:w-8 lg:h-8 bg-white border-2 border-primary rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-base lg:text-xl font-black mb-2">
                Create Account
              </h3>
              <p className="text-xs lg:text-sm text-body leading-relaxed px-2">
                Sign up with role-based access tailored to your needs
              </p>
            </motion.div>

            {/* Step 3 Header */}
            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                  <Image
                    src="/assets/learn.svg"
                    width={36}
                    height={36}
                    alt="Learn Icon"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 lg:w-8 lg:h-8 bg-white border-2 border-primary rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-base lg:text-xl font-black mb-2">
                Start Learning
              </h3>
              <p className="text-xs lg:text-sm text-body leading-relaxed px-2">
                Access all learning features and track your progress
              </p>
            </motion.div>

            {/* Step 4 Header */}
            <motion.div
              className="flex flex-col items-center text-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
                  <Image
                    src="/assets/manage.png"
                    width={36}
                    height={36}
                    alt="Manage Icon"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 lg:w-8 lg:h-8 bg-white border-2 border-primary rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  4
                </div>
              </div>
              <h3 className="text-base lg:text-xl font-black mb-2">
                Manage & Monitor
              </h3>
              <p className="text-xs lg:text-sm text-body leading-relaxed px-2">
                Admins get complete control over all operations
              </p>
            </motion.div>
          </motion.div>

          {/* Section 2: Step Cards (Action items for each step) */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {/* Step 1 Cards - Download Buttons */}
            <motion.div
              className="flex flex-col items-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full space-y-3 px-4 max-w-xs">
                <button className="w-full bg-[#0a1128] text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-black transition-all">
                  <Image
                    src="/assets/android-icon.svg"
                    width={24}
                    height={24}
                    alt="Android Icon"
                  />
                  Android
                </button>
                <button className="w-full bg-[#0a1128] text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-black transition-all">
                  <Image
                    src="/assets/ios-icon.svg"
                    width={24}
                    height={24}
                    alt="iOS Icon"
                  />
                  iOS
                </button>
                <button className="w-full bg-[#0a1128] text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-black transition-all">
                  <Image
                    src="/assets/windows-icon.svg"
                    width={24}
                    height={24}
                    alt="Windows Icon"
                  />
                  Windows
                </button>
              </div>
            </motion.div>

            {/* Step 2 Cards - Account Types */}
            <motion.div
              className="flex flex-col items-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full space-y-3 px-2 max-w-xs">
                <div className="bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/student-icon.svg"
                    width={21}
                    height={24}
                    alt="Student Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Student</h4>
                    <p className="text-[10px] text-body">
                      Access courses & exams
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/teacher.svg"
                    width={30}
                    height={24}
                    alt="Teacher Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Teacher</h4>
                    <p className="text-[10px] text-body">Manage classes</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/admin-icon.svg"
                    width={30}
                    height={24}
                    alt="Admin Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Admin</h4>
                    <p className="text-[10px] text-body">Full system control</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 3 Cards - Learning Features */}
            <motion.div
              className="flex flex-col items-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full space-y-3 px-2 max-w-xs">
                <div className="bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/feature-1.png"
                    width={21}
                    height={24}
                    alt="Live Class Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Live Classes</h4>
                    <p className="text-[10px] text-body">
                      Join interactive sessions
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/exam-icon.svg"
                    width={21}
                    height={24}
                    alt="Exam Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Exams</h4>
                    <p className="text-[10px] text-body">Test your knowledge</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/attendance.png"
                    width={15}
                    height={20}
                    alt="Attendance Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Attendance</h4>
                    <p className="text-[10px] text-body">Automatic tracking</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 4 Cards - Management Features */}
            <motion.div
              className="flex flex-col items-center"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full space-y-3 px-2 max-w-xs">
                <div className="bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/payment.svg"
                    width={22}
                    height={20}
                    alt="Payment Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Payments</h4>
                    <p className="text-[10px] text-body">Manage transactions</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/Transfer.png"
                    width={20}
                    height={20}
                    alt="Transfer Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Transfers</h4>
                    <p className="text-[10px] text-body">
                      Handle user movements
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#F0F9FF] to-[#E0F2FE] border border-blue-100/50 p-3 rounded-xl flex items-center gap-4 text-left">
                  <Image
                    src="/assets/schedules.png"
                    width={17}
                    height={20}
                    alt="Schedule Icon"
                  />
                  <div>
                    <h4 className="text-xs font-black">Schedules</h4>
                    <p className="text-[10px] text-body">Plan & organize</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <motion.section
          className="mt-30 bg-[#0061ff] py-12 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7 }}
        >
          <div className="container-custom text-center text-white relative z-10">
            <h2 className="text-4xl text-white  lg:text-4xl font-black mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-blue-100/80 mb-12 max-w-xl mx-auto">
              Join thousands of students and teachers already using LearnApp
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="bg-white text-primary px-10 py-4 rounded-xl font-black hover:bg-blue-50 transition-all flex items-center gap-3">
                <Image
                  src="/assets/free-trial-icon.svg"
                  width={20}
                  height={20}
                  alt="Free Trial Icon"
                />{" "}
                Start Free Trial
              </button>
              <button className="border-2 border-white/100 text-white px-10 py-4 rounded-xl font-black hover:bg-white/10 transition-all flex items-center gap-3">
                <span className="text-xl brightness-0 invert">📞</span> Contact
                Sales
              </button>
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-[120px]"></div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
