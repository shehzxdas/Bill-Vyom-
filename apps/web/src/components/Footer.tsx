import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#050e26] text-slate-400 border-t border-slate-800 text-xs font-medium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          
          {/* Brand Column (2 cols wide) */}
          <div className="lg:col-span-2 space-y-4">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-base">
                BV
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-none">
                  BILL VYOM
                </span>
                <span className="text-[9px] font-bold text-sky-400 tracking-wider uppercase mt-0.5">
                  GLOBAL BUSINESS OPERATING SYSTEM
                </span>
              </div>
            </a>

            <p className="text-slate-400 font-medium leading-relaxed max-w-sm text-xs">
              Bill Vyom is a unified business platform to manage your operations, finance, people and growth.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-700 transition-colors">
                in
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-700 transition-colors">
                ▶
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-700 transition-colors">
                𝕏
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-700 transition-colors">
                f
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-700 transition-colors">
                📷
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              PLATFORM
            </h4>
            <ul className="space-y-2.5">
              <li><a href="#platform" className="hover:text-white transition-colors">Overview</a></li>
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Modules</a></li>
              <li><a href="#integrations" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              SOLUTIONS
            </h4>
            <ul className="space-y-2.5">
              <li><a href="#solutions" className="hover:text-white transition-colors">By Business Size</a></li>
              <li><a href="#industries" className="hover:text-white transition-colors">By Industry</a></li>
              <li><a href="#global" className="hover:text-white transition-colors">Deployment Options</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              RESOURCES
            </h4>
            <ul className="space-y-2.5">
              <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#community" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>

          {/* Stay Updated Column */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              STAY UPDATED
            </h4>
            <p className="text-slate-400 text-xs mb-3 font-medium">
              Subscribe to our newsletter for the latest updates and insights.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-transparent border-none text-xs text-white placeholder:text-slate-500 px-2 py-1.5 focus:outline-hidden w-full"
              />
              <button type="submit" className="w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div>
            © 2025 Bill Vyom. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Cookie Policy</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
