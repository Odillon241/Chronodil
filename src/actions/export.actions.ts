"use server";

import { authActionClient } from "@/lib/safe-action";
import { prisma } from "@/lib/db";
import { z } from "zod";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Export timesheet data to Excel
export const exportTimesheetToExcel = authActionClient
  .schema(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
      userId: z.string().optional(),
      projectId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId: currentUserId, userRole } = ctx;
    const { startDate, endDate, userId, projectId } = parsedInput;

    // Get timesheet entries
    const entries = await prisma.timesheetEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId && { userId }),
        ...(projectId && { projectId }),
        // If employee, only their entries
        ...(userRole === "EMPLOYEE" && { userId: currentUserId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { user: { name: "asc" } }],
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Feuilles de temps");

    // Set column headers
    worksheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Employé", key: "employee", width: 25 },
      { header: "Projet", key: "project", width: 25 },
      { header: "Code Projet", key: "projectCode", width: 15 },
      { header: "Tâche", key: "task", width: 25 },
      { header: "Type", key: "type", width: 15 },
      { header: "Durée (h)", key: "duration", width: 12 },
      { header: "Statut", key: "status", width: 15 },
      { header: "Description", key: "description", width: 40 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDD2D4A" },
    };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // Add data rows
    entries.forEach((entry) => {
      worksheet.addRow({
        date: entry.date.toLocaleDateString("fr-FR"),
        employee: entry.user.name || entry.user.email,
        project: entry.project.name,
        projectCode: entry.project.code,
        task: entry.task?.name || "-",
        type: getTypeLabel(entry.type),
        duration: entry.duration,
        status: getStatusLabel(entry.status),
        description: entry.description || "-",
      });
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      date: "TOTAL",
      employee: "",
      project: "",
      projectCode: "",
      task: "",
      type: "",
      duration: entries.reduce((sum, e) => sum + e.duration, 0),
      status: "",
      description: "",
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(column.width || 10, 12);
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = buffer.toString("base64");

    return {
      data: base64,
      filename: `timesheet_${startDate.toISOString().split("T")[0]}_to_${endDate.toISOString().split("T")[0]}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  });

// Export timesheet data to PDF
export const exportTimesheetToPDF = authActionClient
  .schema(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
      userId: z.string().optional(),
      projectId: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId: currentUserId, userRole } = ctx;
    const { startDate, endDate, userId, projectId } = parsedInput;

    // Get timesheet entries
    const entries = await prisma.timesheetEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(userId && { userId }),
        ...(projectId && { projectId }),
        ...(userRole === "EMPLOYEE" && { userId: currentUserId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { user: { name: "asc" } }],
    });

    // Create PDF
    const doc = new jsPDF({ orientation: "landscape" });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(221, 45, 74); // Rusty red
    doc.text("Chronodil - Rapport de Temps", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Période: ${startDate.toLocaleDateString("fr-FR")} - ${endDate.toLocaleDateString("fr-FR")}`,
      14,
      22
    );
    doc.text(`Généré le: ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 14, 27);

    // Prepare table data
    const tableData = entries.map((entry) => [
      entry.date.toLocaleDateString("fr-FR"),
      entry.user.name || entry.user.email,
      entry.project.name,
      entry.project.code,
      entry.task?.name || "-",
      getTypeLabel(entry.type),
      `${entry.duration}h`,
      getStatusLabel(entry.status),
    ]);

    // Add totals row
    const totalHours = entries.reduce((sum, e) => sum + e.duration, 0);
    tableData.push(["TOTAL", "", "", "", "", "", `${totalHours}h`, ""]);

    // Add table
    autoTable(doc, {
      head: [["Date", "Employé", "Projet", "Code", "Tâche", "Type", "Durée", "Statut"]],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [221, 45, 74], // Rusty red
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249],
      },
      foot: [["TOTAL", "", "", "", "", "", `${totalHours}h`, ""]],
    });

    // Generate base64
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    return {
      data: pdfBase64,
      filename: `timesheet_${startDate.toISOString().split("T")[0]}_to_${endDate.toISOString().split("T")[0]}.pdf`,
      mimeType: "application/pdf",
    };
  });

// Helper functions
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    NORMAL: "Normal",
    OVERTIME: "Heures sup.",
    NIGHT: "Heures nuit",
    WEEKEND: "Week-end",
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Brouillon",
    SUBMITTED: "Soumis",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
    LOCKED: "Verrouillé",
  };
  return labels[status] || status;
}
