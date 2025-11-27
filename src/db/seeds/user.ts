import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    const adminUser = {
        id: 'admin-mibs-001',
        name: 'Администратор МИБС',
        email: 'admin@mibs.ru',
        emailVerified: true,
        role: 'admin',
        image: null,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
    };

    await db.insert(user).values([adminUser]);
    
    console.log('✅ Admin user seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});