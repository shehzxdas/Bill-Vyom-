import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Globe, Hash, Bell, Save, Check } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useTenant } from '@apps/tenant/src/lib/TenantContext';
import { TenantSettings } from '../../../../src/domain/types';

export default function SettingsPage() {
  const { tenant, refreshContext } = useTenant();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    const res = await apiClient.get<TenantSettings>('/tenant/settings');
    if (res.success && res.data) {
      setSettings(res.data);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;
    const res = await apiClient.put('/tenant/settings', settings);
    if (res.success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      refreshContext();
    }
  };

  if (!settings) {
    return <div className="p-8 text-center text-xs font-bold text-gray-400">Loading settings configuration...</div>;
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-gray-100 text-gray-700 border border-gray-200 rounded uppercase tracking-wider">
              Tenant Configuration
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#111827] tracking-tight">System Settings</h1>
          <p className="text-[12px] text-gray-500 font-medium mt-0.5">
            Configure business profiles, localization formats, numbering sequences, and security rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#1E3A8A] hover:bg-blue-900 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
        >
          {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Settings Saved' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Settings */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-[14px] font-extrabold text-[#111827] border-b border-gray-100 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Business Profile</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Trade Name</label>
              <input
                type="text"
                value={settings.business.trade_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    business: { ...settings.business, trade_name: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-lg text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Legal Name</label>
              <input
                type="text"
                value={settings.business.legal_name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    business: { ...settings.business, legal_name: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-lg text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Base Currency</label>
                <input
                  type="text"
                  disabled
                  value={settings.business.base_currency}
                  className="w-full p-2 border rounded-lg text-xs font-medium bg-gray-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Timezone</label>
                <input
                  type="text"
                  value={settings.business.timezone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      business: { ...settings.business, timezone: e.target.value },
                    })
                  }
                  className="w-full p-2 border rounded-lg text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-[14px] font-extrabold text-[#111827] border-b border-gray-100 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Security & Session Policy</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Session Timeout (Minutes)
              </label>
              <input
                type="number"
                value={settings.security.session_timeout_minutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      session_timeout_minutes: parseInt(e.target.value) || 15,
                    },
                  })
                }
                className="w-full p-2 border rounded-lg text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <span className="text-[12px] font-bold text-[#111827] block">Multi-Factor Authentication</span>
                <span className="text-[10px] text-gray-400">Require 2FA for all workspace users</span>
              </div>
              <input
                type="checkbox"
                checked={settings.security.mfa_required}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    security: { ...settings.security, mfa_required: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-[#1E3A8A]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
