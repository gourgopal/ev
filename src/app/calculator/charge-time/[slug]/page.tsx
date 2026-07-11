import { EV_CARS, EVCar } from "@/lib/ev-cars";
import { EVProvider } from "@/components/ev-provider";
import EVChargingCalculator from "@/components/ev-calculator";
import { I18nProvider } from "@/components/i18n-provider";
import Link from "next/link";
import { ArrowLeft, Car, Info, Zap } from "lucide-react";
import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return EV_CARS.map((car) => ({
    slug: car.slug,
  }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const car = EV_CARS.find(c => c.slug === params.slug);
  if (!car) return { title: 'Not Found' };
  
  return {
    title: `${car.brand} ${car.model} Charging Time Calculator | EV-Time`,
    description: `Calculate exact charging time, cost, and range gained for the ${car.year} ${car.brand} ${car.model} (${car.capacity} kWh).`,
    keywords: [`${car.brand} ${car.model} charging time`, `${car.brand} charging cost`, "EV calculator"]
  };
}

export default async function CarCalculatorPage(props: Props) {
  const params = await props.params;
  const car = EV_CARS.find(c => c.slug === params.slug);
  
  if (!car) {
    return <div className="p-20 text-center text-white">Car not found.</div>;
  }

  // Find 3 similar cars (same brand or similar capacity)
  const similarCars = EV_CARS.filter(c => 
    c.slug !== car.slug && 
    (c.brand === car.brand || Math.abs(c.capacity - car.capacity) < 10)
  ).slice(0, 3);

  // SEO Content Math Logic
  const usableCapacity = car.capacity * 0.9; // 10% safety buffer typical
  const homeCharger = 7.2;
  const fastCharger = 50;
  
  const homeTime = (car.capacity / (homeCharger * 0.9)).toFixed(1); // 90% efficiency
  const fastTime = (car.capacity / (fastCharger * 0.9)).toFixed(1);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-primary/30 pb-20 pt-10">
      <div className="container mx-auto max-w-6xl px-4">
        
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-gradient">{car.brand} {car.model}</span> 
            <br /> Charging Calculator
          </h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Configure your charging scenario for the {car.year} {car.brand} {car.model} ({car.capacity} kWh battery).
          </p>
        </div>

        <I18nProvider>
          <EVProvider>
            <EVChargingCalculator initialCar={car} />
          </EVProvider>
        </I18nProvider>

        {/* SEO Mathematical Explanation Content */}
        <section className="mt-16 glass-panel p-8">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                 <Info className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">How long does it take to charge the {car.brand} {car.model}?</h2>
           </div>
           
           <div className="space-y-6 text-[var(--muted-foreground)] leading-relaxed">
             <p>
               To find the charging time ($T$) in hours, we divide the battery energy capacity ($E$) in kWh by the effective charging power ($P$) in kW, accounting for approximately 10% thermal efficiency loss.
             </p>
             <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--glass-border)] font-mono text-center text-lg text-white my-4">
                T = E / (P × 0.90)
             </div>
             
             <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                   <h3 className="font-bold text-white flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-primary"/> Home AC Charging (7.2 kW)</h3>
                   <p>For the {car.model} with a {car.capacity} kWh battery, a standard 7.2 kW wallbox charger will take approximately <strong>{homeTime} hours</strong> from 0% to 100%.</p>
                </div>
                <div>
                   <h3 className="font-bold text-white flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-amber-500"/> Public DC Fast Charging (50 kW)</h3>
                   <p>Using a 50 kW public rapid charger, the {car.model} can charge fully in roughly <strong>{fastTime} hours</strong> (or significantly faster if stopping at 80% due to the charging curve taper).</p>
                </div>
             </div>
           </div>
        </section>

        {/* Cross-linking Section */}
        <section className="mt-16">
           <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Car className="text-primary"/> Compare Similar Vehicles</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {similarCars.map(similar => (
               <Link href={`/calculator/charge-time/${similar.slug}`} key={similar.slug} className="glass-panel p-5 hover:border-primary transition-colors group">
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{similar.brand} {similar.model}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-2">
                    {similar.capacity} kWh Battery &bull; {similar.range} {similar.rangeUnit} Range
                  </p>
               </Link>
             ))}
           </div>
        </section>

      </div>
    </main>
  );
}
