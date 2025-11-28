"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-20 bg-gradient-to-b from-black/20 to-transparent">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <div className="text-white text-base md:text-lg font-semibold">МИБС</div>
          <div className="flex gap-2 md:gap-3 flex-wrap justify-end">
            {isPending ? (
              <div className="text-white text-xs md:text-sm">Загрузка...</div>
            ) : session?.user ? (
              <>
                <span className="text-white/90 text-xs md:text-sm flex items-center gap-2">
                  <span className="hidden sm:inline">Привет,</span> {session.user.name}
                  {session.user.role === "admin" && (
                    <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">
                      Admin
                    </span>
                  )}
                </span>
                {session.user.role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="bg-yellow-400 text-yellow-900 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-all text-xs md:text-sm"
                  >
                    <span className="hidden sm:inline">Админ панель</span>
                    <span className="sm:hidden">Админ</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="bg-white/20 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/30 transition-all text-xs md:text-sm"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="bg-white/20 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/30 transition-all text-xs md:text-sm whitespace-nowrap"
                >
                  Войти
                </button>
                <button
                  onClick={() => router.push("/register")}
                  className="bg-white text-[#2980b9] px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-white/90 transition-all text-xs md:text-sm font-semibold whitespace-nowrap"
                >
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-6 md:space-y-8 max-w-2xl mt-16 md:mt-0">
        {/* Logo */}
        <div className="flex justify-center mb-8 md:mb-12">
          <div className="animate-pulse-scale rounded-full overflow-hidden">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/c5ffde93234aaa3019335a52178b26c0-1764232128129.jpeg"
              alt="МИБС Медицинский институт"
              width={280}
              height={280}
              className="object-cover rounded-full w-40 h-40 md:w-[280px] md:h-[280px]"
              priority
            />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Добро пожаловать!</h2>
          <p className="text-xl md:text-2xl text-white/90">Система записи на курсы</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 md:space-y-4 pt-6 md:pt-8">
          <button 
            onClick={() => router.push('/registration')}
            className="w-full max-w-xs mx-auto block bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-3 md:py-4 px-8 md:px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            Начать запись
          </button>
          
          <button 
            onClick={() => router.push('/account')}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-white/20 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-full hover:bg-white/30 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Личный кабинет
          </button>

          <button 
            onClick={() => router.push('/news')}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-white/20 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-full hover:bg-white/30 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Новости
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-8 md:mt-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 md:p-6 text-white/90">
          <p className="text-sm leading-relaxed">
            Приложение для записи на образовательные курсы МИБС. 
            Выберите курс, укажите данные и получите подтверждение с QR-кодом.
          </p>
        </div>
      </div>

      {/* Decorative circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -top-48 -right-48" />
        <div className="absolute w-80 h-80 bg-white/5 rounded-full -bottom-40 -left-40" />
        <div className="absolute w-64 h-64 bg-white/5 rounded-full bottom-1/4 -right-20" />
      </div>
    </div>
  );
}