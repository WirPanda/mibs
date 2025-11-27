import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';

export interface RegistrationData {
  fullName: string;
  age: string;
  phone: string;
  email: string;
  courseId: string;
  courseName: string;
  selectedDate: string;
  workEmail: string;
  personalEmail: string;
  organization: string;
  position: string;
  experience: string;
  secondSpecialty: string;
  comments: string;
}

const initialData: RegistrationData = {
  fullName: '',
  age: '',
  phone: '+7 ',
  email: '',
  courseId: '',
  courseName: '',
  selectedDate: '',
  workEmail: '',
  personalEmail: '',
  organization: '',
  position: '',
  experience: '',
  secondSpecialty: '',
  comments: '',
};

export const [RegistrationProvider, useRegistration] = createContextHook(() => {
  const [data, setData] = useState<RegistrationData>(initialData);

  const updateField = useCallback(<K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
  }, []);

  return {
    data,
    updateField,
    resetData,
  };
});