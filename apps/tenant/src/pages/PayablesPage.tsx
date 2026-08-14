import React, { useState } from 'react';
import { 
  FileBox, 
  CreditCard, 
  FileText,
  Plus, 
  Search, 
  Filter, 
  AlertCircle
} from 'lucide-react';

export default function PayablesPage() {
  const [activeTab, setActiveTab] = useState<'bills' | 'payments' | 'statements'>('bills');
  
  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Accounts Payable</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Manage vendor bills, payables, matching, and payments.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'bills' && (
            <button className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Record Vendor Bill
            </button>
          )}
          {activeTab === 'payments' && (
            <button className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Issue Payment
            </button>
          )}
        </div>
      </div>
      
      <div className="px-6 py-2 bg-white border-b border-gray-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('bills')}
          className={`py-2 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'bills' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Vendor Bills
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`py-2 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'payments' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Vendor Payments
        </button>
        <button 
          onClick={() => setActiveTab('statements')}
          className={`py-2 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'statements' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Vendor Statements & Aging
        </button>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`}
                  className="pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-md focus:border-[#1E3A8A] outline-none w-[250px]"
                />
              </div>
              <button className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 cursor-pointer">
                <Filter className="w-4 h-4" />
              </button>
            </div>
            
            {activeTab === 'bills' && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5" />
                0 Matching Exceptions
              </div>
            )}
          </div>
          
          <div className="p-12 text-center flex flex-col items-center justify-center">
            {activeTab === 'bills' && <FileBox className="w-12 h-12 text-gray-300 mb-3" />}
            {activeTab === 'payments' && <CreditCard className="w-12 h-12 text-gray-300 mb-3" />}
            {activeTab === 'statements' && <FileText className="w-12 h-12 text-gray-300 mb-3" />}
            
            <h3 className="text-sm font-bold text-gray-700 mb-1">No {activeTab} found</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Your accounts payable records will appear here once they are created through the legitimate operational flows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
