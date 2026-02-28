import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MutualTransfer from "@/components/MutualTransfer";

export default function MutualTransferPage() {
  return (
    <main className="min-h-screen bg-white selection:bg-primary selection:text-white">
      <Navbar />
      <MutualTransfer />
      <Footer />
    </main>
  );
}
