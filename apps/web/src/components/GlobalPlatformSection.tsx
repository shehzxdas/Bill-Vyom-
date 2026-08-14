import { 
  Globe2, 
  Building2, 
  Coins, 
  Monitor, 
  Cloud, 
  ShieldCheck 
} from "lucide-react";

export default function GlobalPlatformSection() {
  const cards = [
    {
      title: "GLOBAL ARCHITECTURE",
      desc: "Multi-tenant, Scalable. High availability across regions.",
      icon: Globe2,
    },
    {
      title: "MULTI-COMPANY MULTI-BRANCH",
      desc: "Manage multiple companies, branches and warehouses.",
      icon: Building2,
    },
    {
      title: "MULTI-CURRENCY MULTI-COUNTRY",
      desc: "Work in multiple currencies and comply with local regulations.",
      icon: Coins,
    },
    {
      title: "ALL PLATFORMS",
      desc: "Web, Android, iOS, Windows and Powerful POS experience.",
      icon: Monitor,
    },
    {
      title: "DEPLOYMENT CHOICE",
      desc: "Cloud, Local, Offline or Hybrid—your business, your choice.",
      icon: Cloud,
    },
    {
      title: "SECURITY & GOVERNANCE",
      desc: "Role-based access, audit logs, data backup and enterprise security.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="global" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs hover:border-blue-400 transition-all flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-blue-600 tracking-wider uppercase mb-1.5">
                    {c.title}
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 leading-snug">
                    {c.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
