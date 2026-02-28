"use client";

import { 
  Video, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  PlayCircle, 
  Eye, 
  Calendar 
} from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Total Videos", value: "24", icon: Video, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Testimonials", value: "12", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
  { label: "Total Views", value: "1.2k", icon: Eye, color: "text-green-600", bg: "bg-green-50" },
  { label: "Active Features", value: "3", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 px-2 lg:px-0">
            Welcome back, Admin! 👋
          </h2>
          <p className="text-gray-600 px-2 lg:px-0">
            Here&apos;s what&apos;s happening with your platform today.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/videos" className="btn-primary py-3 px-6 flex items-center gap-2 text-sm">
            <Video size={18} />
            Manage Videos
          </Link>
          <Link href="/admin/testimonials" className="btn-outline py-3 px-6 flex items-center gap-2 text-sm border-gray-200">
            <MessageSquare size={18} />
            Edit Testimonials
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Videos */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Videos</h3>
            <Link href="/admin/videos" className="text-primary text-sm font-bold hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors group">
                <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                   <PlayCircle className="text-gray-400 group-hover:text-primary transition-colors z-10" />
                   <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 line-clamp-1">Product Demo - Feature {i}</p>
                  <p className="text-xs text-gray-500">Video Conferencing • 2.4 MB • 2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Testimonials */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Testimonials</h3>
            <Link href="/admin/testimonials" className="text-primary text-sm font-bold hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold shrink-0">
                  {["A", "M", "S"][i-1]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{["Alex", "Maria", "Sam"][i-1]}</p>
                    <span className="text-[10px] bg-green-50 text-success px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 italic">
                    &quot;{["Great platform!", "Saves me so much time.", "The best LMS I have used."][i-1]}&quot;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
