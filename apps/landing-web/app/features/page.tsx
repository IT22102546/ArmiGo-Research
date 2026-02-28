import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Features from "@/components/Features";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col selection:bg-primary selection:text-white pt-20">
      <Navbar />
      <Features />
      <Footer />
    </main>
  );
}
