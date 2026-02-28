"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Activity, Shield, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#0a1128] via-[#1a1f3a] to-[#2a1f4a] text-white pt-16 pb-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        {/* Floating Hearts */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-500/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + i * 2}s infinite`,
              transform: `scale(${0.5 + i * 0.2})`,
            }}
          >
            <Heart size={24} />
          </div>
        ))}
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-10">
          {/* Brand Column - Enhanced */}
          <div className="md:col-span-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6 lg:mb-8 group">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ArmiGo
              </span>
              <Heart className="w-5 h-5 text-red-400 fill-current animate-pulse" />
            </div>
            
            <p className="text-blue-100/60 w-full mb-6 max-w-sm mx-auto md:mx-0 leading-relaxed">
              Empowering hemiplegic children (ages 6-14) through innovative IoT devices and engaging VR games. 
              Transforming rehabilitation into an exciting adventure.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6 text-blue-100/70">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Phone className="w-4 h-4 text-purple-400" />
                <span className="text-sm">+1 (800) 123-4567</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Mail className="w-4 h-4 text-purple-400" />
                <span className="text-sm">support@armigo.com</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-sm">123 Rehab Ave, Medical City, MC 12345</span>
              </div>
            </div>

            {/* Social Links - Enhanced */}
            <div className="flex justify-center md:justify-start gap-3">
              {[
                { name: "facebook", icon: "/assets/facebook.svg", color: "hover:bg-blue-600" },
                { name: "twitter", icon: "/assets/twitter.svg", color: "hover:bg-sky-500" },
                { name: "linkedin", icon: "/assets/linkedin.svg", color: "hover:bg-blue-700" },
                { name: "instagram", icon: "/assets/instagram.png", color: "hover:bg-pink-600" },
                { name: "youtube", icon: "/assets/youtube.svg", color: "hover:bg-red-600" },
              ].map((social) => (
                <Link
                  key={social.name}
                  href="#"
                  className={`w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:scale-110 transition-all border border-white/10 ${social.color}`}
                >
                  <Image
                    src={social.icon}
                    width={18}
                    height={18}
                    alt={`${social.name} icon`}
                    className="brightness-0 invert"
                  />
                </Link>
              ))}
            </div>

            {/* Trust Badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs text-blue-100/80">HIPAA Compliant • FDA Registered</span>
            </div>
          </div>

          {/* For Families Column - New */}
          <div className="md:col-span-2 md:col-start-6 text-center md:text-left">
            <h4 className="text-lg font-bold mb-6 flex items-center justify-center md:justify-start gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              For Families
            </h4>
            <ul className="space-y-4 text-blue-100/60 font-medium">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/devices" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Our Devices
                </Link>
              </li>
              <li>
                <Link href="/games" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  VR Games
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/parent-app" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Parent App
                </Link>
              </li>
            </ul>
          </div>

          {/* For Hospitals Column - New */}
          <div className="md:col-span-2 md:col-start-9 text-center md:text-left">
            <h4 className="text-lg font-bold mb-6 flex items-center justify-center md:justify-start gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              For Hospitals
            </h4>
            <ul className="space-y-4 text-blue-100/60 font-medium">
              <li>
                <Link href="/hospital-solutions" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Solutions Overview
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Hospital Dashboard
                </Link>
              </li>
              <li>
                <Link href="/integration" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  EHR Integration
                </Link>
              </li>
              <li>
                <Link href="/training" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Staff Training
                </Link>
              </li>
              <li>
                <Link href="/research" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Clinical Research
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column - New */}
          <div className="md:col-span-2 md:col-start-11 text-center md:text-left">
            <h4 className="text-lg font-bold mb-6 flex items-center justify-center md:justify-start gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Support
            </h4>
            <ul className="space-y-4 text-blue-100/60 font-medium">
              <li>
                <Link href="/help" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/technical-support" className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                  Technical Support
                </Link>
              </li>
            </ul>

            {/* CTA Button */}
            <div className="mt-8">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl font-semibold text-sm hover:scale-105 transition-transform shadow-lg"
              >
                <Heart className="w-4 h-4" />
                Start Free Assessment
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Enhanced */}
        <div className="border-t border-white/10 pt-8 mt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <p className="text-sm text-blue-100/40 order-2 lg:order-1">
              © 2026 ArmiGo Rehabilitation. All rights reserved. 
              <span className="block sm:inline sm:ml-2">Making therapy fun for little heroes.</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 order-1 lg:order-2">
              <Link
                href="/privacy"
                className="text-sm text-blue-100/40 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-blue-100/40 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-blue-100/40 hover:text-white transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="/hipaa"
                className="text-sm text-blue-100/40 hover:text-white transition-colors"
              >
                HIPAA Compliance
              </Link>
              <Link
                href="/accessibility"
                className="text-sm text-blue-100/40 hover:text-white transition-colors"
              >
                Accessibility
              </Link>
            </div>
          </div>

          {/* Certification Badges */}
          <div className="flex flex-wrap justify-center lg:justify-end gap-4 mt-6">
            {[
              "FDA Registered",
              "HIPAA Compliant",
              "ISO 13485",
              "CE Mark"
            ].map((cert, i) => (
              <span
                key={i}
                className="text-xs bg-white/5 px-3 py-1 rounded-full border border-white/10 text-blue-100/60"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>

        {/* Made with love note */}
        <div className="text-center mt-8 text-xs text-blue-100/30 flex items-center justify-center gap-1">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-red-400 fill-current animate-pulse" />
          <span>for little heroes everywhere</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;