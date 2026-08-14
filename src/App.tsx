import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from '@apps/web/src/components/Landing';
import TenantLoginPage from '@apps/web/src/pages/TenantLoginPage';
import SuperAdminLoginPage from '@apps/web/src/pages/SuperAdminLoginPage';
import AppLayout from '@packages/ui/src/layouts/AppLayout';
import TenantDashboard from '@apps/tenant/src/modules/dashboard/components/TenantDashboard';
import TeamAccessPage from '@apps/tenant/src/pages/TeamAccessPage';
import SettingsPage from '@apps/tenant/src/pages/SettingsPage';
import ProductsMasterPage from '@apps/tenant/src/pages/ProductsMasterPage';
import CustomersMasterPage from '@apps/tenant/src/pages/CustomersMasterPage';
import VendorsMasterPage from '@apps/tenant/src/pages/VendorsMasterPage';
import AccountingPage from '@apps/tenant/src/pages/AccountingPage';
import ReceivablesPage from '@apps/tenant/src/pages/ReceivablesPage';
import SalesPage from '@apps/tenant/src/pages/SalesPage';
import ProcurementPage from '@apps/tenant/src/pages/ProcurementPage';
import PayablesPage from '@apps/tenant/src/pages/PayablesPage';
import InventoryPage from '@apps/tenant/src/pages/InventoryPage';
import POSPage from '@apps/tenant/src/pages/POSPage';
import SuperAdminDashboard from '@apps/admin/src/modules/dashboard/components/SuperAdminDashboard';
import AdminUsers from '@apps/admin/src/modules/users/components/AdminUsers';
import { TenantProvider } from '@apps/tenant/src/lib/TenantContext';

export default function App() {
  return (
    <TenantProvider>
      <Router>
        <Routes>
          {/* Public Website & Authentication Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<TenantLoginPage />} />
          <Route path="/admin/login" element={<SuperAdminLoginPage />} />

          {/* Tenant Workspace Application Routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<TenantDashboard />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="sales/customers" element={<CustomersMasterPage />} />
            <Route path="procurement" element={<ProcurementPage />} />
            <Route path="payables" element={<PayablesPage />} />
            <Route path="purchases/vendors" element={<VendorsMasterPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/products" element={<ProductsMasterPage />} />
            <Route path="accounting" element={<AccountingPage />} />
            <Route path="receivables" element={<ReceivablesPage />} />
            <Route path="team" element={<TeamAccessPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>

          {/* Super Admin Console Routes */}
          <Route path="/admin" element={<AppLayout isAdmin />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Router>
    </TenantProvider>
  );
}
