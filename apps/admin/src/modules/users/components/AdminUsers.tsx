import { Users, Search, Plus, Filter, Key, Check, Shield } from "lucide-react";

export default function AdminUsers() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight">Role-Based Access Control</h1>
          <p className="text-[13px] text-gray-500 font-medium">Manage permissions, modules, and branch access workflows.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm text-[13px] flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            Filters
          </button>
          <button className="bg-[#1E3A8A] hover:bg-[#152e73] text-white font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-[13px]">
            <Plus className="w-4 h-4" />
            New Role
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Roles List */}
        <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
            <h3 className="text-[14px] font-bold text-[#111827] mb-3">Roles</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] transition-all font-medium placeholder:font-normal placeholder:text-gray-400 shadow-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {[
               { name: "Super Admin", count: 0, icon: Shield, active: true },
               { name: "Owner", count: 0, icon: Key },
               { name: "Finance Manager", count: 0, icon: Users },
               { name: "Store Manager", count: 0, icon: Users },
               { name: "Cashier", count: 0, icon: Users },
             ].map((role) => (
                <div key={role.name} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${role.active ? "bg-[#F8FAFC] border border-[#E5E7EB]" : "hover:bg-gray-50 border border-transparent"}`}>
                  <div className="flex items-center gap-2.5">
                     <div className={`p-1.5 rounded-md ${role.active ? "bg-[#1E3A8A] text-white" : "bg-gray-100 text-gray-500"}`}>
                        <role.icon className="w-3.5 h-3.5" />
                     </div>
                     <span className={`text-[13px] font-semibold ${role.active ? "text-[#1E3A8A]" : "text-[#111827]"}`}>{role.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{role.count}</span>
                </div>
             ))}
          </div>
        </div>

        {/* Matrix */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#111827]">Super Admin Permissions</h3>
              <p className="text-[12px] text-gray-500 font-medium mt-0.5">Full platform access with destructive capabilities.</p>
            </div>
            <button className="text-[13px] font-semibold bg-white border border-[#E5E7EB] text-[#111827] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              Edit Mode
            </button>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-500 w-[250px]">Module / Resource</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 w-[80px] text-center">View</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 w-[80px] text-center">Create</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 w-[80px] text-center">Edit</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 w-[80px] text-center">Delete</th>
                  <th className="px-5 py-3 font-semibold text-gray-500">Approvals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  { section: "Billing & Invoicing", view: true, create: true, edit: true, delete: true, approval: "Yes" },
                  { section: "Inventory (HQ)", view: true, create: true, edit: true, delete: true, approval: "Yes" },
                  { section: "Inventory (Branches)", view: true, create: false, edit: false, delete: false, approval: "No" },
                  { section: "Accounting Ledgers", view: true, create: true, edit: true, delete: false, approval: "Requires Manager" },
                  { section: "GST Reports", view: true, create: true, edit: false, delete: false, approval: "No" },
                  { section: "Settings & Setup", view: true, create: true, edit: true, delete: true, approval: "Yes" },
                  { section: "Workflow Automation", view: true, create: true, edit: true, delete: true, approval: "Yes" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#111827]">{row.section}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="inline-flex w-5 h-5 bg-[#10B981] rounded items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {row.create ? (
                       <div className="inline-flex w-5 h-5 bg-[#10B981] rounded items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                       </div>
                      ) : (
                        <div className="inline-flex w-5 h-5 border border-[#E5E7EB] bg-[#F8FAFC] rounded items-center justify-center"></div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {row.edit ? (
                       <div className="inline-flex w-5 h-5 bg-[#10B981] rounded items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                       </div>
                      ) : (
                        <div className="inline-flex w-5 h-5 border border-[#E5E7EB] bg-[#F8FAFC] rounded items-center justify-center"></div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {row.delete ? (
                       <div className="inline-flex w-5 h-5 bg-[#10B981] rounded items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                       </div>
                      ) : (
                        <div className="inline-flex w-5 h-5 border border-[#E5E7EB] bg-[#F8FAFC] rounded items-center justify-center"></div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-medium">
                      {row.approval}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
