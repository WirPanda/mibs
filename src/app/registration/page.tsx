"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: number;
  instructor: string;
  category: string;
  isActive: boolean;
  imageUrl?: string;
}

export default function RegistrationPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Загрузка курсов
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch("/api/courses?isActive=true&limit=100");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      } else {
        toast.error("Ошибка загрузки курсов");
      }
    } catch (error) {
      toast.error("Ошибка загрузки курсов");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleRegister = async (courseId: number) => {
    // Проверка авторизации
    if (!isPending && !session?.user) {
      toast.error("Необходимо войти в систему для записи на курс");
      router.push(`/login?redirect=/registration`);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("bearer_token");
      
      // Получаем данные пользователя из сессии
      const fullName = (session?.user as any)?.fullName || session?.user?.name || "";
      const email = (session?.user as any)?.workEmail || session?.user?.email || "";
      const phone = (session?.user as any)?.phone || "";

      // Создаем регистрацию
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: courseId,
          firstName: fullName.split(" ")[1] || fullName,
          lastName: fullName.split(" ")[0] || fullName,
          email: email,
          phone: phone,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Ошибка отправки заявки");
        setSubmitting(false);
        return;
      }

      const registration = await res.json();
      
      // Генерируем QR-код
      const course = courses.find(c => c.id === courseId);
      const qrRes = await fetch("/api/registrations/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registrationId: registration.id,
          fullName: fullName,
          courseTitle: course?.title || "",
          registrationDate: new Date().toISOString(),
        }),
      });

      if (!qrRes.ok) {
        toast.error("Ошибка генерации QR-кода");
        setSubmitting(false);
        return;
      }

      const updatedRegistration = await qrRes.json();
      
      toast.success("Регистрация успешна!");
      
      // Сохраняем данные для страницы подтверждения
      localStorage.setItem("registrationData", JSON.stringify({
        registrationId: updatedRegistration.id,
        courseTitle: course?.title,
        fullName: fullName,
        registrationDate: new Date().toISOString(),
        qrCode: updatedRegistration.qrCode,
      }));
      
      router.push("/confirmation");
    } catch (error) {
      toast.error("Ошибка отправки заявки");
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-white hover:text-white/80 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-white">Выберите курс</h1>
          <div className="w-6" />
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <p className="text-gray-600 text-lg">В данный момент нет доступных курсов</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => setSelectedCourse(course)}
              >
                {/* Изображение курса */}
                <div className="relative w-full h-48">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#3498db] to-[#2980b9] flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Содержимое карточки */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {course.duration}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {course.instructor}
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-2 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {course.category}
                    </div>
                  </div>

                  {/* Бесплатно */}
                  <div className="bg-green-100 text-green-800 text-center py-2 px-4 rounded-lg font-bold mb-4">
                    БЕСПЛАТНО
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegister(course.id);
                    }}
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Отправка..." : "Записаться"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модальное окно с подробной информацией */}
        {selectedCourse && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedCourse(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Изображение */}
              <div className="relative w-full h-64">
                {selectedCourse.imageUrl ? (
                  <Image
                    src={selectedCourse.imageUrl}
                    alt={selectedCourse.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#3498db] to-[#2980b9] flex items-center justify-center">
                    <span className="text-white text-6xl font-bold">
                      {selectedCourse.title.charAt(0)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Содержимое */}
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedCourse.title}</h2>
                <p className="text-gray-600 mb-6">{selectedCourse.description}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-700">
                    <svg className="w-6 h-6 mr-3 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Длительность:</span>
                    <span className="ml-2">{selectedCourse.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <svg className="w-6 h-6 mr-3 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-semibold">Инструктор:</span>
                    <span className="ml-2">{selectedCourse.instructor}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <svg className="w-6 h-6 mr-3 text-[#3498db]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-semibold">Категория:</span>
                    <span className="ml-2">{selectedCourse.category}</span>
                  </div>
                </div>

                {/* Бесплатно */}
                <div className="bg-green-100 text-green-800 text-center py-3 px-6 rounded-lg font-bold text-lg mb-6">
                  БЕСПЛАТНО
                </div>

                <button
                  onClick={() => {
                    handleRegister(selectedCourse.id);
                    setSelectedCourse(null);
                  }}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Отправка..." : "Записаться на курс"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}