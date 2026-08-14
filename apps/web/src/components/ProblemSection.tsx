import { ArrowRight, CheckCircle2, Target } from "lucide-react";

export default function ProblemSection() {
  return (
    <section id="problem" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dual Side-by-Side Challenge vs Solution Container */}
        <div className="relative flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          
          {/* Left Card: THE CHALLENGE */}
          <div className="flex-1 w-full bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-50 text-rose-600 font-extrabold text-xs uppercase tracking-wider mb-6">
                THE CHALLENGE
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                Disconnected systems slow down your business
              </h3>

              {/* Challenge Bullet Points */}
              <div className="space-y-4 mb-8">
                {[
                  "Data scattered across multiple tools",
                  "Manual processes and duplicate work",
                  "Limited visibility and inaccurate reports",
                  "Scaling becomes complex and costly",
                  "Security and compliance risks"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      🎯
                    </div>
                    <span className="text-sm md:text-base font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Red Fragmented Blocks Visual */}
            <div className="relative z-10 pt-4 flex justify-end">
              <div className="w-36 h-28 relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-rose-100 border-2 border-rose-300 rounded-2xl transform -rotate-12 translate-x-2 translate-y-2 opacity-80" />
                <div className="absolute w-20 h-20 bg-rose-200 border-2 border-rose-400 rounded-2xl transform rotate-6 -translate-x-3 -translate-y-2 shadow-md" />
                <div className="absolute w-16 h-16 bg-rose-500 border-2 border-rose-600 rounded-2xl transform rotate-45 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                  ✖
                </div>
              </div>
            </div>
          </div>

          {/* Central Connecting Circle Arrow */}
          <div className="lg:absolute lg:left-1/2 lg:-translate-x-1/2 z-20 shrink-0 my-[-1rem] lg:my-0">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white">
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>

          {/* Right Card: THE SOLUTION */}
          <div className="flex-1 w-full bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-xs uppercase tracking-wider mb-6">
                THE SOLUTION
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-8">
                Bill Vyom brings everything together
              </h3>

              {/* Solution Bullet Points */}
              <div className="space-y-4 mb-8">
                {[
                  "One connected platform for all operations",
                  "Real-time insights for better decisions",
                  "Automate workflows and save time",
                  "Scale effortlessly across locations",
                  "Secure, compliant and future-ready"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D Green Connected Assembled Cube Visual */}
            <div className="relative z-10 pt-4 flex justify-end">
              <div className="w-36 h-28 relative flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl shadow-xl transform rotate-12 flex items-center justify-center border-2 border-emerald-300 text-white font-black text-3xl">
                  ✓
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
