import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCarbonStore } from '../store/useCarbonStore';
import type { FootprintInputs } from '@carbonwise/shared';

const formSchema = z.object({
  transport: z.object({
    car_km_per_week: z.number().min(0, 'Must be positive').default(0),
    car_fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']).default('petrol'),
    motorcycle_km_per_week: z.number().min(0).default(0),
    transit_km_per_week: z.number().min(0).default(0),
    flights_short: z.number().min(0).default(0),
    flights_long: z.number().min(0).default(0),
  }),
  home: z.object({
    electricity_kwh_per_month: z.number().min(0).default(0),
    natural_gas_kwh_per_month: z.number().min(0).default(0),
    heating_oil_kwh_per_month: z.number().min(0).default(0),
    lpg_kwh_per_month: z.number().min(0).default(0),
    water_m3_per_month: z.number().min(0).default(0),
    renewable_energy_pct: z.number().min(0).max(100).default(0),
    household_size: z.number().min(1, 'At least 1 person required').default(1),
  }),
  diet: z.object({
    type: z.enum(['heavy_meat', 'medium_meat', 'low_meat', 'pescatarian', 'vegetarian', 'vegan']).default('vegetarian'),
  }),
  consumption: z.object({
    shopping_spend_usd_per_month: z.number().min(0).default(0),
    waste_landfill_kg_per_week: z.number().min(0).default(0),
    recycling_pct: z.number().min(0).max(100).default(0),
  })
});

type FormValues = z.infer<typeof formSchema>;

export default function LandingPage() {
  const navigate = useNavigate();
  const calculate = useCarbonStore((state) => state.calculate);
  const storeError = useCarbonStore((state) => state.error);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transport: { car_km_per_week: 0, car_fuel_type: 'petrol', motorcycle_km_per_week: 0, transit_km_per_week: 0, flights_short: 0, flights_long: 0 },
      home: { electricity_kwh_per_month: 0, natural_gas_kwh_per_month: 0, heating_oil_kwh_per_month: 0, lpg_kwh_per_month: 0, water_m3_per_month: 0, renewable_energy_pct: 0, household_size: 1 },
      diet: { type: 'vegetarian' },
      consumption: { shopping_spend_usd_per_month: 0, waste_landfill_kg_per_week: 0, recycling_pct: 0 }
    }
  });

  const scrollToCalculator = () => {
    document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await calculate(data as FootprintInputs);
      navigate('/results');
    } catch (err) {
      console.error('Calculation error:', err);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 sm:py-24" aria-label="Hero">
        <div className="absolute inset-0 z-0 bg-cover bg-center scale-100" style={{ backgroundImage: "url('/hero-bg.jpg')" }} />
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

        <div aria-live="polite">
          {storeError && (
            <div id="form-error" className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
              {storeError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label="Carbon footprint calculator" aria-describedby={storeError ? 'form-error' : undefined}>
          
          {/* Transport */}
          <fieldset className="card p-6 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 mb-5 shadow-sm">
              <span>🚗</span> Transport
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label htmlFor="car_km_per_week" className="text-[13px] font-semibold text-slate-700 block mb-1.5">Car distance per week (km)</label>
                <input id="car_km_per_week" type="number" {...register('transport.car_km_per_week', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15" />
                {errors.transport?.car_km_per_week && <p className="text-red-500 text-xs mt-1">{errors.transport.car_km_per_week.message}</p>}
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Car fuel type</label>
                <select {...register('transport.car_fuel_type')} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15 bg-white">
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Motorcycle per week (km)</label>
                <input type="number" {...register('transport.motorcycle_km_per_week', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Public transit per week (km)</label>
                <input type="number" {...register('transport.transit_km_per_week', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Short-haul flights / yr</label>
                <input type="number" {...register('transport.flights_short', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Long-haul flights / yr</label>
                <input type="number" {...register('transport.flights_long', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:border-eco-500 focus:ring-2 focus:ring-eco-500/15" />
              </div>
            </div>
          </fieldset>

          {/* Home Energy */}
          <fieldset className="card p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 mb-5 shadow-sm">
              <span>⚡</span> Home energy
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label htmlFor="electricity_kwh_per_month" className="text-[13px] font-semibold text-slate-700 block mb-1.5">Electricity per month (kWh)</label>
                <input id="electricity_kwh_per_month" type="number" {...register('home.electricity_kwh_per_month', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Natural gas per month (kWh)</label>
                <input type="number" {...register('home.natural_gas_kwh_per_month', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Heating oil per month (kWh)</label>
                <input type="number" {...register('home.heating_oil_kwh_per_month', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">LPG / Propane per month (kWh)</label>
                <input type="number" {...register('home.lpg_kwh_per_month', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Water usage per month (m³)</label>
                <input type="number" {...register('home.water_m3_per_month', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Renewable energy (%)</label>
                <input type="number" {...register('home.renewable_energy_pct', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">People in household</label>
                <input type="number" {...register('home.household_size', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
                {errors.home?.household_size && <p className="text-red-500 text-xs mt-1">{errors.home.household_size.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* Diet & Consumption */}
          <fieldset className="card p-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-3 py-1 flex items-center gap-1.5 mb-5 shadow-sm">
              <span>🍳</span> Diet & consumption
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
              <div>
                <label htmlFor="diet_type" className="text-[13px] font-semibold text-slate-700 block mb-1.5">Diet</label>
                <select id="diet_type" {...register('diet.type')} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="heavy_meat">Heavy meat eater</option>
                  <option value="medium_meat">Medium meat eater</option>
                  <option value="low_meat">Low meat eater</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Goods spending / month (USD)</label>
                <input type="number" {...register('consumption.shopping_spend_usd_per_month', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Landfill waste / week (kg)</label>
                <input type="number" {...register('consumption.waste_landfill_kg_per_week', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Recycling / composting (%)</label>
                <input type="number" {...register('consumption.recycling_pct', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              </div>
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
