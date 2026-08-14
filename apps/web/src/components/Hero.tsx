import { useState } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, 
  Check, 
  ChevronDown,
  Building2,
  ShieldAlert,
  Smartphone,
  TrendingUp,
  CreditCard,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  Home,
  Receipt,
  ShoppingCart,
  Package,
  Users,
  Briefcase,
  FileText,
  Activity,
  Settings,
  HelpCircle
} from "lucide-react";
import SignInModal from "./SignInModal";

export default function Hero() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [signInDropdown, setSignInDropdown] = useState(false);

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-slate-50/60 border-b border-slate-200/60">
      
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Hero Header */}
        <div className="flex flex-col items-start text-left max-w-3xl mb-12">
          
          {/* Badge Pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs uppercase tracking-wider mb-6"
          >
            <span className="text-amber-500 text-sm">★</span>
            <span>A UNIFIED PLATFORM. EVERY OPERATION.</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.08] mb-6"
          >
            <span className="text-blue-600 block mb-1">Bill Vyom</span>
            <span>Global Business Operating System</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed mb-8 max-w-2xl"
          >
            Unify your finance, operations, people and customers on one connected platform built for scale, flexibility and real business impact.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center gap-4 mb-8 w-full sm:w-auto"
          >
            {/* Primary CTA */}
            <a
              href="/app"
              className="h-13 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            {/* Secondary CTA */}
            <a
              href="#ecosystem"
              className="h-13 px-7 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-base inline-flex items-center justify-center transition-all hover:bg-slate-50 shadow-xs"
            >
              <span>Explore Platform</span>
            </a>
          </motion.div>

          {/* Feature Checkmarks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm font-semibold text-slate-600"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">✓</div>
              <span>Secure by Design</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">✓</div>
              <span>Scalable by Architecture</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">✓</div>
              <span>Always Available</span>
            </div>
          </motion.div>

        </div>

        {/* Hero Visual Mockups (Desktop Frame + Phone Floating Frame) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative w-full max-w-6xl mx-auto mt-6"
        >
          {/* Main Desktop Dashboard Frame */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden text-slate-800">
            
            {/* Desktop App Window Titlebar */}
            <div className="h-11 bg-slate-100 border-b border-slate-200/80 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xs font-bold text-slate-500 tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Bill Vyom Enterprise Core - Live Environment</span>
              </div>
              <div className="w-12"></div>
            </div>

            {/* Desktop Main Interface Content */}
            <div className="flex h-[480px] overflow-hidden bg-slate-50/50">
              
              {/* Left Sidebar Menu */}
              <div className="w-48 bg-white border-r border-slate-200 p-3 flex flex-col gap-1 shrink-0 hidden md:flex text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2 px-3 py-2 text-blue-600 font-extrabold text-sm mb-2 border-b border-slate-100 pb-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-md flex items-center justify-center font-black text-xs">BV</div>
                  <span>BILL VYOM</span>
                </div>
                {[
                  { label: "Home", icon: Home, active: true },
                  { label: "Finance", icon: DollarSign },
                  { label: "Sales", icon: ShoppingCart },
                  { label: "Purchasing", icon: Briefcase },
                  { label: "Inventory", icon: Package },
                  { label: "POS", icon: Receipt },
                  { label: "CRM", icon: Users },
                  { label: "HR", icon: Users },
                  { label: "Payroll", icon: FileText },
                  { label: "Reports", icon: Activity },
                  { label: "Analytics", icon: BarChart2 },
                  { label: "Settings", icon: Settings },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                        item.active 
                          ? "bg-blue-50 text-blue-600 font-bold" 
                          : "hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Central Dashboard Canvas */}
              <div className="flex-1 p-5 overflow-y-auto bg-slate-50">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Dashboard</h3>
                  <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    Live System Synchronized
                  </div>
                </div>

                {/* Top 4 Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-500 mb-1 flex justify-between items-center">
                      <span>Total Revenue</span>
                      <span className="text-emerald-600 font-bold text-[10px]">▲ 12.5%</span>
                    </div>
                    <div className="text-lg md:text-xl font-black text-slate-900">₹ 8,45,230</div>
                    <div className="text-[10px] text-slate-400 mt-1">vs last month</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-500 mb-1 flex justify-between items-center">
                      <span>Total Expenses</span>
                      <span className="text-emerald-600 font-bold text-[10px]">▲ 8.2%</span>
                    </div>
                    <div className="text-lg md:text-xl font-black text-slate-900">₹ 2,45,340</div>
                    <div className="text-[10px] text-slate-400 mt-1">vs last month</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-500 mb-1 flex justify-between items-center">
                      <span>Net Profit</span>
                      <span className="text-emerald-600 font-bold text-[10px]">▲ 11.7%</span>
                    </div>
                    <div className="text-lg md:text-xl font-black text-slate-900">₹ 6,00,290</div>
                    <div className="text-[10px] text-slate-400 mt-1">vs last month</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-500 mb-1 flex justify-between items-center">
                      <span>Cash Balance</span>
                      <span className="text-emerald-600 font-bold text-[10px]">▲ 10.2%</span>
                    </div>
                    <div className="text-lg md:text-xl font-black text-slate-900">₹ 4,32,120</div>
                    <div className="text-[10px] text-slate-400 mt-1">vs last month</div>
                  </div>
                </div>

                {/* Dashboard Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                  {/* Business Overview Chart */}
                  <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-800">Business Overview</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Jan - Jun</span>
                    </div>
                    <div className="h-28 flex items-end justify-between gap-2 pt-2 px-2 border-b border-slate-100">
                      {[
                        { month: "Jan", val1: 40, val2: 20 },
                        { month: "Feb", val1: 65, val2: 30 },
                        { month: "Mar", val1: 50, val2: 25 },
                        { month: "Apr", val1: 85, val2: 40 },
                        { month: "May", val1: 70, val2: 35 },
                        { month: "Jun", val1: 95, val2: 45 },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div className="w-full flex items-end justify-center gap-1 h-full">
                            <div className="w-3 bg-blue-500 rounded-t-xs" style={{ height: `${bar.val1}%` }}></div>
                            <div className="w-3 bg-indigo-300 rounded-t-xs" style={{ height: `${bar.val2}%` }}></div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold">{bar.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses Donut */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                    <div className="text-xs font-bold text-slate-800 mb-2">Top Expenses</div>
                    <div className="flex items-center justify-center my-1 relative">
                      <div className="w-20 h-20 rounded-full border-8 border-blue-500 border-t-amber-400 border-r-indigo-400 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-[10px] font-extrabold text-slate-800">₹ 2,45,340</div>
                          <div className="text-[8px] text-slate-400">Total</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-500 pt-1">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Purchase</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400"></span>Payroll</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Rent</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300"></span>Operations</span>
                    </div>
                  </div>
                </div>

                {/* Cash flow & Sales Channel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="text-xs font-bold text-slate-800 mb-2">Cash Flow</div>
                    <div className="h-16 flex items-end gap-1.5 pt-1">
                      {[30, 45, 60, 40, 75, 90, 85, 95].map((h, idx) => (
                        <div key={idx} className="flex-1 bg-blue-600 rounded-t-xs" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                    <div className="text-xs font-bold text-slate-800 mb-2">Sales by Channel</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-14 h-14 rounded-full border-4 border-blue-600 border-t-emerald-500 border-l-amber-500 shrink-0"></div>
                      <div className="flex-1 grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-600">
                        <span>● Online</span>
                        <span>● Retail</span>
                        <span>● B2B</span>
                        <span>● Distributor</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Floating Phone Visual Overlay on Right Side */}
          <div className="absolute -right-4 -bottom-6 sm:right-6 sm:-bottom-8 w-56 sm:w-64 bg-slate-900 border-[5px] border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden hidden sm:block z-30 transform hover:scale-105 transition-transform">
            
            {/* Phone Notch */}
            <div className="h-5 bg-slate-900 flex justify-center items-center pt-1">
              <div className="w-16 h-2 bg-slate-800 rounded-full" />
            </div>

            {/* Phone Screen UI */}
            <div className="bg-slate-50 p-3 text-slate-900 text-xs h-[360px] flex flex-col justify-between">
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-blue-600 text-xs">BILL VYOM</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Live</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs mb-2">
                  <div className="text-[9px] text-slate-400 font-bold">Net Profit</div>
                  <div className="text-base font-black text-slate-900">₹ 6,00,290</div>
                  <div className="text-[9px] text-emerald-600 font-bold">▲ 11.7% vs last month</div>
                </div>

                {/* Small Chart */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs mb-2">
                  <div className="text-[9px] font-bold text-slate-700 mb-1">Sales Overview</div>
                  <div className="h-12 flex items-end gap-1">
                    {[40, 65, 50, 85, 70, 95].map((val, i) => (
                      <div key={i} className="flex-1 bg-blue-500 rounded-t-xs" style={{ height: `${val}%` }} />
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[9px] font-bold text-slate-700 mb-1">Recent Activities</div>
                  <div className="space-y-1 text-[8px] text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-0.5">
                      <span>Sales Order Created</span>
                      <span className="font-bold text-blue-600">SO-11243</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-0.5">
                      <span>Payment Received</span>
                      <span className="font-bold text-emerald-600">₹ 45,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Phone Nav */}
              <div className="bg-white border-t border-slate-200 pt-1.5 pb-0.5 px-2 flex justify-between items-center text-[8px] text-slate-400 font-bold">
                <span className="text-blue-600 flex flex-col items-center"><span>🏠</span>Home</span>
                <span className="flex flex-col items-center"><span>🛍️</span>Sales</span>
                <span className="flex flex-col items-center"><span>➕</span>Add</span>
                <span className="flex flex-col items-center"><span>📊</span>Reports</span>
                <span className="flex flex-col items-center"><span>⚙️</span>More</span>
              </div>

            </div>
          </div>

        </motion.div>

      </div>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </section>
  );
}
