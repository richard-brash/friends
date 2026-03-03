const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = 'postgresql://friendsuser:friendspassword@localhost:5432/friendsdb';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
