#!/usr/bin/env ts-node
/**
 * Script to create or promote a user to admin
 * Usage: npm run create-admin <email>
 */

import prisma from '../src/services/database';

async function createAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('Usage: npm run create-admin <email>');
        console.error('Example: npm run create-admin admin@example.com');
        process.exit(1);
    }

    try {
        // Check if user exists
        const user = await prisma.user.findFirst({
            where: { email, deletedAt: null },
        });

        if (user) {
            // User exists, promote to admin
            await prisma.user.update({
                where: { id: user.id },
                data: { isAdmin: true },
            });
            console.log(`✓ User ${email} promoted to admin`);
        } else {
            // User doesn't exist, create new admin user
            console.log(`User ${email} not found. Create a new admin account? (This will prompt for details)`);
            console.log('Please use the registration page first, then run this script to promote the user.');
            process.exit(1);
        }

        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

createAdmin();
