"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function ConfirmationPage() {
  const router = useRouter();
  const [registrationData, setRegistrationData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("registrationData");
    if (data) {
      setRegistrationData(JSON.parse(data));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  // Форматируем текст для QR-кода
  const qrCodeText = `ФИО: ${registrationData.fullName}\nКурс: ${registrationData.courseTitle}\nДата регистрации: ${new Date(registrationData.registrationDate).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}`;

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-code-${registrationData.courseTitle}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Иконка успеха */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">
            Регистрация успешна!
          </h1>
          
          <p className="text-gray-600 text-center mb-8">
            Вы успешно зарегистрированы на курс. Ниже представлен ваш персональный QR-код.
          </p>

          {/* Информация о регистрации */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700">ФИО:</span>
                <p className="text-gray-800">{registrationData.fullName}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Курс:</span>
                <p className="text-gray-800">{registrationData.courseTitle}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Дата регистрации:</span>
                <p className="text-gray-800">
                  {new Date(registrationData.registrationDate).toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* QR-код */}
          <div className="bg-gray-50 rounded-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
              Ваш QR-код
            </h2>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <QRCodeCanvas
                  id="qr-code-canvas"
                  value={qrCodeText}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Отсканируйте этот QR-код для получения информации о регистрации
            </p>
            <button
              onClick={handleDownloadQR}
              className="w-full bg-[#3498db] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#2980b9] transition-all"
            >
              Скачать QR-код
            </button>
          </div>

          {/* Кнопки навигации */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/account")}
              className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Перейти в личный кабинет
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-white text-gray-700 font-semibold py-4 px-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-all"
            >
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}