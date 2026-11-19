import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileDown,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import type { CurrencyCode, WorkspacePayload } from '../types/optica.ts';
import { formatMoney, formatShortDate, todayISO } from '../utils/format.ts';
import { exportReceiptPDF } from '../utils/exportUtils.ts';
import { ProductImage } from './LogoMark.tsx';

interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  maxQty: number;
}

export function SalesPosView({
  data,
  currency,
  onCreateSale,
  onSettleSale,
}: {
  data: WorkspacePayload;
  currency: CurrencyCode;
  onCreateSale: (payload: {
    clientId?: number | null;
    clientName: string;
    sellerName: string;
    discount: number;
    paidAmount: number;
    paymentMethod: string;
    saleDate: string;
    notes?: string;
    items: Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) => Promise<void>;
  onSettleSale: (saleId: number, amount: number, method: string) => Promise<void>;
}) {
  const [viewMode, setViewMode] = useState<'pos' | 'history'>('pos');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientId, setClientId] = useState<number>(data.clients[0]?.id || 0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Multicaixa Express');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter(
      (p) =>
        p.quantity > 0 &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q))
    );
  }, [data.products, search]);

  const subtotal = useMemo(
    () => cart.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - discount);

  const addToCart = (productId: number) => {
    const prod = data.products.find((p) => p.id === productId);
    if (!prod || prod.quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        if (existing.quantity >= prod.quantity) return prev;
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          unitPrice: Number(prod.salePrice),
          quantity: 1,
          maxQty: prod.quantity,
        },
      ];
    });
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const next = i.quantity + delta;
          if (next <= 0) return null;
          return { ...i, quantity: Math.min(i.maxQty, next) };
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const selectedClient = data.clients.find((c) => c.id === clientId);
    const paid =
      paymentMethod === 'Pagamento Parcial'
        ? Math.min(total, Math.max(0, Number(partialAmount) || 0))
        : total;

    setSubmitting(true);
    try {
      await onCreateSale({
        clientId: selectedClient?.id || null,
        clientName: selectedClient?.fullName || 'Cliente de Balcão',
        sellerName: data.currentUser.name,
        discount,
        paidAmount: paid,
        paymentMethod,
        saleDate: todayISO(),
        notes,
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
      });
      setCart([]);
      setDiscount(0);
      setPartialAmount('');
      setNotes('');
      setViewMode('history');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Vendas & Facturação
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ponto de venda em Kwanza (Kz) com Multicaixa Express, pagamento parcial e recibos PDF
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            onClick={() => setViewMode('pos')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'pos'
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Novo Atendimento (POS)
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              viewMode === 'history'
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Histórico de Transacções ({data.sales.length})
          </button>
        </div>
      </div>

      {viewMode === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar armações, lentes, óculos de sol ou código..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p.id)}
                  className="text-left p-3 border border-slate-200 hover:border-sky-400 rounded-xl transition-colors flex items-center gap-3 cursor-pointer bg-white"
                >
                  <ProductImage src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {p.code} · Stock: {p.quantity} un.
                    </p>
                    <p className="font-mono text-xs font-bold text-[#0B1F3A] mt-1 tabular-nums">
                      {formatMoney(p.salePrice, currency)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleCheckout}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#0B1F3A]" />
                  <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                    Carrinho de Compras
                  </h2>
                </div>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {cart.reduce((a, b) => a + b.quantity, 0)} itens
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Cliente
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value={0}>Cliente de Balcão (Consumidor Final)</option>
                  {data.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    Seleccione produtos à esquerda para adicionar à venda.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">
                          {item.productName}
                        </p>
                        <p className="font-mono text-slate-500 tabular-nums">
                          {formatMoney(item.unitPrice, currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, -1)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono w-5 text-center font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, 1)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, -item.quantity)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Desconto (Kz)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Método de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Multicaixa Express">Multicaixa Express</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Pagamento Parcial">Pagamento Parcial</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'Pagamento Parcial' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valor Entregue Agora (Kz)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={total}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder={`Ex: ${Math.round(total * 0.5)}`}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-sky-300 rounded-lg bg-sky-50/30"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Observações da Factura
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Entrega de lentes prevista em 48h"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#0B1F3A]">
                <span>Total a Pagar</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(total, currency)}
                </span>
              </div>
              <button
                type="submit"
                disabled={cart.length === 0 || submitting}
                className="w-full py-2.5 px-4 bg-[#0B1F3A] hover:bg-[#14325B] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>{submitting ? 'A emitir factura...' : 'Finalizar Venda & Emitir Recibo'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Factura</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Pendente</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sales.map((sale) => {
                  const items = data.saleItems.filter((i) => i.saleId === sale.id);
                  const pending = Number(sale.pendingAmount);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs font-semibold text-[#0B1F3A]">
                          {sale.invoiceNumber}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatShortDate(sale.saleDate)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-900">
                        {sale.clientName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{sale.sellerName}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {sale.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-[#0B1F3A] tabular-nums">
                        {formatMoney(sale.total, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                        <span className={pending > 0 ? 'text-amber-700 font-semibold' : 'text-slate-400'}>
                          {formatMoney(pending, currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {pending <= 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pago</span>
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              onSettleSale(sale.id, pending, 'Multicaixa Express')
                            }
                            className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                          >
                            Liquidar Saldo
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            exportReceiptPDF(sale, items, data.tenant, currency)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
