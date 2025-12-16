import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

// Prisma 7 pattern: pass connectionString directly to adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

export default prisma;
