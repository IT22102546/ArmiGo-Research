import { useEffect, useState } from 'react';
import { BookOpen, Calendar, Download, FileText, Search, Filter, Eye } from 'lucide-react';
import { apiFetch } from '../utils/api';

const extractData = (p: any) => p?.success && p?.data ? p.data : p;

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:5000/uploads';

export default function Publications() {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/v1/publications', { method: 'GET' });
        if (res.ok) {
          const json = await res.json();
          const data = extractData(json);
          // Backend returns { publications: [...], pagination: {...} }
          const list = data?.publications || data?.items || (Array.isArray(data) ? data : []);
          setPublications(list);
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const resolveFileUrl = (pub: any) => {
    if (pub.fileUrl) {
      if (pub.fileUrl.startsWith('http')) return pub.fileUrl;
      return `${STORAGE_URL}/${pub.fileUrl}`;
    }
    return null;
  };

  const resolveThumbnail = (pub: any) => {
    const url = pub.thumbnailUrl || pub.imageUrl || pub.coverImage;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${STORAGE_URL}/${url}`;
  };

  const filtered = publications.filter((pub) =>
    !searchQuery || pub.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="mb-8">
          <div className="h-8 w-48 shimmer rounded-lg mb-2" />
          <div className="h-4 w-72 shimmer rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100">
              <div className="h-44 shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 shimmer rounded" />
                <div className="h-4 w-1/2 shimmer rounded" />
                <div className="h-3 w-full shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Publications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {publications.length > 0 ? `${publications.length} educational resources available` : 'Browse educational materials and resources'}
          </p>
        </div>
        {publications.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search publications..."
              className="pl-9 pr-4 py-2.5 w-64 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center card-shadow-lg border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center mx-auto mb-5">
            <BookOpen size={36} className="text-purple-500" />
          </div>
          <p className="text-xl font-semibold text-slate-800">
            {searchQuery ? 'No results found' : 'No publications yet'}
          </p>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search terms' : 'Educational materials and resources will appear here when available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((pub: any) => {
            const thumbnail = resolveThumbnail(pub);
            const fileUrl = resolveFileUrl(pub);
            return (
              <div key={pub.id} className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100 hover-lift group">
                {/* Thumbnail or gradient placeholder */}
                <div className="h-44 relative overflow-hidden">
                  {thumbnail ? (
                    <img src={thumbnail} alt={pub.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full gradient-purple flex items-center justify-center">
                      <BookOpen size={48} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {pub.status && (
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full backdrop-blur-sm ${
                        pub.status === 'PUBLISHED' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
                      }`}>
                        {pub.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{pub.title}</p>
                      {(pub.author || pub.createdBy?.name) && (
                        <p className="text-xs text-slate-400 mt-1">by {pub.author || pub.createdBy?.name}</p>
                      )}
                    </div>
                  </div>

                  {pub.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{pub.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={12} />
                      <span className="text-[11px]">{pub.createdAt ? new Date(pub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                    {fileUrl && (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        <Download size={12} />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
