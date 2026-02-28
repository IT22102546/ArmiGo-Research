"use client";

import Link from "next/link";
import { Download, Play } from "lucide-react";
import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const ReadyToLearnCTA = () => {
  return (
    <section className="py-20">
      <div className="container-custom">
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-[40px] px-8 py-16 md:py-24 text-center text-white shadow-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7 }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-[80px]" />
             <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl  text-white md:text-5xl font-extrabold mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-blue-50 text-lg md:text-xl mb-12 opacity-90">
              Join thousands of students already using LearnApp LMS to achieve their educational goals.
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              <Link 
                href="#" 
                className="flex items-center gap-2 bg-white text-[#6366f1] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/20"
              >
                <Download size={20} />
                Download Now
              </Link>
              <Link 
                href="#" 
                className="flex items-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <Play size={20} />
                Watch Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ReadyToLearnCTA;
