"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Video, 
  Upload, 
  Trash2, 
  Play, 
  Clock, 
  HardDrive, 
  Filter, 
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  url: string;
  category: string;
  size: string;
  uploadedAt: string;
}

const categories = [
  "Video Conferencing",
  "Exam Features",
  "Mutual Transfer",
  "Other"
];

export default function VideoArchivePage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState("All");

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/videos");
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File size exceeds 100MB limit");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("category", category);

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setVideos([data.video, ...videos]);
        setShowUploadModal(false);
        resetForm();
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setVideos(videos.filter(v => v.id !== id));
      }
    } catch (err) {
      alert("Failed to delete video");
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory(categories[0]);
    setFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredVideos = filter === "All" 
    ? videos 
    : videos.filter(v => v.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Archive</h2>
          <p className="text-gray-500 text-sm">Upload and manage feature demonstration videos.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Upload New Video
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter size={16} className="text-gray-400 shrink-0" />
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === cat 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-500 font-medium">Loading archive...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video size={40} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">
            {filter === "All" 
              ? "You haven't uploaded any videos yet." 
              : `No videos found in the "${filter}" category.`}
          </p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn-outline border-gray-200"
          >
            Upload your first video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center">
                <video 
                  src={video.url} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-xl hover:scale-110 transition-transform"
                   >
                     <Play size={20} fill="currentColor" />
                   </a>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-primary uppercase tracking-wider shadow-sm">
                    {video.category}
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(video.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-gray-900 mb-4 line-clamp-1">{video.title}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <HardDrive size={14} />
                    {video.size}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {new Date(video.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !uploading && setShowUploadModal(false)} />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-70 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 font-inter">Upload Video</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl flex gap-3">
                  <AlertCircle className="text-red-400 shrink-0" size={20} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Video Title</label>
                <input 
                  type="text"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-inter"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-gray-700 font-inter appearance-none bg-no-repeat bg-[right_1.25rem_center] bg-[length:1em_1em]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Video File (Max 100MB)</label>
                <div 
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${
                    file ? "border-success bg-success/5" : "border-gray-200 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-900 font-inter line-clamp-1">{file.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB • Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-900 font-inter">Click to browse or drag and drop</p>
                      <p className="text-xs text-gray-500 font-medium">MP4, WebM, or Ogg formats</p>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed group transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                    Upload Video
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
