/**
 * Bill Vyom — Customers Master Data Management Page
 * Production-grade Master Data UI with Zero Fake Data Policy.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Building,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCcw,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Customer, CustomerGroup, CustomerType } from '@/domain/types';

export default function CustomersMasterPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // New Customer Form State
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('BUSINESS');
  const [groupId, setGroupId] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [countryCode, setCountryCode] = useState('IN');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState('50000.00');
  const [creditDays, setCreditDays] = useState('30');

  // New Group Form State
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const token = localStorage.getItem('billvyom_jwt_token');

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        q: searchQuery,
        status: selectedStatus,
        type: selectedType,
        group_id: selectedGroup,
      });

      const res = await fetch(`/api/v1/master/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setCustomers(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.total_pages || 1);
          setTotalCount(json.pagination.total || 0);
        }
      } else {
        setError(json.errors?.[0]?.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError('Network error loading customers dataset');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/v1/master/customer-groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setCustomerGroups(json.data || []);
    } catch (err) {
      console.error('Failed loading customer groups', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery, selectedGroup, selectedType, selectedStatus]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCode || !customerName) {
      alert('Customer code and name required.');
      return;
    }

    try {
      const taxRegistrations = taxRegistrationNumber
        ? [{ jurisdiction_code: countryCode, registration_type: 'GENERIC_TAX_ID', registration_number: taxRegistrationNumber, status: 'ACTIVE' }]
        : [];

      const res = await fetch('/api/v1/master/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_code: customerCode,
          customer_name: customerName,
          legal_name: legalName || customerName,
          customer_type: customerType,
          customer_group_id: groupId || null,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          country_code: countryCode,
          currency_code: currencyCode,
          tax_registrations: taxRegistrations,
          credit_limit: creditLimit,
          credit_days: parseInt(creditDays, 10) || 30,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setCustomerCode('');
        setCustomerName('');
        setLegalName('');
        setContactEmail('');
        setContactPhone('');
        setTaxRegistrationNumber('');
        fetchCustomers();
      } else {
        alert(json.errors?.[0]?.message || 'Failed to create customer');
      }
    } catch (err) {
      alert('Network error creating customer');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCode || !groupName) {
      alert('Group code and name required.');
      return;
    }

    try {
      const res = await fetch('/api/v1/master/customer-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_code: groupCode,
          group_name: groupName,
          description: groupDescription,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsGroupModalOpen(false);
        setGroupCode('');
        setGroupName('');
        setGroupDescription('');
        fetchGroups();
      } else {
        alert(json.errors?.[0]?.message || 'Failed to create customer group');
      }
    } catch (err) {
      alert('Network error creating customer group');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1E3A8A]" />
            Customers Master Data
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Central customer directory supporting B2B, B2C, Groups, Addresses, Contacts & Credit Controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5 text-gray-500" />
            New Group
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e3a8a]/90 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Customer
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by code, name, legal name, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="">All Groups</option>
            {customerGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="">All Types</option>
            <option value="BUSINESS">Business</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="ORGANIZATION">Organization</option>
          </select>

          <button
            onClick={fetchCustomers}
            className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            title="Refresh List"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500">Loading customer directory...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600 bg-red-50 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No Customers Registered</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Production database is currently empty. Click "Create Customer" above to register a customer account.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-gray-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Customer Code</th>
                    <th className="px-4 py-3">Customer / Legal Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Contact Email & Phone</th>
                    <th className="px-4 py-3">Country / Currency</th>
                    <th className="px-4 py-3">Credit Limit</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-[#111827]">{c.customer_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{c.customer_name}</div>
                        {c.legal_name !== c.customer_name && (
                          <div className="text-[10px] text-gray-400">{c.legal_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                          {c.customer_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{c.contact_email || '—'}</div>
                        <div className="text-[10px] text-gray-400">{c.contact_phone}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {c.country_code} ({c.currency_code})
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">
                        {c.currency_code} {c.credit_config?.credit_limit || '0.00'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-gray-500 bg-white">
              <div>
                Showing {customers.length} of {totalCount} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Create New Customer</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="CUST-001"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Customer Type</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    <option value="BUSINESS">Business</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="ORGANIZATION">Organization</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Global Logistics"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Legal Name (for invoicing)</label>
                <input
                  type="text"
                  placeholder="Acme Global Logistics Private Limited"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="accounts@acme.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 555 0192"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="AE">UAE (AE)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="SG">Singapore (SG)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="GBP">GBP</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Tax Registration #</label>
                  <input
                    type="text"
                    placeholder="27AABCU9603R1ZM"
                    value={taxRegistrationNumber}
                    onChange={(e) => setTaxRegistrationNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Credit Limit ({currencyCode})</label>
                  <input
                    type="text"
                    placeholder="50000.00"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Credit Days</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={creditDays}
                    onChange={(e) => setCreditDays(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg font-medium hover:bg-[#1e3a8a]/90"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Customer Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Create Customer Group</h2>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Group Code *</label>
                <input
                  type="text"
                  required
                  placeholder="KEY_ACCTS"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Key Enterprise Accounts"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="High priority customer tier..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg font-medium hover:bg-[#1e3a8a]/90"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
