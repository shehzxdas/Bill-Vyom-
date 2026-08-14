import { Building2, GitBranch, Globe, Languages, Cloud } from "lucide-react";

export default function TrustCredibilityBar() {
  const stats = [
    {
      icon: Building2,
      label: "Multi-Company",
      val: "Unlimited",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: GitBranch,
      label: "Multi-Branch",
      val: "Unlimited",
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      icon: Globe,
      label: "Multi-Currency",
      val: "180+",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: Languages,
      label: "Languages",
      val: "12+",
      color: "text-cyan-600 bg-cyan-50"
    },
    {
      icon: Cloud,
      label: "Deployment",
      val: "Cloud, Local, Hybrid",
      color: "text-sky-600 bg-sky-50"
    }
  ];

  return (
    <section className="py-8 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:border-blue-300 transition-colors"
              >
                <div className={`p-2.5 rounded-xl ${item.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">{item.label}</div>
                  <div className="text-sm font-extrabold text-slate-900">{item.val}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
