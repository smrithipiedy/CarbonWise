import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { HistoryEntry, FootprintResponse } from '../services/api';

interface HistoryLogProps {
  history: HistoryEntry[];
  summary: FootprintResponse | null;
  selectedEntryId: string | null;
  selectHistoryEntry: (entry: HistoryEntry) => void;
}

export default function HistoryLog({
  history,
  summary,
  selectedEntryId,
  selectHistoryEntry,
}: HistoryLogProps) {
  let trendText: { text: string; positive: boolean } | null = null;
  if (history.length > 1) {
    const current = history[0].totalEmission / 1000;
    const prev = history[1].totalEmission / 1000;
    const diff = current - prev;
    if (diff < 0) {
      trendText = { text: `↓ ${Math.abs(diff).toFixed(2)} t less than your last entry`, positive: true };
    } else if (diff > 0) {
      trendText = { text: `↑ ${diff.toFixed(2)} t more than your last entry`, positive: false };
    } else {
      trendText = { text: 'No change since your last entry', positive: true };
    }
  }

  const trendData = [...history]
    .reverse()
    .map((h) => ({
      id: h.id,
      date: new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      emissions: Number((h.totalEmission / 1000).toFixed(2)),
    }));

  return (
    <section className="card p-6 animate-fade-in-up" aria-labelledby="history-title">
      <div className="flex items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 id="history-title" className="text-base font-bold text-slate-900">Your history</h2>
          <span className="badge badge-eco">{history.length} entries</span>
        </div>
      </div>

      {trendText && (
        <p className={`text-sm font-semibold mb-4 ${trendText.positive ? 'text-eco-600' : 'text-rose-600'}`} role="status">
          {trendText.text}
        </p>
      )}

      {trendData.length > 1 && (
        <>
          <div className="h-[200px] mb-4 -mx-2 animate-fade-in" role="img" aria-label="Emissions trend line chart">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit=" t" />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                  }}
                  formatter={(v: number) => [`${v} t CO₂e`, 'Emissions']}
                />
                <Area
                  type="monotone"
                  dataKey="emissions"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#grad)"
                  dot={{ r: 3.5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <table className="sr-only">
            <caption>Emissions history data</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Emissions (tonnes CO₂e)</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.emissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1" role="list" aria-label="History entries">
        {history.map((entry) => {
          const isSelected = selectedEntryId
            ? entry.id === selectedEntryId
            : summary !== null && Math.abs(summary.totalEmission - entry.totalEmission) < 0.01;

          return (
            <button
              key={entry.id}
              onClick={() => selectHistoryEntry(entry)}
              role="listitem"
              aria-current={isSelected ? 'true' : undefined}
              aria-label={`View calculation from ${new Date(entry.date).toLocaleString()} — ${(entry.totalEmission / 1000).toFixed(2)} tonnes`}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2 ${
                isSelected ? 'bg-eco-50/50 border-eco-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isSelected && <span className="text-eco-600 font-bold text-xs" aria-hidden="true">➔</span>}
                <span className="text-sm font-semibold text-slate-700">
                  {new Date(entry.date).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <span className="text-sm font-extrabold text-slate-800">{(entry.totalEmission / 1000).toFixed(2)} t</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
