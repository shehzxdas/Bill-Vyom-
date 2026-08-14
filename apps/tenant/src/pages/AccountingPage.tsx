/**
 * Bill Vyom — Global Accounting Core & Double-Entry Ledger Console
 * Production-grade financial infrastructure interface with zero-mock data policies.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calculator,
  Plus,
  Search,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Lock,
  Unlock,
  Layers,
  History,
  Check,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { useTenant } from '@apps/tenant/src/lib/TenantContext';
import { apiClient } from '../lib/apiClient';
import {
  Account,
  AccountType,
  AccountSubtype,
  NormalBalance,
  JournalEntry,
  JournalLine,
  FiscalPeriod,
  AccountingDimension,
  TrialBalanceReport,
  TrialBalanceItem,
  GeneralLedgerStatement,
  GeneralLedgerLine,
} from '../../../../src/domain/types';

type TabType = 'coa' | 'journals' | 'ledger' | 'trial' | 'periods';

export default function AccountingPage() {
  const { legalEntity, legalEntities } = useTenant();
  const [activeTab, setActiveTab] = useState<TabType>('coa');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  // Sync with active context legal entity
  useEffect(() => {
    if (legalEntity) {
      setSelectedEntityId(legalEntity.id);
    } else if (legalEntities && legalEntities.length > 0) {
      setSelectedEntityId(legalEntities[0].id);
    }
  }, [legalEntity, legalEntities]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20 rounded uppercase tracking-wider">
              Financial Core
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded uppercase tracking-wider">
              Double-Entry Ledger Verified
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#1E3A8A]" />
            <span>Accounting Console</span>
          </h1>
          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
            Immutable general ledger, real-time double-entry compliance, structured trial balance, and dimensional manual journals.
          </p>
        </div>

        {/* Legal Entity context selector */}
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-xl border">
        {(
          [
            { id: 'coa', label: 'Chart of Accounts', desc: 'Hierarchy & Ledgers' },
            { id: 'journals', label: 'Manual Journals', desc: 'Double-Entry Postings' },
            { id: 'ledger', label: 'General Ledger', desc: 'Audit Statements' },
            { id: 'trial', label: 'Trial Balance', desc: 'Balance Ledger' },
            { id: 'periods', label: 'Fiscal Periods', desc: 'Period Closing' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-left px-4 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#1E3A8A] text-white shadow-sm'
                  : 'hover:bg-gray-50 text-gray-600 hover:text-[#111827]'
              }`}
            >
              <div className="text-xs font-extrabold">{tab.label}</div>
              <div className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-white/85' : 'text-gray-400'}`}>
                {tab.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab Component Render */}
      <div className="min-h-[500px]">
        {selectedEntityId ? (
          <>
            {activeTab === 'coa' && <ChartOfAccountsTab legalEntityId={selectedEntityId} />}
            {activeTab === 'journals' && <JournalsTab legalEntityId={selectedEntityId} />}
            {activeTab === 'ledger' && <GeneralLedgerTab legalEntityId={selectedEntityId} />}
            {activeTab === 'trial' && <TrialBalanceTab legalEntityId={selectedEntityId} />}
            {activeTab === 'periods' && <FiscalPeriodsTab legalEntityId={selectedEntityId} />}
          </>
        ) : (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center text-xs font-bold text-gray-400">
            Please select or configure a Legal Entity context to view the accounting ledger.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 1. CHART OF ACCOUNTS TAB
// ============================================================================

interface TabProps {
  legalEntityId: string;
}

function ChartOfAccountsTab({ legalEntityId }: TabProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form & Drawer states
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('ASSET');
  const [accountSubtype, setAccountSubtype] = useState<AccountSubtype>('CURRENT_ASSET');
  const [normalBalance, setNormalBalance] = useState<NormalBalance>('DEBIT');
  const [postingAllowed, setPostingAllowed] = useState(true);
  const [description, setDescription] = useState('');
  const [parentAccountId, setParentAccountId] = useState('');
  const [singleCurrencyCode, setSingleCurrencyCode] = useState('');

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Account[]>(`/accounting/accounts?legal_entity_id=${legalEntityId}`);
      if (res.success && res.data) {
        setAccounts(res.data);
      } else {
        setError(res.errors?.[0]?.message || 'Failed to load chart of accounts.');
      }
    } catch (err) {
      setError('Connection failure loading ledger accounts.');
    } finally {
      setLoading(false);
    }
  }, [legalEntityId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code || !name) {
      setFormError('Account code and account name are mandatory.');
      return;
    }

    try {
      const res = await apiClient.post<Account>('/accounting/accounts', {
        legal_entity_id: legalEntityId,
        code,
        name,
        account_type: accountType,
        account_subtype: accountSubtype,
        normal_balance: normalBalance,
        posting_allowed: postingAllowed,
        description,
        parent_account_id: parentAccountId || null,
        currency_policy: singleCurrencyCode ? 'SINGLE_CURRENCY' : 'MULTI_CURRENCY',
        single_currency_code: singleCurrencyCode || null,
      });

      if (res.success) {
        setIsOpen(false);
        // Reset Form
        setCode('');
        setName('');
        setAccountType('ASSET');
        setAccountSubtype('CURRENT_ASSET');
        setNormalBalance('DEBIT');
        setPostingAllowed(true);
        setDescription('');
        setParentAccountId('');
        setSingleCurrencyCode('');
        fetchAccounts();
      } else {
        setFormError(res.errors?.[0]?.message || 'Account creation rejected.');
      }
    } catch (err) {
      setFormError('Network communication failed during creation.');
    }
  };

  // Subtype choices depend on account type for usability
  const getSubtypesForType = (type: AccountType): AccountSubtype[] => {
    switch (type) {
      case 'ASSET':
        return ['CURRENT_ASSET', 'NON_CURRENT_ASSET', 'CASH_AND_EQUIVALENT', 'BANK', 'ACCOUNTS_RECEIVABLE', 'INVENTORY', 'FIXED_ASSET', 'OTHER_ASSET'];
      case 'LIABILITY':
        return ['CURRENT_LIABILITY', 'NON_CURRENT_LIABILITY', 'ACCOUNTS_PAYABLE', 'TAX_PAYABLE', 'OTHER_LIABILITY'];
      case 'EQUITY':
        return ['OWNERS_EQUITY', 'RETAINED_EARNINGS', 'CAPITAL'];
      case 'REVENUE':
        return ['OPERATING_REVENUE', 'NON_OPERATING_REVENUE', 'SALES'];
      case 'EXPENSE':
        return ['COST_OF_GOODS_SOLD', 'OPERATING_EXPENSE', 'ADMINISTRATIVE_EXPENSE', 'TAX_EXPENSE', 'FINANCE_COST'];
    }
  };

  const handleTypeChange = (newType: AccountType) => {
    setAccountType(newType);
    const available = getSubtypesForType(newType);
    setAccountSubtype(available[0]);
    setNormalBalance(newType === 'ASSET' || newType === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center text-xs text-gray-500 font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E3A8A] mb-2" />
        Analyzing General Ledger Account schemas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter accounts by code or name..."
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white"
          />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-extrabold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Ledger Account
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Account Creation Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#111827]">New Ledger Account</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Define structured double-entry ledger accounts.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Account Code</label>
                <input
                  type="text"
                  placeholder="e.g. 1010, 4000, 2200"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:ring-0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Petty Cash, Sales Domestic"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs font-extrabold text-gray-700 focus:border-blue-500 focus:ring-0"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="REVENUE">REVENUE</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Normal Balance</label>
                  <select
                    value={normalBalance}
                    onChange={(e) => setNormalBalance(e.target.value as NormalBalance)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs font-extrabold text-gray-700 focus:border-blue-500 focus:ring-0"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Account Subtype</label>
                <select
                  value={accountSubtype}
                  onChange={(e) => setAccountSubtype(e.target.value as AccountSubtype)}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:border-blue-500 focus:ring-0"
                >
                  {getSubtypesForType(accountType).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Currency Lock</label>
                  <select
                    value={singleCurrencyCode}
                    onChange={(e) => setSingleCurrencyCode(e.target.value)}
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium focus:border-blue-500 focus:ring-0"
                  >
                    <option value="">Multi-Currency (None)</option>
                    <option value="INR">INR (Rupees)</option>
                    <option value="USD">USD (Dollars)</option>
                    <option value="EUR">EUR (Euros)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Parent Account</label>
                  <select
                    value={parentAccountId}
                    onChange={(e) => setParentAccountId(e.target.value)}
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium focus:border-blue-500 focus:ring-0"
                  >
                    <option value="">None (Top Level)</option>
                    {accounts
                      .filter((a) => !a.posting_allowed)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="postingAllowed"
                  checked={postingAllowed}
                  onChange={(e) => setPostingAllowed(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="postingAllowed" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Posting Allowed (Transactional account)
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  placeholder="Enter notes about the ledger's usage limits..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:ring-0"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Account Code</th>
              <th className="py-3 px-4">Account Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Subtype</th>
              <th className="py-3 px-4 text-center">Balance</th>
              <th className="py-3 px-4 text-center">Posting Allowed</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                  No chart accounts have been provisioned yet for this entity.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-50/50 font-medium">
                  <td className="py-3 px-4 font-bold text-[#111827]">{acc.code}</td>
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-gray-900">{acc.name}</div>
                    {acc.description && <div className="text-[10px] text-gray-400 mt-0.5">{acc.description}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                        acc.account_type === 'ASSET'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : acc.account_type === 'LIABILITY'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : acc.account_type === 'REVENUE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : acc.account_type === 'EXPENSE'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {acc.account_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-bold text-[10px] uppercase">
                    {acc.account_subtype.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-gray-600">{acc.normal_balance}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        acc.posting_allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {acc.posting_allowed ? 'YES' : 'NO (Header)'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-800">ACTIVE</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 2. JOURNALS & POSTING ENGINE TAB
// ============================================================================

interface LineDraft {
  account_id: string;
  debit: string;
  credit: string;
  description: string;
  dimensions: Record<string, string>;
}

function JournalsTab({ legalEntityId }: TabProps) {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dimensions, setDimensions] = useState<AccountingDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form toggles
  const [isPostingFormOpen, setIsPostingFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [memo, setMemo] = useState('');
  const [refNum, setRefNum] = useState('');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('INR');
  const [exchRate, setExchRate] = useState('1.0000');
  const [lines, setLines] = useState<LineDraft[]>([
    { account_id: '', debit: '0.00', credit: '0.00', description: '', dimensions: {} },
    { account_id: '', debit: '0.00', credit: '0.00', description: '', dimensions: {} },
  ]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [journalsRes, accountsRes, dimsRes] = await Promise.all([
        apiClient.get<JournalEntry[]>(`/accounting/journals?legal_entity_id=${legalEntityId}`),
        apiClient.get<Account[]>(`/accounting/accounts?legal_entity_id=${legalEntityId}`),
        apiClient.get<AccountingDimension[]>('/accounting/dimensions'),
      ]);

      if (journalsRes.success && journalsRes.data) {
        setJournals(journalsRes.data);
      }
      if (accountsRes.success && accountsRes.data) {
        // Filter down to transactional accounts (posting_allowed = true)
        setAccounts(accountsRes.data.filter((a) => a.posting_allowed));
      }
      if (dimsRes.success && dimsRes.data) {
        setDimensions(dimsRes.data);
      }
    } catch (err) {
      setError('Communication failure loading journal datasets.');
    } finally {
      setLoading(false);
    }
  }, [legalEntityId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calculations for balancing checker
  const totalDebits = lines.reduce((sum, l) => sum + parseFloat(l.debit || '0'), 0);
  const totalCredits = lines.reduce((sum, l) => sum + parseFloat(l.credit || '0'), 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

  const handleAddLine = () => {
    setLines([
      ...lines,
      { account_id: '', debit: '0.00', credit: '0.00', description: '', dimensions: {} },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: keyof LineDraft, value: any) => {
    const updated = [...lines];
    if (field === 'debit') {
      updated[index].debit = value;
      if (parseFloat(value) > 0) updated[index].credit = '0.00';
    } else if (field === 'credit') {
      updated[index].credit = value;
      if (parseFloat(value) > 0) updated[index].debit = '0.00';
    } else {
      updated[index][field] = value as never;
    }
    setLines(updated);
  };

  const handleLineDimensionChange = (lineIndex: number, key: string, value: string) => {
    const updated = [...lines];
    updated[lineIndex].dimensions = {
      ...updated[lineIndex].dimensions,
      [key]: value,
    };
    setLines(updated);
  };

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!memo.trim()) {
      setFormError('Please enter a description/memo for the transaction.');
      return;
    }

    if (!isBalanced) {
      setFormError(`Journal is unbalanced. Difference: ${difference.toFixed(2)}. Debits must exactly match Credits.`);
      return;
    }

    // Verify account selection
    const missingAccounts = lines.some((l) => !l.account_id);
    if (missingAccounts) {
      setFormError('All journal entry lines must specify an account.');
      return;
    }

    try {
      const res = await apiClient.post<JournalEntry>('/accounting/journals/post', {
        legal_entity_id: legalEntityId,
        description: memo,
        reference: refNum,
        transaction_date: transDate,
        currency_code: currency,
        exchange_rate: exchRate,
        lines: lines.map((l) => ({
          account_id: l.account_id,
          debit: parseFloat(l.debit).toFixed(2),
          credit: parseFloat(l.credit).toFixed(2),
          description: l.description || memo,
          dimensions: l.dimensions,
        })),
      });

      if (res.success) {
        setIsPostingFormOpen(false);
        // Reset state
        setMemo('');
        setRefNum('');
        setTransDate(new Date().toISOString().split('T')[0]);
        setLines([
          { account_id: '', debit: '0.00', credit: '0.00', description: '', dimensions: {} },
          { account_id: '', debit: '0.00', credit: '0.00', description: '', dimensions: {} },
        ]);
        loadInitialData();
      } else {
        setFormError(res.errors?.[0]?.message || 'Posting rejected by general ledger logic.');
      }
    } catch (err) {
      setFormError('Communication error trying to post transaction.');
    }
  };

  const handleReverseJournal = async (id: string) => {
    const reason = prompt('Please specify reversal adjustment justification description:');
    if (reason === null) return; // Cancel

    try {
      const res = await apiClient.post<any>(`/accounting/journals/${id}/reverse`, { reason });
      if (res.success) {
        alert('Reversal entry generated successfully.');
        loadInitialData();
      } else {
        alert(`Reversal Rejected: ${res.errors?.[0]?.message}`);
      }
    } catch (err) {
      alert('Communication failure executing reversal.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center text-xs text-gray-500 font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E3A8A] mb-2" />
        Synching double-entry posted history ledger...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="text-sm font-extrabold text-[#111827] self-start sm:self-auto">
          Audit Trail Logs ({journals.length} Posted Items)
        </h3>

        <button
          onClick={() => setIsPostingFormOpen(true)}
          className="w-full sm:w-auto bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-extrabold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Manual Journal
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Manual Entry Modal Dialog */}
      {isPostingFormOpen && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Post Manual Double-Entry Journal</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  Double-entry validation, ledger locks, and dimensional classifications are enforced on post.
                </p>
              </div>
              <button
                onClick={() => setIsPostingFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handlePostJournal} className="space-y-4 flex-1 flex flex-col overflow-hidden">
              {/* Header Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 shrink-0">
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={transDate}
                    onChange={(e) => setTransDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Memo / General Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Funding capitalization transfer"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Reference Code / Document #</label>
                  <input
                    type="text"
                    placeholder="e.g. JV-2024-001"
                    value={refNum}
                    onChange={(e) => setRefNum(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium bg-white"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Exchange Rate</label>
                    <input
                      type="text"
                      value={exchRate}
                      onChange={(e) => setExchRate(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium bg-white text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Lines Table Grid */}
              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-extrabold text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                      <th className="py-2.5 px-3 w-1/4">Account Ledger</th>
                      <th className="py-2.5 px-3 w-28 text-right">Debit</th>
                      <th className="py-2.5 px-3 w-28 text-right">Credit</th>
                      <th className="py-2.5 px-3 w-40">Classification Dimensions</th>
                      <th className="py-2.5 px-3">Line Memo</th>
                      <th className="py-2.5 px-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((ln, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-2">
                          <select
                            value={ln.account_id}
                            onChange={(e) => handleLineChange(idx, 'account_id', e.target.value)}
                            className="w-full p-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white"
                          >
                            <option value="">-- Choose posting account --</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                [{a.code}] {a.name} ({a.normal_balance})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={ln.debit}
                            onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                            className="w-full p-1.5 border border-gray-200 rounded-lg text-xs font-extrabold text-right text-emerald-700 bg-white"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={ln.credit}
                            onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                            className="w-full p-1.5 border border-gray-200 rounded-lg text-xs font-extrabold text-right text-rose-700 bg-white"
                          />
                        </td>

                        <td className="p-2">
                          <div className="space-y-1">
                            {dimensions.map((dim) => (
                              <div key={dim.id} className="flex items-center gap-1">
                                <span className="text-[8px] font-extrabold text-gray-400 uppercase w-12 truncate">{dim.dimension_name}</span>
                                <input
                                  type="text"
                                  placeholder="None"
                                  value={ln.dimensions[dim.dimension_key] || ''}
                                  onChange={(e) => handleLineDimensionChange(idx, dim.dimension_key, e.target.value)}
                                  className="p-1 border border-gray-100 rounded text-[9px] font-bold w-full bg-white"
                                />
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Line details..."
                            value={ln.description}
                            onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                            className="w-full p-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white"
                          />
                        </td>

                        <td className="p-2 text-center">
                          <button
                            type="button"
                            disabled={lines.length <= 2}
                            onClick={() => handleRemoveLine(idx)}
                            className={`p-1.5 rounded-lg border ${
                              lines.length <= 2
                                ? 'text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'text-gray-400 border-gray-100 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary & Actions */}
              <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-6 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200/50 w-full md:w-auto">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Total Debits</span>
                    <span className="text-sm font-extrabold text-emerald-700">₹{totalDebits.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Total Credits</span>
                    <span className="text-sm font-extrabold text-rose-700">₹{totalCredits.toFixed(2)}</span>
                  </div>
                  <div className="h-6 w-[1px] bg-gray-200" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Status Checker</span>
                    {isBalanced ? (
                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Balanced
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                        Unbalanced (Diff: ₹{difference.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleAddLine()}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Row Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPostingFormOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-extrabold rounded-lg shadow-md"
                  >
                    Post to General Ledger
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posted Journals Grid List */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">Post Date</th>
              <th className="py-3 px-4">Entry Number</th>
              <th className="py-3 px-4">Memo & Description</th>
              <th className="py-3 px-4">Ref Code</th>
              <th className="py-3 px-4">Lines Summary</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Reversal Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {journals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                  No posted accounting journals exist in the ledger yet.
                </td>
              </tr>
            ) : (
              journals.map((jn) => {
                const totalAmt = jn.lines.reduce((sum, l) => sum + parseFloat(l.debit || '0'), 0);
                return (
                  <tr key={jn.id} className="hover:bg-gray-50/50 font-medium">
                    <td className="py-3 px-4 font-bold text-gray-500">{jn.posting_date}</td>
                    <td className="py-3 px-4 font-extrabold text-[#111827]">{jn.entry_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-gray-900">{jn.description}</div>
                      {jn.lines && jn.lines.length > 0 && (
                        <div className="space-y-1 mt-1.5 bg-gray-50/50 p-2 rounded border border-gray-100 text-[11px]">
                          {jn.lines.map((line, lidx) => {
                            const isDr = parseFloat(line.debit) > 0;
                            const accName = accounts.find((a) => a.id === line.account_id)?.name || 'Unknown Account';
                            return (
                              <div key={line.id || lidx} className="flex justify-between items-center text-[10.5px]">
                                <span className={`font-bold ${isDr ? 'text-gray-900' : 'text-gray-500 pl-4'}`}>
                                  {isDr ? 'Dr' : 'Cr'} {accName}
                                </span>
                                <span className={`font-extrabold ${isDr ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  ₹{isDr ? parseFloat(line.debit).toFixed(2) : parseFloat(line.credit).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-bold">{jn.reference || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-[#111827]">₹{totalAmt.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{jn.lines.length} Line items</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-extrabold rounded border ${
                          jn.status === 'POSTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : jn.status === 'REVERSED'
                            ? 'bg-gray-50 text-gray-500 border-gray-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {jn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {jn.status === 'POSTED' ? (
                        <button
                          onClick={() => handleReverseJournal(jn.id)}
                          className="px-2.5 py-1 text-[10.5px] font-extrabold border border-[#E5E7EB] hover:border-rose-200 text-gray-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          Reverse Entry
                        </button>
                      ) : (
                        <span className="text-[10.5px] font-bold text-gray-400">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 3. GENERAL LEDGER TAB
// ============================================================================

function GeneralLedgerTab({ legalEntityId }: TabProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [statement, setStatement] = useState<GeneralLedgerStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await apiClient.get<Account[]>(`/accounting/accounts?legal_entity_id=${legalEntityId}`);
        if (res.success && res.data) {
          const postingOnly = res.data.filter((a) => a.posting_allowed);
          setAccounts(postingOnly);
          if (postingOnly.length > 0) {
            setSelectedAccId(postingOnly[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load accounts for GL lookup.', err);
      }
    };
    fetchAccounts();
  }, [legalEntityId]);

  const handleGenerateLedger = useCallback(async () => {
    if (!selectedAccId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        account_id: selectedAccId,
        start_date: startDate,
        end_date: endDate,
      });
      const res = await apiClient.get<GeneralLedgerStatement>(`/accounting/reports/general-ledger?${params.toString()}`);
      if (res.success && res.data) {
        setStatement(res.data);
      } else {
        setError(res.errors?.[0]?.message || 'Failed to calculate ledger balances.');
      }
    } catch (err) {
      setError('Communication failed fetching statement.');
    } finally {
      setLoading(false);
    }
  }, [selectedAccId, startDate, endDate]);

  useEffect(() => {
    handleGenerateLedger();
  }, [handleGenerateLedger]);

  return (
    <div className="space-y-6">
      {/* Search Parameters Toolbar */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Select General Ledger Account</label>
          <select
            value={selectedAccId}
            onChange={(e) => setSelectedAccId(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 bg-white"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.code}] {a.name} ({a.normal_balance})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs font-medium"
            />
          </div>
        </div>

        <button
          onClick={handleGenerateLedger}
          className="w-full md:w-auto md:self-end bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-extrabold px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors"
        >
          Generate Statement
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center text-xs text-gray-500 font-medium">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E3A8A] mb-2" />
          Querying ledger journals dataset...
        </div>
      ) : statement ? (
        <div className="space-y-6">
          {/* Summary KPI Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Account Norm</span>
              <div className="text-sm font-extrabold text-gray-800 mt-1">{statement.normal_balance} balance</div>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Opening Balance</span>
              <div className="text-sm font-extrabold text-gray-800 mt-1">₹{parseFloat(statement.opening_balance).toFixed(2)}</div>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Period Net Activity</span>
              <div className="text-sm font-extrabold text-gray-800 mt-1 flex gap-2">
                <span className="text-emerald-700">Dr ₹{parseFloat(statement.total_debit).toFixed(2)}</span>
                <span className="text-rose-700">Cr ₹{parseFloat(statement.total_credit).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white border border-[#1E3A8A]/20 bg-[#1E3A8A]/5 p-4 rounded-xl shadow-sm">
              <span className="text-[9px] font-extrabold text-blue-800 uppercase tracking-wider">Closing Balance</span>
              <div className="text-lg font-extrabold text-[#111827] mt-1">₹{parseFloat(statement.closing_balance).toFixed(2)}</div>
            </div>
          </div>

          {/* Statement Lines */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Post Date</th>
                  <th className="py-3 px-4">Transaction Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Ref Doc</th>
                  <th className="py-3 px-4 text-right">Debit (Dr)</th>
                  <th className="py-3 px-4 text-right">Credit (Cr)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {/* Initial opening line */}
                <tr className="bg-gray-50/50 font-extrabold text-gray-500">
                  <td className="py-2.5 px-4" colSpan={4}>Opening Balance Brought Forward</td>
                  <td className="py-2.5 px-4 text-right">—</td>
                  <td className="py-2.5 px-4 text-right">—</td>
                  <td className="py-2.5 px-4 text-right">₹{parseFloat(statement.opening_balance).toFixed(2)}</td>
                </tr>

                {statement.lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-bold bg-white">
                      No matching journals recorded within the selected period.
                    </td>
                  </tr>
                ) : (
                  statement.lines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50/50 font-medium">
                      <td className="py-3 px-4 font-bold text-gray-500">{line.transaction_date}</td>
                      <td className="py-3 px-4 font-bold text-[#111827]">{line.entry_number}</td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-gray-900">{line.description}</div>
                        {line.dimensions && Object.keys(line.dimensions).length > 0 && (
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {Object.entries(line.dimensions).map(([key, val]) => (
                              <span key={key} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-extrabold uppercase">
                                {key.replace('_id', '')}: {val}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400">{line.reference || '—'}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                        {parseFloat(line.debit) > 0 ? `₹${parseFloat(line.debit).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700 font-bold">
                        {parseFloat(line.credit) > 0 ? `₹${parseFloat(line.credit).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#111827]">
                        ₹{parseFloat(line.running_balance).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// 4. TRIAL BALANCE TAB
// ============================================================================

function TrialBalanceTab({ legalEntityId }: TabProps) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [report, setReport] = useState<TrialBalanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        legal_entity_id: legalEntityId,
        start_date: startDate,
        end_date: endDate,
      });
      const res = await apiClient.get<TrialBalanceReport>(`/accounting/reports/trial-balance?${params.toString()}`);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.errors?.[0]?.message || 'Failed to calculate Trial Balance.');
      }
    } catch (err) {
      setError('Communication failure generating Trial Balance report.');
    } finally {
      setLoading(false);
    }
  }, [legalEntityId, startDate, endDate]);

  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center text-xs text-gray-500 font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E3A8A] mb-2" />
        Processing General Ledger trial balancing schemas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parameter Box */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-extrabold text-[#111827]">Report Filtering Boundaries</h3>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Filter opening/closing balances by fiscal calendar boundaries.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
            <div>
              <label className="block text-[8px] font-extrabold text-gray-400 uppercase mb-0.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white"
              />
            </div>
            <div>
              <label className="block text-[8px] font-extrabold text-gray-400 uppercase mb-0.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            className="w-full md:w-auto bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-extrabold px-4 py-2 rounded-lg shadow-sm shrink-0 self-end transition-colors"
          >
            Calculate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Ledger status banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
            report.is_balanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2.5">
              {report.is_balanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
              <div>
                <h4 className="text-xs font-extrabold uppercase">Accounting Integrity Status</h4>
                <p className="text-[10px] opacity-85 mt-0.5">
                  {report.is_balanced
                    ? 'Total general ledger Debits exactly equal Credits. General Ledger is aligned.'
                    : 'A discrepancy exists between sum debits and sum credits. Contact system administrator.'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded text-xs font-extrabold border ${
                report.is_balanced ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'
              }`}>
                {report.is_balanced ? 'BALANCED' : 'OUT-OF-BALANCE'}
              </span>
            </div>
          </div>

          {/* Trial Balance Report Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-28">Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Opening Bal</th>
                  <th className="py-3 px-4 text-right">Period Dr</th>
                  <th className="py-3 px-4 text-right">Period Cr</th>
                  <th className="py-3 px-4 text-right">Closing Bal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {report.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-bold bg-white">
                      No accounts have posted activity records within this fiscal frame.
                    </td>
                  </tr>
                ) : (
                  report.items.map((item) => (
                    <tr key={item.account_id} className="hover:bg-gray-50/50 font-medium">
                      <td className="py-3 px-4 font-bold text-[#111827]">{item.account_code}</td>
                      <td className="py-3 px-4 font-extrabold text-gray-900">{item.account_name}</td>
                      <td className="py-3 px-4">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.account_type}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-600">
                        ₹{parseFloat(item.opening_balance).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                        {parseFloat(item.period_debit) > 0 ? `₹${parseFloat(item.period_debit).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700 font-bold">
                        {parseFloat(item.period_credit) > 0 ? `₹${parseFloat(item.period_credit).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-gray-950">
                        ₹{parseFloat(item.closing_balance).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Report Totals Row */}
                <tr className="bg-gray-100/50 font-extrabold text-xs text-[#111827]">
                  <td className="py-3 px-4" colSpan={3}>Grand Summary Totals</td>
                  <td className="py-3 px-4 text-right text-gray-500">—</td>
                  <td className="py-3 px-4 text-right text-emerald-800">
                    ₹{parseFloat(report.total_period_debit).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-800">
                    ₹{parseFloat(report.total_period_credit).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. FISCAL PERIODS CLOSE TAB
// ============================================================================

interface CalendarResponse {
  legal_entity: { id: string; legal_name: string };
  calendar: any;
  fiscal_year: any;
  periods: FiscalPeriod[];
}

function FiscalPeriodsTab({ legalEntityId }: TabProps) {
  const [calendars, setCalendars] = useState<CalendarResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<CalendarResponse[]>('/accounting/calendars');
      if (res.success && res.data) {
        setCalendars(res.data);
      } else {
        setError(res.errors?.[0]?.message || 'Failed to load fiscal calendars.');
      }
    } catch (err) {
      setError('Communication failure loading fiscal calendar frame.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const handleUpdateStatus = async (periodId: string, newStatus: string) => {
    try {
      const res = await apiClient.post<FiscalPeriod>(`/accounting/periods/${periodId}/status`, { status: newStatus });
      if (res.success) {
        alert(`Fiscal period status locked and updated to ${newStatus}.`);
        fetchCalendars();
      } else {
        alert(`Failed to close period: ${res.errors?.[0]?.message}`);
      }
    } catch (err) {
      alert('Communication failure executing period lock.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-16 text-center text-xs text-gray-500 font-medium">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E3A8A] mb-2" />
        Synching calendar period locks...
      </div>
    );
  }

  const activeCal = calendars.find((cal) => cal.legal_entity.id === legalEntityId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!activeCal ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center text-xs font-bold text-gray-400">
          No fiscal calendar config found for this legal entity.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info block */}
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-2">
            <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 uppercase">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Fiscal Period Controls for {activeCal.legal_entity.legal_name}</span>
            </h4>
            <p className="text-[11.5px] text-gray-500 font-medium">
              Closing a period completely locks the double-entry accounting ledger. Under authoritative GAAP/IFRS rules, once a fiscal period is set to <span className="text-rose-700 font-bold">CLOSED</span>, no additional entries, reversals, adjustments, or invoice postings are permitted under any circumstances within its boundary.
            </p>
          </div>

          {/* List Periods */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Period Number</th>
                  <th className="py-3 px-4">Period Month Name</th>
                  <th className="py-3 px-4">Date Range Boundaries</th>
                  <th className="py-3 px-4">Active Locks</th>
                  <th className="py-3 px-4 text-right">Operations & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {activeCal.periods.map((period) => (
                  <tr key={period.id} className="hover:bg-gray-50/50 font-medium">
                    <td className="py-3.5 px-4 font-bold text-gray-400">#{period.period_number}</td>
                    <td className="py-3.5 px-4 font-extrabold text-[#111827]">{period.period_name}</td>
                    <td className="py-3.5 px-4 text-gray-500 font-semibold">
                      {period.start_date} <span className="text-gray-300">to</span> {period.end_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-extrabold rounded border ${
                          period.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : period.status === 'SOFT_CLOSE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {period.status === 'OPEN' && '🔓 OPEN'}
                        {period.status === 'SOFT_CLOSE' && '⚠️ SOFT CLOSE'}
                        {period.status === 'CLOSED' && '🔒 CLOSED (Ledger locked)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {period.status === 'CLOSED' ? (
                        <button
                          onClick={() => handleUpdateStatus(period.id, 'OPEN')}
                          className="px-2.5 py-1 text-[10.5px] font-extrabold border border-emerald-100 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        >
                          Reopen Period
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-end">
                          {period.status === 'OPEN' && (
                            <button
                              onClick={() => handleUpdateStatus(period.id, 'SOFT_CLOSE')}
                              className="px-2.5 py-1 text-[10.5px] font-extrabold border border-amber-100 text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                            >
                              Soft Close
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(period.id, 'CLOSED')}
                            className="px-2.5 py-1 text-[10.5px] font-extrabold bg-rose-550 border border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <Lock className="w-3.5 h-3.5" /> Close Permanently
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
