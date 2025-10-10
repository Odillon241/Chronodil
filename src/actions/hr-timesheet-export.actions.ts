"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { z } from "zod";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const exportTimesheetSchema = z.object({
  timesheetId: z.string(),
});

export const exportHRTimesheetToExcel = authActionClient
  .schema(exportTimesheetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { timesheetId } = parsedInput;
    const { userId } = ctx;

    // Récupérer le timesheet avec toutes les données
    const timesheet = await prisma.hRTimesheet.findUnique({
      where: { id: timesheetId },
      include: {
        User: true,
        ManagerSigner: true,
        OdillonSigner: true,
        activities: {
          include: {
            ActivityCatalog: true,
          },
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    if (!timesheet) {
      throw new Error("Timesheet non trouvé");
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Seul le propriétaire, son manager, HR ou Admin peuvent exporter
    const canExport =
      timesheet.userId === userId ||
      user.role === "ADMIN" ||
      user.role === "HR" ||
      (user.role === "MANAGER" && timesheet.User.managerId === userId);

    if (!canExport) {
      throw new Error("Vous n'êtes pas autorisé à exporter ce timesheet");
    }

    // Créer le workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Feuille de temps RH");

    // Configuration des colonnes
    worksheet.columns = [
      { header: "Type", key: "type", width: 15 },
      { header: "Nom de l'activité", key: "name", width: 40 },
      { header: "Catégorie", key: "category", width: 20 },
      { header: "Périodicité", key: "periodicity", width: 15 },
      { header: "Quantité/semaine", key: "weeklyQuantity", width: 18 },
      { header: "Date début", key: "startDate", width: 12 },
      { header: "Date fin", key: "endDate", width: 12 },
      { header: "Total heures", key: "totalHours", width: 12 },
      { header: "Statut", key: "status", width: 12 },
    ];

    // En-tête du document
    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "FEUILLE DE TEMPS RH - CHRONODIL";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD63031" }, // Rusty red
    };
    titleCell.font = { ...titleCell.font, color: { argb: "FFFFFFFF" } };

    // Informations générales
    worksheet.addRow([]);
    worksheet.addRow(["Semaine du:", format(timesheet.weekStartDate, "dd/MM/yyyy", { locale: fr })]);
    worksheet.addRow(["Semaine au:", format(timesheet.weekEndDate, "dd/MM/yyyy", { locale: fr })]);
    worksheet.addRow(["Employé:", timesheet.employeeName]);
    worksheet.addRow(["Poste:", timesheet.position]);
    worksheet.addRow(["Site:", timesheet.site]);
    worksheet.addRow(["Statut:", getStatusLabel(timesheet.status)]);
    worksheet.addRow([]);

    // Observations
    if (timesheet.employeeObservations) {
      worksheet.addRow(["Observations de l'employé:"]);
      const obsRow = worksheet.addRow([timesheet.employeeObservations]);
      worksheet.mergeCells(`A${obsRow.number}:I${obsRow.number}`);
      obsRow.getCell(1).alignment = { wrapText: true };
      worksheet.addRow([]);
    }

    // En-têtes des colonnes d'activités
    const headerRow = worksheet.addRow([
      "Type",
      "Nom de l'activité",
      "Catégorie",
      "Périodicité",
      "Quantité/semaine",
      "Date début",
      "Date fin",
      "Total heures",
      "Statut",
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // Grouper les activités par catégorie
    const groupedActivities = timesheet.activities.reduce((acc: Record<string, any[]>, activity: any) => {
      const category = activity.ActivityCatalog?.category || "Autres";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(activity);
      return acc;
    }, {} as Record<string, typeof timesheet.activities>);

    // Ajouter les activités groupées par catégorie
    Object.entries(groupedActivities).forEach(([category, activities]) => {
      // Ligne de catégorie
      const categoryRow = worksheet.addRow([category]);
      worksheet.mergeCells(`A${categoryRow.number}:I${categoryRow.number}`);
      categoryRow.font = { bold: true, size: 12 };
      categoryRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF5F5F5" },
      };

      // Activités de cette catégorie
      activities.forEach((activity: any) => {
        const row = worksheet.addRow({
          type: activity.activityType === "OPERATIONAL" ? "Opérationnel" : "Reporting",
          name: activity.activityName,
          category: activity.ActivityCatalog?.category || "Autres",
          periodicity: getPeriodicityLabel(activity.periodicity),
          weeklyQuantity: activity.weeklyQuantity || "",
          startDate: format(activity.startDate, "dd/MM/yyyy", { locale: fr }),
          endDate: format(activity.endDate, "dd/MM/yyyy", { locale: fr }),
          totalHours: activity.totalHours,
          status: activity.status === "COMPLETED" ? "Terminé" : "En cours",
        });

        // Style conditionnel selon le type
        if (activity.activityType === "OPERATIONAL") {
          row.getCell("type").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDBEAFE" }, // Bleu clair
          };
        } else {
          row.getCell("type").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF3C7" }, // Jaune clair
          };
        }
      });
    });

    // Ligne de total
    worksheet.addRow([]);
    const totalRow = worksheet.addRow(["", "", "", "", "", "", "TOTAL HEURES:", timesheet.totalHours]);
    totalRow.font = { bold: true, size: 12 };
    totalRow.getCell("H").font = { ...totalRow.getCell("H").font, color: { argb: "FFD63031" } };
    totalRow.getCell("H").alignment = { horizontal: "right" };

    // Section signatures
    worksheet.addRow([]);
    worksheet.addRow([]);
    const signaturesHeaderRow = worksheet.addRow(["SIGNATURES ET VALIDATIONS"]);
    worksheet.mergeCells(`A${signaturesHeaderRow.number}:I${signaturesHeaderRow.number}`);
    signaturesHeaderRow.font = { bold: true, size: 12 };
    signaturesHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };

    worksheet.addRow([]);

    if (timesheet.employeeSignedAt) {
      worksheet.addRow([
        "Employé:",
        timesheet.employeeName,
        "Signé le:",
        format(timesheet.employeeSignedAt, "dd/MM/yyyy à HH:mm", { locale: fr }),
      ]);
    }

    if (timesheet.managerSignedAt) {
      worksheet.addRow([
        "Manager:",
        timesheet.ManagerSigner?.name || "N/A",
        "Validé le:",
        format(timesheet.managerSignedAt, "dd/MM/yyyy à HH:mm", { locale: fr }),
      ]);
      if (timesheet.managerComments) {
        const commentRow = worksheet.addRow(["Commentaires manager:", timesheet.managerComments]);
        worksheet.mergeCells(`B${commentRow.number}:I${commentRow.number}`);
      }
    }

    if (timesheet.odillonSignedAt) {
      worksheet.addRow([
        "Admin/Odillon:",
        timesheet.OdillonSigner?.name || "N/A",
        "Approuvé le:",
        format(timesheet.odillonSignedAt, "dd/MM/yyyy à HH:mm", { locale: fr }),
      ]);
      if (timesheet.odillonComments) {
        const commentRow = worksheet.addRow(["Commentaires admin:", timesheet.odillonComments]);
        worksheet.mergeCells(`B${commentRow.number}:I${commentRow.number}`);
      }
    }

    // Bordures pour toutes les cellules avec du contenu
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Générer le buffer Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Convertir en base64 pour le retour
    const base64 = Buffer.from(buffer).toString("base64");

    const fileName = `Timesheet_RH_${timesheet.employeeName.replace(/\s+/g, "_")}_${format(
      timesheet.weekStartDate,
      "yyyy-MM-dd",
    )}.xlsx`;

    return {
      success: true,
      data: {
        fileData: base64,
        fileName,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    };
  });

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    PENDING: "En attente validation manager",
    MANAGER_APPROVED: "Validé manager - En attente validation finale",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
  };
  return labels[status] || status;
}

function getPeriodicityLabel(periodicity: string): string {
  const labels: Record<string, string> = {
    DAILY: "Quotidien",
    WEEKLY: "Hebdomadaire",
    MONTHLY: "Mensuel",
    PUNCTUAL: "Ponctuel",
    WEEKLY_MONTHLY: "Hebdo/Mensuel",
  };
  return labels[periodicity] || periodicity;
}
