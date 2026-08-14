import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShoppingCart, 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'requisitions' | 'purchase_orders' | 'receiving'>('purchase_orders');
  
  // Minimal data representation for dashboard preview
  return (
    <div className="flex-1 min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Procurement</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Manage purchase requests, orders, and receiving.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'requisitions' && (
            <button className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> New Requisition
            </button>
          )}
          {activeTab === 'purchase_orders' && (
            <button className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> New Purchase Order
            </button>
          )}
          {activeTab === 'receiving' && (
            <button className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#152a66] rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Record Goods Receipt
            </button>
          )}
        </div>
      </div>
      
      <div className="px-6 py-2 bg-white border-b border-gray-200 flex gap-6">
        <button 
          onClick={() => setActiveTab('requisitions')}
          className={`py-2 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'requisitions' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Purchase Requisitions
        </button>
        <button 
          onClick={() => setActiveTab('purchase_orders')}
          className={`py-2 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'purchase_orders' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Purchase Orders
        </button>
        <button 
          onClick={() => setActiveTab('receiving')}
          className={`py-2 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'receiving' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Goods Receipts
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
                  placeholder={`Search ${activeTab.replace('_', ' ')}...`}
                  className="pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-md focus:border-[#1E3A8A] outline-none w-[250px]"
                />
              </div>
              <button className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 cursor-pointer">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-12 text-center flex flex-col items-center justify-center">
            {activeTab === 'requisitions' && <FileText className="w-12 h-12 text-gray-300 mb-3" />}
            {activeTab === 'purchase_orders' && <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />}
            {activeTab === 'receiving' && <Truck className="w-12 h-12 text-gray-300 mb-3" />}
            
            <h3 className="text-sm font-bold text-gray-700 mb-1">No {activeTab.replace('_', ' ')} found</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Your procurement records will appear here once they are created through the legitimate operational flows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
