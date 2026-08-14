import { useState } from "react";
import { ChevronDown, ArrowRight, Check } from "lucide-react";
import SignInModal from "./SignInModal";

export default function ObjectionFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const faqs = [
    {
      q: "What is Bill Vyom?",
      a: "Bill Vyom is a unified Global Business Operating System (GBOS) connecting finance, sales, inventory, purchasing, POS, CRM, HR, and analytics on one platform."
    },
    {
      q: "Can I use Bill Vyom offline?",
      a: "Yes. The POS and store billing engine features an embedded local store that buffers transactions offline and automatically syncs when connected."
    },
    {
      q: "Is my data secure?",
      a: "Yes. Bill Vyom uses row-level security (RLS), encrypted database connections, and role-based permissions to isolate and protect your business data."
    },
    {
      q: "Can I manage multiple businesses?",
      a: "Yes. You can manage multiple companies, branches, and warehouses under a single account with consolidated financial reporting."
    }
  ];

  return (
    <section id="faq" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: FAQ (7 cols) */}
          <div className="lg:col-span-7">
            <div className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">
              FREQUENTLY ASKED QUESTIONS.
            </div>

            <div className="space-y-3 mb-6">
              {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-slate-800 text-sm md:text-base focus:outline-hidden"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs md:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <a href="#faq" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700">
              <span>View all FAQs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Right Side: Final CTA Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#0a235c] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-3">
                  Ready to transform your business?
                </h3>
                <p className="text-xs md:text-sm text-blue-100/90 font-medium leading-relaxed mb-8">
                  Join Bill Vyom and experience the power of a connected business platform.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <a
                    href="/app"
                    className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <span>Get Started Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setIsSignInOpen(true)}
                    className="h-12 px-5 rounded-xl border border-blue-400/40 hover:bg-blue-900/50 text-white font-bold text-sm inline-flex items-center justify-center transition-colors"
                  >
                    Schedule a Demo
                  </button>
                </div>
              </div>

              {/* Checkmarks Footer */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-blue-200/90 pt-4 border-t border-blue-800/60">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Quick Setup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Free Trial Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dedicated Support</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </section>
  );
}
