"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Video, MessageSquare, LogOut, Menu, X } from "lucide-react";

const sidebarItems = [
  { name: "Video Archive", href: "/admin/videos", icon: Video },
  { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuth =
    typeof document !== "undefined" &&
    document.cookie.includes("admin_session=true");

  useEffect(() => {
    if (!isAuth && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [pathname, router, isAuth]);

  const handleLogout = () => {
    document.cookie =
      "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuth && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Fixed Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between">
          {/* Left: Mobile Toggle + Logo */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link href="/admin/videos" className="flex items-center gap-3">
              <Image
                src="/assets/learnapplogo.png"
                alt="LearnApp"
                width={36}
                height={36}
                className="rounded-xl"
              />
              <div className="hidden sm:block">
                <span className="font-bold text-lg text-gray-900">
                  LearnApp
                </span>
              </div>
            </Link>
          </div>

          {/* Right: User & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 pr-3 border-r border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Below Header */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Label */}
          <div className="px-4 pt-6 pb-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 space-y-1">
            {sidebarItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={active ? "text-white" : "text-gray-400"}
                  />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500">LearnApp Admin Panel</p>
              <p className="text-[10px] text-gray-400 mt-1">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
