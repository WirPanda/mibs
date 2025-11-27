"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import { toast } from "sonner";

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  publishedAt: number;
  createdAt: string;
  authorId: string;
}

export default function NewsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news/published?limit=100");
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка новостей...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-white">📰 Новости</h1>
          <div className="w-6" />
        </div>

        {/* News Grid */}
        {news.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <p className="text-gray-600 text-lg">Новостей пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                {/* Image */}
                <div className="relative w-full h-48">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#3498db] to-[#2980b9] flex items-center justify-center">
                      <span className="text-white text-6xl">📰</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {item.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>📅 {formatDate(item.publishedAt)}</span>
                    <button className="text-[#3498db] font-semibold hover:underline">
                      Читать далее →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* News Detail Modal */}
        {selectedNews && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedNews(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              {selectedNews.imageUrl && (
                <div className="relative w-full h-96">
                  <Image
                    src={selectedNews.imageUrl}
                    alt={selectedNews.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      {selectedNews.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      📅 {formatDate(selectedNews.publishedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="text-gray-500 hover:text-gray-700 ml-4"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700">
                  <p className="text-xl text-gray-600 mb-6 italic">
                    {selectedNews.excerpt}
                  </p>
                  <div className="whitespace-pre-wrap">
                    {selectedNews.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
