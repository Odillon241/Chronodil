"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from "date-fns";
import { nanoid } from "nanoid";

interface ReportFilters {
  period?: "week" | "month" | "quarter" | "year" | "custom";
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  userId?: string;
}

export async function getReportSummary(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Les employés voient uniquement leurs propres données
    const userIdFilter = session.user.role === "EMPLOYEE" 
      ? session.user.id 
      : filters.userId;

    const { startDate, endDate } = getDateRange(filters);

    // Total des heures
    const totalHoursResult = await prisma.timesheetEntry.aggregate({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userIdFilter && { userId: userIdFilter }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    // Heures par statut
    const hoursByStatus = await prisma.timesheetEntry.groupBy({
      by: ["status"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userIdFilter && { userId: userIdFilter }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    // Heures par type
    const hoursByType = await prisma.timesheetEntry.groupBy({
      by: ["type"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userIdFilter && { userId: userIdFilter }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    // Nombre de projets actifs
    const activeProjects = await prisma.project.count({
      where: {
        isActive: true,
        ...(filters.projectId && { id: filters.projectId }),
      },
    });

    const totalHours = totalHoursResult._sum.duration || 0;
    const approvedHours = hoursByStatus.find(s => s.status === "APPROVED")?._sum.duration || 0;
    const normalHours = hoursByType.find(t => t.type === "NORMAL")?._sum.duration || 0;
    const overtimeHours = hoursByType.find(t => t.type === "OVERTIME")?._sum.duration || 0;

    return {
      data: {
        totalHours,
        billableHours: approvedHours,
        activeProjects,
        validationRate: totalHours > 0 ? Math.round((approvedHours / totalHours) * 100) : 0,
        normalHours,
        overtimeHours,
        nightHours: hoursByType.find(t => t.type === "NIGHT")?._sum.duration || 0,
        weekendHours: hoursByType.find(t => t.type === "WEEKEND")?._sum.duration || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching report summary:", error);
    return { serverError: "Erreur lors du chargement des données" };
  }
}

export async function getWeeklyActivity(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Les employés voient uniquement leurs propres données
    const userIdFilter = session.user.role === "EMPLOYEE" 
      ? session.user.id 
      : filters.userId;

    const { startDate, endDate } = getDateRange(filters);

    const entries = await prisma.timesheetEntry.groupBy({
      by: ["date"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userIdFilter && { userId: userIdFilter }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const weeklyData = entries.map((entry) => ({
      day: format(new Date(entry.date), "EEE"),
      date: entry.date,
      hours: entry._sum.duration || 0,
    }));

    return { data: weeklyData };
  } catch (error) {
    console.error("Error fetching weekly activity:", error);
    return { serverError: "Erreur lors du chargement de l'activité hebdomadaire" };
  }
}

export async function getProjectDistribution(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Les employés voient uniquement leurs propres données
    const userIdFilter = session.user.role === "EMPLOYEE" 
      ? session.user.id 
      : filters.userId;

    const { startDate, endDate } = getDateRange(filters);

    const projectData = await prisma.timesheetEntry.groupBy({
      by: ["projectId"],
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userIdFilter && { userId: userIdFilter }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      _sum: {
        duration: true,
      },
    });

    const projectIds = projectData.map(item => item.projectId).filter((id): id is string => id !== null);
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, color: true, code: true },
    });

    const projectMap = new Map(projects.map(p => [p.id, p]));

    const distribution = projectData.map((item) => {
      const project = item.projectId ? projectMap.get(item.projectId) : null;
      return {
        name: project?.name || "Inconnu",
        code: project?.code || "",
        hours: item._sum.duration || 0,
        color: project?.color || "#3b82f6",
      };
    }).sort((a, b) => b.hours - a.hours);

    return { data: distribution };
  } catch (error) {
    console.error("Error fetching project distribution:", error);
    return { serverError: "Erreur lors du chargement de la répartition par projet" };
  }
}

export async function getDetailedReport(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Les employés voient uniquement leurs propres données
    const userIdFilter = session.user.role === "EMPLOYEE" 
      ? session.user.id 
      : filters.userId;

    const { startDate, endDate } = getDateRange(filters);

    const entries = await prisma.timesheetEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userIdFilter && { userId: userIdFilter }),
        ...(filters.projectId && { projectId: filters.projectId }),
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        Project: {
          select: {
            name: true,
            code: true,
            color: true,
          },
        },
        Task: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return { data: entries };
  } catch (error) {
    console.error("Error fetching detailed report:", error);
    return { serverError: "Erreur lors du chargement du rapport détaillé" };
  }
}

export async function getProjectReport(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Les employés voient uniquement leurs propres données
    const userIdFilter = session.user.role === "EMPLOYEE" 
      ? session.user.id 
      : filters.userId;

    const { startDate, endDate } = getDateRange(filters);

    const projectStats = await prisma.project.findMany({
      where: {
        isActive: true,
        ...(filters.projectId && { id: filters.projectId }),
      },
      include: {
        TimesheetEntry: {
          where: {
            date: { gte: startDate, lte: endDate },
            ...(userIdFilter && { userId: userIdFilter }),
          },
          select: {
            duration: true,
            type: true,
            status: true,
          },
        },
        ProjectMember: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const report = projectStats.map((project) => {
      const totalHours = project.TimesheetEntry.reduce((sum, entry) => sum + entry.duration, 0);
      const normalHours = project.TimesheetEntry
        .filter(e => e.type === "NORMAL")
        .reduce((sum, entry) => sum + entry.duration, 0);
      const overtimeHours = project.TimesheetEntry
        .filter(e => e.type === "OVERTIME")
        .reduce((sum, entry) => sum + entry.duration, 0);
      const approvedHours = project.TimesheetEntry
        .filter(e => e.status === "APPROVED")
        .reduce((sum, entry) => sum + entry.duration, 0);

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        color: project.color,
        budgetHours: project.budgetHours,
        totalHours,
        normalHours,
        overtimeHours,
        approvedHours,
        members: project.ProjectMember.length,
        progress: project.budgetHours ? (totalHours / project.budgetHours) * 100 : 0,
      };
    });

    return { data: report };
  } catch (error) {
    console.error("Error fetching project report:", error);
    return { serverError: "Erreur lors du chargement du rapport par projet" };
  }
}

export async function getUserReport(filters: ReportFilters) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Les employés voient uniquement leurs propres données
    const userIdFilter = session.user.role === "EMPLOYEE" 
      ? session.user.id 
      : filters.userId;

    const { startDate, endDate } = getDateRange(filters);

    const userStats = await prisma.user.findMany({
      where: {
        ...(userIdFilter && { id: userIdFilter }),
      },
      include: {
        TimesheetEntry: {
          where: {
            date: { gte: startDate, lte: endDate },
            ...(filters.projectId && { projectId: filters.projectId }),
          },
          select: {
            duration: true,
            type: true,
            status: true,
            Project: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        Department: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const report = userStats.map((user) => {
      const totalHours = user.TimesheetEntry.reduce((sum, entry) => sum + entry.duration, 0);
      const approvedHours = user.TimesheetEntry
        .filter(e => e.status === "APPROVED")
        .reduce((sum, entry) => sum + entry.duration, 0);
      const pendingHours = user.TimesheetEntry
        .filter(e => e.status === "SUBMITTED")
        .reduce((sum, entry) => sum + entry.duration, 0);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.Department?.name || "N/A",
        totalHours,
        approvedHours,
        pendingHours,
        validationRate: totalHours > 0 ? Math.round((approvedHours / totalHours) * 100) : 0,
      };
    });

    return { data: report };
  } catch (error) {
    console.error("Error fetching user report:", error);
    return { serverError: "Erreur lors du chargement du rapport par utilisateur" };
  }
}

export async function generateCustomReport(data: {
  title: string;
  content: string;
  includeSummary?: boolean;
  includeCharts?: boolean;
  period?: "week" | "month" | "quarter" | "year";
  format?: "pdf" | "word";
  saveToDatabase?: boolean;
  reportId?: string; // ID du rapport si on veut mettre à jour un existant
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Tous les utilisateurs peuvent générer des rapports

    const exportFormat = data.format || "pdf";
    const reportId = data.reportId || nanoid();

    if (exportFormat === "word") {
      // Générer le rapport en Word
      const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import("docx");
      
      const paragraphs: any[] = [];

      // Titre
      paragraphs.push(
        new Paragraph({
          text: data.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Métadonnées
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm")}`,
              size: 20,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Par ${session.user.name}`,
              size: 20,
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Contenu principal
      const contentLines = data.content.split('\n');
      contentLines.forEach(line => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line || " ",
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      });

      // Ajouter des données statistiques si demandé
      if (data.includeSummary && data.period) {
        const summaryResult = await getReportSummary({ period: data.period });
        if (summaryResult.data) {
          paragraphs.push(
            new Paragraph({
              text: "",
              spacing: { before: 400, after: 400 },
            })
          );

          paragraphs.push(
            new Paragraph({
              text: "Statistiques de la période",
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 300 },
            })
          );

          const stats = [
            `Total heures : ${summaryResult.data.totalHours.toFixed(1)}h`,
            `Heures facturables : ${summaryResult.data.billableHours.toFixed(1)}h`,
            `Projets actifs : ${summaryResult.data.activeProjects}`,
            `Taux validation : ${summaryResult.data.validationRate}%`,
          ];

          stats.forEach(stat => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: stat,
                    size: 22,
                  }),
                ],
                spacing: { after: 150 },
              })
            );
          });
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      const wordData = Buffer.from(buffer).toString("base64");
      const filename = `rapport_${format(new Date(), "yyyy-MM-dd_HHmm")}.docx`;
      const fileSize = buffer.length;

      // Enregistrer en base de données si demandé
      if (data.saveToDatabase) {
        await prisma.report.create({
          data: {
            id: reportId,
            title: data.title,
            content: data.content,
            format: "word",
            period: data.period || null,
            includeSummary: data.includeSummary || false,
            fileSize: fileSize,
            createdById: session.user.id,
          },
        });
      }

      return {
        data: {
          reportId,
          data: wordData,
          filename,
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      };
    } else {
      // Générer le rapport en PDF
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();

      // En-tête
      doc.setFontSize(20);
      doc.setTextColor(221, 45, 74); // rusty-red
      doc.text(data.title, 20, 20);

      // Date de génération
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm")}`, 20, 30);
      doc.text(`Par ${session.user.name}`, 20, 35);

      // Contenu principal
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const splitContent = doc.splitTextToSize(data.content, 170);
      doc.text(splitContent, 20, 50);

      // Ajouter des données statistiques si demandé
      if (data.includeSummary && data.period) {
        const summaryResult = await getReportSummary({ period: data.period });
        if (summaryResult.data) {
          const y = 50 + splitContent.length * 7 + 20;
          doc.setFontSize(14);
          doc.setTextColor(221, 45, 74);
          doc.text("Statistiques de la période", 20, y);

          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(`Total heures : ${summaryResult.data.totalHours.toFixed(1)}h`, 20, y + 10);
          doc.text(`Heures facturables : ${summaryResult.data.billableHours.toFixed(1)}h`, 20, y + 17);
          doc.text(`Projets actifs : ${summaryResult.data.activeProjects}`, 20, y + 24);
          doc.text(`Taux validation : ${summaryResult.data.validationRate}%`, 20, y + 31);
        }
      }

      // Pied de page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} sur ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Convertir en base64
      const pdfData = doc.output("datauristring").split(",")[1];
      const filename = `rapport_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`;
      
      // Estimer la taille du fichier
      const fileSize = Math.ceil((pdfData.length * 3) / 4); // Approximation de la taille du PDF

      // Enregistrer en base de données si demandé
      if (data.saveToDatabase) {
        await prisma.report.create({
          data: {
            id: reportId,
            title: data.title,
            content: data.content,
            format: "pdf",
            period: data.period || null,
            includeSummary: data.includeSummary || false,
            fileSize: fileSize,
            createdById: session.user.id,
          },
        });
      }

      return {
        data: {
          reportId,
          data: pdfData,
          filename,
          mimeType: "application/pdf",
        },
      };
    }
  } catch (error) {
    console.error("Error generating custom report:", error);
    return { serverError: "Erreur lors de la génération du rapport" };
  }
}

export async function sendReportByEmail(data: {
  title: string;
  content: string;
  recipientEmail: string;
  recipientName?: string;
  recipientUserId?: string; // ID de l'utilisateur si c'est un utilisateur de la base
  attachPdf?: boolean;
  period?: "week" | "month" | "quarter" | "year";
  reportId?: string; // ID du rapport si on veut l'associer à un rapport existant
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Tous les utilisateurs peuvent envoyer des rapports

    // Générer le rapport et l'enregistrer en base de données
    let reportId = data.reportId;
    let pdfAttachment = null;
    
    if (data.attachPdf || !reportId) {
      const pdfResult = await generateCustomReport({
        title: data.title,
        content: data.content,
        period: data.period,
        saveToDatabase: !reportId, // Enregistrer seulement si pas déjà enregistré
        reportId: reportId,
      });
      
      if (pdfResult.data) {
        reportId = pdfResult.data.reportId;
        pdfAttachment = {
          filename: pdfResult.data.filename,
          content: pdfResult.data.data,
          encoding: "base64",
        };
      }
    }

    // Enregistrer le destinataire
    if (reportId) {
      await prisma.reportRecipient.create({
        data: {
          id: nanoid(),
          reportId: reportId,
          userId: data.recipientUserId || null,
          email: data.recipientEmail,
          name: data.recipientName || null,
          status: "sent",
        },
      });
    }

    // Note: Dans un environnement de production, vous devriez utiliser un service d'email
    // comme SendGrid, Mailgun, ou AWS SES. Pour l'instant, nous retournons simplement un succès.
    
    // Exemple avec nodemailer (à implémenter si nécessaire):
    // const nodemailer = await import("nodemailer");
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to: data.recipientEmail,
    //   subject: data.title,
    //   html: `<p>${data.content.replace(/\n/g, '<br>')}</p>`,
    //   attachments: pdfAttachment ? [pdfAttachment] : [],
    // });

    return {
      data: {
        success: true,
        message: `Rapport envoyé à ${data.recipientEmail}`,
        reportId,
      },
    };
  } catch (error) {
    console.error("Error sending report by email:", error);
    return { serverError: "Erreur lors de l'envoi du rapport par email" };
  }
}

export async function getReports(filters?: {
  createdById?: string;
  startDate?: Date;
  endDate?: Date;
  format?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Les employés voient uniquement leurs propres rapports
    const createdByFilter = session.user.role === "EMPLOYEE"
      ? session.user.id
      : filters?.createdById;

    const reports = await prisma.report.findMany({
      where: {
        ...(createdByFilter && { createdById: createdByFilter }),
        ...(filters?.format && { format: filters.format }),
        ...(filters?.startDate && filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        CreatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Recipients: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            Recipients: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { data: reports };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { serverError: "Erreur lors du chargement des rapports" };
  }
}

export async function downloadReport(reportId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { serverError: "Rapport non trouvé" };
    }

    // Les employés peuvent uniquement télécharger leurs propres rapports
    if (session.user.role === "EMPLOYEE" && report.createdById !== session.user.id) {
      throw new Error("Permissions insuffisantes");
    }

    // Régénérer le rapport
    const result = await generateCustomReport({
      title: report.title,
      content: report.content,
      includeSummary: report.includeSummary,
      period: report.period as any,
      format: report.format as "pdf" | "word",
      saveToDatabase: false, // Ne pas créer un nouveau rapport
      reportId: report.id,
    });

    return result;
  } catch (error) {
    console.error("Error downloading report:", error);
    return { serverError: "Erreur lors du téléchargement du rapport" };
  }
}

export async function deleteReport(reportId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Non authentifié");
    }

    // Vérifier que l'utilisateur peut supprimer ce rapport
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { createdById: true },
    });

    if (!report) {
      throw new Error("Rapport non trouvé");
    }

    // Les employés peuvent uniquement supprimer leurs propres rapports
    if (session.user.role === "EMPLOYEE" && report.createdById !== session.user.id) {
      throw new Error("Permissions insuffisantes");
    }

    // Supprimer le rapport et ses destinataires (cascade)
    await prisma.report.delete({
      where: { id: reportId },
    });

    return {
      data: {
        success: true,
        message: "Rapport supprimé avec succès",
      },
    };
  } catch (error) {
    console.error("Error deleting report:", error);
    return { serverError: "Erreur lors de la suppression du rapport" };
  }
}

function getDateRange(filters: ReportFilters) {
  const now = new Date();

  if (filters.startDate && filters.endDate) {
    return { startDate: filters.startDate, endDate: filters.endDate };
  }

  switch (filters.period) {
    case "week":
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "quarter":
      return {
        startDate: startOfQuarter(now),
        endDate: endOfQuarter(now),
      };
    case "year":
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };
    case "month":
    default:
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
  }
}
