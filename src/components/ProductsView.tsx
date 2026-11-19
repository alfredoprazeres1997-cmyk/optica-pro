import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import type { CurrencyCode, ProductRecord, UserRole, WorkspacePayload } from '../types/optica.ts';
import { formatMoney } from '../utils/format.ts';
import { ProductImage } from './LogoMark.tsx';

const CATEGORIES = [
  'Todas',
  'Armações',
  'Óculos de sol',
  'Lentes oftálmicas',
  'Lentes de contacto',
  'Acessórios',
  'Produtos de limpeza',
];

const CATALOG_PRESETS = [
  {
    label: 'Armação Titânio',
    url: '/src/assets/images/eyewear_titanium_frame_1795086400951.jpg',
  },
  {
    label: 'Armação Acetato',
    url: '/src/assets/images/eyewear_acetate_frame_1795086401024.jpg',
  },
  {
    label: 'Óculos de Sol',
    url: '/src/assets/images/eyewear_polarized_sunglasses_1795086401259.jpg',
  },
  {
    label: 'Lentes & Limpeza',
    url: '/src/assets/images/optical_lens_care_1795086401905.jpg',
  },
];

export function ProductsView({
  data,
  currency,
  role,
  onSaveProduct,
  onDeleteProduct,
}: {
  data: WorkspacePayload;
  currency: CurrencyCode;
  role: UserRole;
  onSaveProduct: (payload: Partial<ProductRecord>, id?: number) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
}) {
  const [category, setCategory] = useState('Todas');
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [editing, setEditing] = useState<Partial<ProductRecord> | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = ['admin', 'gerente'].includes(role);

  const lowStockCount = useMemo(
    () => data.products.filter((p) => p.quantity <= p.minStock).length,
    [data.products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.products.filter((p) => {
      if (category !== 'Todas' && p.category !== category) return false;
      if (onlyLowStock && p.quantity > p.minStock) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !p.brand.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [data.products, category, onlyLowStock, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name || !editing.code) return;
    setSaving(true);
    try {
      await onSaveProduct(
        {
          name: editing.name,
          code: editing.code,
          category: editing.category || 'Armações',
          brand: editing.brand || '',
          supplierName: editing.supplierName || '',
          supplierId: editing.supplierId || null,
          imageUrl: editing.imageUrl || CATALOG_PRESETS[0].url,
          purchasePrice: String(editing.purchasePrice || '0'),
          salePrice: String(editing.salePrice || '0'),
          quantity: Number(editing.quantity || 0),
          minStock: Number(editing.minStock || 5),
        },
        editing.id
      );
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Gestão de Produtos & Stock
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Catálogo óptico com alertas automáticos de stock mínimo ({lowStockCount} alertas activos)
          </p>
        </div>
        {canManage && (
          <button
            onClick={() =>
              setEditing({
                name: '',
                code: `OPT-${Math.floor(100 + Math.random() * 899)}`,
                category: 'Armações',
                brand: '',
                supplierName: data.suppliers[0]?.name || '',
                supplierId: data.suppliers[0]?.id || null,
                imageUrl: CATALOG_PRESETS[0].url,
                purchasePrice: '25000',
                salePrice: '65000',
                quantity: 10,
                minStock: 5,
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Produto</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  category === cat
                    ? 'bg-white text-[#0B1F3A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, código ou marca..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                onlyLowStock
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Stock Baixo ({lowStockCount})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500 border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Categoria / Marca</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4 text-right">P. Compra</th>
                <th className="py-3 px-4 text-right">P. Venda</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4">Estado</th>
                {canManage && <th className="py-3 px-4 text-right">Acções</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-10 text-center text-slate-500">
                    Nenhum produto encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.quantity <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductImage src={p.imageUrl} alt={p.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate max-w-[240px]">
                              {p.name}
                            </p>
                            <p className="font-mono text-xs text-slate-500">{p.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <p className="font-medium text-slate-800">{p.category}</p>
                        <p className="text-slate-500">{p.brand}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {p.supplierName || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                        {formatMoney(p.purchasePrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-[#0B1F3A] tabular-nums">
                        {formatMoney(p.salePrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                        <span className="font-semibold text-slate-900">{p.quantity}</span>
                        <span className="text-slate-400"> / mín. {p.minStock}</span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Stock Baixo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Normal</span>
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setEditing(p)}
                              title="Editar"
                              className="p-1.5 text-slate-500 hover:text-[#0B1F3A] rounded cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              title="Remover"
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                {editing.id ? 'Editar Produto' : 'Adicionar Produto'}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    required
                    type="text"
                    value={editing.name || ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Código *
                  </label>
                  <input
                    required
                    type="text"
                    value={editing.code || ''}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editing.category || 'Armações'}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Marca *
                  </label>
                  <input
                    required
                    type="text"
                    value={editing.brand || ''}
                    onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={editing.supplierName || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, supplierName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Fotografia do Produto
                  </label>
                  <select
                    value={editing.imageUrl || CATALOG_PRESETS[0].url}
                    onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {CATALOG_PRESETS.map((preset) => (
                      <option key={preset.url} value={preset.url}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Compra (Kz)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editing.purchasePrice || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, purchasePrice: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Venda (Kz)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editing.salePrice || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, salePrice: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Quantidade
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editing.quantity ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, quantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editing.minStock ?? 5}
                    onChange={(e) =>
                      setEditing({ ...editing, minStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer"
                >
                  {saving ? 'A guardar...' : 'Guardar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
