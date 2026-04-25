"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Section } from "@/components/shared/Section";
import { motion } from "framer-motion";
import {
  BookOpen,
  AlertCircle,
  Target,
  FlaskConical,
  Cpu,
  Search,
} from "lucide-react";

const objectives = [
  "Develop IoT-based wearable devices to support upper-limb rehabilitation for hemiplegic children aged 6–14.",
  "Design engaging VR games that motivate children to perform repetitive therapeutic exercises.",
  "Provide a real-time progress monitoring dashboard for parents and hospital staff.",
  "Integrate machine learning to personalise therapy difficulty based on patient performance.",
  "Reduce reliance on in-clinic sessions by enabling effective home-based rehabilitation.",
];

const technologies = [
  "React Native", "Next.js", "NestJS", "Unity 3D", "Arduino",
  "ESP32", "TensorFlow Lite", "PostgreSQL", "Prisma ORM",
  "WebSocket", "AWS S3", "Docker",
];

export default function DomainPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-purple-50/30">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-10 text-center px-4">
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
            Understanding the research landscape, problem space, and technical approach behind ArmiGo.
          </p>
        </motion.div>
      </section>

      <main className="flex-1 container-custom pb-20 space-y-4">

        {/* Literature Review */}
        <Section title="Literature Review" subtitle="What existing research says about pediatric rehabilitation" accent>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3 text-gray-600 leading-relaxed">
            <p>
              Hemiplegia in children — often resulting from perinatal stroke or cerebral palsy — affects 1 in 1,000 live births. Conventional therapy relies on repetitive physical exercises under clinical supervision, which is resource-intensive and difficult to sustain long-term.
            </p>
            <p>
              Recent literature highlights the effectiveness of technology-assisted rehabilitation. Studies on constraint-induced movement therapy (CIMT) and robot-assisted therapy show statistically significant improvements in motor function. VR-based approaches show comparable outcomes with higher patient engagement and adherence rates, particularly among younger populations.
            </p>
            <p>
              IoT-enabled wearables allow continuous remote monitoring, closing the feedback loop between patients and clinicians. However, most existing solutions target adult populations and are cost-prohibitive for widespread adoption in developing regions.
            </p>
          </div>
        </Section>

        {/* Research Gap */}
        <Section title="Research Gap" accent>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex gap-4 items-start">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="text-gray-600 leading-relaxed space-y-2">
                <p>
                  Existing rehabilitation technologies fail to address the paediatric context holistically. Key gaps identified include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Lack of age-appropriate, gamified therapy solutions for children under 14.</li>
                  <li>Absence of affordable IoT wearables designed for small limb profiles.</li>
                  <li>No unified platform connecting the child, parent, and clinician in real time.</li>
                  <li>Limited adaptive difficulty systems that personalise therapy intensity.</li>
                  <li>Insufficient solutions suitable for low-resource healthcare settings.</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Research Problem */}
        <Section title="Research Problem" accent>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 text-gray-700 leading-relaxed text-base italic">
            "How can an integrated IoT and VR platform improve upper-limb motor rehabilitation outcomes for hemiplegic children aged 6–14, while maintaining engagement and enabling remote monitoring by caregivers and clinicians?"
          </div>
        </Section>

        {/* Objectives */}
        <Section title="Research Objectives" accent>
          <div className="grid gap-3">
            {objectives.map((obj, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="flex gap-4 items-start bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
              >
                <span className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-gray-600 text-sm leading-relaxed">{obj}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Methodology */}
        <Section title="Methodology" accent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Requirement Analysis", desc: "Clinician interviews, literature synthesis, and patient family surveys to define functional and non-functional requirements." },
              { step: "02", title: "Iterative Design & Build", desc: "Agile sprints covering hardware prototyping, game development, backend APIs, and mobile/web dashboards." },
              { step: "03", title: "Evaluation & Validation", desc: "Usability testing with target users, clinical expert review, and quantitative performance metrics analysis." },
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
        </Section>

        {/* Technologies */}
        <Section title="Technologies Used" accent>
          <div className="flex flex-wrap gap-3">
            {technologies.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 text-blue-700 rounded-full text-sm font-medium hover:from-blue-100 hover:to-purple-100 transition-colors cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </Section>

      </main>

      <Footer />
    </div>
  );
}
