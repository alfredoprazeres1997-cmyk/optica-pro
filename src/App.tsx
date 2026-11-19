import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  BarChart3,
  Calendar,
  CreditCard,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import type {
  CurrencyCode,
  LanguageCode,
  SaasPlanId,
  UserRole,
  WorkspacePayload,
} from './types/optica.ts';
import { TRANSLATIONS } from './utils/i18n.ts';
import { OpticaLogo } from './components/LogoMark.tsx';
import { AuthGate } from './components/AuthGate.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ClientsView } from './components/ClientsView.tsx';
import { PrescriptionsView } from './components/PrescriptionsView.tsx';
import { ProductsView } from './components/ProductsView.tsx';
import { SalesPosView } from './components/SalesPosView.tsx';
import { FinanceView } from './components/FinanceView.tsx';
import { AppointmentsView } from './components/AppointmentsView.tsx';
import { SuppliersView } from './components/SuppliersView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { AdminAndSaasView } from './components/AdminAndSaasView.tsx';
import {
  AndroidAppInstallButton,
  OfflineIndicator,
} from './components/PWAInstallModal.tsx';

type NavTabId =
  | 'dashboard'
  | 'clients'
  | 'prescriptions'
  | 'products'
  | 'sales'
  | 'finance'
  | 'appointments'
  | 'suppliers'
  | 'reports'
  | 'admin'
  | 'saas';

const ROLE_ALLOWED_TABS: Record<UserRole, NavTabId[]> = {
  admin: [
    'dashboard',
    'clients',
    'prescriptions',
    'products',
    'sales',
    'finance',
    'appointments',
    'suppliers',
    'reports',
    'admin',
    'saas',
  ],
  gerente: [
    'dashboard',
    'clients',
    'prescriptions',
    'products',
    'sales',
    'finance',
    'appointments',
    'suppliers',
    'reports',
    'admin',
  ],
  funcionario: ['dashboard', 'clients', 'products', 'sales', 'appointments'],
  optometrista: ['dashboard', 'clients', 'prescriptions', 'products', 'appointments'],
};

export default function App() {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const current = auth.currentUser;
      if (!current) throw new Error('Sessão expirada.');
      const token = await current.getIdToken();
      const res = await fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Erro ao comunicar com o servidor.');
      }
      return json;
    },
    []
  );

  const loadWorkspace = useCallback(async () => {
    setLoadingWorkspace(true);
    setApiError(null);
    try {
      await apiFetch('/api/bootstrap', { method: 'POST' });
      const data: WorkspacePayload = await apiFetch('/api/workspace');
      setWorkspace(data);
    } catch (err: any) {
      setApiError(err.message || 'Não foi possível carregar os dados da óptica.');
    } finally {
      setLoadingWorkspace(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthReady(true);
      if (user) {
        loadWorkspace();
      } else {
        setWorkspace(null);
      }
    });
    return () => unsub();
  }, [loadWorkspace]);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      setAuthError(
        err?.message || 'Não foi possível concluir a autenticação com Google.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setWorkspace(null);
    setActiveTab('dashboard');
  };

  const currency: CurrencyCode = workspace?.tenant?.currency || 'AOA';
  const language: LanguageCode = workspace?.tenant?.language || 'pt';
  const role: UserRole = workspace?.currentUser?.role || 'admin';
  const t = TRANSLATIONS[language];

  const navItems = useMemo(() => {
    const allowed = ROLE_ALLOWED_TABS[role] || ROLE_ALLOWED_TABS.admin;
    const all: Array<{ id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
      { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
      { id: 'clients', label: t.nav.clients, icon: Users },
      { id: 'prescriptions', label: t.nav.prescriptions, icon: Eye },
      { id: 'products', label: t.nav.products, icon: Package },
      { id: 'sales', label: t.nav.sales, icon: ShoppingBag },
      { id: 'finance', label: t.nav.finance, icon: Wallet },
      { id: 'appointments', label: t.nav.appointments, icon: Calendar },
      { id: 'suppliers', label: t.nav.suppliers, icon: Truck },
      { id: 'reports', label: t.nav.reports, icon: BarChart3 },
      { id: 'admin', label: t.nav.admin, icon: Settings },
      { id: 'saas', label: t.nav.saas, icon: CreditCard },
    ];
    return all.filter((item) => allowed.includes(item.id));
  }, [role, t]);

  useEffect(() => {
    const allowed = ROLE_ALLOWED_TABS[role] || ROLE_ALLOWED_TABS.admin;
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [role, activeTab]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <OpticaLogo />
          <p className="text-xs text-slate-500">A verificar sessão segura...</p>
        </div>
      </div>
    );
  }

  if (!fbUser) {
    return (
      <AuthGate
        onSignIn={handleSignIn}
        loading={authLoading}
        error={authError}
      />
    );
  }

  if (!workspace && loadingWorkspace) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center space-y-3">
          <div className="flex justify-center">
            <OpticaLogo />
          </div>
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
            A preparar a sua óptica...
          </h2>
          <p className="text-xs text-slate-500">
            A carregar clientes, receitas, stock e indicadores financeiros em PostgreSQL.
          </p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full space-y-4 text-center">
          <p className="text-sm text-red-700 font-medium">
            {apiError || 'Não foi possível ligar à base de dados.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={loadWorkspace}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] rounded-lg cursor-pointer"
            >
              Tentar Novamente
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg cursor-pointer"
            >
              Terminar Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  const refreshAfterMutation = async (fn: () => Promise<void>) => {
    setApiError(null);
    try {
      await fn();
      const updated: WorkspacePayload = await apiFetch('/api/workspace');
      setWorkspace(updated);
    } catch (err: any) {
      setApiError(err.message || 'Erro ao executar operação.');
      throw err;
    }
  };

  const activeNavLabel =
    navItems.find((i) => i.id === activeTab)?.label || t.nav.dashboard;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-[#0B1F3A] text-white shrink-0">
        <div className="h-16 px-5 flex items-center border-b border-white/10">
          <OpticaLogo light />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-sky-500/20 text-sky-200'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <select
              aria-label="Moeda"
              value={currency}
              onChange={(e) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/tenant', {
                    method: 'PATCH',
                    body: JSON.stringify({ currency: e.target.value }),
                  })
                )
              }
              className="flex-1 bg-[#132E53] border border-white/15 text-xs text-white rounded-md px-2 py-1.5"
            >
              <option value="AOA">AOA (Kz)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
            <select
              aria-label="Idioma"
              value={language}
              onChange={(e) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/tenant', {
                    method: 'PATCH',
                    body: JSON.stringify({ language: e.target.value }),
                  })
                )
              }
              className="w-20 bg-[#132E53] border border-white/15 text-xs text-white rounded-md px-2 py-1.5"
            >
              <option value="pt">PT</option>
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
            </select>
          </div>

          <AndroidAppInstallButton />

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.common.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 bg-[#0B1F3A] text-white flex flex-col z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
              <OpticaLogo light />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-sky-500/20 text-sky-200'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10 space-y-2.5">
              <AndroidAppInstallButton />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.common.signOut}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
              <span className="font-semibold text-[#0B1F3A] truncate">
                {workspace.tenant.name}
              </span>
              <span aria-hidden="true">/</span>
              <span className="truncate">{activeNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-800">
                {workspace.currentUser.name}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize text-sky-700 font-medium">{role}</span>
            </div>
            <div className="hidden md:block">
              <AndroidAppInstallButton compact />
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              POS Rápido
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-4">
          {apiError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
              <span>{apiError}</span>
              <button
                onClick={() => setApiError(null)}
                className="text-red-500 hover:text-red-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              data={workspace}
              currency={currency}
              language={language}
              onNavigate={(tab) => setActiveTab(tab as NavTabId)}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              data={workspace}
              currency={currency}
              onSaveClient={(payload, id) =>
                refreshAfterMutation(() =>
                  apiFetch(id ? `/api/clients/${id}` : '/api/clients', {
                    method: id ? 'PATCH' : 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsView
              data={workspace}
              role={role}
              onCreatePrescription={(payload) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/prescriptions', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              data={workspace}
              currency={currency}
              role={role}
              onSaveProduct={(payload, id) =>
                refreshAfterMutation(() =>
                  apiFetch(id ? `/api/products/${id}` : '/api/products', {
                    method: id ? 'PATCH' : 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
              onDeleteProduct={(id) =>
                refreshAfterMutation(() =>
                  apiFetch(`/api/products/${id}`, { method: 'DELETE' })
                )
              }
            />
          )}

          {activeTab === 'sales' && (
            <SalesPosView
              data={workspace}
              currency={currency}
              onCreateSale={(payload) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/sales', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
              onSettleSale={(saleId, amount, paymentMethod) =>
                refreshAfterMutation(() =>
                  apiFetch(`/api/sales/${saleId}/settle`, {
                    method: 'POST',
                    body: JSON.stringify({ amount, paymentMethod }),
                  })
                )
              }
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              data={workspace}
              currency={currency}
              role={role}
              onCreateEntry={(payload) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/finance', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              data={workspace}
              onCreateAppointment={(payload) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/appointments', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
              onUpdateAppointment={(id, payload) =>
                refreshAfterMutation(() =>
                  apiFetch(`/api/appointments/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                  })
                )
              }
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              data={workspace}
              currency={currency}
              role={role}
              onCreateSupplier={(payload) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/suppliers', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
              onUpdateSupplierBalance={(id, pendingBalance) =>
                refreshAfterMutation(() =>
                  apiFetch(`/api/suppliers/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ pendingBalance }),
                  })
                )
              }
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView data={workspace} currency={currency} />
          )}

          {(activeTab === 'admin' || activeTab === 'saas') && (
            <AdminAndSaasView
              mode={activeTab}
              data={workspace}
              currency={currency}
              onCreateStaff={(payload) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/staff', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  })
                )
              }
              onToggleStaff={(id, active) =>
                refreshAfterMutation(() =>
                  apiFetch(`/api/staff/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ active }),
                  })
                )
              }
              onSwitchRolePreview={(newRole) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/role-preview', {
                    method: 'POST',
                    body: JSON.stringify({ role: newRole }),
                  })
                )
              }
              onUpdateTenant={(payload) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/tenant', {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                  })
                )
              }
              onUpgradePlan={(plan: SaasPlanId, amount: number, paymentMethod: string) =>
                refreshAfterMutation(() =>
                  apiFetch('/api/subscription', {
                    method: 'POST',
                    body: JSON.stringify({ plan, amount, paymentMethod }),
                  })
                )
              }
              onDownloadBackup={async () => {
                const backup = await apiFetch('/api/backup');
                const blob = new Blob([JSON.stringify(backup, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `optica-pro-backup-${new Date()
                  .toISOString()
                  .slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            />
          )}
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
}
