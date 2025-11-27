"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TabType = "dashboard" | "users" | "courses" | "registrations" | "news" | "settings";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  fullName: string | null;
  organization: string | null;
  position: string | null;
  phone: string | null;
  createdAt: string;
}

interface Course {
  id: number;
  title: string;
  category: string;
  price: number;
  maxStudents: number;
  isActive: boolean;
  instructor: string;
  duration: string;
  description: string;
}

interface Registration {
  registration: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    courseId: number;
    notes: string | null;
    registeredAt: string;
  };
  course: {
    id: number;
    title: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface NewsItem {
  news: {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    isPublished: boolean;
    publishedAt: number | null;
    imageUrl: string | null;
    createdAt: string;
  };
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [newsSearch, setNewsSearch] = useState("");

  // Защита роута - только для admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin");
    }
    
    if (!isPending && session?.user?.role !== "admin") {
      toast.error("Доступ запрещен. Требуются права администратора.");
      router.push("/");
    }
  }, [session, isPending, router]);

  // Загрузка данных
  useEffect(() => {
    if (session?.user?.role === "admin") {
      loadData();
    }
  }, [session, activeTab]);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("bearer_token");

    try {
      if (activeTab === "users" || activeTab === "dashboard") {
        const res = await fetch(`/api/admin/users?limit=100&search=${userSearch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      }

      if (activeTab === "courses" || activeTab === "dashboard") {
        const res = await fetch(`/api/courses?limit=100&search=${courseSearch}`);
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      }

      if (activeTab === "registrations" || activeTab === "dashboard") {
        const res = await fetch(`/api/admin/registrations?limit=100&search=${registrationSearch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data);
        }
      }

      if (activeTab === "news" || activeTab === "dashboard") {
        const res = await fetch(`/api/admin/news?limit=100&search=${newsSearch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      }

      if (activeTab === "settings" || activeTab === "dashboard") {
        const res = await fetch("/api/settings?limit=100");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const token = localStorage.getItem("bearer_token");
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        toast.success(`Роль изменена на ${newRole === "admin" ? "Администратор" : "Пользователь"}`);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Ошибка изменения роли");
      }
    } catch (error) {
      toast.error("Ошибка сервера");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Удалить этого пользователя? Это действие необратимо.")) return;

    const token = localStorage.getItem("bearer_token");

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Пользователь удалён");
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Ошибка удаления");
      }
    } catch (error) {
      toast.error("Ошибка сервера");
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Удалить этот курс?")) return;

    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        method: "DELETE",
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
    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
      const res = await fetch(`/api/admin/registrations?id=${id}`, {
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

  const deleteRegistration = async (regId: number) => {
    if (!confirm("Удалить эту регистрацию? Это действие необратимо.")) return;

    const token = localStorage.getItem("bearer_token");

    try {
      const res = await fetch(`/api/admin/registrations?id=${regId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Регистрация удалена");
        loadData();
      } else {
        toast.error("Ошибка удаления");
      }
    } catch (error) {
      toast.error("Ошибка сервера");
    }
  };

  const toggleNewsPublished = async (newsId: number, currentStatus: boolean) => {
    const token = localStorage.getItem("bearer_token");

    try {
      const res = await fetch(`/api/admin/news?id=${newsId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (res.ok) {
        toast.success(`Новость ${!currentStatus ? "опубликована" : "снята с публикации"}`);
        loadData();
      } else {
        toast.error("Ошибка изменения статуса");
      }
    } catch (error) {
      toast.error("Ошибка сервера");
    }
  };

  const deleteNews = async (newsId: number) => {
    if (!confirm("Удалить эту новость? Это действие необратимо.")) return;

    const token = localStorage.getItem("bearer_token");

    try {
      const res = await fetch(`/api/admin/news?id=${newsId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Новость удалена");
        loadData();
      } else {
        toast.error("Ошибка удаления");
      }
    } catch (error) {
      toast.error("Ошибка сервера");
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">⚙️ Панель администратора</h1>
            <p className="text-white/80 mt-1">Добро пожаловать, {session.user.name}</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 text-white px-6 py-2 rounded-lg hover:bg-white/30 transition-all"
          >
            ← На главную
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 mb-6 flex gap-2 flex-wrap">
          {[
            { id: "dashboard", label: "📊 Статистика", count: 0 },
            { id: "users", label: "👥 Пользователи", count: users.length },
            { id: "courses", label: "📚 Курсы", count: courses.length },
            { id: "registrations", label: "📝 Записи", count: registrations.length },
            { id: "news", label: "📰 Новости", count: news.length },
            { id: "settings", label: "⚙️ Настройки", count: settings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all text-sm ${
                activeTab === tab.id
                  ? "bg-white text-[#2980b9] shadow-lg"
                  : "text-white hover:bg-white/20"
              }`}
            >
              {tab.label}
              {tab.id !== "dashboard" && <span className="ml-1">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-3 text-gray-600">Загрузка...</p>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Общая статистика системы</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="text-4xl font-bold">{users.length}</div>
                      <div className="text-blue-100 mt-2">👥 Пользователей</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="text-4xl font-bold">{courses.length}</div>
                      <div className="text-green-100 mt-2">📚 Курсов</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="text-4xl font-bold">{registrations.length}</div>
                      <div className="text-purple-100 mt-2">📝 Записей</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                      <div className="text-4xl font-bold">{news.length}</div>
                      <div className="text-orange-100 mt-2">📰 Новостей</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Управление пользователями</h2>
                    <input
                      type="text"
                      placeholder="Поиск пользователей..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadData()}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Имя</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Организация</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Должность</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Роль</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{user.fullName || user.name}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{user.organization || "-"}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{user.position || "-"}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  user.role === "admin"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {user.role === "admin" ? "👑 Админ" : "👤 Пользователь"}
                              </span>
                            </td>
                            <td className="py-3 px-4 space-x-2">
                              <button
                                onClick={() => toggleUserRole(user.id, user.role)}
                                disabled={user.id === session.user.id}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                {user.role === "admin" ? "Снять админа" : "Сделать админом"}
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                disabled={user.id === session.user.id}
                                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
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

              {activeTab === "courses" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Управление курсами</h2>
                    <input
                      type="text"
                      placeholder="Поиск курсов..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadData()}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>👨‍🏫 {course.instructor}</span>
                              <span>📂 {course.category}</span>
                              <span>⏱️ {course.duration}</span>
                              <span>💰 {course.price.toLocaleString()} ₽</span>
                              <span>👥 {course.maxStudents} чел.</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold text-center ${
                                course.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {course.isActive ? "✅ Активен" : "❌ Неактивен"}
                            </span>
                            <button
                              onClick={() => handleToggleCourseStatus(course.id, course.isActive)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {course.isActive ? "Деактивировать" : "Активировать"}
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "registrations" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Управление записями</h2>
                    <input
                      type="text"
                      placeholder="Поиск записей..."
                      value={registrationSearch}
                      onChange={(e) => setRegistrationSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadData()}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Студент</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Курс</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Телефон</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Статус</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((reg) => (
                          <tr key={reg.registration.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {reg.registration.firstName} {reg.registration.lastName}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {reg.course?.title || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{reg.registration.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{reg.registration.phone}</td>
                            <td className="py-3 px-4">
                              <select
                                value={reg.registration.status}
                                onChange={(e) =>
                                  handleUpdateRegistrationStatus(reg.registration.id, e.target.value)
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
                              <button
                                onClick={() => deleteRegistration(reg.registration.id)}
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

              {activeTab === "news" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Управление новостями</h2>
                    <input
                      type="text"
                      placeholder="Поиск новостей..."
                      value={newsSearch}
                      onChange={(e) => setNewsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadData()}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    {news.map((item) => (
                      <div key={item.news.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{item.news.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.news.excerpt}</p>
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                              <span>✍️ {item.author?.name || "Неизвестно"}</span>
                              <span>
                                📅 {new Date(item.news.createdAt).toLocaleDateString("ru-RU")}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold text-center ${
                                item.news.isPublished
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {item.news.isPublished ? "✅ Опубликовано" : "📝 Черновик"}
                            </span>
                            <button
                              onClick={() => toggleNewsPublished(item.news.id, item.news.isPublished)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {item.news.isPublished ? "Снять с публикации" : "Опубликовать"}
                            </button>
                            <button
                              onClick={() => deleteNews(item.news.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Настройки системы</h2>
                  {settings.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Ключ</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Значение</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Описание</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settings.map((setting) => (
                            <tr key={setting.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{setting.key}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">{setting.value}</td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {setting.description || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>Настройки не найдены</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}