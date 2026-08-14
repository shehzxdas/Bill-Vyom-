import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, User, AlertCircle, Globe, ShieldCheck, UserCheck } from 'lucide-react';
import { apiClient } from '../../../tenant/src/lib/apiClient';
import { useTenant } from '@apps/tenant/src/lib/TenantContext';

export default function TenantLoginPage() {
  const navigate = useNavigate();
  const { refreshContext } = useTenant();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'ONBOARD' | 'INVITATION'>('LOGIN');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invitation Accept State
  const [inviteToken, setInviteToken] = useState(tokenParam);
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Onboard Form State
  const [onboardData, setOnboardData] = useState({
    legalName: '',
    tradeName: '',
    countryCode: 'IN',
    baseCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    businessType: 'Private Limited',
    industry: 'Technology & Services',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPassword: '',
  });
  const [onboardError, setOnboardError] = useState('');

  useEffect(() => {
    if (tokenParam) {
      setInviteToken(tokenParam);
      setActiveTab('INVITATION');
    }
  }, [tokenParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    const res = await apiClient.post<{
      token: string;
      activeTenant: { id: string };
    }>('/auth/login', {
      email: loginEmail,
      password: loginPassword,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      apiClient.setToken(res.data.token);
      apiClient.setTenantContext({ tenantId: res.data.activeTenant.id });
      await refreshContext();
      navigate('/app');
    } else {
      setLoginError(res.errors?.[0]?.message || 'Invalid email or password.');
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError('');
    setIsSubmitting(true);

    const res = await apiClient.post<{
      token: string;
      tenant: { id: string };
    }>('/auth/onboard', {
      legal_name: onboardData.legalName,
      trade_name: onboardData.tradeName || onboardData.legalName,
      country_code: onboardData.countryCode,
      base_currency_code: onboardData.baseCurrency,
      timezone: onboardData.timezone,
      business_type: onboardData.businessType,
      industry: onboardData.industry,
      contact_email: onboardData.ownerEmail,
      contact_phone: '',
      owner_first_name: onboardData.ownerFirstName,
      owner_last_name: onboardData.ownerLastName,
      owner_email: onboardData.ownerEmail,
      owner_password: onboardData.ownerPassword,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      apiClient.setToken(res.data.token);
      apiClient.setTenantContext({ tenantId: res.data.tenant.id });
      await refreshContext();
      navigate('/app');
    } else {
      setOnboardError(res.errors?.[0]?.message || 'Failed to onboard tenant organization.');
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setIsSubmitting(true);

    const res = await apiClient.post<{
      token: string;
      activeTenant: { id: string };
    }>('/auth/invitations/accept', {
      token: inviteToken,
      password: invitePassword,
      first_name: inviteFirstName,
      last_name: inviteLastName,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      apiClient.setToken(res.data.token);
      apiClient.setTenantContext({ tenantId: res.data.activeTenant.id });
      await refreshContext();
      navigate('/app');
    } else {
      setInviteError(res.errors?.[0]?.message || 'Failed to accept invitation. Token may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-lg shadow-sm flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-tighter">B</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-[#111827]">BillVyom</span>
        </Link>
        <span className="text-xs font-extrabold text-[#1E3A8A] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
          Tenant Workspace Portal
        </span>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 mb-6">
            <button
              onClick={() => setActiveTab('LOGIN')}
              className={`flex-1 pb-3 text-sm font-extrabold transition-all border-b-2 ${
                activeTab === 'LOGIN'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('ONBOARD')}
              className={`flex-1 pb-3 text-sm font-extrabold transition-all border-b-2 ${
                activeTab === 'ONBOARD'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setActiveTab('INVITATION')}
              className={`flex-1 pb-3 text-sm font-extrabold transition-all border-b-2 ${
                activeTab === 'INVITATION'
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Accept Invite
            </button>
          </div>

          {/* TAB 1: LOGIN */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="owner@company.com"
                    className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium focus:ring-1 focus:ring-[#1E3A8A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium focus:ring-1 focus:ring-[#1E3A8A] outline-none"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2 text-red-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER / ONBOARD ORGANIZATION */}
          {activeTab === 'ONBOARD' && (
            <form onSubmit={handleOnboard} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Legal Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={onboardData.legalName}
                  onChange={(e) => setOnboardData({ ...onboardData, legalName: e.target.value })}
                  placeholder="e.g. Acme Enterprise Pvt Ltd"
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Country Code *
                  </label>
                  <select
                    value={onboardData.countryCode}
                    onChange={(e) => setOnboardData({ ...onboardData, countryCode: e.target.value })}
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium bg-white"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="AE">UAE (AE)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="SG">Singapore (SG)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Base Currency *
                  </label>
                  <select
                    value={onboardData.baseCurrency}
                    onChange={(e) => setOnboardData({ ...onboardData, baseCurrency: e.target.value })}
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="AED">AED (AED)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Owner First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardData.ownerFirstName}
                    onChange={(e) => setOnboardData({ ...onboardData, ownerFirstName: e.target.value })}
                    placeholder="First Name"
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Owner Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardData.ownerLastName}
                    onChange={(e) => setOnboardData({ ...onboardData, ownerLastName: e.target.value })}
                    placeholder="Last Name"
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Owner Email *
                </label>
                <input
                  type="email"
                  required
                  value={onboardData.ownerEmail}
                  onChange={(e) => setOnboardData({ ...onboardData, ownerEmail: e.target.value })}
                  placeholder="owner@company.com"
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Owner Password *
                </label>
                <input
                  type="password"
                  required
                  value={onboardData.ownerPassword}
                  onChange={(e) => setOnboardData({ ...onboardData, ownerPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium"
                />
              </div>

              {onboardError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
                  {onboardError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold py-2.5 rounded-lg transition-colors text-xs shadow-sm mt-2"
              >
                {isSubmitting ? 'Onboarding Tenant...' : 'Onboard Production Tenant Workspace'}
              </button>
            </form>
          )}

          {/* TAB 3: ACCEPT INVITATION */}
          {activeTab === 'INVITATION' && (
            <form onSubmit={handleAcceptInvitation} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Invitation Token *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="e.g. bv_inv_abc123"
                    className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1E3A8A] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Your First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Your Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full p-2 border border-[#E5E7EB] rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Choose Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1E3A8A] outline-none"
                  />
                </div>
              </div>

              {inviteError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-lg transition-colors text-xs shadow-sm mt-2 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Joining Tenant Workspace...' : 'Accept Invite & Join Workspace'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl w-full mx-auto text-center text-xs text-gray-400 font-medium">
        Bill Vyom Platform Security • Multi-Tenant Enterprise Architecture Constitution
      </div>
    </div>
  );
}
