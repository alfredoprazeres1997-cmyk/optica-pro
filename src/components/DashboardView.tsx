import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Package,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import type { CurrencyCode, LanguageCode, WorkspacePayload } from '../types/optica.ts';
import { formatMoney, formatShortDate, todayISO } from '../utils/format.ts';
import { TRANSLATIONS } from '../utils/i18n.ts';
import { FinancialBarChart, HorizontalBarList } from './Charts.tsx';

export function DashboardView({
  data,
  currency,
  language,
  onNavigate,
}: {
  data: WorkspacePayload;
  currency: CurrencyCode;
  language: LanguageCode;
  onNavigate: (tab: string) => void;
}) {
  const t = TRANSLATIONS[language];
  const today = todayISO();
  const currentMonth = today.slice(0, 7);

  const stats = useMemo(() => {
    const salesToday = data.sales
      .filter((s) => s.saleDate === today)
      .reduce((acc, s) => acc + Number(s.total), 0);

    const salesMonth = data.sales
      .filter((s) => s.saleDate.startsWith(currentMonth))
      .reduce((acc, s) => acc + Number(s.total), 0);

    const totalRevenue = data.financialEntries
      .filter((f) => f.type === 'receita')
      .reduce((acc, f) => acc + Number(f.amount), 0);

    const totalExpenses = data.financialEntries
      .filter((f) => f.type === 'despesa')
      .reduce((acc, f) => acc + Number(f.amount), 0);

    const estimatedProfit = totalRevenue - totalExpenses;

    const totalStockUnits = data.products.reduce((acc, p) => acc + p.quantity, 0);
    const lowStockProducts = data.products.filter((p) => p.quantity <= p.minStock);

    const scheduledAppointments = data.appointments.filter(
      (a) => a.status === 'Agendada' || a.status === 'Confirmada' || a.status === 'Em Atendimento'
    );

    const pendingSalesAmount = data.sales.reduce(
      (acc, s) => acc + Number(s.pendingAmount),
      0
    );
    const pendingSuppliersAmount = data.suppliers.reduce(
      (acc, sup) => acc + Number(sup.pendingBalance),
      0
    );

    return {
      salesToday,
      salesMonth,
      estimatedProfit,
      totalClients: data.clients.length,
      totalStockUnits,
      lowStockProducts,
      scheduledAppointments,
      pendingAccounts: pendingSalesAmount + pendingSuppliersAmount,
      pendingSalesAmount,
      pendingSuppliersAmount,
      totalRevenue,
      totalExpenses,
    };
  }, [data, today, currentMonth]);

  const chartSeries = useMemo(() => {
    const months = ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'];
    const baseRev = Math.max(stats.totalRevenue, 500000);
    const baseExp = Math.max(stats.totalExpenses, 250000);
    const factors = [0.68, 0.75, 0.82, 0.79, 0.91, 1];
    return months.map((label, idx) => ({
      label,
      receitas: Math.round(baseRev * factors[idx]),
      despesas: Math.round(baseExp * (0.72 + idx * 0.05)),
    }));
  }, [stats.totalRevenue, stats.totalExpenses]);

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of data.sales) {
      map.set(s.paymentMethod, (map.get(s.paymentMethod) || 0) + Number(s.total));
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [data.sales]);

  const kpiCards = [
    {
      label: t.kpis.salesToday,
      value: formatMoney(stats.salesToday, currency),
      sub: `Ref. ${formatShortDate(today)}`,
      icon: TrendingUp,
      target: 'sales',
      alert: false,
    },
    {
      label: t.kpis.salesMonth,
      value: formatMoney(stats.salesMonth, currency),
      sub: `${data.sales.length} facturas emitidas`,
      icon: CreditCard,
      target: 'sales',
      alert: false,
    },
    {
      label: t.kpis.estimatedProfit,
      value: formatMoney(stats.estimatedProfit, currency),
      sub: `Receitas ${formatMoney(stats.totalRevenue, currency)}`,
      icon: Wallet,
      target: 'finance',
      alert: stats.estimatedProfit < 0,
    },
    {
      label: t.kpis.totalClients,
      value: String(stats.totalClients),
      sub: `${data.prescriptions.length} receitas registadas`,
      icon: Users,
      target: 'clients',
      alert: false,
    },
    {
      label: t.kpis.productsInStock,
      value: `${stats.totalStockUnits} un.`,
      sub: `${data.products.length} referências activas`,
      icon: Package,
      target: 'products',
      alert: false,
    },
    {
      label: t.kpis.lowStock,
      value: String(stats.lowStockProducts.length),
      sub: stats.lowStockProducts.length > 0 ? 'Reposição recomendada' : 'Níveis normais',
      icon: AlertTriangle,
      target: 'products',
      alert: stats.lowStockProducts.length > 0,
    },
    {
      label: t.kpis.scheduledAppointments,
      value: String(stats.scheduledAppointments.length),
      sub: 'Optometria & Contactologia',
      icon: Calendar,
      target: 'appointments',
      alert: false,
    },
    {
      label: t.kpis.pendingAccounts,
      value: formatMoney(stats.pendingAccounts, currency),
      sub: `Clientes ${formatMoney(stats.pendingSalesAmount, currency)}`,
      icon: Wallet,
      target: 'finance',
      alert: stats.pendingAccounts > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            {t.nav.dashboard}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data.tenant.name} · Visão operacional e financeira em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('sales')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Nova Venda (POS)
          </button>
          <button
            onClick={() => onNavigate('appointments')}
            className="px-4 py-2 text-xs font-semibold text-[#0B1F3A] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Agendar Consulta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onNavigate(card.target)}
              className="text-left bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <Icon
                  className={`w-4 h-4 ${
                    card.alert ? 'text-amber-600' : 'text-sky-600'
                  }`}
                />
              </div>
              <p className="mt-2 font-mono text-xl font-bold text-[#0B1F3A] tabular-nums truncate">
                {card.value}
              </p>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className={card.alert ? 'text-amber-700 font-medium' : 'text-slate-500'}>
                  {card.sub}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                Desempenho Financeiro Semestral
              </h2>
              <p className="text-xs text-slate-500">
                Comparação mensal entre receitas e despesas operacionais
              </p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer whitespace-nowrap"
            >
              Ver Relatórios
            </button>
          </div>
          <FinancialBarChart data={chartSeries} currency={currency} />
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-[#0B1F3A] mb-1">
              Facturação por Método
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Distribuição das vendas registadas
            </p>
            <HorizontalBarList
              items={paymentBreakdown}
              valueFormatter={(v) => formatMoney(v, currency)}
              barColor="bg-sky-600"
            />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Contas a Pagar (Fornecedores)</span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              {formatMoney(stats.pendingSuppliersAmount, currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-[#0B1F3A]">
              Alertas de Stock Baixo
            </h2>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
            >
              Gerir Stock
            </button>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Todos os produtos estão acima do stock mínimo configurado.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.lowStockProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.code} · {p.category} · Mínimo {p.minStock} un.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 shrink-0 tabular-nums font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{p.quantity} un.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-[#0B1F3A]">
              Próximas Consultas de Optometria
            </h2>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
            >
              Ver Agenda
            </button>
          </div>
          {stats.scheduledAppointments.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhuma consulta agendada de momento.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.scheduledAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {apt.clientName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {apt.reason} · {apt.professionalName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-semibold text-[#0B1F3A] tabular-nums">
                      {formatShortDate(apt.appointmentDate)} · {apt.appointmentTime}
                    </p>
                    <p className="text-[11px] text-sky-700">{apt.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
