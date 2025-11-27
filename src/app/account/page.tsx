"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

interface Registration {
  id: number;
  courseId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  qrCode: string | null;
  registeredAt: number;
  registrationDate: number;
  courseDetails?: {
    id: number;
    title: string;
    description: string;
    duration: string;
    instructor: string;
    category: string;
    learningMaterials?: string;
  };
}

interface UserProfile {
  phone: string;
  personalEmail: string;
  organization: string;
  position: string;
  experience: string;
  secondSpecialty: string | null;
}

interface LearningMaterial {
  preparationMaterials?: Array<{
    title: string;
    type: string;
    url?: string;
    duration?: string;
    description: string;
  }>;
  courseTopics?: string[];
  prerequisites?: string[];
}

export default function AccountPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [activeTab, setActiveTab] = useState<"history" | "settings">("history");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [learningMaterials, setLearningMaterials] = useState<LearningMaterial | null>(null);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
  const [profileData, setProfileData] = useState<UserProfile>({
    phone: "",
    personalEmail: "",
    organization: "",
    position: "",
    experience: "",
    secondSpecialty: "",
  });

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
      // Загрузка регистраций пользователя с деталями курсов
      const regRes = await fetch(`/api/registrations/user/${session?.user?.id}?includeCourseDetails=true&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (regRes.ok) {
        const regData = await regRes.json();
        setRegistrations(regData);
      }

      // Загрузка профиля пользователя
      if (session?.user) {
        setProfileData({
          phone: (session.user as any).phone || "",
          personalEmail: (session.user as any).personalEmail || "",
          organization: (session.user as any).organization || "",
          position: (session.user as any).position || "",
          experience: (session.user as any).experience || "",
          secondSpecialty: (session.user as any).secondSpecialty || "",
        });
      }
    } catch (error) {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const loadCourseMaterials = async (courseId: number) => {
    setLoadingMaterials(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/materials`);
      if (res.ok) {
        const materials = await res.json();
        setLearningMaterials(materials);
      } else {
        toast.error("Учебные материалы пока недоступны");
        setLearningMaterials(null);
      }
    } catch (error) {
      toast.error("Ошибка загрузки материалов");
      setLearningMaterials(null);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleViewDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    if (registration.courseDetails?.id) {
      loadCourseMaterials(registration.courseDetails.id);
    }
  };

  const handleDownloadQR = (registration: Registration) => {
    const canvas = document.getElementById(`qr-code-${registration.id}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-code-${registration.courseDetails?.title || 'course'}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.phone || !profileData.personalEmail || !profileData.organization || !profileData.position || !profileData.experience) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("bearer_token");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: profileData.phone.trim(),
          personalEmail: profileData.personalEmail.trim().toLowerCase(),
          organization: profileData.organization.trim(),
          position: profileData.position.trim(),
          experience: profileData.experience.trim(),
          secondSpecialty: profileData.secondSpecialty?.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Ошибка сохранения профиля");
        return;
      }

      toast.success("Профиль успешно обновлен");
      setEditing(false);
      await refetch();
    } catch (error) {
      toast.error("Ошибка сохранения профиля");
    } finally {
      setSaving(false);
    }
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

  if (!session?.user) {
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
            <div className="w-20 h-20 bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{session.user.name}</h2>
              <p className="text-gray-600">{session.user.email}</p>
              {session.user.role === "admin" && (
                <span className="inline-block mt-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Администратор
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
              Мои курсы
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 px-4 font-semibold transition-colors ${
                activeTab === "settings"
                  ? "text-[#3498db] border-b-2 border-[#3498db]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Личные данные
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
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {reg.courseDetails?.title || "Курс"}
                      </h3>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(reg.status)}`}>
                        {getStatusText(reg.status)}
                      </span>
                    </div>
                    
                    {reg.courseDetails && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">{reg.courseDetails.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>⏱️ {reg.courseDetails.duration}</span>
                          <span>👤 {reg.courseDetails.instructor}</span>
                          <span>📂 {reg.courseDetails.category}</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-3">
                      Дата регистрации: {new Date(reg.registrationDate).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(reg)}
                        className="flex-1 bg-[#3498db] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#2980b9] transition-all text-sm"
                      >
                        Подробнее и материалы
                      </button>
                      {reg.qrCode && (
                        <button
                          onClick={() => handleDownloadQR(reg)}
                          className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-all text-sm"
                        >
                          QR-код
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Личные данные</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-[#3498db] text-white font-semibold py-2 px-6 rounded-full hover:bg-[#2980b9] transition-all"
                  >
                    Редактировать
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        loadData();
                      }}
                      className="bg-gray-400 text-white font-semibold py-2 px-6 rounded-full hover:bg-gray-500 transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-[#2ECC71] text-white font-semibold py-2 px-6 rounded-full hover:bg-[#27ae60] transition-all disabled:opacity-50"
                    >
                      {saving ? "Сохранение..." : "Сохранить"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ФИО пользователя
                  </label>
                  <input
                    type="text"
                    value={session.user.name || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email для входа
                  </label>
                  <input
                    type="email"
                    value={session.user.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Сотовый телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none disabled:bg-gray-50"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Личная почта <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={profileData.personalEmail}
                    onChange={(e) => setProfileData({ ...profileData, personalEmail: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none disabled:bg-gray-50"
                    placeholder="personal@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Наименование организации <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.organization}
                    onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none disabled:bg-gray-50"
                    placeholder="ООО 'Компания'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Должность <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                    disabled={!editing}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none disabled:bg-gray-50"
                    placeholder="Менеджер"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Стаж работы <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.experience}
                  onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none disabled:bg-gray-50"
                  placeholder="5 лет"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Вторая специальность <span className="text-gray-400 text-xs">(опционально)</span>
                </label>
                <input
                  type="text"
                  value={profileData.secondSpecialty || ""}
                  onChange={(e) => setProfileData({ ...profileData, secondSpecialty: e.target.value })}
                  disabled={!editing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none disabled:bg-gray-50"
                  placeholder="Дополнительная специальность"
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-500 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  Выйти из аккаунта
                </button>
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

      {/* Модальное окно с подробной информацией о курсе */}
      {selectedRegistration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => {
            setSelectedRegistration(null);
            setLearningMaterials(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Заголовок */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {selectedRegistration.courseDetails?.title}
                  </h2>
                  <span className={`text-sm font-semibold px-4 py-2 rounded-full ${getStatusColor(selectedRegistration.status)}`}>
                    {getStatusText(selectedRegistration.status)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedRegistration(null);
                    setLearningMaterials(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Информация о курсе */}
              {selectedRegistration.courseDetails && (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">{selectedRegistration.courseDetails.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Длительность</div>
                      <div className="font-semibold text-gray-800">{selectedRegistration.courseDetails.duration}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Инструктор</div>
                      <div className="font-semibold text-gray-800">{selectedRegistration.courseDetails.instructor}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Категория</div>
                      <div className="font-semibold text-gray-800">{selectedRegistration.courseDetails.category}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR-код */}
              {selectedRegistration.qrCode && (
                <div className="mb-6 bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Ваш QR-код</h3>
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
                      <QRCodeCanvas
                        id={`qr-code-${selectedRegistration.id}`}
                        value={JSON.parse(selectedRegistration.qrCode).fullName ? 
                          `ФИО: ${JSON.parse(selectedRegistration.qrCode).fullName}\nКурс: ${JSON.parse(selectedRegistration.qrCode).courseTitle}\nДата регистрации: ${new Date(JSON.parse(selectedRegistration.qrCode).registrationDate).toLocaleDateString("ru-RU")}` : 
                          selectedRegistration.qrCode
                        }
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <button
                      onClick={() => handleDownloadQR(selectedRegistration)}
                      className="bg-green-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 transition-all"
                    >
                      Скачать QR-код
                    </button>
                  </div>
                </div>
              )}

              {/* Учебные материалы */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Учебные материалы для подготовки</h3>
                
                {loadingMaterials ? (
                  <div className="text-center py-8">
                    <div className="text-gray-600">Загрузка материалов...</div>
                  </div>
                ) : learningMaterials ? (
                  <div className="space-y-6">
                    {/* Подготовительные материалы */}
                    {learningMaterials.preparationMaterials && learningMaterials.preparationMaterials.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">📚 Материалы для изучения</h4>
                        <div className="space-y-3">
                          {learningMaterials.preparationMaterials.map((material, index) => (
                            <div key={index} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold text-gray-800">{material.title}</h5>
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                  {material.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{material.description}</p>
                              {material.duration && (
                                <p className="text-xs text-gray-500">⏱️ {material.duration}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Темы курса */}
                    {learningMaterials.courseTopics && learningMaterials.courseTopics.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">📖 Темы курса</h4>
                        <ul className="space-y-2">
                          {learningMaterials.courseTopics.map((topic, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">✓</span>
                              <span className="text-gray-700">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Предварительные требования */}
                    {learningMaterials.prerequisites && learningMaterials.prerequisites.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">⚠️ Предварительные требования</h4>
                        <ul className="space-y-2">
                          {learningMaterials.prerequisites.map((prereq, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              <span className="text-gray-700">{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600">Учебные материалы будут доступны после подтверждения регистрации</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}