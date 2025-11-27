"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PWAStatus } from "@/components/PWAStatus";
import { NetworkStatus } from "@/components/NetworkStatus";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"android" | "ios" | "web" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Определяем iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Сохраняем событие beforeinstallprompt для Android/Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error("Ошибка выхода");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success("Вы вышли из системы");
    }
  };

  const handleDownload = async (platform: "android" | "ios" | "web") => {
    // Для iOS всегда показываем инструкции
    if (platform === "ios" || isIOS) {
      setSelectedPlatform("ios");
      setShowInstallModal(true);
      return;
    }

    // Для Android/Web пытаемся установить через PWA
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast.success('Приложение установлено! 🎉');
        } else {
          toast.info('Вы можете установить приложение позже из меню браузера');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Ошибка установки:', error);
        setSelectedPlatform(platform);
        setShowInstallModal(true);
      }
    } else {
      setSelectedPlatform(platform);
      setShowInstallModal(true);
    }
  };

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-4 md:p-6 relative overflow-hidden">
      {/* Network Status Indicator */}
      <NetworkStatus />
      
      {/* PWA Status Indicator */}
      <PWAStatus />

      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-6 bg-black/20 backdrop-blur-sm border-b border-white/10 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="text-white text-lg md:text-xl font-bold">МИБС</div>
          <div className="flex gap-2 items-center flex-wrap justify-end">
            {isPending ? (
              <div className="text-white text-sm md:text-base bg-white/20 px-3 py-2 rounded-lg animate-pulse">
                Загрузка...
              </div>
            ) : session?.user ? (
              <>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
                  <span className="text-white text-sm md:text-base font-medium flex items-center gap-2 whitespace-nowrap">
                    {session.user.name}
                    {session.user.role === "admin" && (
                      <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded text-xs font-bold">
                        Admin
                      </span>
                    )}
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {session.user.role === "admin" && (
                      <button
                        onClick={() => router.push("/admin")}
                        className="bg-yellow-400 text-yellow-900 px-4 py-2.5 rounded-lg font-bold hover:bg-yellow-300 transition-all duration-200 hover:scale-105 text-sm whitespace-nowrap flex-1 sm:flex-none"
                      >
                        Админ панель
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="bg-white/30 text-white px-4 py-2.5 rounded-lg hover:bg-white/40 transition-all duration-200 hover:scale-105 text-sm font-medium whitespace-nowrap flex-1 sm:flex-none"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="bg-white/30 text-white px-4 py-2.5 rounded-lg hover:bg-white/40 transition-all duration-200 hover:scale-105 text-sm font-medium whitespace-nowrap"
                >
                  Войти
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="bg-white text-[#2980b9] px-4 py-2.5 rounded-lg hover:bg-white/90 transition-all duration-200 hover:scale-105 text-sm font-bold whitespace-nowrap"
                >
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-6 max-w-2xl w-full px-4 mt-24 md:mt-28 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="animate-pulse-scale rounded-full overflow-hidden shadow-2xl">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/c5ffde93234aaa3019335a52178b26c0-1764232128129.jpeg"
              alt="МИБС Медицинский институт"
              width={120}
              height={120}
              className="object-cover rounded-full"
              priority
            />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Добро пожаловать!</h2>
          <p className="text-xl md:text-2xl text-white/90">Система записи на курсы</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <button 
            onClick={() => router.push('/registration')}
            className="w-full max-w-xs mx-auto block bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-base"
          >
            Начать запись
          </button>
          
          <button 
            onClick={() => router.push('/account')}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-white/20 text-white font-semibold py-4 px-8 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-105 text-base backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Личный кабинет
          </button>

          <button 
            onClick={() => router.push('/news')}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-white/20 text-white font-semibold py-4 px-8 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-105 text-base backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Новости
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 md:p-6 text-white/90 animate-in fade-in slide-in-from-bottom-6 duration-1000 shadow-xl">
          <p className="text-sm md:text-base leading-relaxed">
            Приложение для записи на образовательные курсы МИБС. 
            Выберите курс, укажите данные и получите подтверждение с QR-кодом.
          </p>
        </div>
      </div>

      {/* Animated decorative circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -top-48 -right-48 animate-pulse" />
        <div className="absolute w-80 h-80 bg-white/5 rounded-full -bottom-40 -left-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 bg-white/5 rounded-full bottom-1/4 -right-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Download Icons Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm border-t border-white/10 py-3 px-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="text-white/80 text-xs md:text-sm font-medium hidden sm:inline">
            Скачать приложение:
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownload("android")}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 group"
              title="Скачать для Android"
            >
              <span className="text-2xl">🤖</span>
              <span className="text-white text-xs font-medium hidden md:inline">Android</span>
            </button>

            <button
              onClick={() => handleDownload("ios")}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 group"
              title="Скачать для iPhone"
            >
              <span className="text-2xl">📱</span>
              <span className="text-white text-xs font-medium hidden md:inline">iPhone</span>
            </button>

            <button
              onClick={() => handleDownload("web")}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 group"
              title="Открыть в браузере"
            >
              <span className="text-2xl">🌐</span>
              <span className="text-white text-xs font-medium hidden md:inline">Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* Install Prompt Banner */}
      <InstallPrompt />

      {/* Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={() => setShowInstallModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedPlatform === "android" && "📱 Установка на Android"}
                {selectedPlatform === "ios" && "📱 Установка на iPhone"}
                {selectedPlatform === "web" && "🌐 Открыть в браузере"}
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            {selectedPlatform === "android" && (
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold text-lg">Шаги установки:</p>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>Откройте этот сайт в браузере <strong>Chrome</strong></li>
                  <li>Нажмите на три точки <strong>⋮</strong> в правом верхнем углу</li>
                  <li>Выберите <strong>"Установить приложение"</strong> или <strong>"Добавить на главный экран"</strong></li>
                  <li>Подтвердите установку</li>
                  <li>✅ Готово! Иконка появится на главном экране</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 После установки приложение будет работать как обычное приложение Android
                  </p>
                </div>
              </div>
            )}

            {selectedPlatform === "ios" && (
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold text-lg">Шаги установки:</p>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>Откройте этот сайт в браузере <strong>Safari</strong> (не Chrome!)</li>
                  <li>Нажмите кнопку <strong>"Поделиться"</strong> <span className="inline-block">⬆️</span> внизу экрана</li>
                  <li>Прокрутите вниз и найдите <strong>"На экран «Домой»"</strong></li>
                  <li>Нажмите <strong>"Добавить"</strong></li>
                  <li>✅ Готово! Иконка появится на главном экране</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Важно использовать Safari, а не Chrome для установки на iPhone
                  </p>
                </div>
              </div>
            )}

            {selectedPlatform === "web" && (
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">Вы уже используете веб-версию! 🎉</p>
                <p>Просто добавьте эту страницу в закладки для быстрого доступа:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Chrome/Edge:</strong> Нажмите Ctrl+D (Windows) или Cmd+D (Mac)</li>
                  <li><strong>Firefox:</strong> Нажмите Ctrl+D или звездочку в адресной строке</li>
                  <li><strong>Safari:</strong> Нажмите Cmd+D</li>
                </ul>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✨ Веб-версия всегда актуальна и не требует обновлений!
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full bg-gradient-to-r from-[#2980b9] to-[#3498db] text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
}