import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCalculatorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const calcSec = document.getElementById('calculator-section');
      if (calcSec) {
        calcSec.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const calcSec = document.getElementById('calculator-section');
        if (calcSec) {
          calcSec.scrollIntoView({ behavior: 'smooth' });
        }
      }, 80);
    }
  };

  return (
    <nav className="sticky top-0 z-50 px-6 py-3.5 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]" role="navigation" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="CarbonWise Home">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-eco-500 to-eco-600 flex items-center justify-center shadow-sm shadow-eco-500/20 group-hover:shadow-md group-hover:shadow-eco-500/30 transition-all">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Carbon<span className="text-eco-600">Wise</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2" role="navigation" aria-label="Site pages">
          <a
            href="#calculator-section"
            onClick={handleCalculatorClick}
            aria-current={location.pathname === '/' ? 'page' : undefined}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
          >
            Calculator
          </a>
          <Link
            to="/results"
            aria-current={location.pathname === '/results' ? 'page' : undefined}
            className="px-4.5 py-2 text-sm font-semibold text-white bg-eco-700 hover:bg-eco-800 active:bg-eco-900 rounded-lg transition-all shadow-sm shadow-eco-700/10 hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
          >
            Results
          </Link>
        </div>
      </div>
    </nav>
  );
}
