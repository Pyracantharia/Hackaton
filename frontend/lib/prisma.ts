import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });

// singleton instance of prisma
const prisma = new PrismaClient({ adapter });

export { prisma };