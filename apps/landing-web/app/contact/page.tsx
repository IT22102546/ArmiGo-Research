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

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-20 pb-0">
        {/* Header Section */}
        <motion.section
          className="w-full pt-12 bg-gradient-to-b from-[#EFF6FF] to-white text-center mb-10"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-main mb-3">
            Get in Touch
          </h1>
          <p className="lg:text-lg text-body  lg:max-w-2xl mx-auto leading-relaxed">
            We&apos;re here to help! Reach out to us with any questions or
            inquiries about LearnApp
          </p>
        </motion.section>

        {/* Contact Grid Section */}
        <section className="container-custom pb-10">
          <div className="p-4 lg:p-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Left: Contact Form */}
              <motion.div
                className="bg-white rounded-2xl p-8 shadow-sm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeInLeft}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-bold text-main mb-2">
                  Send Us a Message
                </h2>
                <p className="text-sm text-body mb-8">
                  Fill out the form below and we&apos;ll get back to you as soon
                  as possible.
                </p>

                <form className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+94 XX XXX XXXX"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      placeholder="Your school or organization"
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-main mb-2">
                      Message
                    </label>
                    <textarea
                      placeholder="Tell us how we can help you..."
                      rows={5}
                      className="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none"
                    ></textarea>
                  </div>

                  <button className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2">
                    <Image
                      src="/assets/send-icon.svg"
                      width={20}
                      height={20}
                      alt="Send Icon"
                    />
                    Send Message
                  </button>
                </form>
              </motion.div>

              {/* Right: Contact Info & Map */}
              <motion.div
                className="space-y-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeInRight}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-white rounded-2xl  p-8 shadow-md">
                  <h2 className="text-2xl font-bold text-main mb-8">
                    Contact Information
                  </h2>

                  <div className="space-y-6">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-primary">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-main">
                          Email Address
                        </h4>
                        <p className="text-sm text-body">info@LearnApp.com</p>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 font-bold">
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-main">
                          WhatsApp
                        </h4>
                        <button className="mt-2 bg-[#25D366] text-white py-2 px-6 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#20ba59] transition-all">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Chat with Us
                        </button>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-main">
                          Office Address
                        </h4>
                        <p className="text-sm text-body leading-relaxed">
                          123 Education Lane,
                          <br />
                          Colombo 07, Sri Lanka
                        </p>
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-main">
                          Business Hours
                        </h4>
                        <p className="text-sm text-body leading-relaxed">
                          Monday - Friday: 9:00 AM - 6:00 PM
                          <br />
                          Saturday: 10:00 AM - 4:00 PM
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Mock */}
                <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl relative h-64 group cursor-pointer">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.20017129188!2d79.8516086871582!3d6.9085189!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2596ad7cf2f97%3A0x86134b266395e26!2sColombo%2007%2C%20Colombo!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "grayscale(0.1)" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  {/* Design Overlay */}
                  <div className="absolute top-4 left-4 bg-white/95 p-3 rounded-lg shadow-lg pointer-events-none">
                    <h4 className="text-main font-bold text-xs">Colombo 07</h4>
                    <p className="text-body text-[10px]">
                      Colombo 00700, Sri Lanka
                    </p>
                    <button className="text-primary text-[10px] font-bold mt-1">
                      View larger map
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <motion.section
          className="bg-primary pt-10 pb-10 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7 }}
        >
          <div className="container-custom text-center text-white relative z-10">
            <h2 className="text-4xl lg:text-4xl text-white font-black mb-4 leading-tight">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-lg text-blue-100/80 mb-6 max-w-xl mx-auto">
              Join thousands of students and educators already using LearnApp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="bg-white text-primary px-10 py-4 rounded-xl font-black hover:bg-blue-50 transition-all">
                Get Started Free
              </button>
              <button className="border-2 border-white/50 text-white px-10 py-4 rounded-xl font-black hover:bg-white/10 transition-all flex items-center gap-2">
                Schedule Demo
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
