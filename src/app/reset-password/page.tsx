"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import Image from "next/image";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Неверная или отсутствующая ссылка для восстановления");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Пароли не совпадают!");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Пароль должен быть минимум 6 символов!");
      return;
    }

    if (!token) {
      toast.error("Неверный токен восстановления");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: formData.password,
      });

      if (error) {
        toast.error("Ошибка сброса пароля. Возможно, ссылка устарела.");
        setLoading(false);
        return;
      }

      toast.success("Пароль успешно изменен! Перенаправление на вход...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      toast.error("Ошибка. Попробуйте снова.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                ❌ Неверная или отсутствующая ссылка для восстановления. 
                Пожалуйста, запросите новую ссылку.
              </p>
            </div>
            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full mt-4 bg-gradient-to-r from-[#3498db] to-[#2980b9] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Запросить новую ссылку
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Новый пароль
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Новый пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none pr-12"
                  placeholder="Минимум 6 символов"
                  autoComplete="off"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Подтвердите пароль
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none pr-12"
                  placeholder="Повторите пароль"
                  autoComplete="off"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Сохранение..." : "Сохранить новый пароль"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-gray-500 text-sm hover:text-gray-700"
              >
                ← Вернуться к входу
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
