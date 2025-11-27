export interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  imageUrl: string;
}

export const courses: Course[] = [
  {
    id: '1',
    name: 'ReBLS - курс',
    description: 'Ресертификационный курс базовой реанимации',
    duration: '4 часа',
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/uszlgr1ehg23417ijigo7',
  },
  {
    id: '2',
    name: 'BLS - курс',
    description: 'Курс базовой сердечно-легочной реанимации с автоматической наружной дефибрилляцией',
    duration: '8 часов',
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/jhb1rr5griz95v5axhf1c',
  },
  {
    id: '3',
    name: 'BVA - курс',
    description: 'Курс базового обеспечения сосудистого доступа',
    duration: '6 часов',
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/04ypojtshls5300hzaa8z',
  },
  {
    id: '4',
    name: 'EMR - курс',
    description: 'Курс неотложной и экстренной медицинской помощи',
    duration: '12 часов',
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/h8owzay8h29dwan9l0zhu',
  },
  {
    id: '5',
    name: 'RLS - курс',
    description: 'Курс респираторного обеспечения в критических ситуациях',
    duration: '10 часов',
    imageUrl: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/x3j2t4mugzpblj18zckqy',
  },
];

export const availableDates = [
  '2025-12-02',
  '2025-12-05',
  '2025-12-09',
  '2025-12-12',
  '2025-12-16',
  '2025-12-19',
  '2025-12-23',
  '2026-01-06',
  '2026-01-13',
  '2026-01-20',
];
