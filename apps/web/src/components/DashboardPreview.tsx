import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AlertCircle, IndianRupee, Package, Search, ShoppingCart, TrendingUp, Settings, Inbox, User, CheckCircle2, ShieldCheck, Activity } from "lucide-react";

export default function DashboardPreview() {
  return (
    <div className="relative w-full shadow-[0_20px_60px_rgb(0,0,0,0.1)] rounded-[2rem] border-[4px] border-white/60 bg-white/40 backdrop-blur-2xl overflow-hidden flex flex-col h-[700px] transform-gpu">
      
      {/* Glass Header */}
      <div className="h-16 border-b border-white/40 bg-white/30 backdrop-blur-md flex items-center px-4 justify-between shrink-0 z-20 relative">
        <div className="flex gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-red-500/20 shadow-sm" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-amber-500/20 shadow-sm" />
          <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-green-500/20 shadow-sm" />
        </div>
        
        <div className="flex-1 px-8">
          <div className="h-9 max-w-md bg-white/60 border border-white/80 rounded-xl flex items-center px-3 gap-2 shadow-sm mx-auto backdrop-blur-md transition-all hover:bg-white/80">
            <Search className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400 font-medium">Search invoices, items, or GST numbers...</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/60 border border-white/80 flex items-center justify-center shadow-sm cursor-pointer hover:bg-white/80 transition-colors">
            <Inbox className="w-4 h-4 text-gray-700" />
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-900 border border-white/50 flex items-center justify-center shadow-lg text-white text-xs font-bold tracking-wider cursor-pointer transform hover:scale-105 transition-transform">
            BV
          </div>
        </div>
      </div>

      {/* Layout Map - Main */}
      <div className="flex flex-1 overflow-hidden bg-white/20 relative z-10">
        {/* Glass Sidebar */}
        <div className="w-16 md:w-64 border-r border-white/40 bg-white/30 backdrop-blur-md hidden sm:flex flex-col py-6 px-4 gap-1.5 overflow-y-auto z-20 relative shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-3 hidden md:block">Main Menu</div>
          {[
            { icon: TrendingUp, label: "Dashboard", active: true },
            { icon: ShoppingCart, label: "POS Billing" },
            { icon: Package, label: "Inventory" },
            { icon: IndianRupee, label: "Accounting" },
            { icon: AlertCircle, label: "GST Reports" },
          ].map((item, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-3.5 px-3 py-3 rounded-[14px] text-sm font-bold transition-all cursor-pointer ${
                item.active 
                  ? "bg-white/90 text-blue-900 shadow-sm border border-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden md:block pt-0.5">{item.label}</span>
            </div>
          ))}
          
          <div className="mt-auto flex flex-col gap-1.5 pt-6 border-t border-white/30">
            {[
              { icon: Settings, label: "Settings" },
              { icon: User, label: "My Profile" },
            ].map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3.5 px-3 py-3 rounded-[14px] text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-white/50 transition-all cursor-pointer"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:block pt-0.5">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Data Area - Glass Canvas */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto relative perspective-[1000px]">
          {/* Internal glowing blobs for the glass canvas */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 w-full max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight hidden md:block mb-2">Overview</h2>
            
            {/* Top Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { label: "Today's Sales", val: "₹ 0.00", change: "No ledger entries today", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100", borderColor: "border-blue-100" },
                { label: "Pending GST", val: "₹ 0.00", change: "Tax ledger balanced", icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-100", borderColor: "border-emerald-100" },
                { label: "Stock Alerts", val: "0 Alerts", change: "Inventory optimal", icon: Package, color: "text-purple-600", bg: "bg-purple-100", hiddenMini: true, borderColor: "border-purple-100" },
              ].map((stat, i) => (
                <div key={i} className={`p-6 rounded-3xl border ${stat.borderColor} bg-white/70 backdrop-blur-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] ${stat.hiddenMini ? 'hidden md:flex flex-col' : 'flex flex-col'} transform transition-transform hover:-translate-y-1`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                    <div className={"w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm " + stat.bg}>
                      <stat.icon className={"w-5 h-5 " + stat.color} />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">{stat.val}</div>
                  <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts & Actions Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Chart Glass Card */}
              <div className="md:col-span-2 border border-white rounded-[2rem] p-7 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-2xl flex flex-col justify-between h-[300px]">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">Revenue Trends</h3>
                    <p className="text-sm text-gray-500 font-semibold">Real-time financial performance</p>
                  </div>
                </div>
                
                <div className="flex-1 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                  <Activity className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-sm font-bold text-gray-700">No Revenue Logged</span>
                  <p className="text-xs text-gray-400 font-medium mt-1 max-w-[240px]">Sales trend chart renders automatically once transactions are posted.</p>
                </div>
              </div>

              {/* Actions List Card */}
              <div className="border border-white rounded-[2rem] p-7 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-2xl flex flex-col justify-between h-[300px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Urgent Tasks</h3>
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">0</div>
                </div>
                <div className="flex-1 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <span className="text-sm font-bold text-emerald-800">All Workflows Clear</span>
                  <p className="text-xs text-emerald-600 font-medium mt-1 max-w-[200px]">No pending reorders or filing actions required.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
