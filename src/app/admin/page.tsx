"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TabType = "dashboard" | "courses" | "registrations" | "news" | "settings";

interface Course {
  id: number;
  title: string;
  category: string;
  price: number;
  maxStudents: number;
  isActive: boolean;
  instructor: string;
  duration: string;
}

interface Registration {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  courseId: number;
}

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  isPublished: boolean;
  publishedAt: number | null;
}

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Защита роута - для admin, moderator, owner
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin");
    }
    
    if (!isPending && session?.user && !["admin", "moderator", "owner"].includes(session.user.role)) {
      toast.error("Доступ запрещен. Требуются права администратора.");
      router.push("/");
    }
  }, [session, isPending, router]);

  // Загрузка данных
  useEffect(() => {
    if (session?.user && ["admin", "moderator", "owner"].includes(session.user.role)) {
      loadData();
    }
  }, [session, activeTab]);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("bearer_token");

    try {
      if (activeTab === "courses" || activeTab === "dashboard") {
        const res = await fetch("/api/courses?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      }

      if (activeTab === "registrations" || activeTab === "dashboard") {
        const res = await fetch("/api/registrations?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data);
        }
      }

      if (activeTab === "news" || activeTab === "dashboard") {
        const res = await fetch("/api/news?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Удалить этот курс?")) return;

    const token = localStorage.getItem("bearer_token");
    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Курс удален");
        loadData();
      } else {
        toast.error("Ошибка удаления курса");
      }
    } catch (error) {
      toast.error("Ошибка удаления курса");
    }
  };

  const handleToggleCourseStatus = async (id: number, currentStatus: boolean) => {
    const token = localStorage.getItem("bearer_token");
    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        toast.success("Статус обновлен");
        loadData();
      } else {
        toast.error("Ошибка обновления статуса");
      }
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  const handleUpdateRegistrationStatus = async (id: number, newStatus: string) => {
    const token = localStorage.getItem("bearer_token");
    try {
      const res = await fetch(`/api/registrations?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("Статус записи обновлен");
        loadData();
      } else {
        toast.error("Ошибка обновления статуса");
      }
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!session?.user || !["admin", "moderator", "owner"].includes(session.user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Панель администратора</h1>
            <p className="text-white/80 mt-1">
              Добро пожаловать, {session.user.name}
              {session.user.role === "owner" && " 👑"}
              {session.user.role === "admin" && " 🔑"}
              {session.user.role === "moderator" && " 🛡️"}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-all"
          >
            На главную
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 mb-6 flex gap-2 flex-wrap">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "courses", label: "Курсы" },
            { id: "registrations", label: "Записи" },
            { id: "news", label: "Новости" },
            { id: "settings", label: "Настройки" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[#2980b9]"
                  : "text-white hover:bg-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Загрузка...</div>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Статистика</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="text-3xl font-bold">{courses.length}</div>
                      <div className="text-blue-100 mt-1">Всего курсов</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="text-3xl font-bold">{registrations.length}</div>
                      <div className="text-green-100 mt-1">Записей</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="text-3xl font-bold">{news.length}</div>
                      <div className="text-purple-100 mt-1">Новостей</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "courses" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Управление курсами</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Название</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Категория</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Цена</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Преподаватель</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Статус</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => (
                          <tr key={course.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{course.title}</td>
                            <td className="py-3 px-4">{course.category}</td>
                            <td className="py-3 px-4">{course.price.toLocaleString()} ₽</td>
                            <td className="py-3 px-4">{course.instructor}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  course.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {course.isActive ? "Активен" : "Неактивен"}
                              </span>
                            </td>
                            <td className="py-3 px-4 space-x-2">
                              <button
                                onClick={() => handleToggleCourseStatus(course.id, course.isActive)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                {course.isActive ? "Деактивировать" : "Активировать"}
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "registrations" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Управление записями</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">ФИО</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Телефон</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Статус</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((reg) => (
                          <tr key={reg.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{reg.firstName} {reg.lastName}</td>
                            <td className="py-3 px-4">{reg.email}</td>
                            <td className="py-3 px-4">{reg.phone}</td>
                            <td className="py-3 px-4">
                              <select
                                value={reg.status}
                                onChange={(e) =>
                                  handleUpdateRegistrationStatus(reg.id, e.target.value)
                                }
                                className="px-3 py-1 border rounded-lg text-sm"
                              >
                                <option value="pending">В ожидании</option>
                                <option value="confirmed">Подтверждено</option>
                                <option value="completed">Завершено</option>
                                <option value="cancelled">Отменено</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Детали
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "news" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Управление новостями</h2>
                  <div className="space-y-4">
                    {news.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{item.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{item.excerpt}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.isPublished
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.isPublished ? "Опубликовано" : "Черновик"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Настройки системы</h2>
                  <div className="text-gray-600">
                    Раздел в разработке. Здесь будут настройки сайта.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}