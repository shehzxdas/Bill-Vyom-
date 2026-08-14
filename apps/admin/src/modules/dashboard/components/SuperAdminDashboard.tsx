import { 
  Building2, ArrowUpRight, ArrowDownRight, TrendingUp, IndianRupee, Clock, Activity, AlertCircle, FileText,
  AlertTriangle, ShieldCheck, CheckCircle2,
  Users, Check, Eye, MoreVertical, Calendar, Settings2, Zap, HandHeart,
  Server, Database, CloudRain, HardDrive, Mail, MessageSquare, Package, Calculator, MonitorSmartphone, Briefcase, Key, MailIcon
} from "lucide-react";

export default function SuperAdminDashboard() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500" id="super-admin-dashboard-container">
      
      {/* SECTION 1 - KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4" id="kpi-cards-grid-admin">
        {[
          { id: "ten", label: "Total Tenants", val: "0", icon: Users, color: "#2563EB", help: "No registered business accounts" },
          { id: "sub", label: "Active Subs", val: "0", icon: CheckCircle2, color: "#10B981", help: "No active merchant subscriptions" },
          { id: "mrr", label: "MRR", val: "₹ 0.00", icon: TrendingUp, color: "#2563EB", help: "Monthly recurring revenue" },
          { id: "arr", label: "ARR", val: "₹ 0.00", icon: TrendingUp, color: "#8B5CF6", help: "Annual recurring revenue" },
          { id: "ch", label: "Churn Rate", val: "0.00%", icon: AlertTriangle, color: "#EF4444", help: "Tenant retention healthy" },
          { id: "act", label: "Active Users", val: "0", icon: Users, color: "#10B981", help: "No active client sessions" },
          { id: "up", label: "API Uptime", val: "100.0%", icon: Activity, color: "#10B981", help: "All services operating normally" },
          { id: "tkt", label: "Pending Tickets", val: "0", icon: FileText, color: "#F59E0B", help: "All support tickets resolved" },
        ].map((stat, i) => (
          <div key={i} id={`admin-kpi-${stat.id}`} className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex flex-col justify-between h-[125px]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center border border-gray-100">
                  <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
                </div>
                <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider truncate">
                  {stat.label}
                </span>
              </div>
              <div className="text-[20px] font-extrabold text-[#111827] tracking-tight">{stat.val}</div>
            </div>
            <div className="text-[10px] text-gray-400 font-medium truncate mt-2 border-t border-gray-50 pt-1.5">
              {stat.help}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 2 - Performance Charts & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="admin-charts-row">
        
        {/* MRR Growth */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col h-[340px]" id="mrr-growth-card-admin">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#111827]">MRR Growth</h3>
          </div>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-6 text-center">
            <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-[12px] font-bold text-gray-700">No Revenue Records</span>
            <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-[200px]">MRR tracking will initialize as merchants upgrade subscriptions.</p>
          </div>
        </div>

        {/* Tenant Growth */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col h-[340px]" id="tenant-growth-card-admin">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#111827]">Tenant Growth</h3>
          </div>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-6 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-[12px] font-bold text-gray-700">No Merchant Registrations</span>
            <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-[200px]">New tenant onboarding trends will be mapped over time here.</p>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col h-[340px]" id="revenue-dist-card-admin">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#111827]">Revenue Distribution</h3>
          </div>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-6 text-center">
            <IndianRupee className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-[12px] font-bold text-gray-700">No Subscription Distributions</span>
            <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-[200px]">Revenue breakdowns by plan tiers will populate upon active checkouts.</p>
          </div>
        </div>

        {/* Countries Distribution */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col h-[340px]" id="countries-dist-card-admin">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#111827]">Geography Distribution</h3>
          </div>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-4 text-center">
            <span className="text-[11px] font-bold text-gray-500">No Geographical Registrations</span>
          </div>
        </div>

      </div>

      {/* SECTION 3 - Center Master Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="admin-tables-row">
        
        {/* Recent Tenants Panel */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm lg:col-span-6 xl:col-span-7 flex flex-col h-[360px]" id="recent-tenants-card-admin">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#111827]">Recent Tenants</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-[12px] font-bold text-gray-700">No Registered Tenants</span>
            <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-[220px]">A comprehensive list of merchant signups will appear once registration opens.</p>
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm lg:col-span-3 xl:col-span-2 flex flex-col h-[360px]" id="platform-health-card-admin">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h3 className="text-[14px] font-bold text-[#111827]">Platform Services</h3>
          </div>
          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
            {[
              { icon: Server, name: "API Cluster", stat: "Active" },
              { icon: Database, name: "DB Replication", stat: "Active" },
              { icon: Zap, name: "Redis In-Memory", stat: "Active" },
              { icon: Activity, name: "Task Workers", stat: "Active" },
              { icon: HardDrive, name: "Storage Vol", stat: "Active" },
              { icon: Mail, name: "SMTP Service", stat: "Active" },
              { icon: MessageSquare, name: "WhatsApp Engine", stat: "Active" },
            ].map((sys, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] border-b border-gray-50 pb-2">
                <div className="flex items-center gap-2">
                  <sys.icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-700">{sys.name}</span>
                </div>
                <span className="text-emerald-600 font-bold">{sys.stat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Feed */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm lg:col-span-3 flex flex-col h-[360px]" id="system-activity-card-admin">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#111827]">System Activity Feed</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Clock className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-[12px] font-bold text-gray-700">Audit Stream Silent</span>
            <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-[200px]">Real-time system events, backups, and authorization changes will stream here.</p>
          </div>
        </div>

      </div>

      {/* SECTION 4 - Detailed Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 pb-8" id="admin-summaries-row">
        
        {/* Revenue Summary */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm h-[260px] flex flex-col" id="rev-summary-card-admin">
          <h3 className="text-[14px] font-bold text-[#111827] mb-4">Revenue Summary</h3>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-4 text-center">
            <span className="text-[11px] font-bold text-gray-500">No Revenue Data</span>
          </div>
        </div>

        {/* Churn Analysis */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm h-[260px] flex flex-col" id="churn-analysis-card-admin">
          <h3 className="text-[14px] font-bold text-[#111827] mb-4">Churn Analysis</h3>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-4 text-center">
            <span className="text-[11px] font-bold text-gray-500">Churn Matrix Empty</span>
          </div>
        </div>

        {/* Feature Usage */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm h-[260px] flex flex-col" id="feature-usage-card-admin">
          <h3 className="text-[14px] font-bold text-[#111827] mb-4">Top Feature Usage</h3>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-4 text-center">
            <span className="text-[11px] font-bold text-gray-500">No Feature Logs</span>
          </div>
        </div>

        {/* Support Overview */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm h-[260px] flex flex-col" id="support-overview-card-admin">
          <h3 className="text-[14px] font-bold text-[#111827] mb-4">Support Overview</h3>
          <div className="flex-1 bg-[#F8FAFC] border border-dashed border-[#E5E7EB] rounded-lg flex flex-col items-center justify-center p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
            <span className="text-[11px] font-bold text-gray-700">Support Desk Clear</span>
            <span className="text-[10px] text-gray-400 mt-0.5">No pending support tickets.</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm h-[260px] flex flex-col" id="quick-links-card-admin">
          <h3 className="text-[14px] font-bold text-[#111827] mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto">
            {[
              { label: "Add Tenant", icon: Building2 },
              { label: "Create Plan", icon: FileText },
              { label: "Send Notice", icon: MailIcon },
              { label: "View Payouts", icon: IndianRupee },
              { label: "System Logs", icon: FileText },
              { label: "Backup Now", icon: HardDrive },
              { label: "Feature Flags", icon: Settings2 },
              { label: "API Keys", icon: Key },
              { label: "Settings", icon: Settings2 },
            ].map((link, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-1 rounded hover:bg-blue-50 cursor-pointer group transition-colors text-center border border-gray-50">
                <div className="w-6 h-6 rounded flex items-center justify-center text-[#1E3A8A] border border-transparent group-hover:bg-white group-hover:border-blue-100 group-hover:shadow-sm mb-1 transition-all">
                  <link.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] font-extrabold text-gray-500 group-hover:text-[#111827] leading-tight truncate w-full px-1">{link.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
