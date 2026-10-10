import { PrismaClient } from "@prisma/client";
import products from "./products.json";

const prisma = new PrismaClient();
const seedOwnerId = process.env.ADMIN_USER_ID || "seed-owner-user";

async function main() {
  await prisma.user.upsert({
    where: { id: seedOwnerId },
    update: {},
    create: {
      id: seedOwnerId,
      name: "Product Seed Owner",
      email: `${seedOwnerId}@example.invalid`,
    },
  });

  for (const product of products) {
    const { name, company, description, featured, image, price } = product;
    const existing = await prisma.product.findFirst({ where: { name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { company, description, featured, image, price },
      });
    } else {
      await prisma.product.create({
        data: { name, company, description, featured, image, price, userId: seedOwnerId },
      });
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
