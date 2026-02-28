"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import {
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Navigation,
  ArrowUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TermsPage() {
  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      image: "/assets/icon-check.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "user responsiblities",
      title: "User Responsibilities",
      image: "/assets/user-responsibilities.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
      list: [
        "Maintain secure login credentials",
        "Provide accurate personal and academic information",
        "Respect intellectual property rights",
        "Follow academic integrity guidelines",
      ],
    },
    {
      id: "platform usage",
      title: "Platform Usage ",
      image: "/assets/platform-usage.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "ai-exam",
      title: "AI Exam Monitoring",
      image: "/assets/exam-system.svg",
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      id: "payment",
      title: "Payments & Subscription",
      image: "/assets/payment.svg",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      id: "refund",
      title: "Refund Policy",
      image: "/assets/refund.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "transfer",
      title: "Mutual Transfer",
      image: "/assets/Transfer.png",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "admin",
      title: "Admin Rights",
      image: "/assets/Admin.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },

    {
      id: "liability",
      title: "Limitation of Liability",
      image: "/assets/liability.png",
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      id: "termination",
      title: "Account Termination",
      image: "/assets/termination.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "updates",
      title: "Changes to Terms",
      image: "/assets/feature-2.svg",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      id: "contact",
      title: "Contact Information",
      image: "/assets/contact.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },

    {
      id: "eligibility",
      title: "Eligibility",
      image: "/assets/Student.svg",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "usage",
      title: "Use of the App",
      image: "/assets/feature-1.svg",
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      id: "content",
      title: "Content & Services",
      image: "/assets/Teacher.svg",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },

    {
      id: "property",
      title: "Intellectual Property",
      image: "/assets/icon-shield.svg",
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
  ];

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -70% 0%", threshold: 0 }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Track scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavClick = (sectionId: string) => {
    setIsNavOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentSection =
    sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="pt-20 pb-10">
        {/* Header Section */}
        <section className="bg-gradient-to-br from-[#0061ff] via-[#4a90e2] to-[#a855f7] py-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-15 left-20 w-30 h-30 bg-white/50 rounded-full blur-xl"></div>
          <div className="absolute bottom-24 right-25 w-20 h-20 bg-white/50 rounded-full blur-xl"></div>

          <div className="container-custom relative z-10">
            <h1 className="text-3xl sm:text-4xl text-white lg:text-5xl font-bold mb-4 lg:mb-6 px-4">
              Terms & Conditions
            </h1>
            <p className="text-base sm:text-lg text-blue-50/80 max-w-2xl mx-auto px-6">
              Understanding your rights and responsibilities when using
              LearnApp.
            </p>
          </div>
        </section>

        <div className="container-custom mt-8 lg:mt-12">
          {/* Main Content - Full Width */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Acceptance Section */}
            <div
              id="acceptance"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/icon-check.svg"
                      alt="Acceptance"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Acceptance of Terms
                </h2>
              </div>
              <div className="space-y-6 text-body leading-relaxed text-sm lg:text-base">
                <p>
                  By accessing and using LEARN APP, you acknowledge that you
                  have read, understood, and agree to be bound by these Terms
                  and Conditions. If you do not agree to these terms, please do
                  not use our platform.
                </p>

                {/* Info Box from reference image */}
                <div className="bg-[#f0f7ff] border border-[#d0e7ff] p-5 rounded-2xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#0061ff] shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-[#0061ff]">
                    Your continued use of the platform constitutes acceptance of
                    any updates to these terms.
                  </p>
                </div>
              </div>
            </div>

            {/* User Responsibilities Section */}
            <div
              id="user responsibilities"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/userResponsiblities.png"
                      alt="User Responsibilities"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  User Responsibilities
                </h2>
              </div>
              <p className="text-body leading-relaxed text-sm lg:text-base">
                Users are responsible for maintaining the confidentiality of
                their account information and for all activities that occur
                under their account.
              </p>
              <ul className=" pl-5 mt-4 space-y-1 text-sm lg:text-base">
                {[
                  "Maintain secure login credentials",
                  "Provide accurate personal and academic information",
                  "Respect intellectual property rights",
                  "Follow academic integrity guidelines",
                ].map((list, idx) => (
                  <li key={idx}>{list}</li>
                ))}
              </ul>
            </div>

            {/* Platform Usage Section */}
            <div
              id="platform usage"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#F3E8FF] rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/platform-usage.svg"
                      alt="Platform Usage"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Platform Usage
                </h2>
              </div>
              <p className="text-body leading-relaxed text-sm lg:text-base">
                Our platform is intended for educational purposes. Any misuse,
                including unauthorized access attempts or data scraping, is
                strictly prohibited.
              </p>
              <div className="bg-red-50 border border-red-100 mt-5 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">
                  Prohibited activities include cheating, sharing exam content,
                  and attempting to bypass security measures.
                </p>
              </div>
            </div>

            {/* AI Exam Monitoring Section */}
            <div
              id="ai-exam"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/exam-system.svg"
                      alt="AI Exam"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  AI Exam Monitoring
                </h2>
              </div>
              <p className="text-body leading-relaxed text-sm lg:text-base mb-6">
                Our platform uses AI-powered monitoring during examinations to
                ensure academic integrity. By taking exams, you consent to video
                and audio monitoring, screen recording, and behavioral analysis.
              </p>
              <ul className=" pl-5 mt-4 space-y-1 text-sm lg:text-base">
                {[
                  "Camera and microphone access required during exams",
                  "Screen sharing and recording for proctoring purposes",
                  "Al analysis of suspicious behavior patterns",
                  "Data stored securely and used only for academic integrity",
                ].map((list, idx) => (
                  <li key={idx}>{list}</li>
                ))}
              </ul>
            </div>

            {/* Payment Section */}
            <div
              id="payment"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/payment.svg"
                      alt="Payment"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  4. Payments & Subscription
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0061ff] mt-2 shrink-0"></div>
                    Any paid services or features must be paid in full before
                    access.
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0061ff] mt-2 shrink-0"></div>
                    Payments are handled securely via third-party payment
                    providers.
                  </li>
                </ul>
              </div>
            </div>

            {/* Refund Policy Section */}
            <div
              id="refund"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/refund.svg"
                      alt="Refund"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Refund Policy
                </h2>
              </div>
              <p className="text-body leading-relaxed text-sm lg:text-base">
                Refunds are subject to our standard policy. Please contact
                support for more information regarding specific refund requests.
              </p>
            </div>

            {/* Mutual Transfer Section */}
            <div
              id="transfer"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/Transfer.png"
                      alt="Transfer"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Mutual Transfer
                </h2>
              </div>
              <p className="text-body leading-relaxed text-sm lg:text-base">
                Our platform provides a facility for mutual transfer requests.
                Users must adhere to the guidelines set forth within the
                transfer module.
              </p>
            </div>

            {/* Intellectual Property Section */}
            <div
              id="property"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/icon-shield.png"
                      alt="Property"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  5. Intellectual Property
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <p>
                  All content, including text, images, videos, and logos, is the
                  property of LEARN APP and may not be copied or reused without
                  permission.
                </p>
              </div>
            </div>

            {/* Admin Rights Section */}
            <div
              id="admin"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/Admin.svg"
                      alt="Admin"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Admin Rights
                </h2>
              </div>
              <p className="text-body leading-relaxed text-sm lg:text-base">
                Administrators reserve the right to manage users, content, and
                system settings to ensure the smooth operation of the platform.
              </p>
            </div>

            {/* Limitation of Liability Section */}
            <div
              id="liability"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/liability.png"
                      alt="Liability"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  6. Limitation of Liability
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <p>
                  LEARN APP is not responsible for any direct or indirect
                  damages resulting from the use or inability to use the app.
                </p>
              </div>
            </div>

            {/* Termination Section */}
            <div
              id="termination"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/termination.svg"
                      alt="Termination"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Account Termination
                </h2>
              </div>
              <p className="text-body leading-relaxed text-sm lg:text-base">
                We reserve the right to terminate or suspend access to our
                platform immediately, without prior notice or liability, for any
                reason whatsoever.
              </p>
            </div>

            {/* Changes to Terms Section */}
            <div
              id="updates"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/feature-2.png"
                      alt="Updates"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  7. Changes to Terms
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <p>
                  We may update these Terms & Conditions at any time. Continued
                  use of the app means you accept the updated terms.
                </p>
              </div>
            </div>

            {/* Eligibility Section (New) */}
            <div
              id="eligibility"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/Student.png"
                      alt="Eligibility"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Eligibility
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <p>
                  Users must be at least 6 years old to use this application. If
                  the user is under 18, parental guidance is recommended.
                </p>
              </div>
            </div>

            {/* Use of the App Section (New) */}
            <div
              id="usage"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/feature-1.png"
                      alt="Usage"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Use of the App
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                    LEARN APP is intended for educational purposes only.
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                    Users agree not to misuse the app or attempt to access
                    restricted areas.
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                    You must provide accurate information when registering or
                    contacting us.
                  </li>
                </ul>
              </div>
            </div>

            {/* Content & Services Section (New) */}
            <div
              id="content"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/Teacher.png"
                      alt="Content"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Content & Services
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                    Educational content is provided for learning and reference.
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                    We do not guarantee that all content is error-free or always
                    available.
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                    Content may be updated, changed, or removed at any time.
                  </li>
                </ul>
              </div>
            </div>

            {/* Intellectual Property Section (New) */}
            <div
              id="property"
              className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:p-10 scroll-mt-32 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/icon-shield.png"
                      alt="Property"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#1a1d1f]">
                  Intellectual Property
                </h2>
              </div>
              <div className="space-y-4 text-body leading-relaxed text-sm lg:text-base">
                <p>
                  All content, including text, images, videos, and logos, is the
                  property of LEARN APP and may not be copied or reused without
                  permission.
                </p>
              </div>
            </div>

            {/* Contact Card */}
            <div
              id="contact"
              className="relative bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 p-8 border-l-[6px] border-l-[#0061ff] overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center p-2">
                  <div className="relative w-full h-full">
                    <Image
                      src="/assets/contact.svg"
                      alt="Contact"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1d1f]">
                    Contact Information
                  </h3>
                  <p className="text-xs text-body">
                    Questions about these Terms & Conditions
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <Link
                  href="mailto:support@LearnApp.com"
                  className="text-sm text-[#0061ff] font-medium hover:underline"
                >
                  support@LearnApp.com
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Fixed Floating Quick Navigation Dropdown */}
      <div 
        ref={dropdownRef} 
        className="fixed z-50 bottom-6 right-6"
      >
        <AnimatePresence>
          {isNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-20 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-2"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0061ff] to-[#4a90e2] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-sm">
                    Quick Navigation
                  </span>
                </div>
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Navigation List */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {sections.map((section, idx) => (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => handleNavClick(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      activeSection === section.id
                        ? "bg-blue-50 text-[#0061ff] ring-1 ring-blue-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div
                      className={`relative w-5 h-5 shrink-0 ${activeSection === section.id ? "" : "grayscale opacity-60"}`}
                    >
                      <Image
                        src={section.image}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="truncate">{section.title}</span>
                    {activeSection === section.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-[#0061ff]"></div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Back to Top */}
              {showBackToTop && (
                <div className="border-t border-gray-100 p-2">
                  <button
                    onClick={() => {
                      scrollToTop();
                      setIsNavOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0061ff] to-[#4a90e2] text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
                  >
                    <ArrowUp className="w-4 h-4" />
                    Back to Top
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsNavOpen(!isNavOpen)}
          className={`flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl transition-all ${
            isNavOpen
              ? "bg-gray-800 text-white"
              : "bg-gradient-to-r from-[#0061ff] to-[#4a90e2] text-white shadow-blue-500/40"
          }`}
        >
          <Navigation className="w-6 h-6" />
          <span className="font-medium text-sm">
            {currentSection?.title || "Navigate"}
          </span>
          {isNavOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
