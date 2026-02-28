"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

interface VideoData {
  id: string;
  title: string;
  url: string;
  category: string;
  size: string;
  uploadedAt: string;
}

const MutualTransfer = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch("/api/videos?category=Mutual Transfer");
        const data = await res.json();
        if (Array.isArray(data)) {
          setVideos(data);
          if (data.length > 0) {
            setSelectedVideo(data[0]);
          }
        }
      } catch {
        console.error("Failed to fetch videos");
      }
    };
    fetchVideos();
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoSelect = (video: VideoData, index: number) => {
    setSelectedVideo(video);
    setCurrentVideoIndex(index);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handlePrevVideo = () => {
    if (videos.length > 0) {
      const newIndex =
        currentVideoIndex === 0 ? videos.length - 1 : currentVideoIndex - 1;
      handleVideoSelect(videos[newIndex], newIndex);
    }
  };

  const handleNextVideo = () => {
    if (videos.length > 0) {
      const newIndex =
        currentVideoIndex === videos.length - 1 ? 0 : currentVideoIndex + 1;
      handleVideoSelect(videos[newIndex], newIndex);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-12 overflow-hidden">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold mb-6 lg:mb-8 leading-tight text-main px-4 lg:px-0">
                Secure & Verified <br className="hidden sm:block" />
                <span className="text-primary">Mutual Teacher</span>{" "}
                <br className="hidden sm:block" />
                Transfers
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-body mb-8 lg:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed px-6 lg:px-0">
                A secure and verified digital system that enables teachers to
                exchange positions across zones and institutions — without
                middlemen, delays, or risk.
              </p>

              <ul className="space-y-4 mb-10 lg:mb-12 text-left max-w-md mx-auto md:w-fit lg:w-auto lg:mx-0 px-6 lg:px-0">
                {[
                  "Verified Teacher Accounts",
                  "Zone-to-Zone Smart Search",
                  "Secure Request Workflow",
                  "Admin Approval System",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-main font-medium"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="#"
                className="inline-block bg-primary text-white px-10 py-5 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                Register for Transfer
              </Link>
            </motion.div>

            <motion.div
              className="relative px-4 lg:px-0"
              initial="hidden"
              animate="visible"
              variants={fadeInRight}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative z-10 bg-blue-50/50 rounded-[2rem] lg:rounded-[40px] p-4 sm:p-6 lg:p-10 border border-blue-100/50">
                <div className="relative aspect-[1.2] sm:aspect-[1.4] rounded-2xl overflow-hidden shadow-2xl border-4 sm:border-8 border-white">
                  <Image
                    src="/assets/mutual-hero.png"
                    fill
                    className="object-cover"
                    alt="Mutual Transfer Preview"
                  />
                  {/* Overlay UI elements if needed */}
                </div>
              </div>
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-[80px] lg:blur-[120px] rounded-full -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-12 bg-gray-50/30">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="container-custom text-center mb-12 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-main mb-6 px-4">
            How Mutual Transfer Works
          </h2>
        </motion.div>

        <div className="w-full px-20 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-12 text-center"
          >
            {[
              {
                step: 1,
                title: "Register with Official ID",
                desc: "Teacher uploads NIC / official credentials",
              },
              {
                step: 2,
                title: "Admin Verification",
                desc: "System validates credentials securely",
              },
              {
                step: 3,
                title: "Search by Zone",
                desc: "Filter by current zone & desired zone",
              },
              {
                step: 4,
                title: "Send Transfer Request",
                desc: "Request securely sent to matched teacher",
              },
              {
                step: 5,
                title: "Mutual Approval",
                desc: "Both parties must accept",
              },
              {
                step: 6,
                title: "Secure Data Sharing",
                desc: "Full details unlocked after confirmation",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="group"
              >
                <div className="w-24 h-24 bg-gradient-to-b from-[#005CFF] to-[#9333EA] border border-gray-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                  <div className="  flex items-center justify-center font-bold text-2xl text-white">
                    {item.step}
                  </div>
                </div>
                <h4 className="font-bold text-main mb-3 leading-tight">
                  {item.title}
                </h4>
                <p className="text-sm text-body leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Video/Action Section */}
      <section className="py-16 bg-[#F7F9FC] lg:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="container-custom text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-main mb-6 px-4">
            See How Mutual Transfer Works in Action
          </h2>
          <p className="text-base sm:text-lg text-body max-w-5xl mx-auto px-6">
            Watch a quick walkthrough of how teachers can securely register,
            search, request, and complete transfers.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="container-custom max-w-5xl px-4 lg:px-0"
        >
          {videos.length > 0 && selectedVideo ? (
            <>
              {/* Main Video Player */}
              <div className="relative aspect-video rounded-2xl lg:rounded-[32px] overflow-hidden bg-gray-900 shadow-2xl border-4 sm:border-8 border-white">
                <video
                  ref={videoRef}
                  src={selectedVideo.url}
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                  onClick={handlePlayPause}
                />

                {/* Video Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  {/* Center Play Button */}
                  {!isPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={handlePlayPause}
                    >
                      <div className="w-16 h-16 lg:w-24 lg:h-24 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                        <Play size={32} className="ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePlayPause}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause size={20} />
                        ) : (
                          <Play size={20} className="ml-0.5" />
                        )}
                      </button>
                      <button
                        onClick={handleMute}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX size={20} />
                        ) : (
                          <Volume2 size={20} />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      {videos.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevVideo}
                            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <span className="text-white text-sm font-medium">
                            {currentVideoIndex + 1} / {videos.length}
                          </span>
                          <button
                            onClick={handleNextVideo}
                            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleFullscreen}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                      >
                        <Maximize size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Video Title */}
                <div className="absolute top-4 left-4 right-4 lg:top-6 lg:left-6">
                  <span className="bg-primary/90 backdrop-blur-sm text-white text-xs lg:text-sm font-semibold px-4 py-2 rounded-full">
                    {selectedVideo.title}
                  </span>
                </div>
              </div>

              {/* Video Thumbnails */}
              {videos.length > 1 && (
                <div className="mt-6 lg:mt-8">
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {videos.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => handleVideoSelect(video, index)}
                        className={`relative flex-shrink-0 w-40 lg:w-48 aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                          selectedVideo.id === video.id
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-white hover:border-primary/50"
                        }`}
                      >
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play
                            size={20}
                            className="text-white"
                            fill="currentColor"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-white text-[10px] lg:text-xs font-medium truncate">
                            {video.title}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Fallback when no videos uploaded */
            <div className="relative aspect-video rounded-2xl lg:rounded-[32px] overflow-hidden bg-gray-900 shadow-2xl group cursor-pointer border-4 sm:border-8 border-white">
              <Image
                src="/assets/video-thumbnail.png"
                fill
                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                alt="Video Walkthrough"
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-primary/50 text-white rounded-full flex items-center justify-center text-2xl lg:text-4xl shadow-2xl">
                  <Play size={32} fill="currentColor" />
                </div>
                <p className="text-white text-sm lg:text-base font-medium bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                  Videos coming soon
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 mt-12 lg:mt-16 text-center">
            {[
              {
                label: "Register",
                icon: "/assets/register-icon.png",
                desc: "Create verified profile",
              },
              {
                label: "Verify",
                icon: "/assets/verify-icon.svg",
                desc: "Admin validation",
              },
              {
                label: "Match",
                icon: "/assets/match-icon.svg",
                desc: "Find compatible teachers",
              },
              {
                label: "Approve",
                icon: "/assets/approve-icon.png",
                desc: "Finalize transfer",
              },
            ].map((item) => (
              <div key={item.label} className="px-2">
                <Image
                  src={item.icon}
                  width={64}
                  height={64}
                  alt={`${item.label} icon background`}
                  className="mx-auto bg-[#005CFF] p-4 rounded-2xl mb-4"
                />
                <h5 className="font-bold text-main mb-1 text-sm lg:text-base">
                  {item.label}
                </h5>
                <p className="text-[10px] lg:text-xs text-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Admin Control Section */}
      <section className="py-16 lg:py-12 bg-gray-50/50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInLeft}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1 px-4 lg:px-0"
            >
              <div className="bg-white p-2 rounded-[2rem] lg:rounded-[40px] shadow-2xl border border-gray-100">
                <div className="relative aspect-[1.1] sm:aspect-[1.2] rounded-[1.5rem] lg:rounded-[32px] overflow-hidden">
                  <Image
                    src="/assets/admin-control.png"
                    fill
                    className="object-contain"
                    alt="Admin Control Dashboard"
                  />
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl lg:w-40 lg:h-40 lg:-top-10 lg:-left-10"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl lg:w-40 lg:h-40 lg:-bottom-10 lg:-right-10"></div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInRight}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2 text-center lg:text-left"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-6 lg:mb-8 text-main leading-tight px-4 lg:px-0">
                Full Administrative Control
              </h2>
              <div className="space-y-4 lg:space-y-6 text-left max-w-md mx-auto lg:mx-0">
                {[
                  "Approve or reject requests",
                  "Track zone movement",
                  "Manage user verification",
                  "Monitor transfer history",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 text-base lg:text-lg font-medium text-main"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      ✓
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Prop Section (Blue Block) */}
      <section className="relative py-20 lg:py-20">
        <div className="w-full relative z-10">
          <div className="bg-primary p-10 lg:p-24 text-white text-center relative overflow-hidden shadow-2xl shadow-primary/30">
            {/* White bubble circles overlay */}
            <div className="absolute -top-10 -left-10 lg:-top-16 lg:-left-16 w-40 h-40 lg:w-56 lg:h-56 bg-white/10 rounded-full z-20"></div>
            <div className="absolute top-20 left-20 lg:top-32 lg:left-32 w-16 h-16 lg:w-24 lg:h-24 bg-white/10 rounded-full z-20"></div>
            <div className="absolute -bottom-10 -right-10 lg:-bottom-16 lg:-right-16 w-36 h-36 lg:w-48 lg:h-48 bg-white/10 rounded-full z-20"></div>
            <div className="absolute bottom-20 right-24 lg:bottom-28 lg:right-36 w-14 h-14 lg:w-20 lg:h-20 bg-white/10 rounded-full z-20"></div>
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl lg:text-4xl font-bold mb-12 text-white lg:mb-20 relative z-10 px-4"
            >
              Why This System Changes Everything
            </motion.h2>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 relative z-10"
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 backdrop-blur-md">
                  <Image
                    src="/assets/safe-transparent.svg"
                    width={32}
                    height={32}
                    className="object-contain"
                    alt="Safe & Transparent"
                  />
                </div>
                <h4 className="text-xl lg:text-2xl text-white font-bold mb-4">
                  Safe & Transparent
                </h4>
                <p className="text-sm lg:text-base text-blue-50/70 leading-relaxed px-4 lg:px-0">
                  No scams or unauthorized brokers. Every account is verified by
                  institutional admins.
                </p>
              </motion.div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 backdrop-blur-md">
                  <Image
                    src="/assets/fast-transparent.svg"
                    width={32}
                    height={32}
                    className="object-contain"
                    alt="Fast & Efficient"
                  />
                </div>
                <h4 className="text-xl text-white lg:text-2xl font-bold mb-4">
                  Fast & Efficient
                </h4>
                <p className="text-sm lg:text-base text-blue-50/70 leading-relaxed px-4 lg:px-0">
                  Digital processing replaces weeks of paperwork with instant
                  matching and workflow.
                </p>
              </motion.div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 backdrop-blur-md">
                  <Image
                    src="/assets/nationwide-transparent.png"
                    width={32}
                    height={32}
                    className="object-contain"
                    alt="Nationwide Scalability"
                  />
                </div>
                <h4 className="text-xl lg:text-2xl text-white font-bold mb-4">
                  Nationwide Scalability
                </h4>
                <p className="text-sm lg:text-base text-blue-50/70 leading-relaxed px-4 lg:px-0">
                  Expandable across districts and zones for a unified nationwide
                  educator database.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ready Section */}
      <section className="py-16 lg:py-24 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
          className="container-custom"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-main mb-10 lg:mb-12 leading-tight px-4">
            Ready to Find Your Mutual <br className="hidden sm:block" />{" "}
            Transfer Match?
          </h2>

          <div className="flex flex-col sm:flex-row justify-center gap-4 lg:gap-6 px-6 lg:px-0">
            <Link
              href="#"
              className="bg-primary text-white px-8 lg:px-12 py-4 lg:py-5 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg hover:shadow-xl hover:shadow-primary/20 transition-all"
            >
              Register Now
            </Link>
            <Link
              href="#"
              className="border-2 border-primary text-primary px-8 lg:px-12 py-4 lg:py-5 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg hover:bg-primary/5 transition-all"
            >
              Contact Administration
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default MutualTransfer;
