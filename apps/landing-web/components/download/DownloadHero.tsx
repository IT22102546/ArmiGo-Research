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

const DownloadHero = () => {
  return (
    <section className="relative pb-16 md:pt-32 lg:pt-0 md:pb-24 lg:pb-10 overflow-hidden bg-white">
      {/* Background blobs/gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-blue-400 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] bg-purple-400 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="py-10 bg-gradient-to-b from-[#EEF2FF] via-[#FAF5FF] to-[#FDF2F8] relative z-10 flex flex-col items-center text-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-600/20 bg-white text-[#374151] text-xs font-semibold mb-8"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/assets/icon-offline.svg"
            alt="App Icon"
            width={16}
            height={16}
            className="mr-2"
          />
          Available on All Platforms
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold text-main mb-6 leading-tight"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          Get the App – Learn <br />
          <span className="text-[#8B5CF6]">Anywhere, Anytime</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-body text-lg md:text-xl max-w-2xl mb-12"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          Download LearnApp on your favorite device and take your learning
          journey to the next level
        </motion.p>

        {/* Store Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-5"
          variants={fadeInUp}
          transition={{ duration: 0.5 }}
        >
          {/* Google Play Button */}
          <a
            href="#"
            className="group bg-black hover:bg-gray-900 text-white rounded-2xl px-8 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-w-[200px]"
          >
            <Image
              src="/assets/store-google.svg"
              alt="Google Play"
              width={16}
              height={16}
            />
            <div className="text-left">
              <div className="text-[10px] font-medium uppercase tracking-wide opacity-90">
                GET IT ON
              </div>
              <div className="text-lg font-bold leading-tight">Google Play</div>
            </div>
          </a>

          {/* App Store Button */}
          <a
            href="#"
            className="group bg-black hover:bg-gray-900 text-white rounded-2xl px-8 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-w-[200px]"
          >
            <Image
              src="/assets/store-apple.png"
              alt="App Store"
              width={16}
              height={16}
            />
            <div className="text-left">
              <div className="text-[10px] font-medium uppercase tracking-wide opacity-90">
                Download on the
              </div>
              <div className="text-lg font-bold leading-tight">App Store</div>
            </div>
          </a>

          {/* Microsoft Store Button */}
          <a
            href="#"
            className="group bg-[#6366f1] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:bg-[#5558e3] text-white rounded-2xl px-8 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-w-[200px]"
          >
            <Image
              src="/assets/windows-icon.svg"
              alt="Microsoft Store"
              width={16}
              height={16}
            />
            <div className="text-left">
              <div className="text-[10px] font-medium uppercase tracking-wide opacity-90">
                Available on
              </div>
              <div className="text-lg font-bold leading-tight">
                Microsoft Store
              </div>
            </div>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default DownloadHero;
