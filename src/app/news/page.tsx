"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  authorName: string;
  imageUrl: string | null;
  publishedAt: number;
  createdAt: number;
}

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news/published?limit=50");
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      } else {
        toast.error("Ошибка загрузки новостей");
      }
    } catch (error) {
      toast.error("Ошибка загрузки новостей");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-white">Новости</h1>
          <div className="w-6" />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Загрузка новостей...</div>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <p className="text-gray-600 text-lg">Пока нет опубликованных новостей</p>
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-64 object-cover rounded-xl mb-6"
                  />
                )}
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{item.title}</h2>
                <p className="text-gray-600 mb-4">{item.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Автор: {item.authorName}</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString("ru-RU")}</span>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
