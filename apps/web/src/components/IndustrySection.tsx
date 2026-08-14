import { 
  Factory, 
  Package, 
  Store, 
  Globe, 
  HeartPulse, 
  GraduationCap, 
  Building2, 
  Truck, 
  Utensils, 
  HardHat 
} from "lucide-react";

export default function IndustrySection() {
  const industries = [
    { name: "Manufacturing", icon: Factory },
    { name: "Wholesale Distribution", icon: Package },
    { name: "Retail", icon: Store },
    { name: "E-commerce", icon: Globe },
    { name: "Healthcare", icon: HeartPulse },
    { name: "Education", icon: GraduationCap },
    { name: "Real Estate", icon: Building2 },
    { name: "Logistics", icon: Truck },
    { name: "Hospitality", icon: Utensils },
    { name: "Construction", icon: HardHat },
  ];

  return (
    <section id="industries" className="py-16 md:py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
            INDUSTRY SOLUTIONS
          </div>
        </div>

        {/* 10 Industry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {industries.map((ind, idx) => {
            const Icon = ind.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-2xs hover:border-blue-400 hover:bg-white transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-800 leading-tight">
                  {ind.name}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
