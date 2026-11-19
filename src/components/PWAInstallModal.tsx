import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, Smartphone, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return isOnline;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Modo Offline — Interface em cache</span>
    </div>
  );
}

export function AndroidAppInstallButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : '';

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) return;
    }
    setModalOpen(true);
  };

  const downloadCapacitorConfig = () => {
    const config = {
      appId: 'ao.opticapro.app',
      appName: 'ÓPTICA PRO',
      webDir: 'dist',
      server: {
        url: appUrl,
        cleartext: false,
      },
      android: {
        allowMixedContent: false,
        backgroundColor: '#0B1F3A',
      },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'capacitor.config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadApkScript = () => {
    const script = [
      '# ÓPTICA PRO — Guia e Script de Compilação APK (Android)',
      `# URL da Aplicação: ${appUrl}`,
      '',
      '## OPÇÃO 1 (Mais rápida — Sem instalar Android Studio):',
      '1. Aceda a https://www.pwabuilder.com',
      `2. Cole o URL: ${appUrl}`,
      '3. Clique em "Start" -> "Package for Stores" -> "Android" -> "Generate Package"',
      '4. Descarregue o ficheiro .apk pronto a instalar no telemóvel Android.',
      '',
      '## OPÇÃO 2 (Via Capacitor CLI no computador local):',
      'npm install @capacitor/core @capacitor/cli @capacitor/android',
      'npm run build',
      'npx cap add android',
      'npx cap sync android',
      'cd android && ./gradlew assembleRelease',
      '# O APK será gerado em: android/app/build/outputs/apk/release/',
    ].join('\n');
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gerar-apk-optica-pro.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  if (isInstalled && compact) {
    return null;
  }

  return (
    <>
      <button
        onClick={handlePrimaryClick}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B1F3A] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0'
            : 'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#0B1F3A] bg-sky-300 hover:bg-sky-200 transition-colors cursor-pointer'
        }
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>{isInstallable ? 'Instalar App Android' : 'App Android / APK'}</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-5 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] text-sky-300 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#0B1F3A]">
                    ÓPTICA PRO para Android (PWA & APK)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instalação directa ou empacotamento em ficheiro .apk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-semibold text-[#0B1F3A]">
                  1. Instalar agora no telemóvel (sem APK)
                </p>
                {isIOS ? (
                  <p>
                    No Safari do iPhone/iPad: toque no botão <strong>Partilhar</strong> e
                    seleccione <strong>Adicionar ao Ecrã Principal</strong>.
                  </p>
                ) : (
                  <p>
                    Abra este endereço no <strong>Google Chrome</strong> do Android, toque no
                    menu (⋮) e seleccione <strong>Instalar aplicação</strong>. A ÓPTICA PRO
                    será instalada com ícone próprio no ecrã inicial em modo ecrã inteiro.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-sky-50/60 border border-sky-200 space-y-3">
                <p className="font-semibold text-[#0B1F3A]">
                  2. Gerar ficheiro .APK assinável para distribuição
                </p>
                <p>
                  O manifesto PWA e os ícones Android já estão activos nesta aplicação.
                  Pode gerar o ficheiro <strong>.apk</strong> em minutos usando o URL da
                  aplicação no <strong>PWABuilder</strong> ou compilando localmente com{' '}
                  <strong>Capacitor Android</strong>:
                </p>

                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={appUrl}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono text-[11px] text-slate-800"
                  />
                  <button
                    onClick={copyUrl}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded text-xs font-medium text-[#0B1F3A] cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={downloadCapacitorConfig}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B1F3A] hover:bg-[#14325B] text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descarregar capacitor.config.json</span>
                  </button>
                  <button
                    onClick={downloadApkScript}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-[#0B1F3A] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descarregar Script APK (.txt)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
