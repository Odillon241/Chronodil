import { prisma } from "../../src/lib/db";

async function assignManagerToAdmin() {
  console.log("📝 Assignation d'un manager à l'administrateur...\n");

  // Récupérer l'admin et le manager
  const admin = await prisma.user.findUnique({
    where: { email: "admin@chronodil.com" },
  });

  const manager = await prisma.user.findUnique({
    where: { email: "manager@chronodil.com" },
  });

  if (!admin || !manager) {
    console.error("❌ Admin ou Manager non trouvé");
    process.exit(1);
  }

  // Assigner le manager à l'admin
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      managerId: manager.id,
    },
  });

  console.log("✅ Manager assigné avec succès !");
  console.log(`\n   Admin: ${admin.name} (${admin.email})`);
  console.log(`   Manager: ${manager.name} (${manager.email})`);
  console.log(
    "\n💡 Vous pouvez maintenant soumettre des timesheets HR avec le compte admin !"
  );
}

assignManagerToAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
