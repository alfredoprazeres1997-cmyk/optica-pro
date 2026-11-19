import React from 'react';
import type { CurrencyCode } from '../types/optica.ts';
import { formatMoney } from '../utils/format.ts';

export interface MonthlyMetricPoint {
  label: string;
  receitas: number;
  despesas: number;
}

export function FinancialBarChart({
  data,
  currency,
}: {
  data: MonthlyMetricPoint[];
  currency: CurrencyCode;
}) {
  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.receitas, d.despesas])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0B1F3A]" />
            <span>Receitas</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
            <span>Despesas</span>
          </span>
        </div>
        <span className="font-mono tabular-nums">Valores em {currency === 'AOA' ? 'Kz' : currency}</span>
      </div>

      <div className="grid grid-cols-6 gap-3 items-end h-48 pt-4 border-b border-slate-200">
        {data.map((point) => {
          const revH = Math.max(6, Math.round((point.receitas / maxVal) * 145));
          const expH = Math.max(4, Math.round((point.despesas / maxVal) * 145));
          return (
            <div key={point.label} className="flex flex-col items-center gap-2 group relative">
              <div className="w-full flex items-end justify-center gap-1.5 h-40">
                <div
                  style={{ height: `${revH}px` }}
                  title={`Receitas (${point.label}): ${formatMoney(point.receitas, currency)}`}
                  className="w-4 sm:w-5 bg-[#0B1F3A] hover:bg-[#173A68] rounded-t transition-all"
                />
                <div
                  style={{ height: `${expH}px` }}
                  title={`Despesas (${point.label}): ${formatMoney(point.despesas, currency)}`}
                  className="w-4 sm:w-5 bg-sky-400 hover:bg-sky-500 rounded-t transition-all"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-500 pb-1.5">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HorizontalBarList({
  items,
  valueFormatter,
  barColor = 'bg-[#0B1F3A]',
}: {
  items: Array<{ label: string; sublabel?: string; value: number }>;
  valueFormatter: (v: number) => string;
  barColor?: string;
}) {
  const maxVal = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-6 text-center">
        Sem dados registados para este indicador.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.max(4, Math.round((item.value / maxVal) * 100));
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <span className="font-medium text-slate-800">{item.label}</span>
                {item.sublabel && (
                  <span className="text-slate-400 ml-1.5">· {item.sublabel}</span>
                )}
              </div>
              <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${pct}%` }}
                className={`h-full rounded-full ${barColor} transition-all duration-300`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
