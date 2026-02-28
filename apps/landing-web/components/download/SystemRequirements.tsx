"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const SystemRequirements = () => {
  const requirements = [
    {
      platform: "Android",
      icon: "/assets/android-icon.svg",
      version: "Version 6.0+",
      specs: [" 500 MB RAM minimum", "100 MB free storage"],
      iconBg: "bg-green-400",
    },
    {
      platform: "iOS",
      icon: "/assets/ios-icon.svg",
      version: "Version 13.0+",
      specs: ["iPhone 6s or later", "150 MB free RAM"],
      iconBg: "bg-[#111827]",
    },
    {
      platform: "Windows",
      icon: "/assets/windows-icon.svg",
      version: "Version 10+",
      specs: ["4 GB RAM minimum", "200 MB free storage"],
      iconBg: "bg-blue-400",
    },
    {
      platform: "Web Browser",
      icon: "/assets/store-web.png",
      version: "Modern browsers",
      specs: ["Chrome, Firefox, Safari", "Edge (Chromium)"],
      iconBg: "bg-purple-400",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-main mb-4">
            System Requirements
          </h2>
          <p className="text-body text-lg">
            Make sure your device meets these minimum requirements.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          {requirements.map((req, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div
                className={`${req.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}
              >
                <Image
                  src={req.icon}
                  alt={req.platform}
                  width={24}
                  height={24}
                />
              </div>

              <h3 className="text-xl font-bold text-main mb-1">
                {req.platform}
              </h3>
              <p className="text-body text-sm font-medium mb-6 uppercase tracking-wider">
                {req.version}
              </p>

              <ul className="space-y-3">
                {req.specs.map((spec, sIdx) => (
                  <li
                    key={sIdx}
                    className="flex items-start gap-2 text-body text-sm"
                  >
                    <span className="text-success">✓</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SystemRequirements;
