import { db } from '@/db';
import { courses } from '@/db/schema';

async function main() {
    // Delete all existing courses first
    await db.delete(courses);
    
    const now = new Date();
    const currentTimestamp = now.getTime();
    
    // Calculate future dates for course start dates
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fortyFiveDaysFromNow = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const seventyFiveDaysFromNow = new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const sampleCourses = [
        {
            title: 'BLS - курс',
            description: 'Курс базовой сердечно-легочной реанимации с автоматической наружной дефибрилляцией',
            duration: '8 часов',
            price: 0,
            instructor: 'Инструктор МИБС',
            category: 'Базовая реанимация',
            maxStudents: 20,
            startDate: thirtyDaysFromNow,
            isActive: 1,
            imageUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IMG_20251125_153957_814-1764250187481.jpg',
            learningMaterials: JSON.stringify({
                preparationMaterials: [
                    {
                        title: 'Руководство по BLS 2024',
                        type: 'PDF документ',
                        url: '/materials/bls-guidelines-2024.pdf',
                        description: 'Официальное руководство по базовой сердечно-легочной реанимации'
                    },
                    {
                        title: 'Видео: Техника компрессий грудной клетки',
                        type: 'Видео',
                        url: '/materials/chest-compressions-technique.mp4',
                        duration: '15 минут',
                        description: 'Демонстрация правильной техники компрессий'
                    },
                    {
                        title: 'Протокол использования AED',
                        type: 'PDF документ',
                        url: '/materials/aed-protocol.pdf',
                        description: 'Пошаговая инструкция по использованию автоматического дефибриллятора'
                    },
                    {
                        title: 'Алгоритм BLS для взрослых',
                        type: 'Схема',
                        url: '/materials/bls-adult-algorithm.pdf',
                        description: 'Визуальный алгоритм действий при остановке сердца'
                    }
                ],
                courseTopics: [
                    'Распознавание признаков остановки сердца',
                    'Техника компрессий грудной клетки',
                    'Искусственное дыхание',
                    'Работа с автоматическим дефибриллятором',
                    'Командная работа при реанимации',
                    'Особенности реанимации в различных условиях'
                ],
                prerequisites: [
                    'Базовые знания анатомии человека',
                    'Отсутствие медицинских противопоказаний для практических занятий'
                ]
            }),
            createdAt: now,
            updatedAt: now
        },
        {
            title: 'ReBLS - курс',
            description: 'Ресертификационный курс базовой реанимации',
            duration: '4 часа',
            price: 0,
            instructor: 'Инструктор МИБС',
            category: 'Ресертификация',
            maxStudents: 25,
            startDate: fortyFiveDaysFromNow,
            isActive: 1,
            imageUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IMG_20251125_153956_641-1764250187653.jpg',
            learningMaterials: JSON.stringify({
                preparationMaterials: [
                    {
                        title: 'Обновления протоколов BLS 2024',
                        type: 'PDF документ',
                        url: '/materials/bls-updates-2024.pdf',
                        description: 'Последние изменения в протоколах базовой реанимации'
                    },
                    {
                        title: 'Видео: Разбор типичных ошибок',
                        type: 'Видео',
                        url: '/materials/common-mistakes-review.mp4',
                        duration: '20 минут',
                        description: 'Анализ распространенных ошибок при проведении реанимации'
                    },
                    {
                        title: 'Практические сценарии',
                        type: 'PDF документ',
                        url: '/materials/practice-scenarios.pdf',
                        description: 'Клинические случаи для отработки навыков'
                    }
                ],
                courseTopics: [
                    'Обновления в протоколах реанимации',
                    'Повторение техники компрессий',
                    'Работа с современными дефибрилляторами',
                    'Разбор сложных клинических случаев',
                    'Оценка качества реанимационных мероприятий'
                ],
                prerequisites: [
                    'Действующий сертификат BLS',
                    'Практический опыт применения навыков BLS'
                ]
            }),
            createdAt: now,
            updatedAt: now
        },
        {
            title: 'RLS - курс',
            description: 'Курс респираторного обеспечения в критических ситуациях',
            duration: '6 часов',
            price: 0,
            instructor: 'Инструктор МИБС',
            category: 'Респираторная поддержка',
            maxStudents: 18,
            startDate: sixtyDaysFromNow,
            isActive: 1,
            imageUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IMG_20251125_153955_824-1764250187636.jpg',
            learningMaterials: JSON.stringify({
                preparationMaterials: [
                    {
                        title: 'Анатомия дыхательных путей',
                        type: 'PDF документ',
                        url: '/materials/airway-anatomy.pdf',
                        description: 'Подробное руководство по анатомии верхних дыхательных путей'
                    },
                    {
                        title: 'Видео: Техники обеспечения проходимости дыхательных путей',
                        type: 'Видео',
                        url: '/materials/airway-management-techniques.mp4',
                        duration: '25 минут',
                        description: 'Демонстрация основных и альтернативных методов'
                    },
                    {
                        title: 'Протоколы респираторной поддержки',
                        type: 'PDF документ',
                        url: '/materials/respiratory-support-protocols.pdf',
                        description: 'Алгоритмы действий при различных нарушениях дыхания'
                    },
                    {
                        title: 'Оборудование для респираторной поддержки',
                        type: 'PDF документ',
                        url: '/materials/respiratory-equipment-guide.pdf',
                        description: 'Обзор современного оборудования и методик его использования'
                    }
                ],
                courseTopics: [
                    'Оценка проходимости дыхательных путей',
                    'Базовые методы обеспечения проходимости',
                    'Использование воздуховодов',
                    'Техника масочной вентиляции',
                    'Применение мешка Амбу',
                    'Подготовка к интубации',
                    'Кислородотерапия',
                    'Осложнения и их профилактика'
                ],
                prerequisites: [
                    'Сертификат BLS или эквивалент',
                    'Базовые знания физиологии дыхания'
                ]
            }),
            createdAt: now,
            updatedAt: now
        },
        {
            title: 'EMR - курс',
            description: 'Курс неотложной и экстренной медицинской помощи',
            duration: '10 часов',
            price: 0,
            instructor: 'Инструктор МИБС',
            category: 'Неотложная помощь',
            maxStudents: 22,
            startDate: seventyFiveDaysFromNow,
            isActive: 1,
            imageUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IMG_20251125_153954_086-1764250187672.jpg',
            learningMaterials: JSON.stringify({
                preparationMaterials: [
                    {
                        title: 'Протоколы экстренной медицинской помощи',
                        type: 'PDF документ',
                        url: '/materials/emergency-protocols-comprehensive.pdf',
                        description: 'Полный набор протоколов для различных неотложных состояний'
                    },
                    {
                        title: 'Видео: Первичная оценка пациента',
                        type: 'Видео',
                        url: '/materials/primary-assessment.mp4',
                        duration: '30 минут',
                        description: 'Систематический подход к оценке состояния пациента'
                    },
                    {
                        title: 'Руководство по травматологии',
                        type: 'PDF документ',
                        url: '/materials/trauma-management-guide.pdf',
                        description: 'Протоколы помощи при различных видах травм'
                    },
                    {
                        title: 'Неотложные кардиологические состояния',
                        type: 'PDF документ',
                        url: '/materials/cardiac-emergencies.pdf',
                        description: 'Распознавание и лечение острых кардиологических состояний'
                    },
                    {
                        title: 'Неврологические ургентные состояния',
                        type: 'PDF документ',
                        url: '/materials/neurological-emergencies.pdf',
                        description: 'Протоколы при инсульте, судорогах и других неврологических состояниях'
                    }
                ],
                courseTopics: [
                    'Первичная оценка и сортировка',
                    'ABCDE подход к неотложному пациенту',
                    'Травматические повреждения',
                    'Острый коронарный синдром',
                    'Инсульт и неврологические состояния',
                    'Дыхательная недостаточность',
                    'Шок различной этиологии',
                    'Анафилактические реакции',
                    'Отравления',
                    'Работа в команде на вызове',
                    'Транспортировка критического пациента',
                    'Коммуникация с диспетчерской службой'
                ],
                prerequisites: [
                    'Действующий сертификат BLS',
                    'Базовые медицинские знания',
                    'Готовность к интенсивной практической работе'
                ]
            }),
            createdAt: now,
            updatedAt: now
        },
        {
            title: 'BVA - курс',
            description: 'Курс базового обеспечения сосудистого доступа',
            duration: '5 часов',
            price: 0,
            instructor: 'Инструктор МИБС',
            category: 'Сосудистый доступ',
            maxStudents: 15,
            startDate: ninetyDaysFromNow,
            isActive: 1,
            imageUrl: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/IMG_20251125_153952_705-1764250187647.jpg',
            learningMaterials: JSON.stringify({
                preparationMaterials: [
                    {
                        title: 'Анатомия периферических вен',
                        type: 'PDF документ',
                        url: '/materials/peripheral-vein-anatomy.pdf',
                        description: 'Детальное руководство по анатомии доступных периферических вен'
                    },
                    {
                        title: 'Видео: Техника венепункции',
                        type: 'Видео',
                        url: '/materials/venipuncture-technique.mp4',
                        duration: '20 минут',
                        description: 'Пошаговая демонстрация установки периферического венозного катетера'
                    },
                    {
                        title: 'Протоколы асептики и антисептики',
                        type: 'PDF документ',
                        url: '/materials/aseptic-technique-protocols.pdf',
                        description: 'Правила инфекционной безопасности при сосудистом доступе'
                    },
                    {
                        title: 'Осложнения и их профилактика',
                        type: 'PDF документ',
                        url: '/materials/iv-complications-prevention.pdf',
                        description: 'Распознавание и предотвращение осложнений при венозном доступе'
                    },
                    {
                        title: 'Видео: Особенности у сложных пациентов',
                        type: 'Видео',
                        url: '/materials/difficult-iv-access.mp4',
                        duration: '15 минут',
                        description: 'Техники установки венозного доступа у пациентов со сложной венозной анатомией'
                    }
                ],
                courseTopics: [
                    'Анатомия периферических вен верхних конечностей',
                    'Показания и противопоказания к венозному доступу',
                    'Выбор оборудования и катетеров',
                    'Техника асептики и антисептики',
                    'Пошаговая техника венепункции',
                    'Фиксация и уход за венозным катетером',
                    'Распознавание осложнений',
                    'Особенности у детей и пожилых пациентов',
                    'Альтернативные методы при сложном доступе',
                    'Документирование процедуры'
                ],
                prerequisites: [
                    'Базовые медицинские знания',
                    'Знание правил асептики',
                    'Желательно наличие опыта работы с пациентами'
                ]
            }),
            createdAt: now,
            updatedAt: now
        }
    ];

    await db.insert(courses).values(sampleCourses);
    
    console.log('✅ Courses seeder completed successfully - 5 medical emergency courses added');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});