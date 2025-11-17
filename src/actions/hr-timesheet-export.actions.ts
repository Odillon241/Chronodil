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
        User_HRTimesheet_userIdToUser: true,
        User_HRTimesheet_managerSignedByIdToUser: true,
        User_HRTimesheet_odillonSignedByIdToUser: true,
        HRActivity: {
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
      (user.role === "MANAGER" && timesheet.User_HRTimesheet_userIdToUser.managerId === userId);

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
    titleCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF10B981" }, // Vert moderne (emerald-500)
    };
    worksheet.getRow(1).height = 30;

    // Informations générales - Section avec style
    worksheet.addRow([]);
    const infoRows = [
      worksheet.addRow(["Semaine du:", format(timesheet.weekStartDate, "dd/MM/yyyy", { locale: fr })]),
      worksheet.addRow(["Semaine au:", format(timesheet.weekEndDate, "dd/MM/yyyy", { locale: fr })]),
      worksheet.addRow(["Employé:", timesheet.employeeName]),
      worksheet.addRow(["Poste:", timesheet.position]),
      worksheet.addRow(["Site:", timesheet.site]),
      worksheet.addRow(["Statut:", getStatusLabel(timesheet.status)]),
    ];

    // Style pour les informations générales
    infoRows.forEach((row) => {
      row.height = 20;
      const labelCell = row.getCell(1);
      const valueCell = row.getCell(2);

      // Style des labels (colonne A)
      labelCell.font = { bold: true, size: 11 };
      labelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" }, // Gris très clair
      };
      labelCell.alignment = { vertical: "middle", horizontal: "right" };

      // Style des valeurs (colonne B)
      valueCell.font = { size: 11 };
      valueCell.alignment = { vertical: "middle" };

      // Bordures fines
      [labelCell, valueCell].forEach((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    });

    // Mettre en évidence le statut avec une couleur
    const statusRow = infoRows[infoRows.length - 1];
    const statusCell = statusRow.getCell(2);
    const statusColors: Record<string, string> = {
      DRAFT: "FFFEF3C7",        // Jaune clair
      PENDING: "FFFDE68A",      // Jaune
      MANAGER_APPROVED: "FFBFDBFE", // Bleu clair
      APPROVED: "FFD1FAE5",     // Vert clair
      REJECTED: "FFFECACA",     // Rouge clair
    };
    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: statusColors[timesheet.status] || "FFFFFFFF" },
    };
    statusCell.font = { bold: true, size: 11 };

    worksheet.addRow([]);

    // Observations
    if (timesheet.employeeObservations) {
      const obsLabelRow = worksheet.addRow(["Observations de l'employé:"]);
      obsLabelRow.getCell(1).font = { bold: true, size: 11, italic: true };
      obsLabelRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEF3C7" }, // Jaune clair
      };
      worksheet.mergeCells(`A${obsLabelRow.number}:I${obsLabelRow.number}`);

      const obsRow = worksheet.addRow([timesheet.employeeObservations]);
      worksheet.mergeCells(`A${obsRow.number}:I${obsRow.number}`);
      obsRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
      obsRow.getCell(1).border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
      obsRow.height = 40;
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

    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" }, // Vert foncé (emerald-600)
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 25;

    // Bordures pour les en-têtes
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "medium", color: { argb: "FF047857" } },
        left: { style: "thin", color: { argb: "FF047857" } },
        bottom: { style: "medium", color: { argb: "FF047857" } },
        right: { style: "thin", color: { argb: "FF047857" } },
      };
    });

    // Grouper les activités par catégorie
    const groupedActivities = timesheet.HRActivity.reduce((acc: Record<string, any[]>, activity: any) => {
      const category = activity.ActivityCatalog?.category || "Autres";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(activity);
      return acc;
    }, {} as Record<string, typeof timesheet.HRActivity>);

    // Ajouter les activités groupées par catégorie
    Object.entries(groupedActivities).forEach(([category, activities], categoryIndex) => {
      // Ligne de catégorie
      const categoryRow = worksheet.addRow([category]);
      worksheet.mergeCells(`A${categoryRow.number}:I${categoryRow.number}`);
      categoryRow.font = { bold: true, size: 12, color: { argb: "FF1F2937" } };
      categoryRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" }, // Gris clair moderne
      };
      categoryRow.height = 22;
      categoryRow.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

      // Bordure pour la catégorie
      categoryRow.eachCell((cell) => {
        cell.border = {
          top: { style: "medium", color: { argb: "FF9CA3AF" } },
          left: { style: "thin", color: { argb: "FF9CA3AF" } },
          bottom: { style: "medium", color: { argb: "FF9CA3AF" } },
          right: { style: "thin", color: { argb: "FF9CA3AF" } },
        };
      });

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

        row.height = 22;
        row.alignment = { vertical: "middle" };

        // Style conditionnel selon le type
        const typeCell = row.getCell("type");
        if (activity.activityType === "OPERATIONAL") {
          typeCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFBFDBFE" }, // Bleu clair (blue-200)
          };
          typeCell.font = { bold: true, color: { argb: "FF1E40AF" } }; // Bleu foncé
        } else {
          typeCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFDE68A" }, // Jaune clair (yellow-200)
          };
          typeCell.font = { bold: true, color: { argb: "FF92400E" } }; // Orange foncé
        }

        // Style du statut
        const statusCell = row.getCell("status");
        if (activity.status === "COMPLETED") {
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD1FAE5" }, // Vert clair
          };
          statusCell.font = { bold: true, color: { argb: "FF065F46" } };
        } else {
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF3C7" }, // Jaune très clair
          };
          statusCell.font = { color: { argb: "FF92400E" } };
        }

        // Centre les colonnes numériques et dates
        row.getCell("weeklyQuantity").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("startDate").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("endDate").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("totalHours").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("totalHours").font = { bold: true, color: { argb: "FF059669" } };

        // Bordures fines pour toutes les cellules
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      });
    });

    // Ligne de total
    worksheet.addRow([]);
    const totalRow = worksheet.addRow(["", "", "", "", "", "", "TOTAL HEURES:", timesheet.totalHours]);
    totalRow.height = 28;

    // Style du label "TOTAL HEURES:"
    const totalLabelCell = totalRow.getCell("G");
    totalLabelCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
    totalLabelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" }, // Vert emerald-600
    };
    totalLabelCell.alignment = { horizontal: "right", vertical: "middle" };
    totalLabelCell.border = {
      top: { style: "medium", color: { argb: "FF047857" } },
      left: { style: "medium", color: { argb: "FF047857" } },
      bottom: { style: "medium", color: { argb: "FF047857" } },
      right: { style: "thin", color: { argb: "FF047857" } },
    };

    // Style de la valeur du total
    const totalValueCell = totalRow.getCell("H");
    totalValueCell.font = { bold: true, size: 14, color: { argb: "FF065F46" } }; // Vert foncé
    totalValueCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD1FAE5" }, // Vert clair
    };
    totalValueCell.alignment = { horizontal: "center", vertical: "middle" };
    totalValueCell.border = {
      top: { style: "medium", color: { argb: "FF047857" } },
      left: { style: "thin", color: { argb: "FF047857" } },
      bottom: { style: "medium", color: { argb: "FF047857" } },
      right: { style: "medium", color: { argb: "FF047857" } },
    };

    // Section signatures
    worksheet.addRow([]);
    worksheet.addRow([]);
    const signaturesHeaderRow = worksheet.addRow(["SIGNATURES ET VALIDATIONS"]);
    worksheet.mergeCells(`A${signaturesHeaderRow.number}:I${signaturesHeaderRow.number}`);
    signaturesHeaderRow.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
    signaturesHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6366F1" }, // Indigo-500
    };
    signaturesHeaderRow.height = 26;
    signaturesHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
    signaturesHeaderRow.eachCell((cell) => {
      cell.border = {
        top: { style: "medium", color: { argb: "FF4F46E5" } },
        left: { style: "medium", color: { argb: "FF4F46E5" } },
        bottom: { style: "medium", color: { argb: "FF4F46E5" } },
        right: { style: "medium", color: { argb: "FF4F46E5" } },
      };
    });

    worksheet.addRow([]);

    if (timesheet.employeeSignedAt) {
      const empRow = worksheet.addRow([
        "Employé:",
        timesheet.employeeName,
        "",
        "Signé le:",
        format(timesheet.employeeSignedAt, "dd/MM/yyyy à HH:mm", { locale: fr }),
      ]);
      empRow.height = 22;
      empRow.getCell(1).font = { bold: true, size: 11 };
      empRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } }; // Indigo clair
      empRow.getCell(4).font = { bold: true, size: 10, italic: true };
      empRow.getCell(5).font = { size: 10 };

      empRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    }

    if (timesheet.managerSignedAt) {
      const mgrRow = worksheet.addRow([
        "Manager:",
        timesheet.User_HRTimesheet_managerSignedByIdToUser?.name || "N/A",
        "",
        "Validé le:",
        format(timesheet.managerSignedAt, "dd/MM/yyyy à HH:mm", { locale: fr }),
      ]);
      mgrRow.height = 22;
      mgrRow.getCell(1).font = { bold: true, size: 11 };
      mgrRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBFDBFE" } }; // Bleu clair
      mgrRow.getCell(4).font = { bold: true, size: 10, italic: true };
      mgrRow.getCell(5).font = { size: 10 };

      mgrRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      if (timesheet.managerComments) {
        const commentRow = worksheet.addRow(["Commentaires manager:", timesheet.managerComments]);
        worksheet.mergeCells(`B${commentRow.number}:I${commentRow.number}`);
        commentRow.height = 30;
        commentRow.getCell(1).font = { bold: true, size: 10, italic: true };
        commentRow.getCell(1).alignment = { vertical: "top", wrapText: true };
        commentRow.getCell(2).alignment = { vertical: "top", wrapText: true };
        commentRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      }
    }

    if (timesheet.odillonSignedAt) {
      const adminRow = worksheet.addRow([
        "Admin/Odillon:",
        timesheet.User_HRTimesheet_odillonSignedByIdToUser?.name || "N/A",
        "",
        "Approuvé le:",
        format(timesheet.odillonSignedAt, "dd/MM/yyyy à HH:mm", { locale: fr }),
      ]);
      adminRow.height = 22;
      adminRow.getCell(1).font = { bold: true, size: 11 };
      adminRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } }; // Vert clair
      adminRow.getCell(4).font = { bold: true, size: 10, italic: true };
      adminRow.getCell(5).font = { size: 10 };

      adminRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      if (timesheet.odillonComments) {
        const commentRow = worksheet.addRow(["Commentaires admin:", timesheet.odillonComments]);
        worksheet.mergeCells(`B${commentRow.number}:I${commentRow.number}`);
        commentRow.height = 30;
        commentRow.getCell(1).font = { bold: true, size: 10, italic: true };
        commentRow.getCell(1).alignment = { vertical: "top", wrapText: true };
        commentRow.getCell(2).alignment = { vertical: "top", wrapText: true };
        commentRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      }
    }

    // Générer le buffer Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Convertir en base64 pour le retour
    const base64 = Buffer.from(buffer).toString("base64");

    const fileName = `Timesheet_RH_${timesheet.employeeName.replace(/\s+/g, "_")}_${format(
      timesheet.weekStartDate,
      "yyyy-MM-dd",
    )}.xlsx`;

    // next-safe-action retourne automatiquement { data: ... }
    // Donc on retourne directement l'objet de données
    return {
      fileData: base64,
      fileName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
