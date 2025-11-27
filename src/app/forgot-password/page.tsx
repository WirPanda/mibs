"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.forgetPassword({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error("Ошибка отправки ссылки. Проверьте email.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Ссылка для восстановления отправлена! Проверьте консоль (для разработки).");
    } catch (error) {
      toast.error("Ошибка. Попробуйте снова.");
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Восстановление пароля
          </h1>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✓ Ссылка для восстановления пароля отправлена на ваш email!
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm font-semibold mb-2">
                  🔧 Режим разработки:
                </p>
                <p className="text-blue-700 text-xs">
                  Ссылка для восстановления выведена в консоль сервера. 
                  Откройте терминал, где запущен сервер, и скопируйте ссылку.
                </p>
              </div>

              <button
                onClick={() => router.push("/login")}
                className="w-full bg-gradient-to-r from-[#3498db] to-[#2980b9] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Вернуться к входу
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                Введите ваш email, и мы отправим вам ссылку для восстановления пароля.
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                  placeholder="your@ldc.ru"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Отправка..." : "Отправить ссылку"}
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
          )}
        </div>
      </div>
    </div>
  );
}
