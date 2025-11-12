import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { convert } from "html-to-text";
import type { ReportData } from "./types";

/**
 * Convertir du HTML en paragraphes Word
 */
function htmlToParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Convertir HTML en texte simple avec structure
  const text = convert(html, {
    wordwrap: false,
    preserveNewlines: true,
  });

  // Diviser en lignes et créer des paragraphes
  const lines = text.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    // Détecter les titres (commencent souvent par # ou sont en MAJUSCULES)
    if (trimmed.startsWith("#")) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const headingText = trimmed.replace(/^#+\s*/, "");

      paragraphs.push(
        new Paragraph({
          text: headingText,
          heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (trimmed.toUpperCase() === trimmed && trimmed.length > 5) {
      // Ligne en majuscules = titre
      paragraphs.push(
        new Paragraph({
          text: trimmed,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );
    } else {
      // Paragraphe normal
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(trimmed)],
          spacing: { before: 120, after: 120 },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Créer un tableau Word depuis des données structurées
 */
function createTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      // En-tête
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: header,
                      bold: true,
                    }),
                  ],
                }),
              ],
              shading: {
                fill: "F3F4F6",
              },
            })
        ),
      }),
      // Lignes de données
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ text: cell })],
                })
            ),
          })
      ),
    ],
  });
}

/**
 * Exporter un rapport en format Word (.docx)
 */
export async function exportToWord(reportData: ReportData): Promise<Buffer> {
  const { title, content, period, author, createdAt } = reportData;

  // Créer les sections du document
  const sections: Paragraph[] = [];

  // Titre principal
  sections.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Métadonnées
  if (period || author || createdAt) {
    const metadata: string[] = [];
    if (period) metadata.push(`Période: ${period}`);
    if (author) metadata.push(`Auteur: ${author}`);
    if (createdAt) {
      metadata.push(
        `Date de création: ${createdAt.toLocaleDateString("fr-FR")}`
      );
    }

    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: metadata.join(" | "),
            italics: true,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Ligne de séparation
  sections.push(
    new Paragraph({
      text: "─".repeat(50),
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );

  // Convertir le contenu HTML en paragraphes
  const contentParagraphs = htmlToParagraphs(content);
  sections.push(...contentParagraphs);

  // Créer le document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Générer le buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Exporter plusieurs rapports en un seul document Word
 */
export async function exportMultipleReportsToWord(
  reports: ReportData[]
): Promise<Buffer> {
  const sections: Paragraph[] = [];

  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];

    // Titre du rapport
    sections.push(
      new Paragraph({
        text: report.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: i === 0 ? 0 : 480, after: 240 },
      })
    );

    // Métadonnées
    if (report.period) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Période: ${report.period}`,
              italics: true,
            }),
          ],
          spacing: { after: 240 },
        })
      );
    }

    // Contenu
    const contentParagraphs = htmlToParagraphs(report.content);
    sections.push(...contentParagraphs);

    // Séparateur entre rapports
    if (i < reports.length - 1) {
      sections.push(
        new Paragraph({
          text: "",
          spacing: { after: 240 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
