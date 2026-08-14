import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Receipt 
} from "lucide-react";

export default function MultiDeviceSection() {
  const deviceList = [
    { name: "Web", icon: Monitor },
    { name: "Android", icon: Smartphone },
    { name: "iOS", icon: Tablet },
    { name: "Windows", icon: Laptop },
    { name: "POS", icon: Receipt },
  ];

  return (
    <section className="py-16 md:py-20 bg-[#071330] text-white overflow-hidden relative border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Banner Tag */}
        <div className="inline-block text-xs font-black uppercase tracking-widest text-sky-400 bg-blue-950/80 px-3.5 py-1 rounded-md border border-sky-800/80 mb-4">
          ONE PLATFORM. MANY EXPERIENCES.
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-8">
          Powerful across every device
        </h2>

        {/* Device Icons Row */}
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 mb-12">
          {deviceList.map((d, idx) => {
            const Icon = d.icon;
            return (
              <div key={idx} className="flex items-center gap-2 text-slate-300 font-bold text-sm md:text-base bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
                <Icon className="w-5 h-5 text-sky-400" />
                <span>{d.name}</span>
              </div>
            );
          })}
        </div>

        {/* Multi-Device Graphic Frame */}
        <div className="max-w-4xl mx-auto bg-slate-900/90 rounded-3xl border border-slate-800 p-6 md:p-10 shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Desktop View */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
              <div className="h-4 flex items-center gap-1.5 mb-3 border-b border-slate-800 pb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[10px] font-mono text-sky-400 mb-1">Web & Windows App</div>
              <div className="text-sm font-bold text-white mb-2">Enterprise Operating Console</div>
              <div className="h-16 bg-slate-900 rounded-lg p-2 text-[9px] text-slate-400 font-mono">
                [Full General Ledger & Multi-Branch Admin]
              </div>
            </div>

            {/* Tablet & Phone */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
              <div className="text-[10px] font-mono text-emerald-400 mb-1">Android & iOS Mobile</div>
              <div className="text-sm font-bold text-white mb-2">On-the-go Approvals & Analytics</div>
              <div className="h-16 bg-slate-900 rounded-lg p-2 text-[9px] text-slate-400 font-mono">
                [Real-time Push Alerts & Mobile Invoicing]
              </div>
            </div>

            {/* Dedicated POS */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
              <div className="text-[10px] font-mono text-amber-400 mb-1">POS Counter Terminal</div>
              <div className="text-sm font-bold text-white mb-2">High-Speed Billing & Receipts</div>
              <div className="h-16 bg-slate-900 rounded-lg p-2 text-[9px] text-slate-400 font-mono">
                [Thermal Printing & Offline Mode Engine]
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
