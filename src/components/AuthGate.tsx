import React, { useState } from 'react';
import { Eye, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { OpticaLogo } from './LogoMark.tsx';

export function AuthGate({
  onSignIn,
  loading,
  error,
}: {
  onSignIn: () => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="bg-white border-b border-slate-200 px-6 lg:px-12 h-16 flex items-center justify-between gap-8">
        <OpticaLogo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#modulos" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
            Módulos Clínicos
          </a>
          <a href="#seguranca" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
            Isolamento Multi-Tenant
          </a>
          <a href="#planos" className="hover:text-[#0B1F3A] transition-colors whitespace-nowrap shrink-0">
            Planos SaaS
          </a>
        </nav>
        <button
          onClick={onSignIn}
          disabled={loading}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'A autenticar...' : 'Entrar com Google'}
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2 text-xs font-medium text-sky-700">
            <span>Plataforma SaaS para Ópticas & Optometria</span>
            <span aria-hidden="true">·</span>
            <span>Base de Dados PostgreSQL Isolada</span>
          </div>

          <h1 className="font-display text-3xl lg:text-5xl font-bold tracking-tight text-[#0B1F3A] leading-tight text-balance">
            Gestão clínica, stock e facturação em Kwanza numa única plataforma.
          </h1>

          <p className="text-base text-slate-600 max-w-xl leading-relaxed">
            Controle receitas oftalmológicas (OD/OE), inventário de armações e lentes, vendas com Multicaixa Express, marcação de consultas e relatórios financeiros com separação total de dados por óptica.
          </p>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onSignIn}
              disabled={loading}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#0B1F3A] hover:bg-[#14325B] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <span>{loading ? 'A preparar a sua óptica...' : 'Aceder ao Painel com Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500">
              Cria automaticamente a sua óptica de demonstração em segundos.
            </span>
          </div>

          <div id="modulos" className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
            <div>
              <p className="font-mono text-lg font-bold text-[#0B1F3A] tabular-nums">OD / OE</p>
              <p className="text-xs text-slate-500 mt-0.5">Receitas & PDF Clínico</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-[#0B1F3A] tabular-nums">Kz</p>
              <p className="text-xs text-slate-500 mt-0.5">POS & Multicaixa Express</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-[#0B1F3A] tabular-nums">4 Perfis</p>
              <p className="text-xs text-slate-500 mt-0.5">Controlo RBAC Seguro</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-[#0B1F3A] tabular-nums">Multi-Óptica</p>
              <p className="text-xs text-slate-500 mt-0.5">Isolamento por Empresa</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="h-56 bg-slate-100 relative overflow-hidden">
            {!imgErr ? (
              <img
                src="/src/assets/images/eyewear_titanium_frame_1795086400951.jpg"
                alt="Armação óptica profissional em titânio"
                referrerPolicy="no-referrer"
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0B1F3A] to-sky-700 flex items-center justify-center text-white">
                <Eye className="w-12 h-12 opacity-60" />
              </div>
            )}
          </div>
          <div id="seguranca" className="p-6 flex-1 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Arquitectura SaaS Pronta para Produção</span>
              </div>
              <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
                Inclui ambiente de demonstração completo
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                  <span>Catálogo de armações, lentes oftálmicas e alertas de stock mínimo</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                  <span>Prescrições oftalmológicas com exportação imediata para PDF</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                  <span>Relatórios financeiros exportáveis para Excel e PDF</span>
                </li>
              </ul>
            </div>

            <div id="planos" className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Planos: Gratuito · Básico · Profissional · Empresarial</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        ÓPTICA PRO · Sistema de Gestão Óptica & Clínica de Optometria · Moeda padrão Kwanza (Kz)
      </footer>
    </div>
  );
}
