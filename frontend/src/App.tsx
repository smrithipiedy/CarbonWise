import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useCarbonStore } from './store/useCarbonStore';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-eco-600 focus:text-white focus:font-semibold focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

function BackendStatusBanner() {
  const backendOnline = useCarbonStore((state) => state.backendOnline);
  const geminiEnabled = useCarbonStore((state) => state.geminiEnabled);
  const checkBackend = useCarbonStore((state) => state.checkBackend);

  if (backendOnline !== false) return null;

  return (
    <div
      className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-center text-sm text-amber-900"
      role="status"
    >
      <p>
        <strong>Backend offline.</strong> AI insights require the API server on port 5000.{' '}
        Run <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">npm run dev</code> from the project root to start both servers.
      </p>
      <button
        type="button"
        onClick={() => void checkBackend()}
        className="mt-2 text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
      >
        Check connection again
      </button>
    </div>
  );
}

function GeminiStatusBanner() {
  const backendOnline = useCarbonStore((state) => state.backendOnline);
  const geminiEnabled = useCarbonStore((state) => state.geminiEnabled);

  if (backendOnline !== true || geminiEnabled !== false) return null;

  return (
    <div
      className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-center text-sm text-rose-800"
      role="status"
    >
      Gemini AI is not configured on the backend. Set <code className="bg-rose-100 px-1 rounded text-xs font-mono">GEMINI_API_KEY</code> in <code className="bg-rose-100 px-1 rounded text-xs font-mono">backend/.env</code>.
    </div>
  );
}

function AppRoutes() {
  const loadHistory = useCarbonStore((state) => state.loadHistory);
  const checkBackend = useCarbonStore((state) => state.checkBackend);

  useEffect(() => {
    void checkBackend().then((online) => {
      void loadHistory();
      if (online) {
        const { summary, insights, geminiEnabled, retryInsights } = useCarbonStore.getState();
        if (summary && geminiEnabled && insights?.source === 'rules') {
          void retryInsights();
        }
      }
    });
  }, [checkBackend, loadHistory]);

  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <BackendStatusBanner />
      <GeminiStatusBanner />
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-eco-500 border-t-transparent rounded-full"></div></div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="py-6 text-center text-sm text-slate-500" role="contentinfo">
        <p>© 2026 CarbonWise — Track your impact, change the world 🌿</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
