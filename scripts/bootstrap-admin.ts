import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const email = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();
const senha = process.env.SUPER_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "";

async function main() {
  if (!email || !senha) {
    console.error("Defina SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD (ou ADMIN_PASSWORD) no ambiente.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await hashPassword(senha);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, passwordHash, role: "ADMIN", nome: "Super Admin" },
    select: { id: true, email: true },
  });

  const adotados = await prisma.site.updateMany({
    where: { userId: null },
    data: { userId: admin.id },
  });

  console.log(`Super-admin garantido: ${admin.email}. Sites órfãos adotados: ${adotados.count}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
