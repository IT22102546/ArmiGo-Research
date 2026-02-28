"use client";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PrivacyPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sections = [
    {
      title: "Information We Collect",
      subtitle: "Data we gather to provide our services",
      icon: "/assets/database.png",
      color: "text-blue-500",
      bg: "bg-blue-50",
      content: [
        "Name, email address, phone number (if provided)",
        "App usage data such as device type and general location (non-precise)",
      ],
    },
    {
      title: "How We Use Information",
      subtitle: "Purposes and processing of your data",
      icon: "/assets/shield-alert.png",
      color: "text-green-500",
      bg: "bg-green-50",
      content: [
        "To provide educational services",
        "To improve app performance and user experience",
        "To respond to inquiries and support requests",
      ],
    },
    {
      title: "Data Sharing Policy",
      subtitle: "When and how we share information",
      icon: "/assets/share.svg",
      color: "text-purple-500",
      bg: "bg-purple-50",
      content: [
        "We do not sell or share personal information with third parties for marketing.",
        "We use reasonable security measures to protect your data.",
      ],
    },
    {
      title: "Children's Privacy",
      subtitle: "Safety for our younger users",
      icon: "/assets/student-icon.svg",
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      content: [
        "Since LEARN APP allows users from age 6, we encourage parental supervision.",
        "We do not knowingly collect sensitive personal data from children.",
      ],
    },
    {
      title: "Payment & Financial Security",
      subtitle: "How we handle payment information",
      icon: "/assets/card.svg",
      color: "text-orange-500",
      bg: "bg-orange-50",
      content: [
        "All payment transactions are encrypted and processed through secure payment gateways.",
        "We do not store your full credit card details on our servers.",
      ],
    },
    {
      title: "Your Rights",
      subtitle: "Control over your personal data",
      icon: "/assets/lock.svg",
      color: "text-red-500",
      bg: "bg-[#E0E7FF]",
      content: [
        "You have the right to access, correct, or delete your personal data at any time.",
        "You can export your data from your account settings.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfe]">
      <Navbar />

      <main className="pb-20">
        {/* Hero Section */}
        <div className="relative h-[300px] sm:h-[400px] flex items-center justify-center overflow-hidden">
          <Image
            src="/assets/privacy-hero.png"
            fill
            alt="Privacy Policy Background"
            className="object-cover object-center z-0"
            priority
          />

          {/* Content Overlay */}
          <div className="relative z-10 container-custom text-center px-4">
            <h1 className="text-4xl lg:text-6xl font-black text-[#0a1128] mb-4 sm:mb-6 px-4">
              Privacy Policy
            </h1>
            <p className="text-base sm:text-lg text-[#4b5563] max-w-2xl mx-auto mb-4 font-medium px-4">
              How we collect, use, and protect your information
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-6 sm:mt-8">
              Last updated: January 2024
            </p>
          </div>
        </div>

        <div className="container-custom max-w-4xl mt-12 space-y-4">
          {/* Standard Sections */}
          {sections.map((section, idx) => (
            <div key={idx}>
              <div className="group">
                <div
                  onClick={() =>
                    setOpenIndex((prev) => (prev === idx ? null : idx))
                  }
                  className={`bg-white rounded-2xl border ${openIndex === idx ? "border-primary/30 ring-4 ring-primary/5" : "border-gray-100"} p-6 flex flex-col transition-all cursor-pointer hover:border-primary/20 shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 ${section.bg} rounded-xl flex items-center justify-center ${section.color}`}
                      >
                        <Image
                          src={section.icon}
                          alt={`${section.title} Icon`}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-main text-sm lg:text-base">
                          {section.title}
                        </h3>
                        <p className="text-xs text-body">{section.subtitle}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${openIndex === idx ? "rotate-180 text-primary" : ""}`}
                    />
                  </div>

                  <AnimatePresence>
                    {openIndex === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 mt-6 border-t border-gray-100">
                          <ul className="space-y-3">
                            {section.content.map((item, itemIdx) => (
                              <li
                                key={itemIdx}
                                className="flex gap-3 text-sm text-body leading-relaxed text-gray-600"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* AI & Face Recognition Data - After "How We Use Information" */}
              {idx === 1 && (
                <div className="mt-4 bg-primary rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Image
                        src="/assets/shield.svg"
                        alt="AI & Face Recognition Icon"
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm lg:text-base">
                        AI & Face Recognition Data
                      </h3>
                      <p className="text-xs text-white/70">
                        Special protection for biometric information
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white/10 rounded-md p-4">
                    <div className="bg-white/10 rounded-xl p-4 ">
                      <h4 className="font-semibold text-white text-sm mb-1">
                        Biometric Data Collection
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        We may collect facial recognition data for identity
                        verification and proctoring purposes during assessments.
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 ">
                      <h4 className="font-semibold text-white text-sm mb-1">
                        AI Processing
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Biometric data is processed locally and encrypted. We
                        never store raw facial images on our servers.
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 ">
                      <h4 className="font-semibold text-white text-sm mb-1">
                        Your Control
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        You can opt-out of facial recognition features while
                        still accessing core learning materials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Contact Card */}
          <div className="mt-12 bg-gray-50/50 rounded-2xl border border-gray-100 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-primary">
                <Image
                  src="/assets/mail.svg"
                  alt="Contact Us Icon"
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <h3 className="font-bold text-main">Contact Us</h3>
                <p className="text-xs text-body">
                  Questions about this privacy policy
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 bg-white p-6 rounded-2xl border border-gray-100">
              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-2">Email</h4>
                <Link
                  href="mailto:privacy@learnapp.com"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  privacy@learnapp.com
                </Link>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-2">
                  Response Time
                </h4>
                <p className="text-sm text-main font-medium">Within 30 days</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
