import { 
  Users, 
  ShoppingCart, 
  FileText, 
  Package, 
  ClipboardCheck, 
  Receipt, 
  CreditCard, 
  BarChart3,
  ArrowRight
} from "lucide-react";

export default function InteractiveWorkflowSection() {
  const workflowSteps = [
    { name: "Lead / Customer", icon: Users, color: "bg-blue-100 text-blue-600 border-blue-200" },
    { name: "Sales", icon: ShoppingCart, color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
    { name: "Order", icon: FileText, color: "bg-amber-100 text-amber-600 border-amber-200" },
    { name: "Inventory", icon: Package, color: "bg-purple-100 text-purple-600 border-purple-200" },
    { name: "Fulfillment", icon: ClipboardCheck, color: "bg-teal-100 text-teal-600 border-teal-200" },
    { name: "Invoicing", icon: Receipt, color: "bg-sky-100 text-sky-600 border-sky-200" },
    { name: "Payment", icon: CreditCard, color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
    { name: "Analytics", icon: BarChart3, color: "bg-orange-100 text-orange-600 border-orange-200" },
  ];

  return (
    <section id="workflows" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
            CONNECTED BUSINESS WORKFLOW
          </div>
        </div>

        {/* Workflow Horizontal Pipeline */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 overflow-x-auto pb-4">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === workflowSteps.length - 1;

            return (
              <div key={idx} className="flex items-center gap-3 shrink-0 my-2">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl border ${step.color} flex items-center justify-center shadow-xs`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 text-center whitespace-nowrap">
                    {step.name}
                  </span>
                </div>

                {!isLast && (
                  <div className="text-slate-300 font-bold px-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
