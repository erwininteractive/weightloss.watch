#!/usr/bin/env ts-node
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const password = "Password123";
    const passwordHash = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existing = await prisma.user.findFirst({
        where: {
            OR: [
                { email: "success@example.com" },
                { username: "success" }
            ]
        }
    });

    if (existing) {
        // Update existing user
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                isAdmin: true,
                emailVerified: true,
                isActive: true,
            }
        });
        console.log("✓ Updated existing user 'success' to admin");
    } else {
        // Create new admin user
        await prisma.user.create({
            data: {
                email: "success@example.com",
                username: "success",
                passwordHash,
                displayName: "Admin User",
                unitSystem: "IMPERIAL",
                emailVerified: true,
                isActive: true,
                isAdmin: true,
            }
        });
        console.log("✓ Created new admin user 'success'");
    }

    console.log("\nLogin credentials:");
    console.log("  Email: success@example.com");
    console.log("  Username: success");
    console.log("  Password: Password123");
    console.log("  Admin: Yes");
}

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
