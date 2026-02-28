import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const perms = await prisma.permission.findMany({ select: { description: true } });
  console.log('All unique DB permissions:', Array.from(new Set(perms.map(p => p.description))));
  
  const superAdminPerms = await prisma.permission.findMany({
    where: { rolePermissions: { some: { role_id: 1, status: true } } },
    select: { description: true }
  });
  console.log('Super Admin Perms:', superAdminPerms.map(p => p.description));
}
main().catch(console.error).finally(() => prisma.$disconnect());
