export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export const validateFullName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  
  if (!trimmed) {
    return { isValid: false, message: 'Введите ФИО' };
  }
  
  if (words.length < 2) {
    return { isValid: false, message: 'Введите минимум 2 слова (Имя и Фамилия)' };
  }
  
  return { isValid: true, message: '' };
};

export const validateAge = (age: string): ValidationResult => {
  if (!age) {
    return { isValid: false, message: 'Введите возраст' };
  }
  
  const ageNum = parseInt(age, 10);
  
  if (isNaN(ageNum)) {
    return { isValid: false, message: 'Возраст должен быть числом' };
  }
  
  if (ageNum < 18 || ageNum > 80) {
    return { isValid: false, message: 'Возраст должен быть от 18 до 80 лет' };
  }
  
  return { isValid: true, message: '' };
};

export const formatPhoneNumber = (text: string): string => {
  const digits = text.replace(/\D/g, '');
  
  let formatted = '+7 ';
  
  if (digits.length > 1) {
    formatted += '(' + digits.substring(1, 4);
  }
  if (digits.length >= 4) {
    formatted += ') ' + digits.substring(4, 7);
  }
  if (digits.length >= 7) {
    formatted += '-' + digits.substring(7, 9);
  }
  if (digits.length >= 9) {
    formatted += '-' + digits.substring(9, 11);
  }
  
  return formatted;
};

export const validatePhone = (phone: string): ValidationResult => {
  const digits = phone.replace(/\D/g, '');
  
  if (!phone || phone === '+7 ') {
    return { isValid: false, message: 'Введите номер телефона' };
  }
  
  if (digits.length !== 11) {
    return { isValid: false, message: 'Номер должен содержать 11 цифр' };
  }
  
  return { isValid: true, message: '' };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: 'Введите email' };
  }
  
  const ldcRegex = /^[a-zA-Z0-9._%+-]+@ldc\.ru$/;
  
  if (!ldcRegex.test(email)) {
    return { isValid: false, message: 'Email должен быть с доменом @ldc.ru' };
  }
  
  return { isValid: true, message: '' };
};

export const validateCourse = (courseId: string): ValidationResult => {
  if (!courseId) {
    return { isValid: false, message: 'Выберите курс' };
  }
  
  return { isValid: true, message: '' };
};

export const validateDate = (date: string): ValidationResult => {
  if (!date) {
    return { isValid: false, message: 'Выберите дату' };
  }
  
  return { isValid: true, message: '' };
};
