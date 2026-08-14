import React from "react";
import { Building2, ShieldAlert, ArrowRight, X, Lock, Users } from "lucide-react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 md:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decorative ambient glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-8 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3.5 h-3.5 text-blue-700" />
            <span>Bill Vyom Secure Sign In</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Select Your Access Portal
          </h2>
          <p className="text-sm md:text-base text-gray-500 font-medium mt-1">
            Choose the control surface relevant to your role.
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          
          {/* Tenant Login */}
          <a
            href="/login"
            className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-700 bg-white hover:bg-blue-50/40 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-blue-100 text-blue-900 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-colors shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-gray-900 group-hover:text-blue-900">
                  Tenant Login
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Business Workspace
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 font-medium leading-relaxed">
                Access your company's sales, finance, inventory, POS, and operational dashboard.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-900 group-hover:translate-x-1 transition-all self-center shrink-0" />
          </a>

          {/* Super Admin Login */}
          <a
            href="/admin/login"
            className="group relative flex items-start gap-4 p-5 rounded-2xl border border-gray-200 hover:border-gray-900 bg-gray-50/80 hover:bg-gray-900 text-gray-900 hover:text-white transition-all duration-200 shadow-sm"
          >
            <div className="p-3 bg-gray-200 text-gray-800 rounded-xl group-hover:bg-gray-800 group-hover:text-white transition-colors shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold group-hover:text-white">
                  Super Admin Login
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 group-hover:bg-amber-900 group-hover:text-amber-200">
                  Platform Operator
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500 group-hover:text-gray-300 font-medium leading-relaxed">
                Platform-wide infrastructure, tenant provisioning, system audit, and operations.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all self-center shrink-0" />
          </a>

        </div>

        {/* Security Note */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Role-Based Access Enforcement
          </span>
          <span className="font-mono text-[11px] text-gray-400">TLS 1.3 / OAuth 2.1</span>
        </div>

      </div>
    </div>
  );
}
