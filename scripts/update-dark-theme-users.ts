/**
 * Script to update users with DARK theme to LIGHT theme
 * Run before migrating to remove DARK from Theme enum
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Checking for users with DARK theme...');

    // Count users with DARK theme
    const darkThemeCount = await prisma.user.count({
        where: {
            theme: 'DARK' as any, // Cast since we're about to remove it
        },
    });

    console.log(`Found ${darkThemeCount} users with DARK theme`);

    if (darkThemeCount > 0) {
        console.log('🔄 Updating users to LIGHT theme...');

        // Update all DARK theme users to LIGHT
        const result = await prisma.user.updateMany({
            where: {
                theme: 'DARK' as any,
            },
            data: {
                theme: 'LIGHT',
            },
        });

        console.log(`✅ Updated ${result.count} users from DARK to LIGHT theme`);
    } else {
        console.log('✅ No users with DARK theme found');
    }
}

main()
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
