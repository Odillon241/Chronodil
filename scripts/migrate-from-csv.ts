/**
 * Script de migration des données depuis les fichiers CSV exportés
 * Migre: HRActivity, Task, TaskMember avec mapping des anciens IDs vers les nouveaux
 */

import { PrismaClient, HRActivityType, HRPeriodicity, HRActivityStatus, TaskComplexity } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Mapping des anciens IDs Better Auth vers les nouveaux IDs Supabase Auth
const ID_MAPPING: Record<string, string> = {
  "zT54BfytlJODdWbmeKSVZnQsw2bdlYqX": "08d57180-8c8b-448f-a5f8-b67711750958", // vanessamboumba
  "iV8MaMrFXuMT04aqkjJYXzvupR9n47Qq": "1df090ef-2d0d-4d72-a21a-b4113c7eadf4", // nathaliebingangoye
  "S1SfLojzX9ywijHIQd4Lqftiy72b4cOQ": "3f8363ee-1abf-4588-8922-301630b99865", // elianetale
  "pYcGKxZ2bm6CMreDd4PaXfGdyImop3w3": "f583973c-a7d0-4df7-a587-09e0395f9e7c", // dereckdanel
  "SbaqoYkhJiwSJ6kiC7UlgqsWXdNVGYWT": "ed4719fa-fe2a-4442-b1c0-ca3abb8d4f7c", // fethiabicke
  "5CUbS4Ww95utj7iNfbi5WHq8gRcFt1U3": "dba0ccfd-bf14-45fb-a97d-6f267a9bfc1d", // abigaelnfono
  "uzoM3ZYUxlAdTcZz22TEBpxna0cSpHec": "36292638-20e6-40aa-8552-698617dc07fc", // test
  "GdwpHOgPdwWSgNnWSjHG5v0llqBVbKtg": "a1f339ea-6256-45fd-a719-512c5688492a", // nadiataty
  "1jTiaBdFGTw0pvdr0KF7AQcTRWpWme4U": "24ee670e-e3f3-4719-b76a-d03b84d3b725", // manager
};

// Fonction pour mapper un ID utilisateur
function mapUserId(oldId: string | null | undefined): string | null {
  if (!oldId || oldId === "null" || oldId === "") return null;
  return ID_MAPPING[oldId] || oldId; // Retourne l'ID mappé ou l'ID original si pas de mapping
}

// Parseur CSV simple qui gère les champs avec virgules entre guillemets
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Gérer les lignes multi-lignes (descriptions avec retours à la ligne)
    let fullLine = line;
    while (i < lines.length - 1 && !isCompleteLine(fullLine, headers.length)) {
      i++;
      fullLine += "\n" + lines[i];
    }
    
    const values = parseCSVLine(fullLine);
    if (values.length >= headers.length - 1) { // Tolérance pour colonnes vides à la fin
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }
  }
  
  return rows;
}

function isCompleteLine(line: string, expectedFields: number): boolean {
  const fields = parseCSVLine(line);
  return fields.length >= expectedFields - 1;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

async function migrateHRActivities() {
  console.log("\n📋 Migration des HRActivities...");
  
  const csvPath = path.join(__dirname, "..", "HRActivity_rows.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  
  console.log(`   Trouvé ${rows.length} activités à migrer`);
  
  let success = 0;
  let errors = 0;
  
  for (const row of rows) {
    try {
      await prisma.hRActivity.create({
        data: {
          id: row.id,
          hrTimesheetId: row.hrTimesheetId,
          activityType: row.activityType as HRActivityType,
          activityName: row.activityName,
          description: row.description || null,
          periodicity: row.periodicity as HRPeriodicity,
          weeklyQuantity: row.weeklyQuantity ? parseInt(row.weeklyQuantity) : null,
          startDate: new Date(row.startDate),
          endDate: new Date(row.endDate),
          totalHours: parseFloat(row.totalHours),
          status: row.status as HRActivityStatus,
          catalogId: row.catalogId || null,
          taskId: row.taskId || null,
          priority: row.priority || null,
          estimatedHours: row.estimatedHours ? parseFloat(row.estimatedHours) : null,
          dueDate: row.dueDate ? new Date(row.dueDate) : null,
          reminderDate: row.reminderDate ? new Date(row.reminderDate) : null,
          reminderTime: row.reminderTime || null,
          soundEnabled: row.soundEnabled === "true",
          sharedWith: row.sharedWith ? JSON.parse(row.sharedWith) : null,
          complexity: row.complexity ? row.complexity as TaskComplexity : null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        },
      });
      success++;
    } catch (error: any) {
      if (!error.message?.includes("Unique constraint")) {
        console.error(`   ❌ Erreur pour ${row.id}: ${error.message}`);
      }
      errors++;
    }
  }
  
  console.log(`   ✅ ${success} activités migrées, ${errors} erreurs/doublons`);
}

async function migrateTasks() {
  console.log("\n📋 Migration des Tasks...");
  
  const csvPath = path.join(__dirname, "..", "Task_rows.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  
  console.log(`   Trouvé ${rows.length} tâches à migrer`);
  
  let success = 0;
  let errors = 0;
  
  for (const row of rows) {
    try {
      // Mapper les IDs utilisateurs
      const createdBy = mapUserId(row.createdBy);
      const evaluatedBy = mapUserId(row.evaluatedBy);
      
      await prisma.task.create({
        data: {
          id: row.id,
          name: row.name,
          description: row.description || null,
          projectId: row.projectId || null,
          parentId: row.parentId || null,
          estimatedHours: row.estimatedHours ? parseFloat(row.estimatedHours) : null,
          isActive: row.isActive !== "false",
          recurrence: row.recurrence || null,
          evaluatedBy: evaluatedBy,
          evaluationNotes: row.evaluationNotes || null,
          evaluatedAt: row.evaluatedAt ? new Date(row.evaluatedAt) : null,
          createdBy: createdBy,
          dueDate: row.dueDate ? new Date(row.dueDate) : null,
          isShared: row.isShared === "true",
          reminderDate: row.reminderDate ? new Date(row.reminderDate) : null,
          reminderTime: row.reminderTime || null,
          soundEnabled: row.soundEnabled !== "false",
          completedAt: row.completedAt ? new Date(row.completedAt) : null,
          priority: row.priority || "MEDIUM",
          status: row.status || "TODO",
          hrTimesheetId: row.hrTimesheetId || null,
          complexity: row.complexity ? row.complexity as TaskComplexity : "MOYEN",
          trainingLevel: row.trainingLevel || null,
          masteryLevel: row.masteryLevel || null,
          understandingLevel: row.understandingLevel || null,
          activityType: row.activityType || null,
          activityName: row.activityName || null,
          periodicity: row.periodicity || null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        },
      });
      success++;
    } catch (error: any) {
      if (!error.message?.includes("Unique constraint")) {
        console.error(`   ❌ Erreur pour ${row.id}: ${error.message}`);
      }
      errors++;
    }
  }
  
  console.log(`   ✅ ${success} tâches migrées, ${errors} erreurs/doublons`);
}

async function migrateTaskMembers() {
  console.log("\n📋 Migration des TaskMembers...");
  
  const csvPath = path.join(__dirname, "..", "TaskMember_rows.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  
  console.log(`   Trouvé ${rows.length} membres de tâches à migrer`);
  
  let success = 0;
  let errors = 0;
  
  for (const row of rows) {
    try {
      // Mapper l'ID utilisateur
      const userId = mapUserId(row.userId);
      
      if (!userId) {
        console.error(`   ⚠️ ID utilisateur manquant pour TaskMember ${row.id}`);
        errors++;
        continue;
      }
      
      await prisma.taskMember.create({
        data: {
          id: row.id,
          taskId: row.taskId,
          userId: userId,
          role: row.role || "member",
          createdAt: new Date(row.createdAt),
        },
      });
      success++;
    } catch (error: any) {
      if (!error.message?.includes("Unique constraint")) {
        console.error(`   ❌ Erreur pour ${row.id}: ${error.message}`);
      }
      errors++;
    }
  }
  
  console.log(`   ✅ ${success} membres migrés, ${errors} erreurs/doublons`);
}

async function main() {
  console.log("🚀 Début de la migration des données depuis les CSV...\n");
  
  try {
    // D'abord les Tasks (car HRActivity peut référencer des Tasks)
    await migrateTasks();
    
    // Ensuite les HRActivities
    await migrateHRActivities();
    
    // Enfin les TaskMembers
    await migrateTaskMembers();
    
    // Vérification finale
    console.log("\n📊 Vérification des comptages:");
    const taskCount = await prisma.task.count();
    const activityCount = await prisma.hRActivity.count();
    const memberCount = await prisma.taskMember.count();
    
    console.log(`   - Tasks: ${taskCount}`);
    console.log(`   - HRActivities: ${activityCount}`);
    console.log(`   - TaskMembers: ${memberCount}`);
    
    console.log("\n✅ Migration terminée avec succès!");
    
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
