import { Building2, ShieldCheck, Rocket, Plug } from "lucide-react";

export default function AdministrationSection() {
  return (
    <section className="py-16 md:py-20 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: TENANT vs SUPER ADMIN */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-black text-blue-600 tracking-wider uppercase mb-4">
                TENANT vs SUPER ADMIN
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 mb-1">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Tenant</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Manage your daily business operations with full control.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 mb-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Super Admin</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Oversee tenants, manage system and ensure governance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: INTEGRATIONS & API */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-xs font-black text-blue-600 tracking-wider uppercase mb-1.5">
                INTEGRATIONS & API
              </div>
              <p className="text-xs font-semibold text-slate-600 mb-5">
                Connect with your favorite tools and platforms.
              </p>

              {/* Integrations Badges */}
              <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                  🛍️ Shopify
                </span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1">
                  📊 Tally
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg border border-green-200 flex items-center gap-1">
                  💬 WhatsApp
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1">
                  💳 Payment Gateways
                </span>
                <span className="bg-sky-100 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-200 flex items-center gap-1">
                  🚚 Courier Services
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1">
                  🛒 E-commerce
                </span>
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1">
                  🏦 Banking
                </span>
                <span className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300">
                  ••• And More
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: ENTERPRISE CAPABILITIES */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="text-xs font-black text-blue-600 tracking-wider uppercase mb-4 flex items-center justify-between">
                <span>ENTERPRISE CAPABILITIES</span>
                <Rocket className="w-5 h-5 text-blue-600" />
              </div>

              <div className="space-y-2.5 text-xs font-bold">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800">◆ AI Assistant & Analytics</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">Active</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800">◆ Advanced Automation Engine</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">Active</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800">◆ Multi-Entity Accounting</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">Active</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800">◆ Integration Marketplace</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">Active</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
