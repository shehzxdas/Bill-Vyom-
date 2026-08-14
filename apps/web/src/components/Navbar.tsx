import { useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { Menu, X, ChevronDown, Building2, ShieldCheck, User } from "lucide-react";
import SignInModal from "./SignInModal";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [signInDropdown, setSignInDropdown] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-xs"
            : "bg-white py-4 border-b border-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs text-white font-black text-sm md:text-base">
                BV
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black tracking-tight text-slate-900 leading-none">
                  BILL VYOM
                </span>
                <span className="text-[8px] font-bold text-blue-600 tracking-widest uppercase mt-0.5">
                  GLOBAL BUSINESS OPERATING SYSTEM
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-700">
              <div className="relative group cursor-pointer flex items-center gap-1 hover:text-blue-600 transition-colors py-2">
                <a href="#platform">Platform</a>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>

              <div className="relative group cursor-pointer flex items-center gap-1 hover:text-blue-600 transition-colors py-2">
                <a href="#solutions">Solutions</a>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>

              <div className="relative group cursor-pointer flex items-center gap-1 hover:text-blue-600 transition-colors py-2">
                <a href="#industries">Industries</a>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>

              <div className="relative group cursor-pointer flex items-center gap-1 hover:text-blue-600 transition-colors py-2">
                <a href="#resources">Resources</a>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>

              <div className="relative group cursor-pointer flex items-center gap-1 hover:text-blue-600 transition-colors py-2">
                <a href="#company">Company</a>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-3">
              
              {/* Sign In Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setSignInDropdown(!signInDropdown)}
                  onBlur={() => setTimeout(() => setSignInDropdown(false), 200)}
                  className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sign In</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${signInDropdown ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {signInDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-150">
                    <a
                      href="/login"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-slate-800 hover:text-blue-600 transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="text-xs font-extrabold">Tenant Login</div>
                        <div className="text-[10px] text-slate-400">Business Workspace</div>
                      </div>
                    </a>

                    <a
                      href="/admin/login"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800 transition-colors mt-1"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-extrabold">Super Admin Login</div>
                        <div className="text-[10px] text-slate-400">Platform Operators</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Get Started Button */}
              <a
                href="/app"
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center justify-center transition-all shadow-xs shadow-blue-600/20"
              >
                Get Started
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 hover:text-slate-900 rounded-lg"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {["Platform", "Solutions", "Industries", "Resources", "Company"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-bold text-slate-800 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a
                href="/login"
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs text-center"
              >
                Tenant Login
              </a>
              <a
                href="/admin/login"
                className="w-full py-3 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs text-center"
              >
                Super Admin Login
              </a>
              <a
                href="/app"
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs text-center shadow-xs"
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </>
  );
}
