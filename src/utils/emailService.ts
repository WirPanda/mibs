import emailjs from '@emailjs/browser';
import { Platform } from 'react-native';
import { EMAILJS_CONFIG } from '@/constants/emailjs';
import type { RegistrationData } from '@/contexts/RegistrationContext';

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendRegistrationEmail(
  data: RegistrationData
): Promise<EmailResult> {
  if (Platform.OS !== 'web') {
    console.log('EmailJS: Отправка email доступна только на веб-платформе');
    console.log('Данные регистрации:', JSON.stringify(data, null, 2));
    return { success: true };
  }

  try {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    const templateParams = {
      to_email: EMAILJS_CONFIG.ADMIN_EMAIL,
      from_name: data.fullName,
      course_name: data.courseName,
      course_date: formatDate(data.selectedDate),
      user_email: data.email,
      user_phone: data.phone,
      user_age: data.age,
    };

    console.log('EmailJS: Отправка уведомления...', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    console.log('EmailJS: Успешно отправлено', response.status, response.text);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('EmailJS: Ошибка отправки', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendDomainVerificationCode(
  email: string,
  code: string
): Promise<EmailResult> {
  if (Platform.OS !== 'web') {
    console.log('EmailJS: Отправка кода доступна только на веб-платформе');
    return { success: true };
  }

  try {
    const templateParams = {
      to_email: email,
      verification_code: code,
    };

    console.log('EmailJS: Отправка кода подтверждения...', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.VERIFICATION_TEMPLATE_ID ?? EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    console.log('EmailJS: Код подтверждения отправлен', response.status, response.text);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('EmailJS: Ошибка отправки кода', errorMessage);
    return { success: false, error: errorMessage };
  }
}
