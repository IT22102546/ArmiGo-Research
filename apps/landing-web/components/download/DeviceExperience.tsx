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

const DeviceExperience = () => {
  const devices = [
    {
      title: "Mobile",
      subtitle: "Learn on the go",
      icon: "assets/mobile-icon.svg",
      image: "/assets/mobile-ui.png",
      bgColor: "bg-[#f0f4ff]",
      iconBg: "bg-[#6366f1]",
    },
    {
      title: "Tablet",
      subtitle: "Perfect for reading",
      icon: "assets/tablet-icon.svg",
      image: "/assets/tablet-ui.png",
      bgColor: "bg-[#f5f3ff]",
      iconBg: "bg-[#8b5cf6]",
    },
    {
      title: "Desktop",
      subtitle: "Full-featured experience",
      icon: "assets/desktop-icon.svg",
      image: "/assets/desktop-ui.png",
      bgColor: "bg-[#eff6ff]",
      iconBg: "bg-[#3b82f6]",
    },
  ];

  return (
    <section className="py-5 bg-white">
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
            Experience Across All Devices
          </h2>
          <p className="text-body text-lg">
            Seamless learning experience on phone, tablet, and desktop
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          {devices.map((device, index) => (
            <motion.div
              key={index}
              className={`${device.bgColor} rounded-[32px] p-8 flex flex-col items-center`}
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              <div
                className={`${device.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200`}
              >
                {/* Custom icons based on design */}
                {device.title === "Mobile" && (
                  <Image
                    src={device.icon}
                    alt="Mobile Icon"
                    width={16}
                    height={16}
                  />
                )}
                {device.title === "Tablet" && (
                  <Image
                    src={device.icon}
                    alt="Tablet Icon"
                    width={16}
                    height={16}
                  />
                )}
                {device.title === "Desktop" && (
                  <Image
                    src={device.icon}
                    alt="Desktop Icon"
                    width={16}
                    height={16}
                  />
                )}
              </div>

              <h3 className="text-xl font-bold text-main mb-2">
                {device.title}
              </h3>
              <p className="text-body text-sm mb-5">{device.subtitle}</p>

              <div className="relative w-full aspect-[4/5] md:aspect-[3/4] flex items-center justify-center">
                {/* Device Frame Simulation */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {device.title === "Mobile" && (
                    <Image
                      src={device.image}
                      alt="Mobile UI"
                      fill
                      className="object-contain"
                    />
                  )}
                  {device.title === "Tablet" && (
                    <Image
                      src={device.image}
                      alt="Tablet UI"
                      fill
                      className="object-contain"
                    />
                  )}
                  {device.title === "Desktop" && (
                    <Image
                      src={device.image}
                      alt="Desktop UI"
                      fill
                      className="object-contain  "
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default DeviceExperience;
