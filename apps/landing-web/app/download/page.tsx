import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DownloadHero from "@/components/download/DownloadHero";
import DeviceExperience from "@/components/download/DeviceExperience";
import SystemRequirements from "@/components/download/SystemRequirements";
import QRCodeDownload from "@/components/download/QRCodeDownload";
import ReadyToLearnCTA from "@/components/download/ReadyToLearnCTA";

export default function DownloadPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="min-h-screen bg-white ">
        <div className="pt-20">
          {/* Offset for fixed navbar */}
          <DownloadHero />
          <DeviceExperience />
          <SystemRequirements />
          <QRCodeDownload />
          <ReadyToLearnCTA />
        </div>
      </main>
      <Footer />
    </div>
  );
}
