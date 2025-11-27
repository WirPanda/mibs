"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const registered = searchParams.get("registered");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (error?.code) {
        toast.error("Неверный email или пароль. Убедитесь, что вы зарегистрированы.");
        setLoading(false);
        return;
      }

      toast.success("Вход выполнен успешно!");
      router.push(redirect);
    } catch (error) {
      toast.error("Ошибка входа. Попробуйте снова.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="animate-pulse-scale rounded-full overflow-hidden">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/c5ffde93234aaa3019335a52178b26c0-1764232128129.jpeg"
              alt="МИБС"
              width={120}
              height={120}
              className="object-cover rounded-full"
              priority
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Вход в систему</h1>

          {registered && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                ✓ Регистрация завершена! Теперь вы можете войти в систему.
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                placeholder="••••••••"
                autoComplete="off"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 text-[#3498db] border-gray-300 rounded focus:ring-[#3498db]"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                  Запомнить меня
                </label>
              </div>
              
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-sm text-[#3498db] font-semibold hover:underline"
              >
                Забыли пароль?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Нет аккаунта?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-[#3498db] font-semibold hover:underline"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              ← Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}