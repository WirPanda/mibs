"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Проверяем iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Проверяем standalone mode (уже установлено)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Проверяем, было ли уже отклонено
    const dismissed = localStorage.getItem('installPromptDismissed');
    
    if (!standalone && !dismissed) {
      // Для Android - ждем событие beforeinstallprompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      // Для iOS - показываем через 2 секунды
      if (iOS) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
        return () => clearTimeout(timer);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android - используем нативный промпт
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
    // Для iOS просто не закрываем баннер - инструкция остается
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/90 to-black/70 backdrop-blur-lg border-t border-white/20 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#2980b9] to-[#3498db] flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              Установить приложение МИБС
            </h3>
            
            {isIOS ? (
              <div className="text-white/80 text-sm space-y-2">
                <p>Установите на главный экран для быстрого доступа:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Нажмите <span className="inline-flex align-middle w-4 h-4 mx-1">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                    </svg>
                  </span> внизу</li>
                  <li>Выберите "На экран «Домой»"</li>
                  <li>Нажмите "Добавить"</li>
                </ol>
              </div>
            ) : (
              <p className="text-white/80 text-sm mb-3">
                Быстрый доступ без браузера, работает офлайн
              </p>
            )}

            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="mt-3 w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Установить сейчас
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
