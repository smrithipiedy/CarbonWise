import { CATS } from './ComparisonCard';
import { parseActionText } from '../lib/parseActionText';
import type { AIInsightResponse, FootprintResponse } from '../services/api';

interface InsightsPanelProps {
  insights: AIInsightResponse | null;
  summary: FootprintResponse;
  insightsLoading?: boolean;
  insightsError?: string | null;
  onRetry?: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Good: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Bad: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export default function InsightsPanel({
  insights,
  summary,
  insightsLoading = false,
  insightsError = null,
  onRetry,
}: InsightsPanelProps) {
  if (insightsError && !insightsLoading) {
    return (
      <section className="card p-6 h-full flex flex-col" aria-labelledby="ins-error-title" role="alert">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" aria-hidden="true">💡</span>
          <h2 id="ins-error-title" className="text-xl font-extrabold text-slate-900">Personalized Insights</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-4" aria-hidden="true">
            ⚠️
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm mb-6">{insightsError}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-5 py-2.5 rounded-lg bg-eco-600 hover:bg-eco-500 text-white font-bold text-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
            >
              Retry AI insights
            </button>
          )}
        </div>
      </section>
    );
  }

  if (!insights || insightsLoading) {
    return (
      <section className="card p-6 h-full flex flex-col animate-pulse" aria-labelledby="ins-loading-title" aria-busy="true">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">💡</span>
            <h2 id="ins-loading-title" className="text-xl font-extrabold text-slate-900">Personalized Insights</h2>
          </div>
          <span className="badge bg-slate-100 text-slate-400 px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
            {insightsLoading ? 'Connecting to Gemini…' : 'Analyzing…'}
          </span>
        </div>
        <div className="p-4 bg-slate-200/60 rounded-xl mb-6 shrink-0 h-20" />
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 shrink-0">Targeted Reduction Plan</h3>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden">
          <div className="h-36 bg-slate-100 rounded-xl" />
          <div className="h-36 bg-slate-100 rounded-xl" />
          <div className="h-36 bg-slate-100 rounded-xl" />
          <div className="h-36 bg-slate-100 rounded-xl" />
        </div>
      </section>
    );
  }

  const recommendations = insights.recommendations ?? [];

  return (
    <section className="card p-6 h-full flex flex-col animate-fade-in-up" aria-labelledby="ins-title" role="status">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">💡</span>
          <h2 id="ins-title" className="text-xl font-extrabold text-slate-900">Personalized Insights</h2>
        </div>
        <span className="badge badge-ai px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
          {insights.source === 'gemini' ? 'AI-personalized' : 'AI-based review'}
        </span>
      </div>

      <div className="p-5 rounded-xl bg-gradient-to-r from-eco-50/50 to-emerald-50/20 border border-eco-100 mb-6 shrink-0">
        <p className="text-sm font-bold text-eco-700 uppercase tracking-widest mb-2">Coach Summary</p>
        <p className="text-base text-slate-700 leading-relaxed font-medium">
          {insights.summary ||
            `Your annual emissions are ${summary.totalEmission.toLocaleString()} kg CO₂e. Here are targeted actions to bring you closer to the 2-tonne sustainable target.`}
        </p>
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5 shrink-0">Targeted Reduction Plan</h3>

      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label="Reduction recommendations">
          {recommendations.map((act, i) => {
            const categoryKey =
              act.category === 'transportation' ? 'transport' : act.category === 'energy' ? 'home' : act.category;
            const cat = CATS[categoryKey];
            const saving = act.estimated_annual_savings_kg ?? 0;

            const catIcon = cat?.icon ?? '🌱';
            const catColor = cat?.color ?? '#10b981';
            const catName = cat?.name ?? categoryKey;

            const { heading, status, details } = parseActionText(act.action);
            const style = STATUS_STYLES[status] ?? STATUS_STYLES.Moderate;

            return (
              <article
                key={`${categoryKey}-${i}`}
                role="listitem"
                className="p-5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${catColor}12`, color: catColor }}
                    >
                      <span aria-hidden="true">{catIcon}</span>
                      <span className="uppercase tracking-wider text-[10px]">{catName}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
                      {status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-800 mb-2">{heading}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{details}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Annual Saving</span>
                  <span className="inline-flex items-center text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    -{saving.toLocaleString()} kg
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
