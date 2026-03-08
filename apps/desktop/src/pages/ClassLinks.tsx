import { Link2 } from 'lucide-react';

export default function ClassLinks() {
  return (
    <div className="flex-1 overflow-y-auto p-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Class Links</h1>
        <p className="text-sm text-slate-500 mt-1">Access your online class links</p>
      </div>
      <div className="bg-white rounded-2xl p-16 text-center card-shadow-lg border border-slate-100">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 flex items-center justify-center mx-auto mb-5">
          <Link2 size={36} className="text-cyan-500" />
        </div>
        <p className="text-xl font-semibold text-slate-800">No class links available</p>
        <p className="text-sm text-slate-400 mt-2">Your class links will appear here when added</p>
      </div>
    </div>
  );
}
