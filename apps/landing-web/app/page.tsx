import Navbar from "@/components/Navbar";
import HomeSection from "@/components/Home";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <HomeSection />
      <Footer />
    </div>
  );
}
