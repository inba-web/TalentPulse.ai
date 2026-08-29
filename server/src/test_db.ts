import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_oRu5NBIQnj1z@ep-mute-band-az9eonv9-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  console.log("Prisma: Attempting to connect to Neon database...");
  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`Connection attempt ${i}...`);
      const result = await prisma.$queryRaw`SELECT NOW()`;
      console.log("Success! Database response:", result);
      return;
    } catch (e: any) {
      console.error(`Attempt ${i} failed:`, e.message);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
