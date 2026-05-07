"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Section } from "@/components/shared/Section";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Brain,
  Wifi,
  Gamepad2,
  Cpu,
  Cloud,
  Smartphone,
  Zap,
  ChevronRight,
  Target,
  FlaskConical,
} from "lucide-react";

const literatureSections = [
  {
    letter: "A",
    title: "Wearable Sensor-Based Upper Limb Rehabilitation",
    colorClass: "from-blue-500 to-cyan-500",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-100",
    textClass: "text-blue-700",
    content:
      "The ARMIGO glove is a rehabilitation device for children designed to support upper limb rehabilitation through sensors placed at each of the four joints — fingers, wrist, elbow, and shoulder. Wearable Sensing Technologies using Inertial Measurement Units (MPU-9250) and Flex Sensors are among the best technologies for collecting real-time kinematic data. Unlike haptic devices, the ARMIGO glove focuses solely on measuring joint movement without applying force. However, most current rehabilitation devices analyse single joints rather than assessing the interaction of multiple joints simultaneously.",
  },
  {
    letter: "B",
    title: "Virtual Reality and Gamification in Pediatric Rehabilitation",
    colorClass: "from-purple-500 to-pink-500",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-100",
    textClass: "text-purple-700",
    content:
      "Using virtual reality (VR) and serious gaming as rehabilitation methods for pediatric patients has proven effective in overcoming challenges of traditional approaches that struggle with patient motivation. VR makes repetitive exercises more engaging by delivering them as game-based therapies, leading to improved patient attention and compliance. Several studies show benefit in upper limb recovery through goal-directed activities in gaming. However, current VR systems focus primarily on gross motor movements, lack emotional adaptations for children, and are prohibitively expensive for widespread adoption.",
  },
  {
    letter: "C",
    title: "Machine Learning for Movement Recognition & Quality Assessment",
    colorClass: "from-green-500 to-emerald-500",
    bgClass: "bg-green-50",
    borderClass: "border-green-100",
    textClass: "text-green-700",
    content:
      "Machine learning is increasingly applied in rehabilitation to classify movement types using sensor data. Traditional approaches are limited in classifying upper extremity movements due to patient variability. Deep learning with Long Short-Term Memory (LSTM) networks has been shown to effectively classify complex sequential movement patterns in wearable sensor data. Research on LSTMs shows potential for improving classification of movement patterns and assessment of rehabilitation sessions. Key limitations include narrow datasets from adult patients and difficulty integrating ML into real-time immersive environments.",
  },
  {
    letter: "D",
    title: "Tele-Rehabilitation and Remote Monitoring Systems",
    colorClass: "from-orange-500 to-amber-500",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-100",
    textClass: "text-orange-700",
    content:
      "Tele-rehabilitation technologies have emerged as a new approach for therapist-led remote rehabilitation via IoT. Systems with continuous movement measurement improve quality of care for pediatric patients through web-based platforms that share progress between therapists and patients. However, existing products lack full integration of monitoring within the rehabilitation program itself. Additionally, resource constraints in developing nations restrict many children with motor disabilities from accessing adequate physiotherapy services.",
  },
];

const researchGaps = [
  {
    num: 1,
    gap: "No existing published system integrates wearable sensor tracking for all four upper limb joints — shoulder, elbow, wrist, and fingers — simultaneously with joint-specific LSTM classification and dedicated therapeutic VR game environments in a single, affordable platform designed for children with hemiplegia.",
  },
  {
    num: 2,
    gap: "LSTM models for therapeutic movement classification have not been deployed as embedded real-time ONNX Runtime inference components within a commercial VR game engine for paediatric rehabilitation at interactive frame rates.",
  },
  {
    num: 3,
    gap: "No affordable, child-centred multi-joint rehabilitation system exists for the Sri Lankan clinical context, where therapist shortages, geographic barriers, and cost constraints severely limit access to conventional physiotherapy.",
  },
  {
    num: 4,
    gap: "Multi-level monitoring ecosystems combining therapist clinical dashboard, parent mobile application, AI voice assistant, and four-joint wearable therapy have not been implemented in a unified system.",
  },
  {
    num: 5,
    gap: "Most existing VR rehabilitation systems target adult stroke populations and lack the child-specific narrative, motivational, and cognitive design elements required for sustained engagement in children aged 5–15.",
  },
];

const subProblems = [
  "The absence of a complete wearable sensor suite covering all four upper limb joints in a single integrated, child-comfortable, low-cost system capable of real-time kinematic capture in both clinical and home environments.",
  "The lack of validated LSTM models for real-time, embedded classification of therapeutic movements for each joint — shoulder, elbow, wrist, and fingers — deployed within a VR game engine at interactive frame rates without dependency on cloud inference.",
  "The non-existence of a multi-game VR rehabilitation ecosystem that maps each joint's therapeutic movement repertoire to distinct engaging in-game actions, providing immediate multi-sensory feedback that motivates sustained high-repetition practice in children.",
  "The unavailability of a unified multi-level monitoring infrastructure that connects all four joint therapy components to a shared cloud database, therapist dashboard, and parent mobile application, enabling continuous remote clinical oversight across all joints simultaneously.",
];

const specificObjectives = [
  {
    joint: "Shoulder",
    colorClass: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    desc: "Develop a wearable MPU-9250 IMU shoulder module with Kalman-filtered UDP streaming, session calibration, and an LSTM classifier achieving at least 80% average accuracy across six therapeutic shoulder movement classes, integrated via ONNX Runtime into an Unreal Engine VR game.",
  },
  {
    joint: "Elbow",
    colorClass: "from-purple-500 to-violet-500",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    desc: 'Develop a wearable MPU-6050 IMU elbow sleeve with real-time signal conditioning, LSTM-based classification achieving at least 90% mean accuracy, and integration with the "Knight\'s Quest: The Shield of Strength" VR game via ONNX Runtime.',
  },
  {
    joint: "Wrist",
    colorClass: "from-green-500 to-emerald-500",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    desc: 'Develop a wearable MPU-9250 IMU wrist module with Kalman filtering and complementary filter sensor fusion, LSTM-based classification of four wrist movements (flexion, extension, pronation, supination), integrated with the "Fishing Adventure" VR game.',
  },
  {
    joint: "Fingers",
    colorClass: "from-pink-500 to-rose-500",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
    desc: 'Develop a flex-sensor glove with five per-finger sensors and ESP32 processing, implementing two-step calibration and LSTM-based classification of five therapeutic finger movements with at least 90% target accuracy, integrated with the "Magic Quest: The Enchanted Fingers" VR game.',
  },
  {
    joint: "System Integration",
    colorClass: "from-orange-500 to-amber-500",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    desc: "Establish a shared WiFi WebSocket data pipeline from all four wearable modules to Unreal Engine 5, with a unified Azure Cosmos DB cloud backend, React.js therapist dashboard, and parent mobile application providing multi-level remote monitoring across all joints.",
  },
  {
    joint: "Evaluation",
    colorClass: "from-teal-500 to-cyan-500",
    badgeBg: "bg-teal-100",
    badgeText: "text-teal-700",
    desc: "Evaluate the usability, comfort, clinical utility, and technical performance of the complete ArmiGo system through structured stakeholder feedback from parents, children, and a consulting physiotherapist.",
  },
];

const techLayers = [
  {
    Icon: Cpu,
    title: "Hardware Layer",
    colorClass: "from-blue-500 to-cyan-500",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-100",
    items: [
      "ESP32 Microcontroller (Wi-Fi + Bluetooth)",
      "MPU-6050 / MPU-9250 IMU Sensors",
      "Flex Sensors (5-finger glove)",
      "Child-friendly elastic wearable sleeves",
      "Google Cardboard / Oculus Quest VR headsets",
    ],
  },
  {
    Icon: Zap,
    title: "Firmware & Data Handling",
    colorClass: "from-green-500 to-emerald-500",
    bgClass: "bg-green-50",
    borderClass: "border-green-100",
    items: [
      "Arduino IDE & MicroPython",
      "Kalman Filter for noise reduction",
      "Moving average signal smoothing",
      "Wi-Fi / Serial communication protocols",
      "Real-time kinematic data preprocessing",
    ],
  },
  {
    Icon: Brain,
    title: "Machine Learning Layer",
    colorClass: "from-purple-500 to-violet-500",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-100",
    items: [
      "LSTM Networks (temporal movement classification)",
      "Support Vector Machines (static posture detection)",
      "TensorFlow Lite (embedded deployment)",
      "ONNX Runtime (VR game integration)",
      "Python · scikit-learn · Keras",
    ],
  },
  {
    Icon: Gamepad2,
    title: "Game Development Layer",
    colorClass: "from-pink-500 to-rose-500",
    bgClass: "bg-pink-50",
    borderClass: "border-pink-100",
    items: [
      "Unreal Engine 5 (primary VR platform)",
      "Unity 3D (alternative environments)",
      "4 therapeutic joint-specific VR games",
      "Adaptive difficulty scaling",
      "Real-time ONNX Runtime gesture integration",
    ],
  },
  {
    Icon: Cloud,
    title: "Cloud & Monitoring Layer",
    colorClass: "from-orange-500 to-amber-500",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-100",
    items: [
      "Azure Cosmos DB (unified cloud backend)",
      "Firebase / AWS S3 (media & session storage)",
      "React.js therapist clinical dashboard",
      "WebSocket real-time data pipeline",
      "AI Voice Assistant (Dialogflow / Rasa)",
    ],
  },
  {
    Icon: Smartphone,
    title: "Mobile & Caregiver Interface",
    colorClass: "from-teal-500 to-cyan-500",
    bgClass: "bg-teal-50",
    borderClass: "border-teal-100",
    items: [
      "React Native / Flutter parent app",
      "Progress tracking & analytics",
      "Teleconsultation feature",
      "Push notifications & session summaries",
      "Home rehabilitation continuity support",
    ],
  },
];

export default function DomainPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Research Domain
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Project Domain
          </h1>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
            Understanding the research landscape, problem space, and technical approach behind ArmiGo — a four-joint wearable VR rehabilitation system for children with hemiplegia.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container-custom pb-20 space-y-6">

        {/* ── Literature Review ── */}
        <Section title="Literature Review" subtitle="What existing research says about pediatric upper-limb rehabilitation" accent>
          <div className="grid md:grid-cols-2 gap-4">
            {literatureSections.map((sec, i) => (
              <motion.div
                key={sec.letter}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`rounded-2xl p-5 border ${sec.bgClass} ${sec.borderClass}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${sec.colorClass} text-white font-extrabold text-sm flex items-center justify-center shrink-0`}>
                    {sec.letter}
                  </span>
                  <h3 className={`font-bold text-sm ${sec.textClass}`}>{sec.title}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{sec.content}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── Research Gap ── */}
        <Section title="Research Gap" subtitle="Critical gaps identified in existing rehabilitation systems" accent>
          <div className="space-y-5">
            <div className="flex gap-4 items-start bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                The literature review reveals critical gaps in existing rehabilitation systems. Table 1 presents a structured comparison of existing systems against the ArmiGo platform, highlighting the specific capabilities that remain unaddressed.
              </p>
            </div>

            {/* Comparison Table Image */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white p-3"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Table 1.2.1 — Comparison of Existing Systems vs ArmiGo
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/domain/COMPARISON TABLE.png"
                alt="Comparison Table of Existing Rehabilitation Systems vs ArmiGo"
                className="w-full rounded-xl object-contain"
              />
            </motion.div>

            {/* Research Gap Table Image */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white p-3"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Research Gap Analysis Table
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/domain/RESEARCH GAP TABLE.png"
                alt="Research Gap Analysis Table"
                className="w-full rounded-xl object-contain"
              />
            </motion.div>

            {/* Gap list */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 px-1">Based on this analysis, the following specific research gaps are identified:</p>
              {researchGaps.map((item, i) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex gap-3 items-start bg-white border border-red-50 rounded-xl p-4 shadow-sm"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-orange-400 text-white text-xs font-bold flex items-center justify-center">
                    {item.num}
                  </span>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.gap}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Research Problem ── */}
        <Section title="Research Problem" subtitle="The central challenge ArmiGo addresses" accent>
          <div className="space-y-5">
            {/* Problem & Impact Image */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white p-3"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Problem & Impact Overview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/domain/PROBLEM AND IMPACT.png"
                alt="Problem and Impact Overview"
                className="w-full rounded-xl object-contain"
              />
            </motion.div>

            {/* Main problem statement */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <p className="text-gray-700 leading-relaxed text-base italic font-medium">
                "Children with hemiplegia in Sri Lanka and similar low-resource settings lack access to an affordable, engaging, and clinically effective multi-joint upper limb rehabilitation system capable of delivering high-repetition therapeutic exercise across the shoulder, elbow, wrist, and finger joints, providing real-time intelligent movement classification, and supporting continuous remote therapist oversight — all within a home-deployable platform accessible to families regardless of geographic or economic barriers."
              </p>
            </div>

            {/* Sub-problems */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 px-1">This problem manifests through four interconnected sub-problems:</p>
              {subProblems.map((prob, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="flex gap-3 items-start bg-white border border-blue-50 rounded-xl p-4 shadow-sm"
                >
                  <ChevronRight className="shrink-0 w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-gray-600 text-sm leading-relaxed">{prob}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Research Objectives ── */}
        <Section title="Research Objectives" subtitle="What ArmiGo sets out to achieve" accent>
          <div className="space-y-5">
            {/* Objectives Image */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white p-3"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Research Objectives Overview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/domain/RESEARCH OBJECTIVE.png"
                alt="Research Objectives Overview"
                className="w-full rounded-xl object-contain"
              />
            </motion.div>

            {/* Main Objective */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100">
              <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">Main Objective</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                To design, develop, and evaluate an integrated four-joint wearable movement tracking, LSTM classification, and VR therapy system — <strong>ArmiGo</strong> — for upper limb rehabilitation in children with hemiplegia, enabling real-time per-joint movement classification and therapeutic VR gameplay across the shoulder, elbow, wrist, and finger joints within a unified, affordable, and home-deployable platform.
              </p>
            </div>

            {/* Specific Objectives */}
            <div>
              <p className="text-sm font-semibold text-gray-700 px-1 mb-3">Specific Objectives by Joint Component:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {specificObjectives.map((obj, i) => (
                  <motion.div
                    key={obj.joint}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                    className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                  >
                    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold mb-2 ${obj.badgeBg} ${obj.badgeText}`}>
                      {obj.joint}
                    </span>
                    <p className="text-gray-600 text-sm leading-relaxed">{obj.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Methodology ── */}
        <Section title="Methodology" subtitle="Research approach and development process" accent>
          <div className="space-y-5">
            {/* Phase Steps */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  step: "01",
                  title: "Requirement Analysis",
                  desc: "Clinician interviews, literature synthesis, and parent/patient surveys to define functional and non-functional requirements for all four joint modules.",
                },
                {
                  step: "02",
                  title: "Iterative Design & Build",
                  desc: "Agile sprints covering hardware prototyping (ESP32 + IMU sensors), LSTM model training, VR game development in Unreal Engine 5, and backend/mobile dashboard implementation.",
                },
                {
                  step: "03",
                  title: "Evaluation & Validation",
                  desc: "Usability testing with target users (children, parents, therapists), clinical expert review, and quantitative performance metrics analysis across all four joint modules.",
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                >
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {item.step}
                  </span>
                  <h3 className="mt-2 font-semibold text-gray-800">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Technology Layers */}
            <div>
              <p className="text-sm font-semibold text-gray-700 px-1 mb-3">Technology Stack — Multi-Layer Architecture:</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {techLayers.map((layer, i) => (
                  <motion.div
                    key={layer.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                    className={`rounded-2xl p-5 border ${layer.bgClass} ${layer.borderClass}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${layer.colorClass} flex items-center justify-center mb-3`}>
                      <layer.Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-2">{layer.title}</h4>
                    <ul className="space-y-1">
                      {layer.items.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Section>

      </main>

      <Footer />
    </div>
  );
}
