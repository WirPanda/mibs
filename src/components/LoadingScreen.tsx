"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export const LoadingScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Симулируем прогресс загрузки
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
      <div className="text-center space-y-6">
        {/* Logo с анимацией */}
        <div className="animate-pulse-scale">
          <Image 
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/c5ffde93234aaa3019335a52178b26c0-1764232128129.jpeg"
            alt="МИБС"
            width={120}
            height={120}
            className="rounded-full mx-auto"
            priority
          />
        </div>

        {/* Название */}
        <h1 className="text-3xl font-bold text-white">МИБС</h1>

        {/* Прогресс бар */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mt-2">Загрузка {progress}%</p>
        </div>
      </div>
    </div>
  );
};
