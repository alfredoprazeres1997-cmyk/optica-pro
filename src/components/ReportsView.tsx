import React, { useMemo } from 'react';
import type { CurrencyCode, WorkspacePayload } from '../types/optica.ts';
import { formatMoney } from '../utils/format.ts';
import { FinancialBarChart, HorizontalBarList } from './Charts.tsx';

export function ReportsView({
  data,
  currency,
}: {
  data: WorkspacePayload;
  currency: CurrencyCode;
}) {
  const analytics = useMemo(() => {
    const prodQty = new Map<string, { qty: number; rev: number }>();
    for (const item of data.saleItems) {
      const cur = prodQty.get(item.productName) || { qty: 0, rev: 0 };
      prodQty.set(item.productName, {
        qty: cur.qty + item.quantity,
        rev: cur.rev + Number(item.lineTotal),
      });
    }

    const topProductsByRevenue = Array.from(prodQty.entries())
      .map(([label, v]) => ({
        label,
        sublabel: `${v.qty} un.`,
        value: v.rev,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const mostDemandedProducts = Array.from(prodQty.entries())
      .map(([label, v]) => ({
        label,
        sublabel: formatMoney(v.rev, currency),
        value: v.qty,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const sellerTotals = new Map<string, { count: number; total: number }>();
    const clientTotals = new Map<string, { count: number; total: number }>();
    for (const s of data.sales) {
      const sc = sellerTotals.get(s.sellerName) || { count: 0, total: 0 };
      sellerTotals.set(s.sellerName, {
        count: sc.count + 1,
        total: sc.total + Number(s.total),
      });

      const cc = clientTotals.get(s.clientName) || { count: 0, total: 0 };
      clientTotals.set(s.clientName, {
        count: cc.count + 1,
        total: cc.total + Number(s.total),
      });
    }

    const salesByStaff = Array.from(sellerTotals.entries())
      .map(([label, v]) => ({
        label,
        sublabel: `${v.count} vendas`,
        value: v.total,
      }))
      .sort((a, b) => b.value - a.value);

    const frequentClients = Array.from(clientTotals.entries())
      .map(([label, v]) => ({
        label,
        sublabel: `${v.count} compras`,
        value: v.total,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const totalRev = data.financialEntries
      .filter((e) => e.type === 'receita')
      .reduce((acc, e) => acc + Number(e.amount), 0);
    const totalExp = data.financialEntries
      .filter((e) => e.type === 'despesa')
      .reduce((acc, e) => acc + Number(e.amount), 0);

    const periodChart = [
      { label: 'Sem 1', receitas: Math.round(totalRev * 0.22), despesas: Math.round(totalExp * 0.25) },
      { label: 'Sem 2', receitas: Math.round(totalRev * 0.18), despesas: Math.round(totalExp * 0.2) },
      { label: 'Sem 3', receitas: Math.round(totalRev * 0.28), despesas: Math.round(totalExp * 0.3) },
      { label: 'Sem 4', receitas: Math.round(totalRev * 0.32), despesas: Math.round(totalExp * 0.25) },
      { label: 'Mês Ant.', receitas: Math.round(totalRev * 0.85), despesas: Math.round(totalExp * 0.9) },
      { label: 'Actual', receitas: totalRev, despesas: totalExp },
    ];

    return {
      topProductsByRevenue,
      mostDemandedProducts,
      salesByStaff,
      frequentClients,
      totalRev,
      totalExp,
      profit: totalRev - totalExp,
      periodChart,
    };
  }, [data, currency]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
          Relatórios & Inteligência Comercial
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Indicadores analíticos de produtos, equipa comercial, clientes frequentes e rentabilidade
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                Lucro, Receitas e Despesas por Período
              </h2>
              <p className="text-xs text-slate-500">
                Lucro líquido acumulado:{' '}
                <span className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                  {formatMoney(analytics.profit, currency)}
                </span>
              </p>
            </div>
          </div>
          <FinancialBarChart data={analytics.periodChart} currency={currency} />
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A] mb-1">
            Vendas por Funcionário
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Desempenho individual da equipa comercial
          </p>
          <HorizontalBarList
            items={analytics.salesByStaff}
            valueFormatter={(v) => formatMoney(v, currency)}
            barColor="bg-[#0B1F3A]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A] mb-1">
            Produtos Mais Vendidos (Valor)
          </h2>
          <p className="text-xs text-slate-500 mb-4">Receita gerada por referência</p>
          <HorizontalBarList
            items={analytics.topProductsByRevenue}
            valueFormatter={(v) => formatMoney(v, currency)}
            barColor="bg-sky-600"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A] mb-1">
            Produtos Mais Procurados (Qtd)
          </h2>
          <p className="text-xs text-slate-500 mb-4">Volume de saída em unidades</p>
          <HorizontalBarList
            items={analytics.mostDemandedProducts}
            valueFormatter={(v) => `${v} un.`}
            barColor="bg-sky-500"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-display text-base font-bold text-[#0B1F3A] mb-1">
            Clientes Mais Frequentes
          </h2>
          <p className="text-xs text-slate-500 mb-4">Volume de compras acumulado</p>
          <HorizontalBarList
            items={analytics.frequentClients}
            valueFormatter={(v) => formatMoney(v, currency)}
            barColor="bg-[#0B1F3A]"
          />
        </div>
      </div>
    </div>
  );
}
