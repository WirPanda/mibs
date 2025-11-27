import { db } from '@/db';
import { settings } from '@/db/schema';

async function main() {
    const sampleSettings = [
        {
            key: 'site_title',
            value: 'МИБС Медицинский Институт',
            description: 'Website title',
            updatedAt: Date.now(),
        },
        {
            key: 'contact_email',
            value: 'info@mibs.ru',
            description: 'Main contact email',
            updatedAt: Date.now(),
        },
        {
            key: 'contact_phone',
            value: '+7 (800) 555-35-35',
            description: 'Main contact phone',
            updatedAt: Date.now(),
        },
        {
            key: 'address',
            value: 'Москва, ул. Медицинская, д. 10',
            description: 'Institute physical address',
            updatedAt: Date.now(),
        },
        {
            key: 'working_hours',
            value: 'Пн-Пт: 9:00-18:00, Сб: 10:00-15:00',
            description: 'Working hours',
            updatedAt: Date.now(),
        },
        {
            key: 'support_email',
            value: 'support@mibs.ru',
            description: 'Technical support email',
            updatedAt: Date.now(),
        },
        {
            key: 'registration_enabled',
            value: 'true',
            description: 'Enable/disable course registration',
            updatedAt: Date.now(),
        },
        {
            key: 'announcement',
            value: 'Набор на новые курсы МРТ и КТ диагностики!',
            description: 'Homepage announcement banner',
            updatedAt: Date.now(),
        },
    ];

    await db.insert(settings).values(sampleSettings);
    
    console.log('✅ Settings seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});