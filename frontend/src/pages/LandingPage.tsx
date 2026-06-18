import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarbonStore } from '../store/useCarbonStore';

/* ─── Reusable input component ──────────────────────────── */
function FormInput({ id, label, hint, ...props }: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-700 block mb-1.5">{label}</label>
      <input
        id={id}
        {...props}
        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15 focus:outline-none transition-all"
      />
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function FormSelect({ id, label, children, ...props }: { id: string; label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-700 block mb-1.5">{label}</label>
      <div className="relative">
        <select
          id={id}
          {...props}
          className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15 focus:outline-none transition-all cursor-pointer appearance-none"
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const calculate = useCarbonStore((state) => state.calculate);
  const storeError = useCarbonStore((state) => state.error);

  const [validationError, setValidationError] = useState<string>('');

  const [carKmWeek, setCarKmWeek] = useState('0');
  const [carFuelType, setCarFuelType] = useState<'petrol' | 'diesel' | 'hybrid' | 'electric'>('petrol');
  const [motorcycleKmWeek, setMotorcycleKmWeek] = useState('0');
  const [transitKmWeek, setTransitKmWeek] = useState('0');
  const [flightsShort, setFlightsShort] = useState('0');
  const [flightsLong, setFlightsLong] = useState('0');

  const [electricityKwhMonth, setElectricityKwhMonth] = useState('0');
  const [naturalGasKwhMonth, setNaturalGasKwhMonth] = useState('0');
  const [heatingOilKwhMonth, setHeatingOilKwhMonth] = useState('0');
  const [lpgKwhMonth, setLpgKwhMonth] = useState('0');
  const [renewablePct, setRenewablePct] = useState('0');
  const [waterM3Month, setWaterM3Month] = useState('0');
  const [householdSize, setHouseholdSize] = useState('1');

  const [dietType, setDietType] = useState<'heavy_meat' | 'medium_meat' | 'low_meat' | 'pescatarian' | 'vegetarian' | 'vegan'>('vegetarian');
  const [shoppingSpendMonth, setShoppingSpendMonth] = useState('0');
  const [wasteLandfillWeek, setWasteLandfillWeek] = useState('0');
  const [recyclingPct, setRecyclingPct] = useState('0');

  const scrollToCalculator = () => {
    document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const size = parseInt(householdSize) || 1;
    if (size < 1) {
      setValidationError('Household size must be at least 1.');
      return;
    }

    const payload = {
      transport: {
        car_km_per_week: parseFloat(carKmWeek) || 0,
        car_fuel_type: carFuelType,
        motorcycle_km_per_week: parseFloat(motorcycleKmWeek) || 0,
        transit_km_per_week: parseFloat(transitKmWeek) || 0,
        flights_short: parseInt(flightsShort) || 0,
        flights_long: parseInt(flightsLong) || 0
      },
      home: {
        electricity_kwh_per_month: parseFloat(electricityKwhMonth) || 0,
        natural_gas_kwh_per_month: parseFloat(naturalGasKwhMonth) || 0,
        heating_oil_kwh_per_month: parseFloat(heatingOilKwhMonth) || 0,
        lpg_kwh_per_month: parseFloat(lpgKwhMonth) || 0,
        renewable_energy_pct: parseFloat(renewablePct) || 0,
        water_m3_per_month: parseFloat(waterM3Month) || 0,
        household_size: size
      },
      diet: { type: dietType },
      consumption: {
        shopping_spend_usd_per_month: parseFloat(shoppingSpendMonth) || 0,
        waste_landfill_kg_per_week: parseFloat(wasteLandfillWeek) || 0,
        recycling_pct: parseFloat(recyclingPct) || 0
      }
    };

    try {
      await calculate(payload);
    } catch (err) {
      console.error('Calculation error:', err);
    }
    navigate('/results');
  };

  const activeError = validationError || storeError;

  return (
    <div className="animate-fade-in">
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Hero">
        {/* Background image layer */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center scale-100"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <div className="glass p-8 sm:p-12 flex flex-col items-center text-center shadow-2xl bg-white/75 backdrop-blur-md border border-white/30 rounded-2xl">
            <div className="badge badge-eco mb-6 animate-fade-in font-bold py-1.5 px-4 rounded-full text-xs">
              🌱 Carbon Footprint Awareness Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3rem] font-extrabold text-slate-900 leading-[1.15] tracking-tight mb-5 animate-fade-in-up">
              Know your impact. <br />
              <span className="gradient-text">Change the future.</span>
            </h1>

            <p className="text-slate-650 text-base sm:text-lg leading-relaxed max-w-xl mb-8 animate-fade-in-up delay-100">
              Calculate your personal carbon footprint in minutes. Get AI-powered recommendations to reduce your environmental impact — backed by science.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center animate-fade-in-up delay-200 w-full sm:w-auto">
              <button
                onClick={scrollToCalculator}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-eco-600 hover:bg-eco-500 text-white font-bold text-sm transition-all shadow-lg shadow-eco-600/20 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer focus:ring-4 focus:ring-eco-500/40 focus:outline-none"
              >
                Start calculating →
              </button>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all border border-slate-200 hover:border-slate-355 cursor-pointer text-center"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
         ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📝', step: '01', title: 'Enter your habits', desc: 'Tell us about your weekly transport, energy use, diet, and consumption patterns.' },
            { icon: '🧮', step: '02', title: 'Get your footprint', desc: 'Our engine converts your inputs into annual kg CO₂e using published emission factors.' },
            { icon: '💡', step: '03', title: 'Act on insights', desc: 'Receive AI-personalized recommendations targeting your biggest emission categories.' }
          ].map((item, i) => (
            <div key={i} className={`card-gradient-border p-6 animate-fade-in-up delay-${(i + 1) * 100}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-bold text-eco-600 tracking-widest">{item.step}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CALCULATOR SECTION
         ═══════════════════════════════════════════════════════════ */}
      <section id="calculator-section" className="max-w-5xl mx-auto px-6 pb-20 scroll-mt-20" aria-labelledby="calc-title">
        <div className="separator mb-12" />
        <div className="mb-10 text-center">
          <h2 id="calc-title" className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Estimate your annual footprint
          </h2>
          <p className="text-slate-500 text-sm mt-1.5">
            Enter your average weekly and monthly routines. All fields default to zero.
          </p>
        </div>

        {/* Error */}
        <div aria-live="polite">
          {activeError && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
              {activeError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Carbon footprint calculator">
          {/* Transport */}
          <fieldset className="card p-6 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 mb-5 shadow-sm">
              <span>🚗</span> Transport
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormInput id="car-km" label="Car distance per week (km)" type="number" min={0} value={carKmWeek} onChange={e => setCarKmWeek(e.target.value)} />
              <FormSelect id="car-fuel" label="Car fuel type" value={carFuelType} onChange={e => setCarFuelType(e.target.value as any)}>
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </FormSelect>
              <FormInput id="motorcycle-km" label="Motorcycle per week (km)" type="number" min={0} value={motorcycleKmWeek} onChange={e => setMotorcycleKmWeek(e.target.value)} hint="Leave 0 if you don’t ride." />
              <FormInput id="transit-km" label="Public transit per week (km)" type="number" min={0} value={transitKmWeek} onChange={e => setTransitKmWeek(e.target.value)} />
              <FormInput id="flights-short" label="Short-haul flights / yr" type="number" min={0} value={flightsShort} onChange={e => setFlightsShort(e.target.value)} hint="Under 3 hours" />
              <FormInput id="flights-long" label="Long-haul flights / yr" type="number" min={0} value={flightsLong} onChange={e => setFlightsLong(e.target.value)} hint="Over 3 hours" />
            </div>
          </fieldset>

          {/* Home Energy */}
          <fieldset className="card p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 mb-5 shadow-sm">
              <span>⚡</span> Home energy
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormInput id="electricity" label="Electricity per month (kWh)" type="number" min={0} value={electricityKwhMonth} onChange={e => setElectricityKwhMonth(e.target.value)} />
              <FormInput id="natural-gas" label="Natural gas per month (kWh)" type="number" min={0} value={naturalGasKwhMonth} onChange={e => setNaturalGasKwhMonth(e.target.value)} />
              <FormInput id="heating-oil" label="Heating oil per month (kWh)" type="number" min={0} value={heatingOilKwhMonth} onChange={e => setHeatingOilKwhMonth(e.target.value)} hint="Kerosene-based heating" />
              <FormInput id="lpg" label="LPG / Propane per month (kWh)" type="number" min={0} value={lpgKwhMonth} onChange={e => setLpgKwhMonth(e.target.value)} hint="Cooking or heating gas" />
              <FormInput id="water" label="Water usage per month (m³)" type="number" min={0} value={waterM3Month} onChange={e => setWaterM3Month(e.target.value)} hint="Avg household: 8–12 m³" />
              <FormInput id="renewable" label="Renewable energy (%)" type="number" min={0} max={100} value={renewablePct} onChange={e => setRenewablePct(e.target.value)} hint="Solar panels or green tariff" />
              <FormInput id="household" label="People in household" type="number" min={1} value={householdSize} onChange={e => setHouseholdSize(e.target.value)} hint="Energy is split per person" />
            </div>
          </fieldset>

          {/* Diet & Consumption */}
          <fieldset className="card p-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 mb-5 shadow-sm">
              <span>🍳</span> Diet & consumption
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
              <FormSelect id="diet" label="Diet" value={dietType} onChange={e => setDietType(e.target.value as any)}>
                <option value="heavy_meat">Heavy meat eater</option>
                <option value="medium_meat">Medium meat eater</option>
                <option value="low_meat">Low meat eater</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
              </FormSelect>
              <FormInput id="spending" label="Goods spending / month (USD)" type="number" min={0} value={shoppingSpendMonth} onChange={e => setShoppingSpendMonth(e.target.value)} />
              <FormInput id="waste" label="Landfill waste / week (kg)" type="number" min={0} value={wasteLandfillWeek} onChange={e => setWasteLandfillWeek(e.target.value)} />
              <FormInput id="recycling" label="Recycling / composting (%)" type="number" min={0} max={100} value={recyclingPct} onChange={e => setRecyclingPct(e.target.value)} hint="% of waste you recycle or compost" />
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-eco-600 to-emerald-600 hover:from-eco-500 hover:to-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-eco-600/15 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer focus:ring-4 focus:ring-eco-500/40 focus:outline-none"
          >
            Calculate my footprint →
          </button>
        </form>
      </section>
    </div>
  );
}
