import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarbonStore } from '../store/useCarbonStore';
import { PARIS_SUSTAINABLE_ANNUAL_TARGET, GLOBAL_AVERAGE_ANNUAL } from '@carbonwise/shared';

import ComparisonCard, { CATS } from '../components/ComparisonCard';
import HistoryLog from '../components/HistoryLog';
import InsightsPanel from '../components/InsightsPanel';

export default function ResultsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const summary = useCarbonStore((state) => state.summary);
  const insights = useCarbonStore((state) => state.insights);
  const history = useCarbonStore((state) => state.history);
  const saved = useCarbonStore((state) => state.saved);
  const error = useCarbonStore((state) => state.error);
  const hasCalculatedThisSession = useCarbonStore((state) => state.hasCalculatedThisSession);
  const insightsLoading = useCarbonStore((state) => state.insightsLoading);
  const insightsError = useCarbonStore((state) => state.insightsError);
  const selectedEntryId = useCarbonStore((state) => state.selectedEntryId);
  const saveToHistory = useCarbonStore((state) => state.saveToHistory);
  const selectHistoryEntry = useCarbonStore((state) => state.selectHistoryEntry);
  const retryInsights = useCarbonStore((state) => state.retryInsights);

  /* ── 1. Check if opened freshly/directly without session calculation ── */
  if (!hasCalculatedThisSession) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Carbon Dashboard</h1>
          <p className="text-slate-500 mt-2">Track your saved calculations and monitor emissions trends over time.</p>
        </header>

        {history.length === 0 ? (
          <div className="card p-12 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-eco-50 mx-auto mb-5 flex items-center justify-center text-3xl">🌿</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No calculations recorded yet</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Complete a carbon footprint calculation to start tracking your environmental impact.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl bg-eco-600 hover:bg-eco-500 text-white font-bold text-sm transition-all cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
            >
              Start one now
            </button>
          </div>
        ) : (
          <div className="w-full">
            <HistoryLog 
              history={history} 
              summary={summary} 
              selectedEntryId={selectedEntryId}
              selectHistoryEntry={selectHistoryEntry} 
            />
          </div>
        )}
      </main>
    );
  }

  /* ── 2. Check if calculation has error or empty ── */
  if (error || !summary) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 animate-fade-in">
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-eco-50 mx-auto mb-5 flex items-center justify-center text-3xl">🌿</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">No footprint calculated yet</h1>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Enter your daily habits in the calculator to see a detailed breakdown of your carbon emissions.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-lg bg-eco-600 hover:bg-eco-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
          >
            Go to Calculator
          </button>
        </div>
      </main>
    );
  }

  const SUSTAINABLE_TARGET_TONNES = PARIS_SUSTAINABLE_ANNUAL_TARGET / 1000;
  const GLOBAL_AVG_TONNES = GLOBAL_AVERAGE_ANNUAL / 1000;
  const totalTonnes = summary.totalEmission / 1000;
  const targetX = (totalTonnes / SUSTAINABLE_TARGET_TONNES).toFixed(1);
  const avgX = (totalTonnes / GLOBAL_AVG_TONNES).toFixed(1);
  const footprintLevel =
    totalTonnes <= SUSTAINABLE_TARGET_TONNES ? 'Within sustainable target' : totalTonnes <= GLOBAL_AVG_TONNES ? 'Above sustainable target' : 'Well above global average';

  const categories = Object.keys(CATS).map((key) => {
    const cat = CATS[key];
    const val = summary.breakdown[key] || 0;
    return {
      key,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      value: val,
      pct: summary.totalEmission > 0 ? (val / summary.totalEmission) * 100 : 0
    };
  });

  const sortedCategories = [...categories].sort((a, b) => b.value - a.value);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-in" aria-labelledby="res-title">
      <h1 id="res-title" className="sr-only">Carbon Footprint Results</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* ─── Left Column: Numerical Metrics, Charts, Log ─── */}
        <div className="space-y-6 flex flex-col justify-start">
          
          {/* Total Footprint Hero Card & Comparison Benchmarks */}
          <section className="card-gradient-border p-6 sm:p-8 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your annual footprint</h2>
            <div id="footprint-hero" className={`stat-value text-5xl sm:text-6xl font-extrabold tracking-tight animate-count-up ${
                  totalTonnes <= SUSTAINABLE_TARGET_TONNES ? 'text-emerald-500' : totalTonnes <= GLOBAL_AVG_TONNES ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {totalTonnes.toFixed(2)}
                  <span className="text-2xl sm:text-3xl ml-1 font-bold text-slate-800">t CO₂e</span>
                </div>
                <p className="sr-only">{footprintLevel}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">per year</p>
                <div className="separator my-4" />
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  That is <strong className="text-slate-800">{targetX}×</strong> the sustainable target ({SUSTAINABLE_TARGET_TONNES} t) and{' '}
                  <strong className="text-slate-800">{avgX}×</strong> the global average ({GLOBAL_AVG_TONNES} t).
                </p>
              </div>

              {/* Comparison component refactored out for modularity */}
              <ComparisonCard totalTonnes={totalTonnes} />
            </div>
          </section>

          {/* Emissions Breakdown Card */}
          <section className="card p-6 sm:p-8 animate-fade-in-up delay-100">
            <h2 className="text-lg font-extrabold text-slate-900 mb-5">Emissions Breakdown</h2>
            <div className="space-y-4" role="list">
              {sortedCategories.map((c) => (
                <div key={c.key} role="listitem" className="flex items-center gap-3 group">
                  <div className="w-28 sm:w-32 shrink-0 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform duration-200" aria-hidden="true">
                      {c.icon}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                  </div>
                  <div className="flex-1 progress-track h-2.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(c.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name}: ${Math.round(c.pct)} percent of total emissions`} aria-valuetext={`${Math.round(c.pct)} percent`}>
                    <div 
                      className="progress-fill h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${Math.max(3, c.pct)}%`, 
                        backgroundColor: c.color 
                      }} 
                    />
                  </div>
                  <div className="w-24 sm:w-28 shrink-0 flex items-center justify-end gap-2 text-right">
                    <span className="text-xs font-extrabold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md">
                      {Math.round(c.pct)}%
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {c.value.toLocaleString()} <span className="text-xs text-slate-500 font-medium">kg</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {hasCalculatedThisSession && !saved && (
            <button
              onClick={saveToHistory}
              className="w-full px-6 py-4 rounded-xl bg-eco-600 hover:bg-eco-500 text-white font-bold text-base transition-all shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2 animate-fade-in-up"
            >
              Save Current Entry
            </button>
          )}
          {hasCalculatedThisSession && saved && (
            <div className="w-full px-6 py-4 rounded-xl bg-eco-50 border border-eco-200 text-eco-700 font-bold text-base text-center animate-fade-in-up flex items-center justify-center gap-2">
              <span className="w-5 h-5 rounded-full bg-eco-200 text-eco-700 flex items-center justify-center text-xs">✓</span>
              Saved
            </div>
          )}

          {/* History Component refactored out for modularity */}
          <HistoryLog 
            history={history} 
            summary={summary} 
            selectedEntryId={selectedEntryId}
            selectHistoryEntry={selectHistoryEntry} 
          />
        </div>

        {/* ─── Right Column: Personalized Insights ─── */}
        <div className="lg:col-span-1 min-h-0">
          <InsightsPanel
            insights={insights}
            summary={summary}
            insightsLoading={insightsLoading}
            insightsError={insightsError}
            onRetry={() => void retryInsights()}
          />
        </div>

      </div>
    </main>
  );
}
