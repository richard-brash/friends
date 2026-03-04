const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { PrismaService } = require('./dist/src/prisma/prisma.service');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const prisma = app.get(PrismaService);
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));

  await app.close();
}

main();
