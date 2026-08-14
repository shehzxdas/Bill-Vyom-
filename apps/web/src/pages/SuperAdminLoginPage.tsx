import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Lock, ArrowRight, ShieldCheck, Mail, Key } from "lucide-react";

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate directly into super admin platform console
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Ambient Red/Amber Alert Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-amber-400 font-extrabold text-xl tracking-tighter">B</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white leading-none">
              Bill Vyom
            </span>
            <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase mt-0.5">
              Super Admin Gateway
            </span>
          </div>
        </a>

        <a
          href="/login"
          className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
        >
          ← Tenant Workspace Login
        </a>
      </div>

      {/* Center Form Card */}
      <div className="max-w-md w-full mx-auto my-12 z-10">
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              Platform Administration Console
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Restricted to authorized system operators and platform engineers.
            </p>
          </div>

          <div className="mb-6 p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs font-semibold text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Unauthorized access attempts are audited and logged.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@billvyom.internal"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                System Operator Credential
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md mt-2"
            >
              <span>Access Super Admin Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>

      {/* Footer Security Badges */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between text-xs font-mono text-slate-500 z-10">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Hardware Token Verified
        </span>
        <span>mTLS Enabled</span>
      </div>

    </div>
  );
}
