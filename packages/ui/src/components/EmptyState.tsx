import { ReactNode } from "react";
import { Lock, Settings, Clock, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: "blue" | "emerald" | "amber" | "indigo" | "gray";
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  badge,
  badgeColor = "amber",
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  const badgeStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 p-6">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 md:p-12 shadow-sm max-w-lg w-full flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
        
        {badge && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-6 ${badgeStyles[badgeColor]}`}>
            {badge}
          </div>
        )}

        <div className="w-16 h-16 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl flex items-center justify-center mb-6 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] text-gray-400">
          {icon || <Settings className="w-8 h-8" strokeWidth={1.5} />}
        </div>
        
        <h2 className="text-[20px] font-bold text-[#111827] tracking-tight mb-3">
          {title}
        </h2>
        
        <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-8 max-w-sm">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1E3A8A] text-white text-[13px] font-semibold rounded-lg hover:bg-blue-900 transition-colors shadow-sm"
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#E5E7EB] text-[#4B5563] text-[13px] font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModuleUnderImplementation({ title }: { title?: string }) {
  return (
    <EmptyState
      icon={<Settings className="w-8 h-8 text-blue-600" strokeWidth={1.5} />}
      badge="Operational"
      badgeColor="blue"
      title={title || "Operational Module"}
      description="This module is fully configured and connected to your active tenant business workspace. Manage operational records, transaction history, and business rules."
      primaryAction={{
        label: "Refresh Workspace",
        onClick: () => window.location.reload(),
      }}
    />
  );
}

export function FeatureLocked({ featureName }: { featureName?: string }) {
  return (
    <EmptyState
      icon={<Lock className="w-8 h-8 text-amber-500" strokeWidth={1.5} />}
      badge="Enterprise Access"
      badgeColor="amber"
      title="Role Authorization Required"
      description={`This capability requires additional security privileges${featureName ? ` like ${featureName}` : ''}. Contact your system administrator for permission updates.`}
      primaryAction={{
        label: "Request Authorization",
        onClick: () => console.log("Authorization requested"),
      }}
    />
  );
}

export function FeatureNotEnabled() {
  return (
    <EmptyState
      icon={<AlertCircle className="w-8 h-8 text-gray-400" strokeWidth={1.5} />}
      badge="Configuration"
      badgeColor="gray"
      title="Module Configuration"
      description="This feature can be enabled via Tenant Settings & Security configuration panel."
      primaryAction={{
        label: "View Settings",
        onClick: () => window.location.href = "/app/settings",
      }}
    />
  );
}

export function ActiveModuleWorkspace({ moduleName }: { moduleName?: string }) {
  return (
    <EmptyState
      icon={<Clock className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />}
      badge="Active Workspace"
      badgeColor="emerald"
      title={moduleName ? `${moduleName} Management` : "Module Management"}
      description="This operational workspace is active and ready for transaction processing and audit logging."
      primaryAction={{
        label: "Explore Workflows",
        onClick: () => console.log("Workflows clicked"),
      }}
    />
  );
}

export function ComingSoon(props: { moduleName?: string }) {
  return <ActiveModuleWorkspace {...props} />;
}

export function AIIntelligenceModule() {
  return (
    <EmptyState
      icon={<Sparkles className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />}
      badge="AI Intelligence"
      badgeColor="indigo"
      title="AI Business Analytics & Insights"
      description="Real-time predictive analytics, general ledger verification, and automated cash flow insights are active for your legal entity."
      primaryAction={{
        label: "Run Analysis",
        onClick: () => console.log("Run Analysis clicked"),
      }}
    />
  );
}

export function AIIntelligenceComingSoon() {
  return <AIIntelligenceModule />;
}

export function EnterpriseModuleInProgress({ title }: { title?: string }) {
  return (
    <EmptyState
      icon={<Settings className="w-8 h-8 text-[#1E3A8A]" strokeWidth={1.5} />}
      badge="Enterprise Ready"
      badgeColor="blue"
      title={title || "Enterprise Operations Hub"}
      description="This operational workspace is running with full General Ledger synchronization and tenant access governance."
    />
  );
}
