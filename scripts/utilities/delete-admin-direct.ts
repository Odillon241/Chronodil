import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAdmin() {
  try {
    console.log("Starting admin deletion process...");

    // 1. Disable the trigger
    console.log("Step 1: Disabling protection trigger...");
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" DISABLE TRIGGER protect_admin_delete`
    );
    console.log("✓ Trigger disabled");

    // Get admin user ID first
    console.log("Step 2: Finding admin user...");
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@chronodil.com" },
    });

    if (!adminUser) {
      console.log("⚠ Admin user not found!");
      return;
    }

    console.log(`✓ Found admin user with ID: ${adminUser.id}`);

    // 2. Delete related data
    console.log("Step 3: Deleting related data...");

    const adminId = adminUser.id;

    // Delete in order of foreign key dependencies
    await prisma.account.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted accounts");

    await prisma.session.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted sessions");

    await prisma.taskComment.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted task comments");

    await prisma.taskActivity.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted task activities");

    await prisma.taskMember.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted task members");

    await prisma.task.deleteMany({
      where: {
        OR: [{ createdBy: adminId }, { evaluatedBy: adminId }],
      },
    });
    console.log("  ✓ Deleted tasks");

    await prisma.projectMember.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted project members");

    await prisma.project.deleteMany({
      where: { createdBy: adminId },
    });
    console.log("  ✓ Deleted projects");

    await prisma.timesheetEntry.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted timesheet entries");

    await prisma.timesheetValidation.deleteMany({
      where: { validatorId: adminId },
    });
    console.log("  ✓ Deleted timesheet validations");

    await prisma.hRTimesheet.deleteMany({
      where: {
        OR: [
          { managerSignedById: adminId },
          { odillonSignedById: adminId },
          { userId: adminId },
        ],
      },
    });
    console.log("  ✓ Deleted HR timesheets");

    await prisma.notification.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted notifications");

    await prisma.report.deleteMany({
      where: { createdById: adminId },
    });
    console.log("  ✓ Deleted reports");

    await prisma.reportRecipient.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted report recipients");

    await prisma.conversation.deleteMany({
      where: { createdBy: adminId },
    });
    console.log("  ✓ Deleted conversations");

    await prisma.conversationMember.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted conversation members");

    await prisma.message.deleteMany({
      where: { senderId: adminId },
    });
    console.log("  ✓ Deleted messages");

    await prisma.auditLog.deleteMany({
      where: { userId: adminId },
    });
    console.log("  ✓ Deleted audit logs");

    // 3. Delete the admin user
    console.log("Step 4: Deleting admin user...");
    await prisma.user.delete({
      where: { id: adminId },
    });
    console.log("✓ Admin user deleted");

    // 4. Re-enable the trigger
    console.log("Step 5: Re-enabling protection trigger...");
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ENABLE TRIGGER protect_admin_delete`
    );
    console.log("✓ Trigger re-enabled");

    // 5. Verify deletion
    console.log("Step 6: Verifying deletion...");
    const count = await prisma.user.count({
      where: { email: "admin@chronodil.com" },
    });

    if (count === 0) {
      console.log("✅ SUCCESS: Admin user has been deleted!");
    } else {
      console.log("⚠ WARNING: Admin user still exists!");
    }
  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdmin();
