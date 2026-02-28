"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

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

const Features = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-10 pb-16 lg:pt-32  bg-gradient-to-br from-[#EFF6FF] to-[#EEF2FF]   lg:pb-24">
        <motion.div
          className="container-custom text-center"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold mb-6 lg:mb-4 leading-tight text-main px-4">
            Powerful Features Built for{" "}
            <span className="text-primary"> Modern</span>{" "}
            <span className="text-primary block"> Education</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-body max-w-3xl mx-auto mb-10 lg:mb-12 leading-relaxed px-6">
            Everything you need to manage learning, exams, payments, and teacher
            transfers in one secure platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="#live-classes"
              className="bg-primary text-white px-[32px] py-[16px] rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Explore Features
            </Link>
            <Link
              href="#"
              className="border-2 border-primary text-primary px-[32px] py-[16px] rounded-xl font-bold text-lg hover:bg-primary/5 transition-all"
            >
              Watch Demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Live Smart Classes */}
      <section id="live-classes" className="py-1">
        <div className="">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center p-6 sm:p-10 lg:p-10 relative overflow-hidden text-center lg:text-left">
            <motion.div
              className="relative z-10 text-center lg:text-left"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Image
                  src="/assets/feature-1.png"
                  width={20}
                  height={20}
                  alt="Live Learning Icon"
                />
                Live Learning
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-main">
                Live Smart Classes
              </h2>

              {/* Mobile/Tablet image */}
              <div className="relative lg:hidden mb-8 mt-4 px-2">
                <div className="relative aspect-[1.3] sm:aspect-[1.5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                  <Image
                    src="/assets/live-classes-dashboard.png"
                    fill
                    className="object-cover"
                    alt="Live Classes Interface"
                  />
                </div>
              </div>

              <p className="text-base sm:text-lg text-body mb-8 leading-relaxed">
                Conduct interactive live sessions with advanced features
                designed for modern education needs.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-6 text-left max-w-md md:max-w-2xl mx-auto lg:mx-0">
                {[
                  "1000+ participant live sessions",
                  "Screen sharing & whiteboard",
                  "Breakout rooms",
                  "Automatic recordings",
                  "Multi-language support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-main">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0">
                      ✓
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              className="relative px-2 lg:px-0 hidden lg:block"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInRight}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative aspect-[1.3] sm:aspect-[1.5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/assets/live-classes-dashboard.png"
                  fill
                  className="object-cover"
                  alt="Live Classes Interface"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Smart Exam System */}
      <section className="py-16 lg:py-12 bg-[#F9FAFB]">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="relative order-2 lg:order-1 px-4 lg:px-0 hidden lg:block"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[1.2] sm:aspect-[1.4] rounded-2xl overflow-hidden shadow-2xl border-4 sm:border-8 border-white">
                <Image
                  src="/assets/exam-system.png"
                  fill
                  className="object-cover"
                  alt="Exam System Interface"
                />
              </div>
            </motion.div>
            <motion.div
              className="order-1 lg:order-2 text-center lg:text-left"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInRight}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 width-[122px] height-[36px] py-[8px] px-[16px] bg-[#DCFCE7] rounded-full mb-6">
                <Image
                  src="/assets/feature-3.png"
                  width={20}
                  height={20}
                  alt="Smart Testing Icon"
                />
                <span className="text-green-700 text-sm font-semibold">
                  Smart Testing
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-main">
                Smart Exam System
              </h2>

              {/* Mobile/Tablet image */}
              <div className="relative lg:hidden mb-8 mt-4 px-4">
                <div className="relative aspect-[1.2] sm:aspect-[1.4] rounded-2xl overflow-hidden shadow-2xl border-4 sm:border-8 border-white">
                  <Image
                    src="/assets/exam-system.png"
                    fill
                    className="object-cover"
                    alt="Exam System Interface"
                  />
                </div>
              </div>

              <p className="text-base sm:text-lg text-body mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Advanced examination platform with AI-powered monitoring and
                comprehensive assessment tools.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-6 text-left max-w-md md:max-w-2xl mx-auto lg:mx-0">
                {[
                  "MCQ, upload, matching exams",
                  "AI face monitoring",
                  "Anti-cheating controls",
                  "Auto result generation",
                  "Ranking system",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-main">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0">
                      ✓
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Attendance & Performance */}
      <section className="py-16 lg:py-15">
        <div className="container-custom text-center lg:text-left">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 width-[122px] height-[36px] py-[8px] px-[16px] bg-[#F3E8FF] rounded-full mb-6">
                <Image
                  src="/assets/attendance-analytics-icon.png"
                  width={20}
                  height={20}
                  alt="Analytics Icon"
                />
                <span className="text-purple-600 text-sm font-semibold">
                  Analytics
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-6 text-main">
                Attendance & Performance
              </h2>

              {/* Mobile/Tablet image */}
              <div className="relative lg:hidden mb-8 mt-4 px-4">
                <div className="relative aspect-[1.1] sm:aspect-[1.3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                  <Image
                    src="/assets/attendance-analytics.png"
                    fill
                    className="object-contain"
                    alt="Attendance & Analytics"
                  />
                </div>
              </div>

              <p className="text-base sm:text-lg text-body mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Comprehensive tracking and analytics to monitor student progress
                and engagement.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-6 text-left max-w-md md:max-w-2xl mx-auto lg:mx-0">
                {[
                  "Face-based attendance",
                  "Performance tracking",
                  "Monthly best student awards",
                  "Teacher feedback system",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex text-[#374151] items-center gap-3 text-main"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] shrink-0">
                      ✓
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              className="relative px-4 lg:px-0 hidden lg:block"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInRight}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative aspect-[1.1] sm:aspect-[1.3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/assets/attendance-analytics.png"
                  fill
                  className="object-contain"
                  alt="Attendance & Analytics"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Payment & Access Control */}
      <section className="py-15 bg-gray-50/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="relative hidden lg:block"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[1.4] rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
                <Image
                  src="/assets/payment-dashboard.png"
                  fill
                  className="object-contain"
                  alt="Payment Dashboard"
                />
              </div>
            </motion.div>
            <motion.div
              className="text-center lg:text-left"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInRight}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 width-[122px] height-[36px] py-[8px] px-[16px] bg-orange-100 rounded-full mb-6">
                <Image
                  src="/assets/payment-feature.svg"
                  width={20}
                  height={20}
                  alt="Payment Icon"
                />
                <span className="text-orange-600 text-sm font-semibold">
                  Payments
                </span>
              </div>

              <h2 className="text-4xl lg:text-4xl font-bold mb-6 text-main">
                Payment & Access Control
              </h2>

              {/* Mobile/Tablet image */}
              <div className="relative lg:hidden mb-8 mt-4 px-4">
                <div className="relative aspect-[1.4] rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
                  <Image
                    src="/assets/payment-dashboard.png"
                    fill
                    className="object-contain"
                    alt="Payment Dashboard"
                  />
                </div>
              </div>

              <p className="text-lg text-body mb-8 leading-relaxed">
                Streamlined payment processing with flexible access controls and
                subscription management.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-6 text-left max-w-md md:max-w-2xl mx-auto lg:mx-0">
                {[
                  "Monthly subscriptions",
                  "Wallet system",
                  "Temporary access for unpaid users",
                  "Integrated payment gateway",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center text-[#374151] gap-3 text-main"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mutual Transfer System (Blue Banner) */}
      <section className="bg-primary bg-gradient-to-b from-[#005CFF] to-[#2563EB] py-10 text-white text-center">
        <motion.div
          className="container-custom"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-[#FFFFFF33]  text-white rounded-full text-xs font-bold tracking-widest mb-6 lg:mb-2 border border-white/20">
            <Image
              src="/assets/Transfer.png"
              width={16}
              height={16}
              alt="Transfer Icon"
              className="mr-2 inline-block brightness-0 invert"
            />
            Transfer Management
          </span>
          <h2 className="text-3xl sm:text-4xl text-white  lg:text-4xl font-bold mb-6 lg:mb-2 px-4">
            Mutual Transfer System
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#DBEAFE] max-w-4xl mx-auto mb-12 lg:mb-8 leading-relaxed px-6">
            Streamline teacher transfers with our intelligent mutual transfer
            system. Match preferences, automate approvals, and ensure smooth
            transitions for educational staff.
          </p>
          <Link
            href="/mutual-transfer"
            className="inline-block bg-white text-primary px-8 lg:px-10 py-4 lg:py-5 rounded-xl font-bold text-base lg:text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
          >
            Learn More About Transfers
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Features;
