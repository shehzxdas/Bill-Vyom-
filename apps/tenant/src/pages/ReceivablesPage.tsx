/**
 * Bill Vyom — Phase 6 Global Accounts Receivable & Customer Collections Console
 * Full double-entry integration, real-time allocations, credit controls, and reconciliation runs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee,
  Plus,
  Search,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Layers,
  History,
  Check,
  Loader2,
  TrendingUp,
  ShieldAlert,
  UserCheck,
  FileSpreadsheet,
  FileText,
  User,
  ExternalLink,
  DollarSign,
  ClipboardList,
  ChevronRight,
  Scale
} from 'lucide-react';
import { useTenant } from '@apps/tenant/src/lib/TenantContext';
import { apiClient } from '../lib/apiClient';
import {
  Receivable,
  ReceivableSchedule,
  Payment,
  CustomerCreditProfile,
  CreditHold,
  CollectionCase,
  CollectionActivity,
  PromiseToPay,
  WriteOffRequest,
  ARReconciliationRun,
  ARReconciliationException,
  Customer,
  Account
} from '../../../../src/domain/types';

type TabType = 'overview' | 'receivables' | 'payments' | 'credit' | 'collections' | 'writeoffs' | 'reconciliation';

export default function ReceivablesPage() {
  const { legalEntity, legalEntities } = useTenant();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  // Core Datasets
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [schedules, setSchedules] = useState<ReceivableSchedule[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [writeOffs, setWriteOffs] = useState<WriteOffRequest[]>([]);
  const [reconciliations, setReconciliations] = useState<ARReconciliationRun[]>([]);
  const [collectionCases, setCollectionCases] = useState<CollectionCase[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [creditProfiles, setCreditProfiles] = useState<CustomerCreditProfile[]>([]);
  const [promises, setPromises] = useState<PromiseToPay[]>([]);

  // Loading & State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-level view states
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<string>('');
  const [statementData, setStatementData] = useState<any | null>(null);
  const [statementLoading, setStatementLoading] = useState<boolean>(false);
  const [statementStartDate, setStatementStartDate] = useState<string>('');
  const [statementEndDate, setStatementEndDate] = useState<string>('');

  // Modals & Forms
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState<boolean>(false);
  const [recordPaymentData, setRecordPaymentData] = useState({
    customer_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    currency_code: 'INR',
    payment_method: 'Bank Transfer',
    payment_reference: '',
    bank_account_id: '',
    notes: ''
  });

  const [isAllocateOpen, setIsAllocateOpen] = useState<boolean>(false);
  const [selectedPaymentForAlloc, setSelectedPaymentForAlloc] = useState<Payment | null>(null);
  const [allocAmountState, setAllocAmountState] = useState<Record<string, string>>({});

  const [isUpdateCreditOpen, setIsUpdateCreditOpen] = useState<boolean>(false);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState<string>('');
  const [creditForm, setCreditForm] = useState({
    credit_limit: '100000.00',
    credit_days: 30,
    credit_status: 'APPROVED' as 'APPROVED' | 'ON_HOLD' | 'SUSPENDED',
    risk_classification: 'MEDIUM'
  });

  const [isWriteOffOpen, setIsWriteOffOpen] = useState<boolean>(false);
  const [writeOffForm, setWriteOffForm] = useState({
    receivable_id: '',
    write_off_amount: '',
    reason: ''
  });

  const [isCollectionActivityOpen, setIsCollectionActivityOpen] = useState<boolean>(false);
  const [selectedCaseForActivity, setSelectedCaseForActivity] = useState<CollectionCase | null>(null);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'CALL' as 'CALL' | 'EMAIL' | 'MESSAGE' | 'MEETING' | 'PROMISE_TO_PAY' | 'NOTE' | 'FOLLOW_UP',
    summary: '',
    notes: ''
  });

  const [isPromiseOpen, setIsPromiseOpen] = useState<boolean>(false);
  const [promiseForm, setPromiseForm] = useState({
    receivable_id: '',
    promised_amount: '',
    promised_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [isReconExceptionsOpen, setIsReconExceptionsOpen] = useState<boolean>(false);
  const [selectedReconRun, setSelectedReconRun] = useState<ARReconciliationRun | null>(null);
  const [reconExceptions, setReconExceptions] = useState<ARReconciliationException[]>([]);

  // Sync Legal Entity
  useEffect(() => {
    if (legalEntity) {
      setSelectedEntityId(legalEntity.id);
    } else if (legalEntities && legalEntities.length > 0) {
      setSelectedEntityId(legalEntities[0].id);
    }
  }, [legalEntity, legalEntities]);

  // General Fetching Logic
  const fetchAllData = useCallback(async () => {
    if (!selectedEntityId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Customers
      const custRes = await fetch(`/api/v1/master/customers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('bv_auth_token')}` }
      });
      const custJson = await custRes.json();
      if (custJson.success) {
        setCustomers(custJson.data || []);
      }

      // 2. Fetch Accounts to find Cash/Bank accounts
      const accountsRes = await apiClient.request<Account[]>(`/accounting/accounts?legal_entity_id=${selectedEntityId}`);
      if (accountsRes.success) {
        const banks = (accountsRes.data || []).filter(
          a => a.account_subtype === 'CASH_AND_EQUIVALENT' || a.account_subtype === 'BANK'
        );
        setBankAccounts(banks);
      }

      // 3. Fetch Receivables
      const recRes = await apiClient.request<Receivable[]>('/receivables');
      if (recRes.success) {
        setReceivables(recRes.data || []);
      }

      // 4. Fetch Schedules
      const schedRes = await apiClient.request<ReceivableSchedule[]>('/receivables/schedules');
      if (schedRes.success) {
        setSchedules(schedRes.data || []);
      }

      // 5. Fetch Payments
      const pmtRes = await apiClient.request<Payment[]>('/receivables/payments');
      if (pmtRes.success) {
        setPayments(pmtRes.data || []);
      }

      // 6. Fetch Write-offs
      const woRes = await apiClient.request<WriteOffRequest[]>('/receivables/write-offs');
      if (woRes.success) {
        setWriteOffs(woRes.data || []);
      }

      // 7. Fetch Reconciliations
      const reconRes = await apiClient.request<ARReconciliationRun[]>('/receivables/reconciliations');
      if (reconRes.success) {
        setReconciliations(reconRes.data || []);
      }

      // 8. Fetch Collection Cases
      const caseRes = await apiClient.request<CollectionCase[]>('/receivables/collection-cases');
      if (caseRes.success) {
        setCollectionCases(caseRes.data || []);
      }

      // 9. Fetch Credit Profiles
      const cpRes = await apiClient.request<CustomerCreditProfile[]>('/receivables/credit-profiles');
      if (cpRes.success) {
        setCreditProfiles(cpRes.data || []);
      }

      // 10. Fetch Promises to Pay
      const promRes = await apiClient.request<PromiseToPay[]>('/receivables/promises');
      if (promRes.success) {
        setPromises(promRes.data || []);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch Accounts Receivable datasets.');
    } finally {
      setLoading(false);
    }
  }, [selectedEntityId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Statement fetching
  const fetchCustomerStatement = async () => {
    if (!selectedCustomerForStatement || !statementStartDate || !statementEndDate) {
      alert('Please specify customer, start date, and end date.');
      return;
    }
    setStatementLoading(true);
    try {
      const res = await apiClient.request<any>(
        `/receivables/statement?customer_id=${selectedCustomerForStatement}&start_date=${statementStartDate}&end_date=${statementEndDate}`
      );
      if (res.success) {
        setStatementData(res.data);
      } else {
        alert(res.errors?.[0]?.message || 'Statement generation rejected.');
      }
    } catch (err) {
      alert('Failed to connect to reconciliation engine.');
    } finally {
      setStatementLoading(false);
    }
  };

  // Recording Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.request<Payment>('/receivables/payments', {
        method: 'POST',
        body: JSON.stringify({
          legal_entity_id: selectedEntityId,
          customer_id: recordPaymentData.customer_id,
          payment_date: recordPaymentData.payment_date,
          amount: recordPaymentData.amount,
          currency_code: recordPaymentData.currency_code,
          payment_method: recordPaymentData.payment_method,
          payment_reference: recordPaymentData.payment_reference,
          bank_account_id: recordPaymentData.bank_account_id,
          notes: recordPaymentData.notes
        })
      });

      if (res.success) {
        setIsRecordPaymentOpen(false);
        // Reset
        setRecordPaymentData({
          customer_id: '',
          payment_date: new Date().toISOString().split('T')[0],
          amount: '',
          currency_code: 'INR',
          payment_method: 'Bank Transfer',
          payment_reference: '',
          bank_account_id: '',
          notes: ''
        });
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Failed to record customer payment.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record payment due to backend error.');
    }
  };

  // Confirm Payment
  const handleConfirmPayment = async (paymentId: string) => {
    try {
      const res = await apiClient.request<Payment>(`/receivables/payments/${paymentId}/confirm`, {
        method: 'POST'
      });
      if (res.success) {
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Confirmation failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reverse Payment
  const handleReversePayment = async (paymentId: string) => {
    const reason = prompt('Please specify the legal reason for payment reversal (mandatory):');
    if (!reason) return;
    try {
      const res = await apiClient.request<Payment>(`/receivables/payments/${paymentId}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      if (res.success) {
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Reversal failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Refund Payment
  const handleRefundPayment = async (paymentId: string) => {
    const amt = prompt('Please specify refund amount:');
    if (!amt) return;
    try {
      const res = await apiClient.request<any>(`/receivables/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ refund_amount: amt })
      });
      if (res.success) {
        alert('Refund generated and posted back to general ledger successfully.');
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Refund rejected.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Allocate Payment
  const handleOpenAllocate = (payment: Payment) => {
    setSelectedPaymentForAlloc(payment);
    setAllocAmountState({});
    setIsAllocateOpen(true);
  };

  const handleAllocatePaymentSubmit = async () => {
    if (!selectedPaymentForAlloc) return;
    const allocationsList = Object.entries(allocAmountState)
      .filter(([_, amt]) => parseFloat(amt as string) > 0)
      .map(([recId, amt]) => ({
        receivable_id: recId,
        amount: amt as string
      }));

    if (allocationsList.length === 0) {
      alert('Please specify at least one positive allocation amount.');
      return;
    }

    try {
      const res = await apiClient.request<Payment>(`/receivables/payments/${selectedPaymentForAlloc.id}/allocate`, {
        method: 'POST',
        body: JSON.stringify({ allocations: allocationsList })
      });
      if (res.success) {
        setIsAllocateOpen(false);
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Allocation rejected.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCustomerCreditProfile = (customerId: string): Partial<CustomerCreditProfile> => {
    const found = creditProfiles.find(p => p.customer_id === customerId);
    if (found) return found;
    return {
      credit_limit: '100000.00',
      credit_days: 30,
      credit_status: 'APPROVED',
      risk_classification: 'MEDIUM',
      credit_hold_status: 'NONE'
    };
  };

  // Credit Profile Setup/Update
  const handleOpenUpdateCredit = (customerId: string) => {
    setSelectedCreditCustomer(customerId);
    const profile = creditProfiles.find(
      p => p.customer_id === customerId
    );
    setCreditForm({
      credit_limit: profile?.credit_limit || '100000.00',
      credit_days: profile?.credit_days || 30,
      credit_status: (profile?.credit_status as any) || 'APPROVED',
      risk_classification: profile?.risk_classification || 'MEDIUM'
    });
    setIsUpdateCreditOpen(true);
  };

  const handleUpdateCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.request<any>(`/receivables/credit-profiles/${selectedCreditCustomer}`, {
        method: 'PUT',
        body: JSON.stringify(creditForm)
      });
      if (res.success) {
        setIsUpdateCreditOpen(false);
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Update credit profile failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Credit Hold
  const handleCreateCreditHold = async (customerId: string) => {
    const reason = prompt('Please specify risk reasoning for placing account on credit hold:');
    if (!reason) return;
    try {
      const res = await apiClient.request<any>(`/receivables/credit-holds`, {
        method: 'POST',
        body: JSON.stringify({ customer_id: customerId, reason })
      });
      if (res.success) {
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Failed to place credit hold.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Release Credit Hold
  const handleReleaseCreditHold = async (customerId: string) => {
    const reason = prompt('Please specify validation reason for releasing credit hold:');
    if (!reason) return;
    try {
      const res = await apiClient.request<any>(`/receivables/credit-holds/release`, {
        method: 'POST',
        body: JSON.stringify({ customer_id: customerId, reason })
      });
      if (res.success) {
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Failed to release credit hold.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Request Bad Debt Write-Off
  const handleWriteOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.request<any>('/receivables/write-offs', {
        method: 'POST',
        body: JSON.stringify(writeOffForm)
      });
      if (res.success) {
        setIsWriteOffOpen(false);
        setWriteOffForm({ receivable_id: '', write_off_amount: '', reason: '' });
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Write-off request failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Approve Bad Debt Write-Off
  const handleApproveWriteOff = async (requestId: string) => {
    if (!confirm('Are you absolutely sure you want to approve this bad debt write-off? This will post directly to GL Expense Accounts.')) return;
    try {
      const res = await apiClient.request<any>(`/receivables/write-offs/${requestId}/approve`, {
        method: 'POST'
      });
      if (res.success) {
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Approval rejected.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Run AR Reconciliation
  const handleRunReconciliation = async () => {
    try {
      const res = await apiClient.request<any>('/receivables/reconciliations/run', {
        method: 'POST',
        body: JSON.stringify({
          legal_entity_id: selectedEntityId,
          as_of_date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.success) {
        alert('AR subledger and General Ledger reconciliation execution completed successfully.');
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Reconciliation failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // View exceptions
  const handleViewExceptions = async (run: ARReconciliationRun) => {
    setSelectedReconRun(run);
    try {
      const res = await apiClient.request<ARReconciliationException[]>(`/receivables/reconciliations/${run.id}/exceptions`);
      if (res.success) {
        setReconExceptions(res.data || []);
        setIsReconExceptionsOpen(true);
      } else {
        alert('Failed to load reconciliation exceptions.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Rebuild customer AR projections
  const handleRebuildProjections = async (customerId: string) => {
    try {
      const res = await apiClient.request<any>('/receivables/rebuild', {
        method: 'POST',
        body: JSON.stringify({ customer_id: customerId })
      });
      if (res.success) {
        alert('Customer accounts receivable balances successfully recalculated and synchronized with ledger transactions.');
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Recalculation failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Auto trigger Collections Case
  const handleCreateCollectionCase = async (customerId: string) => {
    const priority = prompt('Specify priority level (LOW, MEDIUM, HIGH, CRITICAL):', 'MEDIUM');
    if (!priority) return;
    try {
      const res = await apiClient.request<any>('/receivables/collection-cases', {
        method: 'POST',
        body: JSON.stringify({ customer_id: customerId, priority })
      });
      if (res.success) {
        alert('Collection dispute case created.');
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Creation failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add Case Activity
  const handleCaseActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForActivity) return;
    try {
      const res = await apiClient.request<any>(`/receivables/collection-cases/${selectedCaseForActivity.id}/activities`, {
        method: 'POST',
        body: JSON.stringify(activityForm)
      });
      if (res.success) {
        setIsCollectionActivityOpen(false);
        setActivityForm({ activity_type: 'CALL', summary: '', notes: '' });
        fetchAllData();
      } else {
        alert(res.errors?.[0]?.message || 'Failed to record collection activity.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Helpers
  const getCustomerName = (id: string) => {
    const c = customers.find(item => item.id === id);
    return c ? c.customer_name : `Customer (${id.slice(-6)})`;
  };

  // Financial aggregates
  const totalReceivablesAmt = receivables.reduce(
    (sum, r) => sum + parseFloat(r.outstanding_amount || '0'),
    0
  );
  const overdueReceivablesAmt = receivables
    .filter(r => r.status === 'OVERDUE')
    .reduce((sum, r) => sum + parseFloat(r.outstanding_amount || '0'), 0);

  const activeHoldsCount = customers.filter(
    c => c.credit_config?.credit_status === 'SUSPENDED'
  ).length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20 rounded uppercase tracking-wider">
              Receivables Hub
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded uppercase tracking-wider">
              Phase 6 Enterprise AR
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-[#1E3A8A]" />
            <span>Accounts Receivable & Collections</span>
          </h1>
          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
            Collect faster with high-definition credit management, automatic invoice-receivable mapping, secure dunning policies, and ledger reconciliation.
          </p>
        </div>

        {/* Context switch */}
        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl p-2">
          <Building className="w-4 h-4 text-gray-400 shrink-0 ml-1.5" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">Active Entity context</span>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="bg-transparent border-none text-[12px] font-extrabold text-[#111827] focus:outline-none focus:ring-0 cursor-pointer pr-4 pt-0.5"
            >
              {legalEntities.map((le) => (
                <option key={le.id} value={le.id}>
                  {le.legal_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Total Outstanding</span>
            <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            ₹{totalReceivablesAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Active ledger invoices awaiting settlement</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-[#EF4444] uppercase tracking-wider">Overdue Risk Balance</span>
            <AlertTriangle className="w-4.5 h-4.5 text-[#EF4444]" />
          </div>
          <div className="text-2xl font-black text-[#EF4444]">
            ₹{overdueReceivablesAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Invoices past grace period thresholds</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Blocked Credit Accounts</span>
            <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {activeHoldsCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Customers suspended due to risk limit breach</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Active Collections Cases</span>
            <ClipboardList className="w-4.5 h-4.5 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">
            {collectionCases.filter(c => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Open cases in dispute or recovery workflow</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 pb-px">
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'receivables', name: 'Receivables Ledger' },
          { id: 'payments', name: 'Payment & Allocation' },
          { id: 'credit', name: 'Credit Control Profiles' },
          { id: 'collections', name: 'Collections Case Center' },
          { id: 'writeoffs', name: 'Bad Debt Write-Offs' },
          { id: 'reconciliation', name: 'Subledger Reconciliation' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType);
              setStatementData(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 uppercase tracking-wider -mb-px ${
              activeTab === tab.id
                ? 'border-[#1E3A8A] text-[#1E3A8A] font-extrabold'
                : 'border-transparent text-gray-400 hover:text-gray-900'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1E3A8A]" />
          <span className="text-xs font-semibold text-gray-500">Synchronizing database tables with subledger balances...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl p-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Core Workflows */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Statement Generator */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Real-time Statement Generator</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer</label>
                      <select
                        value={selectedCustomerForStatement}
                        onChange={(e) => setSelectedCustomerForStatement(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-extrabold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select customer...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.customer_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Date</label>
                      <input
                        type="date"
                        value={statementStartDate}
                        onChange={(e) => setStatementStartDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Date</label>
                      <input
                        type="date"
                        value={statementEndDate}
                        onChange={(e) => setStatementEndDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={fetchCustomerStatement}
                    className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    Generate Statements
                  </button>

                  {/* Render Statement */}
                  {statementLoading && <div className="text-center text-xs text-gray-500 py-4 animate-pulse">Running SQL procedures for historical reconciliations...</div>}
                  {statementData && (
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-4">
                      <div className="flex justify-between items-center text-xs font-extrabold">
                        <span className="text-gray-500">Opening Balance: ₹{parseFloat(statementData.opening_balance).toFixed(2)}</span>
                        <span className="text-gray-900">Closing Balance: ₹{parseFloat(statementData.closing_balance).toFixed(2)}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] font-medium text-gray-500">
                          <thead className="bg-white border-b border-gray-200 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Reference</th>
                              <th className="py-2 px-3">Description</th>
                              <th className="py-2 px-3 text-right">Debit</th>
                              <th className="py-2 px-3 text-right">Credit</th>
                              <th className="py-2 px-3 text-right">Running</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statementData.lines.map((line: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100">
                                <td className="py-2 px-3 font-semibold text-gray-900">{line.date}</td>
                                <td className="py-2 px-3 font-mono text-gray-700">{line.reference}</td>
                                <td className="py-2 px-3">{line.description}</td>
                                <td className="py-2 px-3 text-right text-red-600 font-semibold">{parseFloat(line.debit) > 0 ? `+₹${parseFloat(line.debit).toFixed(2)}` : '-'}</td>
                                <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{parseFloat(line.credit) > 0 ? `-₹${parseFloat(line.credit).toFixed(2)}` : '-'}</td>
                                <td className="py-2 px-3 text-right text-gray-900 font-bold">₹{parseFloat(line.running_balance).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Outstanding Schedules */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Upcoming Receivable Schedules</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-500">
                      <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Rec Number</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4 text-right">Schedule Amount</th>
                          <th className="py-3 px-4 text-right">Allocated</th>
                          <th className="py-3 px-4 text-right">Outstanding</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.slice(0, 5).map((sched) => {
                          const parentRec = receivables.find(r => r.id === sched.receivable_id);
                          return (
                            <tr key={sched.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-extrabold text-gray-900">
                                {parentRec ? parentRec.receivable_number : 'REC-UNLINKED'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-600">{sched.due_date}</td>
                              <td className="py-3 px-4 text-right font-semibold">₹{parseFloat(sched.amount).toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-semibold text-emerald-600">₹{parseFloat(sched.allocated_amount).toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">₹{parseFloat(sched.outstanding_amount).toFixed(2)}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  sched.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {sched.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {schedules.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-xs text-gray-400 font-semibold">
                              No receivable schedules logged in system.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column: Risk / Quick Operations */}
              <div className="space-y-6">
                
                {/* Fast Billing Operations */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                    Core Operations
                  </h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setIsRecordPaymentOpen(true)}
                      className="w-full bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 transition-all font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Record Payment receipt</span>
                    </button>
                    <button
                      onClick={handleRunReconciliation}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Scale className="w-4 h-4 text-blue-700" />
                      <span>Run AR Reconciliation</span>
                    </button>
                  </div>
                </div>

                {/* Risk Alerts & Holds */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
                    <span>Real-time Risk Watches</span>
                  </h3>
                  <div className="space-y-3.5">
                    {customers.slice(0, 4).map((c) => {
                      const profile = getCustomerCreditProfile(c.id);
                      return (
                        <div key={c.id} className="flex justify-between items-start gap-2 border-b border-gray-50 pb-2">
                          <div>
                            <span className="text-xs font-black text-gray-900 block leading-tight">{c.customer_name}</span>
                            <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">Limit: ₹{parseFloat(profile.credit_limit || '0').toFixed(2)} | Overdue: {profile.credit_days || 0} days</span>
                          </div>
                          <div>
                            {profile.credit_hold_status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleReleaseCreditHold(c.id)}
                                className="px-2 py-1 text-[9px] font-extrabold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded uppercase tracking-wider shrink-0"
                              >
                                Release Hold
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCreateCreditHold(c.id)}
                                className="px-2 py-1 text-[9px] font-extrabold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 rounded uppercase tracking-wider shrink-0"
                              >
                                Place Hold
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: RECEIVABLES LOG */}
          {activeTab === 'receivables' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Receivables Master Log</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const id = prompt('Please specify receivable_id to write off:');
                      const amt = prompt('Please specify write-off amount:');
                      const reas = prompt('Write-off reason:');
                      if (id && amt && reas) {
                        setWriteOffForm({ receivable_id: id, write_off_amount: amt, reason: reas });
                        handleWriteOffSubmit({ preventDefault: () => {} } as any);
                      }
                    }}
                    className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Request Write-off</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Rec ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Invoice Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Original Amount</th>
                      <th className="py-3 px-4 text-right">Allocated Amount</th>
                      <th className="py-3 px-4 text-right">Outstanding Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivables.map((rec) => (
                      <tr key={rec.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono font-extrabold text-gray-900">{rec.receivable_number}</td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{getCustomerName(rec.customer_id)}</td>
                        <td className="py-3 px-4 font-semibold text-gray-500">{rec.invoice_date}</td>
                        <td className="py-3 px-4 font-semibold text-gray-500">{rec.due_date}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">₹{parseFloat(rec.original_amount).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">₹{parseFloat(rec.allocated_amount).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">₹{parseFloat(rec.outstanding_amount).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            rec.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            rec.status === 'PARTIALLY_SETTLED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            rec.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setWriteOffForm({ receivable_id: rec.id, write_off_amount: rec.outstanding_amount, reason: 'Bad Debt recovery failure' });
                                setIsWriteOffOpen(true);
                              }}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded text-[10px] font-bold"
                            >
                              Write-off
                            </button>
                            <button
                              onClick={() => handleRebuildProjections(rec.customer_id)}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded text-[10px] font-bold"
                            >
                              Recalc
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {receivables.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-gray-400 font-semibold">
                          No accounts receivable recorded. Trigger billing or post an invoice first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS & ALLOCATION */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Customer Payments Received</h3>
                <button
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 transition-all font-extrabold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Customer Payment</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Payment Number</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Method / Ref</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Journal Posted</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pmt) => (
                      <tr key={pmt.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono font-extrabold text-gray-900">{pmt.payment_number}</td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{getCustomerName(pmt.customer_id)}</td>
                        <td className="py-3 px-4 font-semibold text-gray-500">{pmt.payment_date}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-gray-900">₹{parseFloat(pmt.amount).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block text-gray-800">{pmt.payment_method}</span>
                          <span className="text-[10px] text-gray-400 block font-mono">{pmt.reference}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            pmt.status === 'FULLY_ALLOCATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            pmt.status === 'UNAPPLIED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            pmt.status === 'RECEIVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {pmt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-400 text-[10px]">
                          {pmt.journal_entry_id ? pmt.journal_entry_id.slice(-8) : 'Pending Confirmation'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5">
                            {pmt.status === 'RECEIVED' && (
                              <button
                                onClick={() => handleConfirmPayment(pmt.id)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 rounded text-[10px] font-extrabold"
                              >
                                Confirm & GL Post
                              </button>
                            )}
                            {(pmt.status === 'UNAPPLIED' || pmt.status === 'PARTIALLY_ALLOCATED') && (
                              <button
                                onClick={() => handleOpenAllocate(pmt)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 rounded text-[10px] font-extrabold"
                              >
                                Allocate Cash
                              </button>
                            )}
                            {pmt.status !== 'REVERSED' && (
                              <>
                                <button
                                  onClick={() => handleReversePayment(pmt.id)}
                                  className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 rounded text-[10px] font-semibold"
                                >
                                  Reverse
                                </button>
                                <button
                                  onClick={() => handleRefundPayment(pmt.id)}
                                  className="px-2 py-1 bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 rounded text-[10px] font-semibold"
                                >
                                  Refund
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-gray-400 font-semibold">
                          No payment receipts recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CREDIT CONTROL PROFILES */}
          {activeTab === 'credit' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Customer Credit Profiles</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4 text-right">Credit Limit</th>
                      <th className="py-3 px-4 text-right">Credit Days Limit</th>
                      <th className="py-3 px-4">Risk Classification</th>
                      <th className="py-3 px-4">Credit Status</th>
                      <th className="py-3 px-4">Hold Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => {
                      const profile = getCustomerCreditProfile(c.id);
                      return (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-extrabold text-gray-900">{c.customer_name}</td>
                          <td className="py-3 px-4 text-right font-extrabold">₹{parseFloat(profile.credit_limit || '0').toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-600">{profile.credit_days || 0} days</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              profile.risk_classification === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              profile.risk_classification === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {profile.risk_classification} RISK
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              profile.credit_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              profile.credit_status === 'ON_HOLD' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {profile.credit_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {profile.credit_hold_status === 'ACTIVE' ? (
                              <span className="text-red-600 flex items-center gap-1 font-extrabold uppercase text-[10px]">
                                <XCircle className="w-4 h-4" /> HOLD ON ACCOUNT
                              </span>
                            ) : (
                              <span className="text-emerald-600 flex items-center gap-1 font-semibold text-[10px]">
                                <Check className="w-4 h-4" /> CLEAR
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleOpenUpdateCredit(c.id)}
                                className="px-2.5 py-1 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 rounded text-[10px] font-extrabold uppercase tracking-wider"
                              >
                                Edit Profile
                              </button>
                              {profile.credit_hold_status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleReleaseCreditHold(c.id)}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[10px] font-bold"
                                >
                                  Release Hold
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCreateCreditHold(c.id)}
                                  className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded text-[10px] font-bold"
                                >
                                  Apply Hold
                                </button>
                              )}
                              <button
                                onClick={() => handleCreateCollectionCase(c.id)}
                                className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 rounded text-[10px] font-semibold"
                              >
                                Collect Case
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: COLLECTIONS CASE CENTER */}
          {activeTab === 'collections' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Cases List */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Active Recovery Cases</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-500">
                    <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Case Num</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4 text-right">Overdue Amt</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectionCases.map((cs) => (
                        <tr key={cs.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono font-extrabold text-gray-900">{cs.case_number}</td>
                          <td className="py-3 px-4 font-semibold text-gray-700">{getCustomerName(cs.customer_id)}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-red-600">₹{parseFloat(cs.amount_overdue).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              cs.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              cs.priority === 'HIGH' ? 'bg-red-50 text-red-700' :
                              cs.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {cs.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              {cs.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setSelectedCaseForActivity(cs);
                                  setIsCollectionActivityOpen(true);
                                }}
                                className="px-2.5 py-1 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 rounded text-[10px] font-extrabold uppercase tracking-wider"
                              >
                                Log Activity
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {collectionCases.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-gray-400 font-semibold">
                            No active dunning recovery cases open.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side: Promise-to-Pay Records */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Promises to Pay</span>
                </h3>
                <div className="space-y-3">
                  {promises.map((promise) => (
                    <div key={promise.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Date: {promise.promised_date}</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                          {promise.status}
                        </span>
                      </div>
                      <div className="text-xs font-black text-gray-900">₹{parseFloat(promise.promised_amount).toFixed(2)}</div>
                      <p className="text-[10px] text-gray-500 font-medium">Customer: {getCustomerName(promise.customer_id)}</p>
                    </div>
                  ))}
                  {promises.length === 0 && (
                    <p className="text-xs text-gray-400 font-semibold py-4 text-center">No active promises recorded yet.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: BAD DEBT WRITE-OFFS */}
          {activeTab === 'writeoffs' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Bad Debt Write-off Registers</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">WOR Request Number</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Write-Off Amount</th>
                      <th className="py-3 px-4">Reason Statement</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {writeOffs.map((wo) => (
                      <tr key={wo.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono font-extrabold text-gray-900">{wo.request_number}</td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{getCustomerName(wo.customer_id)}</td>
                        <td className="py-3 px-4 font-extrabold text-red-600">₹{parseFloat(wo.amount).toFixed(2)}</td>
                        <td className="py-3 px-4 font-semibold text-gray-500">{wo.reason}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            wo.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {wo.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {wo.status === 'PENDING' && (
                            <button
                              onClick={() => handleApproveWriteOff(wo.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded text-[10px] font-extrabold uppercase tracking-wider"
                            >
                              Approve & post expense
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {writeOffs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-gray-400 font-semibold">
                          No write-off requests or logs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: RECONCILIATION */}
          {activeTab === 'reconciliation' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden space-y-6">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Subledger to GL Account Balance Reconciliation</h3>
                  <p className="text-[11px] text-gray-400 font-semibold mt-1">Runs automated validation rules across Accounts Receivable ledger and transaction histories.</p>
                </div>
                <button
                  onClick={handleRunReconciliation}
                  className="bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 transition-all font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                >
                  <Scale className="w-4 h-4" />
                  <span>Execute AR Reconciliation</span>
                </button>
              </div>

              <div className="p-5">
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs text-gray-500">
                    <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Run number</th>
                        <th className="py-3 px-4">Reconciliation Date</th>
                        <th className="py-3 px-4 text-right">Subledger Total</th>
                        <th className="py-3 px-4 text-right">GL Total</th>
                        <th className="py-3 px-4 text-right">Difference</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Validation exceptions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliations.map((run) => (
                        <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono font-extrabold text-gray-900">{run.run_number}</td>
                          <td className="py-3 px-4 font-semibold text-gray-600">{run.reconciliation_date}</td>
                          <td className="py-3 px-4 text-right font-semibold">₹{parseFloat(run.subledger_total).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold">₹{parseFloat(run.gl_total).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-red-600">₹{parseFloat(run.difference).toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                              run.status === 'RECONCILED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {run.status === 'EXCEPTION' ? (
                              <button
                                onClick={() => handleViewExceptions(run)}
                                className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded text-[10px] font-extrabold uppercase tracking-wider"
                              >
                                View Exceptions
                              </button>
                            ) : (
                              <span className="text-emerald-600 text-[10px] font-extrabold">Passed Audit</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {reconciliations.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-gray-400 font-semibold">
                            No reconciliation audits executed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: RECORD PAYMENT */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Record Customer Payment Receipt</h3>
              <button onClick={() => setIsRecordPaymentOpen(false)} className="text-gray-400 hover:text-gray-900 font-extrabold text-sm">✕</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer</label>
                <select
                  required
                  value={recordPaymentData.customer_id}
                  onChange={(e) => setRecordPaymentData({ ...recordPaymentData, customer_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={recordPaymentData.payment_date}
                    onChange={(e) => setRecordPaymentData({ ...recordPaymentData, payment_date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Amount (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={recordPaymentData.amount}
                    onChange={(e) => setRecordPaymentData({ ...recordPaymentData, amount: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Method</label>
                  <select
                    value={recordPaymentData.payment_method}
                    onChange={(e) => setRecordPaymentData({ ...recordPaymentData, payment_method: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="UTR / Cheque Number"
                    value={recordPaymentData.payment_reference}
                    onChange={(e) => setRecordPaymentData({ ...recordPaymentData, payment_reference: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Receiving Bank / Cash Account (General Ledger)</label>
                <select
                  required
                  value={recordPaymentData.bank_account_id}
                  onChange={(e) => setRecordPaymentData({ ...recordPaymentData, bank_account_id: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                >
                  <option value="">Select accounting ledger account...</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notes / Narration</label>
                <textarea
                  placeholder="Memo details for accounting general entry..."
                  value={recordPaymentData.notes}
                  onChange={(e) => setRecordPaymentData({ ...recordPaymentData, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 rounded-xl text-xs font-extrabold uppercase tracking-wider"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CASH ALLOCATION */}
      {isAllocateOpen && selectedPaymentForAlloc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Allocate Cash Receipt</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Payment {selectedPaymentForAlloc.payment_number} (Unallocated: ₹{parseFloat(selectedPaymentForAlloc.amount).toFixed(2)})</p>
              </div>
              <button onClick={() => setIsAllocateOpen(false)} className="text-gray-400 hover:text-gray-900 font-extrabold text-sm">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Open Receivables for {getCustomerName(selectedPaymentForAlloc.customer_id)}</h4>
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-400 uppercase text-[9px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Rec Code</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Outstanding</th>
                      <th className="py-2.5 px-3 text-right">Allocation Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivables
                      .filter(r => r.customer_id === selectedPaymentForAlloc.customer_id && r.status !== 'SETTLED')
                      .map((rec) => (
                        <tr key={rec.id} className="border-b border-gray-50">
                          <td className="py-2.5 px-3 font-mono font-extrabold text-gray-900">{rec.receivable_number}</td>
                          <td className="py-2.5 px-3 font-semibold text-gray-500">{rec.due_date}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-gray-900">₹{parseFloat(rec.outstanding_amount).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={allocAmountState[rec.id] || ''}
                              onChange={(e) => setAllocAmountState({ ...allocAmountState, [rec.id]: e.target.value })}
                              className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-right text-xs font-bold"
                            />
                          </td>
                        </tr>
                      ))}
                    {receivables.filter(r => r.customer_id === selectedPaymentForAlloc.customer_id && r.status !== 'SETTLED').length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-gray-400 font-semibold">
                          No open outstanding invoices/receivables found for this customer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAllocateOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAllocatePaymentSubmit}
                  className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 rounded-xl text-xs font-extrabold uppercase tracking-wider"
                >
                  Post Allocation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT CREDIT PROFILE */}
      {isUpdateCreditOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 uppercase">Customer Credit Configuration</h3>
              <button onClick={() => setIsUpdateCreditOpen(false)} className="text-gray-400 hover:text-gray-900 font-extrabold">✕</button>
            </div>
            <form onSubmit={handleUpdateCreditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max Credit Limit (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={creditForm.credit_limit}
                  onChange={(e) => setCreditForm({ ...creditForm, credit_limit: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Max Credit Days</label>
                  <input
                    type="number"
                    required
                    value={creditForm.credit_days}
                    onChange={(e) => setCreditForm({ ...creditForm, credit_days: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Risk Rating</label>
                  <select
                    value={creditForm.risk_classification}
                    onChange={(e) => setCreditForm({ ...creditForm, risk_classification: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="LOW">LOW RISK</option>
                    <option value="MEDIUM">MEDIUM RISK</option>
                    <option value="HIGH">HIGH RISK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Overall Status</label>
                <select
                  value={creditForm.credit_status}
                  onChange={(e) => setCreditForm({ ...creditForm, credit_status: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                >
                  <option value="APPROVED">APPROVED (Trading Active)</option>
                  <option value="ON_HOLD">ON_HOLD (Awaiting Review)</option>
                  <option value="SUSPENDED">SUSPENDED (System Hold)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateCreditOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 rounded-xl text-xs font-extrabold uppercase tracking-wider"
                >
                  Save Credit Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: WRITE OFF REQUEST */}
      {isWriteOffOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-gray-900 uppercase">Write-off Bad Debt Request</h3>
              <button onClick={() => setIsWriteOffOpen(false)} className="text-gray-400 hover:text-gray-900 font-extrabold">✕</button>
            </div>
            <form onSubmit={handleWriteOffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Write-off Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={writeOffForm.write_off_amount}
                  onChange={(e) => setWriteOffForm({ ...writeOffForm, write_off_amount: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reason / Dispute Summary</label>
                <textarea
                  required
                  value={writeOffForm.reason}
                  onChange={(e) => setWriteOffForm({ ...writeOffForm, reason: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  rows={3}
                  placeholder="Insolvency, legal dispute settlement, customer liquidation..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWriteOffOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider"
                >
                  Submit write-off request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: LOG COLLECTION ACTIVITY */}
      {isCollectionActivityOpen && selectedCaseForActivity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase">Log Collection Activity</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Case {selectedCaseForActivity.case_number}</p>
              </div>
              <button onClick={() => setIsCollectionActivityOpen(false)} className="text-gray-400 font-extrabold">✕</button>
            </div>
            <form onSubmit={handleCaseActivitySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Activity Type</label>
                <select
                  value={activityForm.activity_type}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none"
                >
                  <option value="CALL">Call with Customer Accounts team</option>
                  <option value="EMAIL">Email Dunning Alert</option>
                  <option value="MEETING">Dispute Escalation Meeting</option>
                  <option value="NOTE">Internal Case Memo Note</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">One Line Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Talked to CFO regarding Invoice status"
                  value={activityForm.summary}
                  onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Additional Notes</label>
                <textarea
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCollectionActivityOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 rounded-xl text-xs font-extrabold uppercase tracking-wider"
                >
                  Post Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: RECONCILIATION RUN EXCEPTIONS */}
      {isReconExceptionsOpen && selectedReconRun && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase">Subledger Reconciliation Audit Exceptions</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Run Audit Number: {selectedReconRun.run_number}</p>
              </div>
              <button onClick={() => setIsReconExceptionsOpen(false)} className="text-gray-400 font-extrabold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs text-gray-500">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[9px]">
                    <tr>
                      <th className="py-2.5 px-3">Detected At</th>
                      <th className="py-2.5 px-3 text-right">Mismatch Amt</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconExceptions.map((ex) => (
                      <tr key={ex.id} className="border-b border-gray-50">
                        <td className="py-2.5 px-3 font-semibold text-gray-700">{ex.detected_at.split('T')[0]}</td>
                        <td className="py-2.5 px-3 text-right font-black text-red-600">₹{parseFloat(ex.mismatch_amount).toFixed(2)}</td>
                        <td className="py-2.5 px-3">{ex.notes}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-extrabold uppercase">
                            {ex.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reconExceptions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-xs text-gray-400 font-semibold">
                          No mismatch exceptions logged for this run.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsReconExceptionsOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
