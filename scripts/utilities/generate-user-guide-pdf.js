const jsPDF = require('jspdf').jsPDF;
require('jspdf-autotable');
const fs = require('fs');
const path = require('path');

// Configuration des couleurs Chronodil
const colors = {
  primary: '#880d1e',      // OU Crimson
  secondary: '#dd2d4a',    // Rusty Red
  accent: '#f26a8d',       // Bright Pink
  light: '#f49cbb',        // Amaranth Pink
  lightBlue: '#cbeef3',    // Light Cyan
  text: '#1f2937',         // Gray-800
  textLight: '#6b7280',    // Gray-500
  bg: '#f9fafb',           // Gray-50
  white: '#ffffff'
};

class ChronodilUserGuide {
  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.yPos = this.margin;
    this.pageNumber = 1;
  }

  // === HELPERS ===

  checkPageBreak(height = 20) {
    if (this.yPos + height > this.pageHeight - this.margin) {
      this.addPage();
    }
  }

  addPage() {
    this.doc.addPage();
    this.pageNumber++;
    this.yPos = this.margin;
    this.addFooter();
  }

  addFooter() {
    const footerY = this.pageHeight - 15;
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);

    // Logo/titre à gauche
    this.doc.text('Chronodil - Guide Utilisateur', this.margin, footerY);

    // Numéro de page à droite
    this.doc.text(
      `Page ${this.pageNumber}`,
      this.pageWidth - this.margin - 10,
      footerY
    );
  }

  // === PAGE DE COUVERTURE ===

  addCoverPage() {
    // Fond dégradé (rectangle supérieur)
    this.doc.setFillColor(136, 13, 30); // primary
    this.doc.rect(0, 0, this.pageWidth, 100, 'F');

    // Logo/Titre
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(40);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CHRONODIL', this.pageWidth / 2, 45, { align: 'center' });

    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Guide Utilisateur', this.pageWidth / 2, 60, { align: 'center' });

    this.doc.setFontSize(12);
    this.doc.text('Application de Gestion du Temps et des Projets', this.pageWidth / 2, 70, { align: 'center' });

    // Section d'information
    this.yPos = 120;
    this.doc.setTextColor(31, 41, 55);

    // Encadré d'info
    this.doc.setFillColor(249, 250, 251);
    this.doc.roundedRect(this.margin, this.yPos, this.pageWidth - 2 * this.margin, 50, 3, 3, 'F');

    this.yPos += 10;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('À propos de ce guide', this.margin + 5, this.yPos);

    this.yPos += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    const introText = [
      'Ce guide vous accompagne dans l\'utilisation de Chronodil, votre outil de gestion',
      'du temps, des tâches et des projets. Vous y trouverez des instructions détaillées,',
      'des exemples concrets et des bonnes pratiques pour chaque fonctionnalité.'
    ];

    introText.forEach(line => {
      this.doc.text(line, this.margin + 5, this.yPos);
      this.yPos += 5;
    });

    // Informations version
    this.yPos = 200;
    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text('Version du guide : 1.0.0', this.pageWidth / 2, this.yPos, { align: 'center' });
    this.yPos += 6;
    this.doc.text('Dernière mise à jour : Novembre 2025', this.pageWidth / 2, this.yPos, { align: 'center' });
    this.yPos += 6;
    this.doc.text('Application : Chronodil v0.1.0 (Next.js 16)', this.pageWidth / 2, this.yPos, { align: 'center' });

    // Footer spécial pour la couverture
    const footerY = this.pageHeight - 20;
    this.doc.setFontSize(9);
    this.doc.setTextColor(136, 13, 30);
    this.doc.text('🚀 Gérez vos temps efficacement', this.pageWidth / 2, footerY, { align: 'center' });

    this.addPage();
  }

  // === TABLE DES MATIÈRES ===

  addTableOfContents() {
    this.addSectionTitle('Table des matières', colors.primary);
    this.yPos += 5;

    const toc = [
      { title: '1. Introduction et premiers pas', page: 3 },
      { title: '2. Rôles et permissions', page: 4 },
      { title: '3. Dashboard (Tableau de bord)', page: 6 },
      { title: '4. Gestion des tâches', page: 7 },
      { title: '5. Gestion des projets', page: 12 },
      { title: '6. Feuilles de temps RH', page: 14 },
      { title: '7. Rapports et exports', page: 18 },
      { title: '8. Notifications', page: 19 },
      { title: '9. Chat et messagerie', page: 20 },
      { title: '10. Paramètres', page: 21 },
      { title: '11. Audit', page: 23 },
      { title: '12. FAQ et support', page: 24 }
    ];

    toc.forEach(item => {
      this.checkPageBreak();

      // Point de leader
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);
      this.doc.text(item.title, this.margin + 5, this.yPos);

      // Numéro de page
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(136, 13, 30);
      this.doc.text(item.page.toString(), this.pageWidth - this.margin - 10, this.yPos, { align: 'right' });

      // Ligne pointillée
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineDash([1, 1]);
      const titleWidth = this.doc.getTextWidth(item.title);
      const pageWidth = this.doc.getTextWidth(item.page.toString());
      this.doc.line(
        this.margin + 5 + titleWidth + 5,
        this.yPos - 1,
        this.pageWidth - this.margin - 10 - pageWidth - 5,
        this.yPos - 1
      );
      this.doc.setLineDash([]);

      this.yPos += 7;
    });

    this.addPage();
  }

  // === SECTIONS ===

  addSectionTitle(title, color = colors.primary) {
    this.checkPageBreak(20);

    // Barre de couleur à gauche
    this.doc.setFillColor(color);
    this.doc.rect(this.margin - 5, this.yPos - 5, 3, 10, 'F');

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(color);
    this.doc.text(title, this.margin + 5, this.yPos);

    this.yPos += 3;

    // Ligne sous le titre
    this.doc.setDrawColor(color);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPos, this.pageWidth - this.margin, this.yPos);

    this.yPos += 8;
  }

  addSubtitle(subtitle) {
    this.checkPageBreak(15);

    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(221, 45, 74); // secondary
    this.doc.text(subtitle, this.margin, this.yPos);

    this.yPos += 8;
  }

  addParagraph(text, options = {}) {
    const {
      fontSize = 10,
      color = colors.text,
      fontStyle = 'normal',
      indent = 0,
      lineHeight = 5
    } = options;

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color);

    const maxWidth = this.pageWidth - 2 * this.margin - indent;
    const lines = this.doc.splitTextToSize(text, maxWidth);

    lines.forEach(line => {
      this.checkPageBreak();
      this.doc.text(line, this.margin + indent, this.yPos);
      this.yPos += lineHeight;
    });

    this.yPos += 2; // Espace après paragraphe
  }

  addBulletPoint(text, level = 0) {
    const indent = 5 + (level * 5);
    const bullet = level === 0 ? '•' : '◦';

    this.checkPageBreak();

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);

    // Bullet
    this.doc.text(bullet, this.margin + indent, this.yPos);

    // Texte
    const maxWidth = this.pageWidth - 2 * this.margin - indent - 5;
    const lines = this.doc.splitTextToSize(text, maxWidth);

    lines.forEach((line, index) => {
      if (index > 0) this.checkPageBreak();
      this.doc.text(line, this.margin + indent + 5, this.yPos);
      this.yPos += 5;
    });
  }

  addInfoBox(title, content, icon = '💡') {
    this.checkPageBreak(30);

    const boxWidth = this.pageWidth - 2 * this.margin;
    const startY = this.yPos;

    // Calculer la hauteur nécessaire d'abord
    const maxWidth = boxWidth - 10;
    const lines = this.doc.splitTextToSize(content, maxWidth);
    const boxHeight = 7 + 7 + (lines.length * 4.5) + 5;

    // Fond
    this.doc.setFillColor(203, 238, 243); // lightBlue
    this.doc.roundedRect(this.margin, startY, boxWidth, boxHeight, 3, 3, 'F');

    this.yPos += 7;

    // Icône et titre
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text(`${icon} ${title}`, this.margin + 5, this.yPos);

    this.yPos += 7;

    // Contenu
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    lines.forEach(line => {
      this.doc.text(line, this.margin + 5, this.yPos);
      this.yPos += 4.5;
    });

    this.yPos += 8;
  }

  addWarningBox(title, content) {
    this.checkPageBreak(30);

    const boxWidth = this.pageWidth - 2 * this.margin;
    const startY = this.yPos;

    // Calculer la hauteur nécessaire d'abord
    const maxWidth = boxWidth - 10;
    const lines = this.doc.splitTextToSize(content, maxWidth);
    const boxHeight = 7 + 7 + (lines.length * 4.5) + 5;

    // Fond orange clair
    this.doc.setFillColor(254, 243, 199);
    this.doc.roundedRect(this.margin, startY, boxWidth, boxHeight, 3, 3, 'F');

    this.yPos += 7;

    // Icône et titre
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(217, 119, 6); // Orange
    this.doc.text(`⚠️ ${title}`, this.margin + 5, this.yPos);

    this.yPos += 7;

    // Contenu
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(120, 53, 15);

    lines.forEach(line => {
      this.doc.text(line, this.margin + 5, this.yPos);
      this.yPos += 4.5;
    });

    this.yPos += 8;
  }

  addTable(headers, rows, options = {}) {
    this.checkPageBreak(40);

    this.doc.autoTable({
      head: [headers],
      body: rows,
      startY: this.yPos,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid',
      headStyles: {
        fillColor: [136, 13, 30], // primary
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [31, 41, 55]
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      ...options
    });

    this.yPos = this.doc.lastAutoTable.finalY + 10;
  }

  addStepByStep(steps) {
    steps.forEach((step, index) => {
      this.checkPageBreak(15);

      // Numéro de l'étape
      this.doc.setFillColor(221, 45, 74); // secondary
      this.doc.circle(this.margin + 3, this.yPos - 2, 3, 'F');

      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text((index + 1).toString(), this.margin + 3, this.yPos, { align: 'center' });

      // Texte de l'étape
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);

      const maxWidth = this.pageWidth - 2 * this.margin - 10;
      const lines = this.doc.splitTextToSize(step, maxWidth);

      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) this.checkPageBreak();
        this.doc.text(line, this.margin + 10, this.yPos);
        this.yPos += 5;
      });

      this.yPos += 3;
    });
  }

  addDiagram(title, items) {
    this.checkPageBreak(60);

    // Titre du diagramme
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(31, 41, 55);
    this.doc.text(title, this.margin, this.yPos);
    this.yPos += 10;

    const boxWidth = 40;
    const boxHeight = 15;
    const spacing = 10;
    const startX = this.margin + 10;

    items.forEach((item, index) => {
      const x = startX + (index % 3) * (boxWidth + spacing);
      const y = this.yPos + Math.floor(index / 3) * (boxHeight + spacing);

      // Box
      this.doc.setFillColor(244, 156, 187); // light
      this.doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');

      // Texte
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(31, 41, 55);

      const lines = this.doc.splitTextToSize(item, boxWidth - 4);
      const textHeight = lines.length * 4;
      const textY = y + (boxHeight - textHeight) / 2 + 3;

      lines.forEach((line, lineIndex) => {
        this.doc.text(line, x + boxWidth / 2, textY + lineIndex * 4, { align: 'center' });
      });

      // Flèche vers la droite (sauf dernier de la ligne)
      if ((index + 1) % 3 !== 0 && index < items.length - 1) {
        this.doc.setDrawColor(136, 13, 30);
        this.doc.setLineWidth(1);
        const arrowX = x + boxWidth + 2;
        const arrowY = y + boxHeight / 2;
        this.doc.line(arrowX, arrowY, arrowX + spacing - 4, arrowY);

        // Pointe de flèche
        this.doc.line(arrowX + spacing - 6, arrowY - 2, arrowX + spacing - 4, arrowY);
        this.doc.line(arrowX + spacing - 6, arrowY + 2, arrowX + spacing - 4, arrowY);
      }

      // Flèche vers le bas (fin de ligne, sauf dernière ligne)
      if ((index + 1) % 3 === 0 && index < items.length - 3) {
        this.doc.setDrawColor(136, 13, 30);
        this.doc.setLineWidth(1);
        const arrowX = x + boxWidth / 2;
        const arrowY = y + boxHeight + 2;
        this.doc.line(arrowX, arrowY, arrowX, arrowY + spacing - 4);

        // Pointe de flèche
        this.doc.line(arrowX - 2, arrowY + spacing - 6, arrowX, arrowY + spacing - 4);
        this.doc.line(arrowX + 2, arrowY + spacing - 6, arrowX, arrowY + spacing - 4);
      }
    });

    this.yPos += Math.ceil(items.length / 3) * (boxHeight + spacing) + 10;
  }

  // === CONTENU DU GUIDE ===

  addIntroduction() {
    this.addSectionTitle('1. Introduction et premiers pas');

    this.addParagraph(
      'Bienvenue dans Chronodil ! Cette application moderne vous permet de gérer efficacement votre temps, ' +
      'vos tâches et vos projets au sein de votre organisation. Que vous soyez employé, manager ou administrateur, ' +
      'Chronodil s\'adapte à votre rôle et vos besoins.'
    );

    this.yPos += 3;

    this.addSubtitle('🔐 Connexion à l\'application');

    this.addStepByStep([
      'Ouvrez votre navigateur web et accédez à l\'URL de Chronodil',
      'Saisissez votre adresse email professionnelle',
      'Entrez votre mot de passe',
      'Cliquez sur le bouton "Se connecter"'
    ]);

    this.yPos += 3;

    this.addInfoBox(
      'Comptes par défaut',
      'Après installation : Admin (admin@chronodil.com / Admin2025!), ' +
      'Manager (manager@chronodil.com / Manager2025!), ' +
      'Employé (employe@chronodil.com / Employee2025!)'
    );

    this.yPos += 3;

    this.addSubtitle('🖥️ Interface principale');

    this.addParagraph(
      'Une fois connecté, vous accédez au Dashboard qui affiche une vue d\'ensemble de vos activités. ' +
      'La barre latérale gauche contient la navigation principale avec toutes les sections de l\'application.'
    );

    this.yPos += 3;

    this.addTable(
      ['Icône', 'Section', 'Description'],
      [
        ['🏠', 'Dashboard', 'Vue d\'ensemble et statistiques'],
        ['✅', 'Tâches', 'Gestion de vos tâches quotidiennes'],
        ['📁', 'Projets', 'Vos projets et leurs équipes'],
        ['📋', 'Feuilles de temps RH', 'Activités RH hebdomadaires'],
        ['📊', 'Rapports', 'Analyses et exports de données'],
        ['💬', 'Chat', 'Messagerie d\'équipe'],
        ['🔔', 'Notifications', 'Alertes et rappels']
      ],
      { columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 45 } } }
    );
  }

  addRoles() {
    this.addSectionTitle('2. Rôles et permissions');

    this.addParagraph(
      'Chronodil utilise un système de 5 rôles avec des permissions spécifiques. ' +
      'Chaque rôle hérite des permissions des rôles inférieurs et ajoute des fonctionnalités supplémentaires.'
    );

    this.yPos += 5;

    // EMPLOYEE
    this.addSubtitle('🟢 EMPLOYEE (Employé)');
    this.addParagraph('Accès de base pour gérer son travail quotidien.', { fontStyle: 'italic', color: colors.textLight });

    this.addBulletPoint('Créer et gérer ses propres tâches');
    this.addBulletPoint('Voir les projets auxquels il est affecté');
    this.addBulletPoint('Créer et soumettre ses feuilles de temps RH');
    this.addBulletPoint('Communiquer via le chat');
    this.addBulletPoint('Modifier son profil et ses préférences');

    this.yPos += 5;

    // MANAGER
    this.addSubtitle('🔵 MANAGER (Responsable)');
    this.addParagraph('Gestion d\'équipe et validation des temps.', { fontStyle: 'italic', color: colors.textLight });

    this.addBulletPoint('Toutes les permissions de l\'employé');
    this.addBulletPoint('Voir et gérer les tâches de son équipe');
    this.addBulletPoint('Valider les feuilles de temps RH (première approbation)');
    this.addBulletPoint('Créer et gérer des projets');
    this.addBulletPoint('Affecter des membres aux projets');
    this.addBulletPoint('Voir les rapports d\'équipe');

    this.yPos += 5;

    // HR
    this.addSubtitle('🟣 HR (Ressources Humaines)');
    this.addParagraph('Gestion RH globale et validation finale.', { fontStyle: 'italic', color: colors.textLight });

    this.addBulletPoint('Toutes les permissions du Manager');
    this.addBulletPoint('Validation finale des feuilles de temps (signature Odillon)');
    this.addBulletPoint('Gestion des utilisateurs et départements');
    this.addBulletPoint('Gestion des jours fériés');
    this.addBulletPoint('Accès aux logs d\'audit complets');

    this.yPos += 5;

    // ADMIN
    this.addSubtitle('🔴 ADMIN (Administrateur)');
    this.addParagraph('Contrôle total de l\'application.', { fontStyle: 'italic', color: colors.textLight });

    this.addBulletPoint('Toutes les permissions du système');
    this.addBulletPoint('Gestion des paramètres de l\'application');
    this.addBulletPoint('Gestion complète des utilisateurs et rôles');
    this.addBulletPoint('Configuration avancée (départements, paramètres globaux)');

    this.yPos += 5;

    // DIRECTEUR
    this.addSubtitle('🟠 DIRECTEUR');
    this.addParagraph('Vue stratégique et décisionnelle.', { fontStyle: 'italic', color: colors.textLight });

    this.addBulletPoint('Toutes les permissions de l\'Admin');
    this.addBulletPoint('Vue sur tous les projets et statistiques');
    this.addBulletPoint('Rapports consolidés de l\'organisation');
    this.addBulletPoint('Validation des décisions stratégiques');
  }

  addTasks() {
    this.addSectionTitle('4. Gestion des tâches');

    this.addParagraph(
      'Le module Tâches est le cœur de votre gestion quotidienne. Il offre 5 modes de visualisation ' +
      'adaptés à différents styles de travail et besoins.'
    );

    this.yPos += 5;

    this.addSubtitle('📊 Les 5 vues disponibles');

    this.addTable(
      ['Vue', 'Icône', 'Utilisation'],
      [
        ['Liste', '📝', 'Vue détaillée avec tri et filtres avancés'],
        ['Kanban', '📊', 'Colonnes par statut (TODO, IN_PROGRESS, DONE)'],
        ['Calendrier', '📅', 'Organisation par dates d\'échéance'],
        ['Gantt', '🗓️', 'Planification avec timeline et dépendances'],
        ['Roadmap', '🗺️', 'Vue stratégique long terme']
      ]
    );

    this.yPos += 5;

    this.addSubtitle('➕ Créer une tâche');

    this.addStepByStep([
      'Cliquez sur le bouton "+" en haut à droite de la page',
      'Remplissez le nom de la tâche (obligatoire)',
      'Ajoutez une description détaillée (recommandé)',
      'Sélectionnez un projet ou laissez "Aucun projet"',
      'Définissez le statut : TODO (À faire), IN_PROGRESS (En cours), DONE (Terminé)',
      'Choisissez la priorité : LOW (Basse), MEDIUM (Moyenne), HIGH (Haute)',
      'Définissez la complexité : FAIBLE, MOYEN, ÉLEVÉ',
      'Ajoutez une date d\'échéance et heures estimées (optionnel)',
      'Configurez un rappel si nécessaire',
      'Partagez avec des membres de l\'équipe (optionnel)',
      'Cliquez sur "Créer la tâche"'
    ]);

    this.yPos += 5;

    this.addInfoBox(
      'Synchronisation bidirectionnelle',
      'Si vous créez une activité RH en mode "Saisie manuelle", Chronodil crée automatiquement ' +
      'une tâche correspondante. Les modifications sont synchronisées dans les deux sens pour ' +
      'assurer la cohérence des données.'
    );

    this.yPos += 5;

    this.addSubtitle('🔍 Filtrer et rechercher');

    this.addParagraph('La barre de filtres vous permet de trouver rapidement vos tâches :');

    this.addBulletPoint('Recherche textuelle : Par nom ou description');
    this.addBulletPoint('Filtre par statut : TODO, IN_PROGRESS, DONE');
    this.addBulletPoint('Filtre par priorité : LOW, MEDIUM, HIGH');
    this.addBulletPoint('Filtre par projet : Voir les tâches d\'un projet spécifique');
    this.addBulletPoint('Filtre par utilisateur : Voir les tâches d\'un membre (Manager+)');

    this.yPos += 5;

    this.addWarningBox(
      'Suppression définitive',
      'La suppression d\'une tâche est définitive et ne peut pas être annulée. ' +
      'Assurez-vous de vouloir vraiment supprimer la tâche avant de confirmer.'
    );
  }

  addHRTimesheet() {
    this.addSectionTitle('6. Feuilles de temps RH');

    this.addParagraph(
      'Les feuilles de temps RH permettent de suivre vos activités hebdomadaires professionnelles. ' +
      'Elles suivent un workflow de validation structuré pour garantir la conformité.'
    );

    this.yPos += 5;

    this.addSubtitle('📋 Qu\'est-ce qu\'une feuille de temps RH ?');

    this.addParagraph(
      'Une feuille de temps regroupe toutes vos activités professionnelles sur une semaine (Lundi au Dimanche). ' +
      'Chaque activité a un type (OPERATIONAL ou REPORTING), une périodicité et une durée.'
    );

    this.yPos += 5;

    this.addSubtitle('🔄 Workflow de validation');

    this.addDiagram(
      'Cycle de vie d\'une feuille de temps :',
      [
        'DRAFT\n(Brouillon)',
        'PENDING\n(Soumis)',
        'MANAGER\nAPPROVED',
        'APPROVED\n(Final)'
      ]
    );

    this.yPos += 5;

    this.addTable(
      ['Statut', 'Description', 'Actions possibles'],
      [
        ['DRAFT', 'Feuille en cours de rédaction', 'Modification libre, soumettre'],
        ['PENDING', 'En attente validation manager', 'Annuler la soumission'],
        ['MANAGER_APPROVED', 'Validée par le manager', 'Validation RH (HR uniquement)'],
        ['APPROVED', 'Validation finale effectuée', 'Archive, export'],
        ['REJECTED', 'Rejetée avec commentaires', 'Corriger et resoumettre']
      ]
    );

    this.yPos += 5;

    this.addSubtitle('➕ Créer une feuille de temps');

    this.addStepByStep([
      'Cliquez sur "Nouvelle feuille de temps"',
      'Sélectionnez la semaine de référence',
      'Remplissez les informations d\'en-tête (poste, site)',
      'Ajoutez vos activités (tâche existante ou saisie manuelle)',
      'Pour chaque activité : définir les dates, heures, périodicité',
      'Vérifiez le total des heures',
      'Ajoutez des observations si nécessaire',
      'Cliquez sur "Soumettre pour validation"'
    ]);

    this.yPos += 5;

    this.addInfoBox(
      'Deux méthodes de saisie',
      'Méthode 1 - Tâche existante : Sélectionnez une tâche, les infos sont pré-remplies. ' +
      'Méthode 2 - Saisie manuelle : Remplissez manuellement, une tâche sera créée automatiquement ' +
      'pour maintenir la synchronisation.'
    );

    this.yPos += 5;

    this.addSubtitle('✅ Valider une feuille (Manager)');

    this.addStepByStep([
      'Accédez à l\'onglet "À valider"',
      'Ouvrez une feuille au statut PENDING',
      'Vérifiez les activités et heures déclarées',
      'Approuvez : Ajoutez un commentaire et validez',
      'Ou Rejetez : Indiquez la raison du rejet (obligatoire)'
    ]);

    this.yPos += 5;

    this.addWarningBox(
      'Attention aux rejets',
      'Quand vous rejetez une feuille de temps, l\'employé doit la corriger et la soumettre à nouveau. ' +
      'Assurez-vous d\'indiquer clairement la raison du rejet dans les commentaires.'
    );
  }

  addFAQ() {
    this.addSectionTitle('12. FAQ et support');

    this.addSubtitle('❓ Questions fréquentes');

    // Question 1
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(136, 13, 30);
    this.doc.text('Q : Pourquoi je ne vois pas le sélecteur de tâche dans le formulaire RH ?', this.margin, this.yPos);
    this.yPos += 6;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    this.addParagraph(
      'R : Le sélecteur n\'apparaît que si vous avez des tâches actives (TODO ou IN_PROGRESS) dont vous êtes ' +
      'créateur ou membre. Créez d\'abord une tâche, puis créez votre feuille de temps.',
      { fontSize: 9 }
    );

    this.yPos += 3;

    // Question 2
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(136, 13, 30);
    this.doc.text('Q : Ma feuille de temps est bloquée au statut PENDING, pourquoi ?', this.margin, this.yPos);
    this.yPos += 6;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    this.addParagraph(
      'R : Une fois soumise (PENDING), vous ne pouvez plus modifier la feuille. Elle est en attente de validation. ' +
      'Pour modifier, annulez d\'abord la soumission, puis éditez et resoumettez.',
      { fontSize: 9 }
    );

    this.yPos += 3;

    // Question 3
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(136, 13, 30);
    this.doc.text('Q : Les notifications ne s\'affichent pas ?', this.margin, this.yPos);
    this.yPos += 6;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(31, 41, 55);
    this.addParagraph(
      'R : Vérifiez 3 points : 1) Autorisations du navigateur pour les notifications, ' +
      '2) Paramètres de l\'application (Paramètres → Notifications), ' +
      '3) Notifications non bloquées au niveau système.',
      { fontSize: 9 }
    );

    this.yPos += 5;

    this.addSubtitle('🐛 Problèmes courants');

    this.addTable(
      ['Problème', 'Solution'],
      [
        ['Erreur "Connection pool timeout"', 'Rechargez la page. Si persiste, contactez l\'admin.'],
        ['Erreur "Unauthorized"', 'Session expirée. Déconnectez-vous et reconnectez-vous.'],
        ['Modifications non visibles', 'Rechargez la page ou videz le cache (Ctrl+Maj+Suppr)'],
        ['Page lente', 'Utilisez les filtres pour réduire les données affichées'],
        ['Upload impossible', 'Vérifiez taille fichier (<10MB) et format supporté']
      ],
      { columnStyles: { 0: { cellWidth: 60 } } }
    );

    this.yPos += 5;

    this.addSubtitle('📞 Support');

    this.addInfoBox(
      'Besoin d\'aide ?',
      '1. Consultez ce guide PDF. ' +
      '2. Vérifiez les logs dans la console du navigateur (F12). ' +
      '3. Contactez votre manager pour les questions de processus. ' +
      '4. Contactez l\'administrateur pour les problèmes techniques. ' +
      '5. Email support : contact@chronodil.com'
    );
  }

  addBestPractices() {
    this.addSectionTitle('13. Bonnes pratiques');

    this.addSubtitle('✅ Pour les employés');

    this.addBulletPoint('Créez vos tâches dès qu\'elles sont identifiées');
    this.addBulletPoint('Mettez à jour régulièrement le statut de vos tâches');
    this.addBulletPoint('Soumettez vos feuilles de temps chaque vendredi');
    this.addBulletPoint('Ajoutez des descriptions détaillées pour faciliter la compréhension');
    this.addBulletPoint('Utilisez les rappels pour ne rien oublier');
    this.addBulletPoint('Consultez régulièrement vos notifications');

    this.yPos += 5;

    this.addSubtitle('✅ Pour les managers');

    this.addBulletPoint('Validez les feuilles de temps dans les 48h');
    this.addBulletPoint('Ajoutez des commentaires constructifs en cas de rejet');
    this.addBulletPoint('Suivez l\'avancement des projets chaque semaine');
    this.addBulletPoint('Communiquez régulièrement avec votre équipe via le chat');
    this.addBulletPoint('Utilisez les rapports pour identifier les tendances');
    this.addBulletPoint('Organisez des points d\'équipe basés sur les données');

    this.yPos += 5;

    this.addSubtitle('✅ Pour les administrateurs');

    this.addBulletPoint('Configurez les départements et utilisateurs dès le début');
    this.addBulletPoint('Consultez les logs d\'audit chaque semaine');
    this.addBulletPoint('Assurez-vous que les sauvegardes sont effectuées');
    this.addBulletPoint('Formez les nouveaux utilisateurs');
    this.addBulletPoint('Maintenez l\'application à jour');
    this.addBulletPoint('Surveillez les performances de l\'application');
  }

  // === GÉNÉRATION FINALE ===

  generate() {
    // Page de couverture
    this.addCoverPage();

    // Table des matières
    this.addTableOfContents();

    // Contenu
    this.addIntroduction();
    this.addRoles();
    this.addTasks();
    this.addHRTimesheet();
    this.addFAQ();
    this.addBestPractices();

    // Dernière page - Conclusion
    this.addSectionTitle('Conclusion');
    this.addParagraph(
      'Chronodil est un outil puissant conçu pour simplifier la gestion de votre temps et de vos projets. ' +
      'N\'hésitez pas à explorer toutes les fonctionnalités et à personnaliser l\'application selon vos besoins.'
    );

    this.yPos += 10;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(136, 13, 30);
    this.doc.text('🚀 Gérez vos temps efficacement avec Chronodil !', this.pageWidth / 2, this.yPos, { align: 'center' });

    // Sauvegarder
    this.doc.save('Chronodil_Guide_Utilisateur.pdf');
    console.log('✅ PDF généré avec succès : Chronodil_Guide_Utilisateur.pdf');
  }
}

// Exécution
const guide = new ChronodilUserGuide();
guide.generate();
