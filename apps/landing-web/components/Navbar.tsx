"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Heart, Activity } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Programs", href: "/programs" },
    { name: "Success Stories", href: "/stories" },
    { name: "For Parents", href: "/parents" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-15">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg sm:text-xl md:text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                ArmiGo
              </span>
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-400 fill-current animate-pulse" />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center md:gap-4 lg:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium transition-all whitespace-nowrap md:text-sm lg:text-base relative group ${
                  pathname === link.href
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
                  pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                }`}></span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center md:gap-3 lg:gap-4">
            <Link
              href="/resources"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors md:text-sm lg:text-base whitespace-nowrap"
            >
              Resources
            </Link>
            <Link
              href="/assessment"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 lg:px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 whitespace-nowrap"
            >
              Free Assessment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2 sm:gap-3">
            <Link
              href="/assessment"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium hover:shadow-md transition-all whitespace-nowrap"
            >
              Assessment
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="container-custom py-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block py-3 px-4 rounded-xl font-medium transition-all ${
                  pathname === link.href
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-blue-500"
                    : "text-gray-600 hover:bg-blue-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Additional mobile menu items */}
            <div className="pt-4 border-t border-blue-100 flex flex-col gap-3">
              <Link
                href="/resources"
                onClick={() => setIsOpen(false)}
                className="block py-3 px-4 text-center text-gray-600 font-medium hover:bg-blue-50 rounded-xl"
              >
                Resources
              </Link>
              <Link
                href="/support"
                onClick={() => setIsOpen(false)}
                className="block py-3 px-4 text-center text-gray-600 font-medium hover:bg-blue-50 rounded-xl"
              >
                Support Groups
              </Link>
            </div>
            
            {/* Kid-friendly decorative elements */}
            <div className="flex justify-center gap-2 pt-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Accessibility feature: font size indicator for kids */}
      <div className="absolute bottom-1 right-4 text-xs text-gray-400 hidden md:block">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Kid-Friendly Mode
        </span>
      </div>
    </nav>
  );
};

export default Navbar;