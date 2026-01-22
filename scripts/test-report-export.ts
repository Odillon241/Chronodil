/**
 * Script de test pour vérifier l'export des rapports
 * Usage: npx tsx scripts/test-report-export.ts
 */

import { exportToWord } from '../src/lib/export/word-export'
import { exportToExcel } from '../src/lib/export/excel-export'
import type { ReportData } from '../src/lib/export/types'
import * as fs from 'fs'
import * as path from 'path'

// Données de test simulant un rapport mensuel
const testReportData: ReportData = {
  title: 'Rapport Mensuel - Janvier 2026',
  period: '01/01/2026 - 31/01/2026',
  author: 'Jean Dupont',
  createdAt: new Date(),
  metadata: {
    reportType: 'MONTHLY',
    format: 'word',
    includeSummary: true,
  },
  content: `<h1>Rapport Mensuel</h1>
<h2>Jean Dupont — Développeur Senior</h2>

<h2>1. Résumé exécutif</h2>
<p>Ce rapport présente la synthèse des activités réalisées durant le mois de <strong>janvier 2026</strong>.</p>

<ul>
<li><strong>Total des heures travaillées :</strong> 156.5h</li>
<li><strong>Nombre de semaines :</strong> 4</li>
<li><strong>Moyenne hebdomadaire :</strong> 39.1h</li>
<li><strong>Nombre d'activités :</strong> 12</li>
<li><strong>Activités terminées :</strong> 10</li>
</ul>

<h2>2. Répartition par type d'activité</h2>
<p>Le tableau ci-dessous présente la répartition des heures par catégorie d'activité :</p>

<table>
<thead>
<tr>
<th>Type d'activité</th>
<th>Nombre</th>
<th>Heures totales</th>
</tr>
</thead>
<tbody>
<tr>
<td>Développement</td>
<td>5</td>
<td>85.0h</td>
</tr>
<tr>
<td>Réunions</td>
<td>3</td>
<td>24.5h</td>
</tr>
<tr>
<td>Documentation</td>
<td>2</td>
<td>28.0h</td>
</tr>
<tr>
<td>Support</td>
<td>2</td>
<td>19.0h</td>
</tr>
</tbody>
</table>

<h2>3. Détail des activités</h2>
<p>Liste exhaustive des 12 activités réalisées durant cette période :</p>

<table>
<thead>
<tr>
<th>Activité</th>
<th>Type</th>
<th>Périodicité</th>
<th>Heures</th>
<th>Statut</th>
</tr>
</thead>
<tbody>
<tr>
<td>Développement module authentification</td>
<td>Développement</td>
<td>Hebdomadaire</td>
<td>32.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Refactoring API REST</td>
<td>Développement</td>
<td>Hebdomadaire</td>
<td>24.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Correction bugs critiques</td>
<td>Développement</td>
<td>Quotidien</td>
<td>15.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Optimisation performances</td>
<td>Développement</td>
<td>Ponctuel</td>
<td>8.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Tests unitaires</td>
<td>Développement</td>
<td>Hebdomadaire</td>
<td>6.0h</td>
<td>En cours</td>
</tr>
<tr>
<td>Daily standup</td>
<td>Réunions</td>
<td>Quotidien</td>
<td>8.5h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Sprint planning</td>
<td>Réunions</td>
<td>Hebdomadaire</td>
<td>8.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Rétrospective</td>
<td>Réunions</td>
<td>Mensuel</td>
<td>8.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Documentation technique API</td>
<td>Documentation</td>
<td>Hebdomadaire</td>
<td>16.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Guide utilisateur</td>
<td>Documentation</td>
<td>Ponctuel</td>
<td>12.0h</td>
<td>En cours</td>
</tr>
<tr>
<td>Support équipe QA</td>
<td>Support</td>
<td>Hebdomadaire</td>
<td>12.0h</td>
<td>Terminée</td>
</tr>
<tr>
<td>Assistance déploiement</td>
<td>Support</td>
<td>Ponctuel</td>
<td>7.0h</td>
<td>Terminée</td>
</tr>
</tbody>
</table>

<hr/>

<h2>4. Observations</h2>
<p>Ce rapport a été généré automatiquement à partir des feuilles de temps hebdomadaires.
Les données présentées couvrent 4 semaines de travail.</p>

<p>Points notables du mois :</p>
<ul>
<li>Livraison du module d'authentification dans les délais</li>
<li>Amélioration des performances de 40% sur l'API</li>
<li>Documentation technique à jour</li>
</ul>`,
  activities: [
    {
      name: 'Développement module authentification',
      type: 'Développement',
      periodicity: 'Hebdomadaire',
      hours: 32,
      status: 'Terminée',
    },
    {
      name: 'Refactoring API REST',
      type: 'Développement',
      periodicity: 'Hebdomadaire',
      hours: 24,
      status: 'Terminée',
    },
    {
      name: 'Correction bugs critiques',
      type: 'Développement',
      periodicity: 'Quotidien',
      hours: 15,
      status: 'Terminée',
    },
    {
      name: 'Optimisation performances',
      type: 'Développement',
      periodicity: 'Ponctuel',
      hours: 8,
      status: 'Terminée',
    },
    {
      name: 'Tests unitaires',
      type: 'Développement',
      periodicity: 'Hebdomadaire',
      hours: 6,
      status: 'En cours',
    },
    {
      name: 'Daily standup',
      type: 'Réunions',
      periodicity: 'Quotidien',
      hours: 8.5,
      status: 'Terminée',
    },
    {
      name: 'Sprint planning',
      type: 'Réunions',
      periodicity: 'Hebdomadaire',
      hours: 8,
      status: 'Terminée',
    },
    {
      name: 'Rétrospective',
      type: 'Réunions',
      periodicity: 'Mensuel',
      hours: 8,
      status: 'Terminée',
    },
    {
      name: 'Documentation technique API',
      type: 'Documentation',
      periodicity: 'Hebdomadaire',
      hours: 16,
      status: 'Terminée',
    },
    {
      name: 'Guide utilisateur',
      type: 'Documentation',
      periodicity: 'Ponctuel',
      hours: 12,
      status: 'En cours',
    },
    {
      name: 'Support équipe QA',
      type: 'Support',
      periodicity: 'Hebdomadaire',
      hours: 12,
      status: 'Terminée',
    },
    {
      name: 'Assistance déploiement',
      type: 'Support',
      periodicity: 'Ponctuel',
      hours: 7,
      status: 'Terminée',
    },
  ],
}

async function main() {
  const outputDir = path.join(process.cwd(), 'test-exports')

  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('🚀 Génération des rapports de test...\n')

  try {
    // Export Word
    console.log('📄 Génération du fichier Word...')
    const wordBuffer = await exportToWord(testReportData)
    const wordPath = path.join(outputDir, 'Rapport_Test_Mensuel.docx')
    fs.writeFileSync(wordPath, wordBuffer)
    console.log(`   ✅ Word exporté: ${wordPath}`)

    // Export Excel
    console.log('📊 Génération du fichier Excel...')
    const excelBuffer = await exportToExcel(testReportData)
    const excelPath = path.join(outputDir, 'Rapport_Test_Mensuel.xlsx')
    fs.writeFileSync(excelPath, excelBuffer)
    console.log(`   ✅ Excel exporté: ${excelPath}`)

    console.log('\n✨ Tous les fichiers ont été générés avec succès!')
    console.log(`📁 Dossier de sortie: ${outputDir}`)
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error)
    process.exit(1)
  }
}

main()
