import { prisma } from "../../src/lib/db";

async function testValidation() {
  console.log("Testing validation system...\n");

  // 1. Vérifier les entrées en attente
  const pendingEntries = await prisma.timesheetEntry.findMany({
    where: {
      status: "SUBMITTED",
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      Project: true,
      Task: true,
    },
    take: 5,
  });

  console.log(`Found ${pendingEntries.length} pending entries:`);
  pendingEntries.forEach((entry) => {
    console.log(`- ID: ${entry.id}`);
    console.log(`  User: ${entry.User.name} (${entry.User.email})`);
    console.log(`  Project: ${entry.Project?.name || "No project"}`);
    console.log(`  Duration: ${entry.duration}h`);
    console.log(`  Date: ${entry.date}`);
    console.log("");
  });

  // 2. Vérifier les utilisateurs avec permissions
  const managers = await prisma.user.findMany({
    where: {
      role: {
        in: ["MANAGER", "HR", "ADMIN"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log(`\nFound ${managers.length} users with validation permissions:`);
  managers.forEach((user) => {
    console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
  });
}

testValidation()
  .then(() => {
    console.log("\nTest completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
