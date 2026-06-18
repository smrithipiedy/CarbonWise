const CATS: Record<string, { name: string; icon: string; color: string }> = {
  transport: { name: 'Transport', icon: '🚗', color: '#10b981' },
  home: { name: 'Home energy', icon: '⚡', color: '#3b82f6' },
  diet: { name: 'Diet', icon: '🍳', color: '#f59e0b' },
  consumption: { name: 'Goods & waste', icon: '🛍️', color: '#8b5cf6' }
};

interface ComparisonCardProps {
  totalTonnes: number;
}

/**
 * ComparisonCard — visual comparison of user's footprint against
 * the Paris Sustainable Target (2.0 t) and the Global Average (4.8 t).
 */
export default function ComparisonCard({ totalTonnes }: ComparisonCardProps) {
  const pctTarget = Math.round((totalTonnes / 2.0) * 100);
  const pctGlobal = Math.round((totalTonnes / 4.8) * 100);

  return (
    <div className="flex flex-col gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-5 sm:pt-0 sm:pl-6">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden="true"></span> Global Context
      </h3>

      {/* Sustainable Target Card */}
      <div
        className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${totalTonnes <= 2.0 ? 'bg-emerald-50/50 border-emerald-100 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]' : 'bg-amber-50/50 border-amber-100 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)]'}`}
        role="meter"
        aria-valuenow={totalTonnes}
        aria-valuemin={0}
        aria-valuemax={2}
        aria-label="Your emissions vs. sustainable target"
      >
        <div className="flex justify-between items-end mb-3 relative z-10">
          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Sustainable Target</span>
            <span className="text-base font-extrabold text-slate-800">2.0 <span className="text-[10px] text-slate-600 font-semibold">t CO₂e</span></span>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${totalTonnes <= 2.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {totalTonnes <= 2.0 ? '🎉 Goal Met' : `${(totalTonnes / 2.0).toFixed(1)}x Over`}
            </span>
          </div>
        </div>
        <div className="progress-track h-2.5 bg-white/60 rounded-full overflow-hidden relative z-10">
          <div
            className="progress-fill h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min(100, pctTarget)}%`,
              background: totalTonnes <= 2.0 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
            }}
          />
        </div>
      </div>

      {/* Global Average Card */}
      <div
        className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${totalTonnes <= 4.8 ? 'bg-emerald-50/50 border-emerald-100 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]' : 'bg-rose-50/50 border-rose-100 shadow-[0_4px_20px_-4px_rgba(243,68,68,0.1)]'}`}
        role="meter"
        aria-valuenow={totalTonnes}
        aria-valuemin={0}
        aria-valuemax={4.8}
        aria-label="Your emissions vs. global average"
      >
        <div className="flex justify-between items-end mb-3 relative z-10">
          <div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Global Average</span>
            <span className="text-base font-extrabold text-slate-800">4.8 <span className="text-[10px] text-slate-600 font-semibold">t CO₂e</span></span>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${totalTonnes <= 4.8 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {totalTonnes <= 4.8 ? 'Below Avg' : `${(totalTonnes / 4.8).toFixed(1)}x Avg`}
            </span>
          </div>
        </div>
        <div className="progress-track h-2.5 bg-white/60 rounded-full overflow-hidden relative z-10">
          <div
            className="progress-fill h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min(100, pctGlobal)}%`,
              background: totalTonnes <= 4.8 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export { CATS };
