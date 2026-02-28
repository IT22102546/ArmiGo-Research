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
    transition: { staggerChildren: 0.15 },
  },
};

const QRCodeDownload = () => {
  const codes = [
    {
      app: "Android App",
      icon: "/assets/android-icon.png",
      color: "text-[#10b981]",
      bgColor: "bg-[#f0fdf4]",
      qrImg: "/assets/qr-android.png",
    },
    {
      app: "iOS App",
      icon: "/assets/ios-icon.png",
      color: "text-main",
      bgColor: "bg-gray-50",
      qrImg: "/assets/qr-ios.png",
    },
    {
      app: "Windows App",
      icon: "/assets/windows-icon.png",
      color: "text-[#3b82f6]",
      bgColor: "bg-[#eff6ff]",
      qrImg: "/assets/qr-windows.png",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <motion.div
          className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-12 md:p-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-main mb-4">
              Quick Download with QR Codes
            </h2>
            <p className="text-body text-lg">
              Scan the QR code with your device to download instantly.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {codes.map((code, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <div
                  className={`${code.bgColor} p-6 rounded-[32px] mb-6 shadow-inner`}
                >
                  <Image
                    src={code.qrImg}
                    alt="QR Code"
                    width={192}
                    height={192}
                  />
                </div>
                <div
                  className={`flex items-center gap-2 font-bold ${code.color}`}
                >
                  <Image src={code.icon} alt="" width={16} height={16} />
                  <span>{code.app}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default QRCodeDownload;
