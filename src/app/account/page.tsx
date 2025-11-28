"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";

interface Registration {
  id: number;
  courseId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  registeredAt: number;
}

interface Course {
  id: number;
  title: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
  personal_email: string | null;
  organization: string | null;
  position: string | null;
  experience: string | null;
  second_specialty: string | null;
  age: number | null;
  gender: string | null;
  role: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [activeTab, setActiveTab] = useState<"history" | "settings">("history");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Защита роута
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/account");
    }
  }, [session, isPending, router]);

  // Загрузка данных
  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("bearer_token");

    try {
      // Загрузка профиля пользователя
      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setProfileData(profile);
      }

      // Загрузка регистраций пользователя
      const regRes = await fetch("/api/registrations?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (regRes.ok) {
        const regData = await regRes.json();
        setRegistrations(regData);
      }

      // Загрузка курсов для отображения названий
      const coursesRes = await fetch("/api/courses?limit=100");
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }
    } catch (error) {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Размер файла не должен превышать 5MB");
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadRes.json();
      
      // Обновляем аватар в профиле
      const token = localStorage.getItem("bearer_token");
      const updateRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: url }),
      });

      if (updateRes.ok) {
        toast.success("Аватар обновлен");
        loadData();
        refetch();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      toast.error("Ошибка загрузки аватара");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData) return;

    if (!profileData.gender) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    const token = localStorage.getItem("bearer_token");

    try {
      const updateRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: profileData.phone,
          personal_email: profileData.personal_email,
          organization: profileData.organization,
          position: profileData.position,
          experience: profileData.experience,
          second_specialty: profileData.second_specialty,
          age: profileData.age,
          gender: profileData.gender,
        }),
      });

      if (updateRes.ok) {
        toast.success("Профиль обновлен");
        setIsEditing(false);
        loadData();
      } else {
        toast.error("Ошибка обновления профиля");
      }
    } catch (error) {
      toast.error("Ошибка обновления профиля");
    }
  };

  const getCourseTitle = (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || "Курс не найден";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "В обработке",
      confirmed: "Подтверждено",
      completed: "Завершено",
      cancelled: "Отменено",
    };
    return texts[status] || status;
  };

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error("Ошибка выхода");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success("Вы вышли из системы");
      router.push("/");
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!session?.user || !profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Личный кабинет</h1>
          <div className="w-6" />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              {profileData.image ? (
                <Image
                  src={profileData.image}
                  alt={profileData.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profileData.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profileData.name}</h2>
              <p className="text-gray-600">{profileData.email}</p>
              {profileData.role === "owner" && (
                <span className="inline-block mt-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                  👑 Владелец
                </span>
              )}
              {profileData.role === "admin" && (
                <span className="inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  🔑 Администратор
                </span>
              )}
              {profileData.role === "moderator" && (
                <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  🛡️ Модератор
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === "history"
                  ? "text-[#3498db] border-b-2 border-[#3498db]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              История записей
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === "settings"
                  ? "text-[#3498db] border-b-2 border-[#3498db]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Настройки
            </button>
          </div>

          {activeTab === "history" && (
            <div className="space-y-4">
              {registrations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">У вас пока нет записей на курсы</p>
                  <button
                    onClick={() => router.push("/registration")}
                    className="bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-all"
                  >
                    Записаться на курс
                  </button>
                </div>
              ) : (
                registrations.map((reg) => (
                  <div key={reg.id} className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{getCourseTitle(reg.courseId)}</h3>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(reg.status)}`}>
                        {getStatusText(reg.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Дата регистрации: {new Date(reg.registeredAt).toLocaleDateString("ru-RU")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Контакт: {reg.email} • {reg.phone}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ФИО
                  </label>
                  <input
                    type="text"
                    value={profileData.name || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone || ""}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Личная почта
                  </label>
                  <input
                    type="email"
                    value={profileData.personal_email || ""}
                    onChange={(e) => setProfileData({ ...profileData, personal_email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="personal@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Организация
                  </label>
                  <input
                    type="text"
                    value={profileData.organization || ""}
                    onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="Название организации"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Должность
                  </label>
                  <input
                    type="text"
                    value={profileData.position || ""}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="Врач-терапевт"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Стаж работы
                  </label>
                  <input
                    type="text"
                    value={profileData.experience || ""}
                    onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="5 лет"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Пол *
                  </label>
                  <select
                    value={profileData.gender || ""}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">Выберите пол</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Возраст
                  </label>
                  <input
                    type="number"
                    value={profileData.age || ""}
                    onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || null })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Вторая специальность
                  </label>
                  <input
                    type="text"
                    value={profileData.second_specialty || ""}
                    onChange={(e) => setProfileData({ ...profileData, second_specialty: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="Кардиолог"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-blue-500 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Редактировать профиль
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex-1 bg-red-500 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Выйти из аккаунта
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-green-500 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Сохранить изменения
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        loadData();
                      }}
                      className="flex-1 bg-gray-500 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Отменить
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push("/registration")}
          className="w-full bg-white/20 text-white font-semibold py-4 px-8 rounded-full hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
        >
          Записаться на новый курс
        </button>
      </div>
    </div>
  );
}