import ExcelJS from "exceljs";
import { convert } from "html-to-text";
import type { ReportData } from "./types";

/**
 * Extraire les données tabulaires depuis le HTML
 */
function extractTablesFromHTML(html: string): Array<{
  headers: string[];
  rows: string[][];
}> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];

  // Expression régulière simple pour détecter les tableaux HTML
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const matches = html.matchAll(tableRegex);

  for (const match of matches) {
    const tableHTML = match[1];

    // Extraire les en-têtes
    const headerMatch = tableHTML.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    const headers: string[] = [];

    if (headerMatch) {
      const thMatches = headerMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi);
      for (const th of thMatches) {
        const text = th[1].replace(/<[^>]+>/g, "").trim();
        headers.push(text);
      }
    }

    // Extraire les lignes
    const rows: string[][] = [];
    const trMatches = tableHTML.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

    for (const tr of trMatches) {
      const row: string[] = [];
      const tdMatches = tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);

      for (const td of tdMatches) {
        const text = td[1].replace(/<[^>]+>/g, "").trim();
        row.push(text);
      }

      if (row.length > 0) {
        rows.push(row);
      }
    }

    if (headers.length > 0 && rows.length > 0) {
      tables.push({ headers, rows });
    }
  }

  return tables;
}

/**
 * Exporter un rapport en format Excel (.xlsx)
 */
export async function exportToExcel(reportData: ReportData): Promise<Buffer> {
  const { title, content, period, author, createdAt, activities } = reportData;

  // Créer un nouveau workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rapport");

  // Définir les colonnes par défaut
  worksheet.columns = [
    { width: 30 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
  ];

  let currentRow = 1;

  // Titre principal
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
  currentRow += 2;

  // Métadonnées
  if (period) {
    worksheet.getCell(`A${currentRow}`).value = "Période:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = period;
    currentRow++;
  }

  if (author) {
    worksheet.getCell(`A${currentRow}`).value = "Auteur:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = author;
    currentRow++;
  }

  if (createdAt) {
    worksheet.getCell(`A${currentRow}`).value = "Date de création:";
    worksheet.getCell(`A${currentRow}`).font = { bold: true };
    worksheet.getCell(`B${currentRow}`).value = createdAt.toLocaleDateString("fr-FR");
    currentRow++;
  }

  currentRow += 2;

  // Extraire et insérer les tableaux depuis le HTML
  const tables = extractTablesFromHTML(content);

  if (tables.length > 0) {
    for (const table of tables) {
      // En-têtes
      const headerRow = worksheet.getRow(currentRow);
      table.headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4B5563" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;

      // Lignes de données
      table.rows.forEach((row) => {
        const dataRow = worksheet.getRow(currentRow);
        row.forEach((cell, index) => {
          const excelCell = dataRow.getCell(index + 1);
          excelCell.value = cell;
          excelCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        currentRow++;
      });

      currentRow += 2;
    }
  } else if (activities && activities.length > 0) {
    // Si pas de tableau HTML mais des activités structurées, les afficher
    const headers = ["Activité", "Type", "Périodicité", "Heures", "Statut"];
    const headerRow = worksheet.getRow(currentRow);

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4B5563" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    currentRow++;

    activities.forEach((activity) => {
      const dataRow = worksheet.getRow(currentRow);
      const values = [
        activity.name,
        activity.type,
        activity.periodicity,
        activity.hours,
        activity.status,
      ];

      values.forEach((value, index) => {
        const cell = dataRow.getCell(index + 1);
        cell.value = value;
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;
    });
  } else {
    // Sinon, convertir le HTML en texte et l'insérer
    const text = convert(content, {
      wordwrap: false,
      preserveNewlines: true,
    });

    const lines = text.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      worksheet.getCell(`A${currentRow}`).value = line;
      currentRow++;
    }
  }

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Exporter plusieurs rapports dans un fichier Excel multi-feuilles
 */
export async function exportMultipleReportsToExcel(
  reports: ReportData[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    const sheetName = `Rapport ${i + 1}`;
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];

    let currentRow = 1;

    // Titre
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = report.title;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    currentRow += 2;

    // Période
    if (report.period) {
      worksheet.getCell(`A${currentRow}`).value = "Période:";
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).value = report.period;
      currentRow += 2;
    }

    // Extraire les tableaux
    const tables = extractTablesFromHTML(report.content);

    for (const table of tables) {
      // En-têtes
      const headerRow = worksheet.getRow(currentRow);
      table.headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4B5563" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;

      // Données
      table.rows.forEach((row) => {
        const dataRow = worksheet.getRow(currentRow);
        row.forEach((cell, index) => {
          const excelCell = dataRow.getCell(index + 1);
          excelCell.value = cell;
          excelCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        currentRow++;
      });

      currentRow += 2;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
