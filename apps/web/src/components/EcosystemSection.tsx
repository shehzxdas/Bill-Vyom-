import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Box, 
  UserCheck, 
  Settings 
} from "lucide-react";

export default function EcosystemSection() {
  const modules = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Customers", icon: Users },
    { name: "Vendors", icon: Building },
    { name: "Products", icon: Box },
    { name: "Team & Access", icon: UserCheck },
    { name: "Settings", icon: Settings },
  ];

  return (
    <section id="ecosystem" className="py-16 md:py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md mb-3">
            ACTIVE PLATFORM MODULES
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-2xs hover:border-blue-400 hover:bg-white transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800">{m.name}</span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
