import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'ru' | 'en';

interface Translations {
  [key: string]: {
    ru: string;
    en: string;
  };
}

const translations: Translations = {
  welcome: { ru: 'Добро пожаловать', en: 'Welcome' },
  welcomeSubtext: { ru: 'в мир технологий!', en: 'to the world of technology!' },
  next: { ru: 'Далее', en: 'Next' },
  back: { ru: 'Назад', en: 'Back' },
  
  login: { ru: 'Вход', en: 'Login' },
  register: { ru: 'Регистрация', en: 'Register' },
  logout: { ru: 'Выйти', en: 'Logout' },
  
  personalAccount: { ru: 'Личный кабинет', en: 'Personal Account' },
  myCourses: { ru: 'Мои курсы', en: 'My Courses' },
  settings: { ru: 'Настройки', en: 'Settings' },
  profile: { ru: 'Профиль', en: 'Profile' },
  
  courseRegistration: { ru: 'Запись на курс', en: 'Course Registration' },
  fillForm: { ru: 'Заполните форму регистрации', en: 'Fill in the registration form' },
  
  fullName: { ru: 'ФИО', en: 'Full Name' },
  age: { ru: 'Возраст', en: 'Age' },
  phone: { ru: 'Телефон', en: 'Phone' },
  email: { ru: 'Email', en: 'Email' },
  course: { ru: 'Курс', en: 'Course' },
  courseDate: { ru: 'Дата курса', en: 'Course Date' },
  
  selectCourse: { ru: 'Выберите курс', en: 'Select Course' },
  selectDate: { ru: 'Выберите дату', en: 'Select Date' },
  search: { ru: 'Поиск', en: 'Search' },
  searchByName: { ru: 'Поиск по названию...', en: 'Search by name...' },
  
  available: { ru: 'Доступно', en: 'Available' },
  unavailable: { ru: 'Занято', en: 'Unavailable' },
  
  confirm: { ru: 'Подтвердить', en: 'Confirm' },
  edit: { ru: 'Редактировать', en: 'Edit' },
  save: { ru: 'Сохранить', en: 'Save' },
  cancel: { ru: 'Отменить', en: 'Cancel' },
  delete: { ru: 'Удалить', en: 'Delete' },
  done: { ru: 'Готово', en: 'Done' },
  
  reviewData: { ru: 'Проверьте данные', en: 'Review Data' },
  confirmRegistration: { ru: 'Подтвердить запись', en: 'Confirm Registration' },
  
  registrationConfirmed: { ru: 'Запись подтверждена!', en: 'Registration Confirmed!' },
  registrationSuccess: { ru: 'Вы успешно записаны на курс', en: 'You have successfully enrolled' },
  
  courseHistory: { ru: 'История курсов', en: 'Course History' },
  enrollmentHistory: { ru: 'История записей', en: 'Enrollment History' },
  noCourses: { ru: 'Нет записей на курсы', en: 'No course enrollments' },
  
  registered: { ru: 'Зарегистрирован', en: 'Registered' },
  completed: { ru: 'Завершен', en: 'Completed' },
  failed: { ru: 'Провален', en: 'Failed' },
  cancelled: { ru: 'Отменен', en: 'Cancelled' },
  
  passed: { ru: 'Пройден', en: 'Passed' },
  notPassed: { ru: 'Не пройден', en: 'Failed' },
  pending: { ru: 'Ожидание', en: 'Pending' },
  
  result: { ru: 'Результат', en: 'Result' },
  status: { ru: 'Статус', en: 'Status' },
  enrolledAt: { ru: 'Дата записи', en: 'Enrolled At' },
  notes: { ru: 'Примечания', en: 'Notes' },
  
  profileSettings: { ru: 'Настройки профиля', en: 'Profile Settings' },
  personalInfo: { ru: 'Личная информация', en: 'Personal Information' },
  language: { ru: 'Язык', en: 'Language' },
  russian: { ru: 'Русский', en: 'Russian' },
  english: { ru: 'Английский', en: 'English' },
  
  updateProfile: { ru: 'Обновить профиль', en: 'Update Profile' },
  profileUpdated: { ru: 'Профиль обновлен', en: 'Profile Updated' },
  
  enterEmail: { ru: 'Введите email', en: 'Enter email' },
  enterFullName: { ru: 'Введите ФИО', en: 'Enter full name' },
  enterPhone: { ru: 'Введите телефон', en: 'Enter phone' },
  
  loginToAccount: { ru: 'Вход в аккаунт', en: 'Login to Account' },
  createAccount: { ru: 'Создать аккаунт', en: 'Create Account' },
  alreadyHaveAccount: { ru: 'Уже есть аккаунт?', en: 'Already have an account?' },
  dontHaveAccount: { ru: 'Нет аккаунта?', en: "Don't have an account?" },
  
  accountNotFound: { ru: 'Аккаунт не найден', en: 'Account not found' },
  invalidEmail: { ru: 'Неверный email', en: 'Invalid email' },
  
  admin: { ru: 'Администратор', en: 'Administrator' },
  adminPanel: { ru: 'Панель управления', en: 'Admin Panel' },
  dashboard: { ru: 'Панель управления', en: 'Dashboard' },
  
  manageCourses: { ru: 'Управление курсами', en: 'Manage Courses' },
  manageRegistrations: { ru: 'Мониторинг записей', en: 'Manage Registrations' },
  manageDates: { ru: 'Управление датами', en: 'Manage Dates' },
  activityLog: { ru: 'Журнал активности', en: 'Activity Log' },
  
  statistics: { ru: 'Статистика', en: 'Statistics' },
  total: { ru: 'Всего', en: 'Total' },
  confirmed: { ru: 'Подтверждено', en: 'Confirmed' },
  
  selectLanguage: { ru: 'Выбрать язык', en: 'Select Language' },
  autoFill: { ru: 'Автозаполнение данных для новых курсов', en: 'Auto-fill data for new courses' },
  
  duration: { ru: 'Длительность', en: 'Duration' },
  description: { ru: 'Описание', en: 'Description' },
  
  close: { ru: 'Закрыть', en: 'Close' },
};

const STORAGE_KEY = 'app_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('ru');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored === 'ru' || stored === 'en') {
        setLanguage(stored);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = useCallback(async (newLanguage: Language) => {
    setLanguage(newLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLanguage);
      console.log('Language changed to:', newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    console.warn(`Translation key not found: ${key}`);
    return key;
  }, [language]);

  return {
    language,
    isLoading,
    changeLanguage,
    t,
  };
});
