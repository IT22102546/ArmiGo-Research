"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Star,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Save,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  image: string;
  active: boolean;
  createdAt: string;
}

export default function TestimonialManagementPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState("/assets/testimonial-1.png");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/testimonials/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setImage(data.url);
      } else {
        setError(data.error || "Image upload failed");
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      const data = await res.json();
      setTestimonials(data);
    } catch (err) {
      console.error("Failed to fetch testimonials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !content) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      name,
      role,
      content,
      rating,
      image,
      id: editingItem?.id,
    };

    try {
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch("/api/admin/testimonials", {
        method,
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        if (editingItem) {
          setTestimonials(
            testimonials.map((t) =>
              t.id === data.testimonial.id ? data.testimonial : t
            )
          );
        } else {
          setTestimonials([...testimonials, data.testimonial]);
        }
        setShowModal(false);
        resetForm();
      } else {
        setError(data.error || "Operation failed");
      }
    } catch (err) {
      setError("Failed to save testimonial. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setTestimonials(testimonials.filter((t) => t.id !== id));
      }
    } catch (err) {
      alert("Failed to delete testimonial");
    }
  };

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PUT",
        body: JSON.stringify({ ...testimonial, active: !testimonial.active }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setTestimonials(
          testimonials.map((t) =>
            t.id === testimonial.id ? { ...t, active: !t.active } : t
          )
        );
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const openEditModal = (item: Testimonial) => {
    setEditingItem(item);
    setName(item.name);
    setRole(item.role);
    setContent(item.content);
    setRating(item.rating);
    setImage(item.image);
    setError("");
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setName("");
    setRole("");
    setContent("");
    setRating(5);
    setImage("/assets/testimonial-1.png");
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 px-2 lg:px-0">
            Testimonials
          </h2>
          <p className="text-gray-500 text-sm px-2 lg:px-0">
            Manage customer reviews displayed on the home page.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-500 font-medium">Loading testimonials...</p>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 px-2 lg:px-0">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={40} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No testimonials yet
          </h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">
            Add your first testimonial to showcase what your users think about
            your platform.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-outline border-gray-200"
          >
            Add first testimonial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`bg-white p-6 rounded-[2rem] shadow-sm border ${t.active ? "border-gray-100" : "border-gray-100 opacity-60"} hover:shadow-md transition-all relative group`}
            >
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 shrink-0">
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={64}
                    height={64}
                    className="rounded-2xl object-cover border-2 border-primary-light"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={`p-2 rounded-full transition-all ${
                          t.active
                            ? "text-success hover:bg-success/10"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={
                          t.active ? "Hide testimonial" : "Show testimonial"
                        }
                      >
                        {t.active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    {t.role}
                  </p>
                  <div className="flex text-yellow-400 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 italic leading-relaxed mb-4 line-clamp-3">
                    &quot;{t.content}&quot;
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400 font-medium">
                      Added {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleToggleActive(t)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        t.active
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      title={
                        t.active
                          ? "Click to hide from website"
                          : "Click to show on website"
                      }
                    >
                      {t.active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {t.active ? "Visible" : "Hidden"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Testimonial Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !saving && setShowModal(false)}
          />
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-70 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 font-inter">
                {editingItem ? "Edit Testimonial" : "Add Testimonial"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-8 space-y-5 overflow-y-auto max-h-[70vh]"
            >
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl flex gap-3">
                  <AlertCircle className="text-red-400 shrink-0" size={20} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Author Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-5 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-inter"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Author Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Principal, High School"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-inter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                    {image ? (
                      <Image
                        src={image}
                        alt="Profile preview"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User className="text-gray-300" size={32} />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload Image
                        </>
                      )}
                    </button>
                    <div className="relative">
                      <ImageIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="Or enter image path..."
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-inter"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 pl-2 italic">
                  Upload a profile picture (max 5MB) or use existing assets like
                  /assets/testimonial-1.png
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        rating >= s
                          ? "bg-yellow-400 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Star
                        size={18}
                        fill={rating >= s ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Review Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Share the feedback..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-inter resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed group transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save
                      size={20}
                      className="group-hover:scale-110 transition-transform"
                    />
                    {editingItem ? "Update Testimonial" : "Save Testimonial"}
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
