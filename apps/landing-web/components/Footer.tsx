import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#0a1128] text-white pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6 lg:mb-8">
              <div className="flex items-center justify-center">
                <Image
                  src="/assets/learnapplogo.png"
                  width={24}
                  height={24}
                  alt="Learn App"
                  className=""
                />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Learn app
              </span>
            </div>
            <p className="text-blue-50/60 w-full mb-8 max-w-sm mx-auto md:mx-0 leading-relaxed">
              Empowering education through innovative technology. Transform your
              institution with our comprehensive learning management system.
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              {[
                { name: "facebook", icon: "/assets/facebook.svg",width: 10, height: 16 },
                { name: "twitter", icon: "/assets/twitter.svg", width: 16, height: 16 },
                { name: "linkedin", icon: "/assets/linkedin.svg", width: 14, height: 16 },
                { name: "instagram", icon: "/assets/instagram.png", width: 14, height: 16 },
                { name: "youtube", icon: "/assets/youtube.svg", width: 18, height: 16 },
              ].map((social) => (
                <Link
                  key={social.name}
                  href="#"
                  className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-primary transition-colors border border-white/10"
                >
                  <Image
                    src={social.icon}
                    width={social.width || 20}
                    height={social.height || 20}
                    alt={`${social.name} icon`}
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Solutions Column */}
          <div className="md:col-span-2 md:col-start-6 text-center md:text-left">
            <h4 className="text-lg text-white font-bold mb-6 lg:mb-8">
              Solutions
            </h4>
            <ul className="space-y-4 text-blue-50/60 font-medium">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  For Schools
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  For Teachers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  For Students
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  For Parents
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Enterprise
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="md:col-span-2 md:col-start-9 text-center md:text-left">
            <h4 className="text-lg text-white font-bold mb-6 lg:mb-8">
              Resources
            </h4>
            <ul className="space-y-4 text-blue-50/60 font-medium">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Video Tutorials
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="md:col-span-2 md:col-start-11 text-center md:text-left">
            <h4 className="text-lg text-white font-bold mb-6 lg:mb-8">
              Company
            </h4>
            <ul className="space-y-4 text-blue-50/60 font-medium">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Press Kit
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-blue-50/40 font-medium">
          <p className="order-2 sm:order-1">
            © 2026 EduPlatform. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 order-1 sm:order-2">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/accessibility"
              className="hover:text-white transition-colors"
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
