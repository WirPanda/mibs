"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Eye, EyeOff, RefreshCw, Search } from "lucide-react";

// Категории должностей
const POSITION_CATEGORIES = [
  "Врач",
  "Медсестра",
  "Фельдшер",
  "Другой медицинский персонал",
];

// Специальности врачей (в алфавитном порядке)
const DOCTOR_SPECIALTIES = [
  "Аллерголог-иммунолог",
  "Анестезиолог-реаниматолог",
  "Гастроэнтеролог",
  "Гинеколог",
  "Дерматолог",
  "Инфекционист",
  "Кардиолог",
  "ЛОР (Оториноларинголог)",
  "Невролог",
  "Нефролог",
  "Онколог",
  "Офтальмолог",
  "Патологоанатом",
  "Педиатр",
  "Пульмонолог",
  "Психиатр",
  "Радиолог",
  "Ревматолог",
  "Рентгенолог",
  "Стоматолог",
  "Терапевт",
  "Травматолог-ортопед",
  "УЗИ-диагност",
  "Уролог",
  "Хирург",
  "Эндокринолог",
];

// Специальности медсестер
const NURSE_SPECIALTIES = [
  "Медсестра общей практики",
  "Медсестра палатная",
  "Медсестра процедурная",
  "Медсестра операционная",
  "Медсестра анестезист",
  "Медсестра реанимационная",
  "Старшая медсестра",
];

// Специальности фельдшеров
const PARAMEDIC_SPECIALTIES = [
  "Фельдшер скорой помощи",
  "Фельдшер общей практики",
  "Фельдшер-лаборант",
  "Фельдшер ФАП",
];

// Другой медицинский персонал
const OTHER_MEDICAL_STAFF = [
  "Акушерка",
  "Администратор",
  "Инструктор ЛФК",
  "Лаборант",
  "Логопед",
  "Массажист",
  "Санитар",
  "Фармацевт",
];

// База данных организаций МИБС
const MIBS_ORGANIZATIONS = [
  // ЛДЦ МИБС
  "ЛДЦ МИБС Санкт-Петербург",
  "ЛДЦ МИБС Москва",
  "ЛДЦ МИБС Воронеж",
  "ЛДЦ МИБС Нижний Новгород",
  "ЛДЦ МИБС Казань",
  "ЛДЦ МИБС Уфа",
  "ЛДЦ МИБС Краснодар",
  "ЛДЦ МИБС Екатеринбург",
  "ЛДЦ МИБС Ростов-на-Дону",
  "ЛДЦ МИБС Самара",
  "ЛДЦ МИБС Челябинск",
  "ЛДЦ МИБС Новосибирск",
  // Другие медицинские учреждения СПб
  "ГБ №40 Сестрорецкого района СПб",
  "ГБ №26 Городская больница Санкт-Петербург",
  "Городская поликлиника №122 СПб",
  "НМИЦ им. В.А. Алмазова",
  "НИИ скорой помощи им. И.И. Джанелидзе",
];

// Генератор паролей
const generatePassword = (length: number = 8): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  const timestamp = Date.now().toString(36);
  password += timestamp.substring(0, 2);
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    workEmail: "",
    personalEmail: "",
    fullName: "",
    phone: "",
    organization: "",
    positionCategory: "",
    position: "",
    experience: "",
    secondSpecialty: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [showOrganizationDropdown, setShowOrganizationDropdown] = useState(false);
  const [filteredOrganizations, setFilteredOrganizations] = useState<string[]>([]);

  // Поиск организаций
  const handleOrganizationSearch = (value: string) => {
    setOrganizationSearch(value);
    setFormData({ ...formData, organization: value });
    
    if (value.length >= 2) {
      const filtered = MIBS_ORGANIZATIONS.filter(org =>
        org.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOrganizations(filtered);
      setShowOrganizationDropdown(true);
    } else {
      setShowOrganizationDropdown(false);
    }
  };

  const selectOrganization = (org: string) => {
    setFormData({ ...formData, organization: org });
    setOrganizationSearch(org);
    setShowOrganizationDropdown(false);
  };

  // Получение списка специальностей в зависимости от категории
  const getSpecialtiesByCategory = () => {
    switch (formData.positionCategory) {
      case "Врач":
        return DOCTOR_SPECIALTIES;
      case "Медсестра":
        return NURSE_SPECIALTIES;
      case "Фельдшер":
        return PARAMEDIC_SPECIALTIES;
      case "Другой медицинский персонал":
        return OTHER_MEDICAL_STAFF;
      default:
        return [];
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(8);
    setFormData({ 
      ...formData, 
      password: newPassword,
      confirmPassword: newPassword 
    });
    setShowPassword(true);
    setShowConfirmPassword(true);
    toast.success("Одноразовый пароль сгенерирован");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (!formData.workEmail.endsWith("@ldc.ru")) {
      toast.error("Рабочая почта должна иметь домен @ldc.ru");
      return;
    }

    if (!formData.positionCategory || !formData.position) {
      toast.error("Выберите категорию должности и специальность");
      return;
    }

    setLoading(true);

    try {
      const loginEmail = formData.workEmail.trim().toLowerCase();
      
      // Шаг 1: Регистрация
      const { data, error } = await authClient.signUp.email({
        email: loginEmail,
        name: formData.fullName.trim(),
        password: formData.password,
      });

      if (error?.code) {
        const errorMessages: Record<string, string> = {
          USER_ALREADY_EXISTS: "Пользователь с таким email уже зарегистрирован",
        };
        toast.error(errorMessages[error.code] || "Ошибка регистрации");
        setLoading(false);
        return;
      }

      // Шаг 2: Автоматический вход
      const loginResult = await authClient.signIn.email({
        email: loginEmail,
        password: formData.password,
      });

      if (loginResult.error) {
        toast.error("Ошибка входа после регистрации");
        setLoading(false);
        return;
      }

      // Шаг 3: Обновление профиля
      const token = localStorage.getItem("bearer_token");
      const profileRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: formData.phone.trim(),
          personalEmail: formData.personalEmail.trim().toLowerCase(),
          organization: formData.organization.trim(),
          position: formData.position.trim(),
          experience: formData.experience.trim(),
          secondSpecialty: formData.secondSpecialty.trim() || null,
        }),
      });

      if (!profileRes.ok) {
        const errorData = await profileRes.json();
        toast.error(errorData.error || "Ошибка сохранения данных профиля");
        setLoading(false);
        return;
      }

      toast.success("Регистрация успешна!");
      router.push("/account");
    } catch (error) {
      toast.error("Ошибка регистрации. Попробуйте снова.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-6">
      <div className="w-full max-w-2xl">
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
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Регистрация</h1>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* ФИО */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ФИО пользователя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email для входа */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email для входа <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.workEmail}
                  onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                  placeholder="ivan.petrov@ldc.ru"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Должен иметь домен @ldc.ru</p>
              </div>

              {/* Личная почта */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Личная почта <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                  placeholder="personal@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Телефон */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Сотовый телефон <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

            {/* Организация с поиском */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Наименование организации <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={organizationSearch}
                  onChange={(e) => handleOrganizationSearch(e.target.value)}
                  onFocus={() => {
                    if (organizationSearch.length >= 2) {
                      setShowOrganizationDropdown(true);
                    }
                  }}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                  placeholder="Начните вводить название (например: ЛДЦ)"
                  required
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Выпадающий список организаций */}
              {showOrganizationDropdown && filteredOrganizations.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredOrganizations.map((org, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectOrganization(org)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0"
                    >
                      <span className="text-gray-800">{org}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Категория должности */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Категория должности <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.positionCategory}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    positionCategory: e.target.value,
                    position: "" // Сбрасываем специальность при смене категории
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-white"
                required
              >
                <option value="">Выберите категорию</option>
                {POSITION_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Специальность (зависит от категории) */}
            {formData.positionCategory && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Специальность <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none bg-white"
                  required
                >
                  <option value="">Выберите специальность</option>
                  {getSpecialtiesByCategory().map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Стаж */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Стаж работы <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                placeholder="5 лет"
                required
              />
            </div>

            {/* Вторая специальность (опционально) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Вторая специальность <span className="text-gray-400 text-xs">(опционально)</span>
              </label>
              <input
                type="text"
                value={formData.secondSpecialty}
                onChange={(e) => setFormData({ ...formData, secondSpecialty: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                placeholder="Дополнительная специальность"
              />
            </div>

            {/* Генератор паролей */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Одноразовый пароль <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-2 px-4 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors text-sm font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Сгенерировать пароль
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Пароль */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                      placeholder="••••••••"
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
                </div>

                {/* Подтверждение пароля */}
                <div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3498db] focus:border-transparent outline-none"
                      placeholder="••••••••"
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27ae60] text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Уже есть аккаунт?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-[#3498db] font-semibold hover:underline"
              >
                Войти
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              ← Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}