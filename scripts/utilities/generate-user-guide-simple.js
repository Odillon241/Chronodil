const jsPDF = require('jspdf').jsPDF;

// Configuration des couleurs Chronodil
const colors = {
  primary: [136, 13, 30],      // OU Crimson
  secondary: [221, 45, 74],    // Rusty Red
  accent: [242, 106, 141],     // Bright Pink
  light: [244, 156, 187],      // Amaranth Pink
  lightBlue: [203, 238, 243],  // Light Cyan
  text: [31, 41, 55],          // Gray-800
  textLight: [107, 114, 128],  // Gray-500
  bg: [249, 250, 251],         // Gray-50
  white: [255, 255, 255]
};

class UserGuide {
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
    this.doc.setTextColor(...colors.textLight);
    this.doc.text('Chronodil - Guide Utilisateur', this.margin, footerY);
    this.doc.text(`Page ${this.pageNumber}`, this.pageWidth - this.margin - 10, footerY);
  }

  // Page de couverture
  addCover() {
    // Fond
    this.doc.setFillColor(...colors.primary);
    this.doc.rect(0, 0, this.pageWidth, 100, 'F');

    // Titre
    this.doc.setTextColor(...colors.white);
    this.doc.setFontSize(40);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CHRONODIL', this.pageWidth / 2, 45, { align: 'center' });

    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Guide Utilisateur', this.pageWidth / 2, 60, { align: 'center' });

    this.doc.setFontSize(12);
    this.doc.text('Application de Gestion du Temps et des Projets', this.pageWidth / 2, 70, { align: 'center' });

    // Info box
    this.doc.setFillColor(...colors.bg);
    this.doc.roundedRect(this.margin, 120, this.pageWidth - 2 * this.margin, 50, 3, 3, 'F');

    this.doc.setTextColor(...colors.text);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('\u00C0 propos de ce guide', this.margin + 5, 130);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);

    const intro = [
      'Ce guide vous accompagne dans l\'utilisation de Chronodil, votre outil de gestion',
      'du temps, des tâches et des projets. Vous y trouverez des instructions d\u00E9taill\u00E9es,',
      'des exemples concrets et des bonnes pratiques pour chaque fonctionnalit\u00E9.'
    ];

    let y = 138;
    intro.forEach(line => {
      this.doc.text(line, this.margin + 5, y);
      y += 5;
    });

    // Version
    this.doc.setFontSize(10);
    this.doc.setTextColor(...colors.textLight);
    this.doc.text('Version du guide : 1.0.0', this.pageWidth / 2, 200, { align: 'center' });
    this.doc.text('Derni\u00E8re mise \u00E0 jour : Novembre 2025', this.pageWidth / 2, 206, { align: 'center' });
    this.doc.text('Application : Chronodil v0.1.0 (Next.js 16)', this.pageWidth / 2, 212, { align: 'center' });

    // Footer
    this.doc.setFontSize(9);
    this.doc.setTextColor(...colors.primary);
    this.doc.text('\uD83D\uDE80 G\u00E9rez vos temps efficacement', this.pageWidth / 2, this.pageHeight - 20, { align: 'center' });

    this.addPage();
  }

  // Section title
  addSection(title) {
    this.checkPageBreak(20);

    this.doc.setFillColor(...colors.primary);
    this.doc.rect(this.margin - 5, this.yPos - 5, 3, 10, 'F');

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.primary);
    this.doc.text(title, this.margin + 5, this.yPos);

    this.yPos += 3;
    this.doc.setDrawColor(...colors.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPos, this.pageWidth - this.margin, this.yPos);

    this.yPos += 8;
  }

  // Subtitle
  addSubtitle(subtitle) {
    this.checkPageBreak(15);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.secondary);
    this.doc.text(subtitle, this.margin, this.yPos);
    this.yPos += 8;
  }

  // Paragraph
  addText(text, options = {}) {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      lineHeight = 5
    } = options;

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(...colors.text);

    const maxWidth = this.pageWidth - 2 * this.margin;
    const lines = this.doc.splitTextToSize(text, maxWidth);

    lines.forEach(line => {
      this.checkPageBreak();
      this.doc.text(line, this.margin, this.yPos);
      this.yPos += lineHeight;
    });

    this.yPos += 2;
  }

  // Bullet point
  addBullet(text) {
    this.checkPageBreak();
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...colors.text);

    this.doc.text('\u2022', this.margin + 5, this.yPos);

    const maxWidth = this.pageWidth - 2 * this.margin - 10;
    const lines = this.doc.splitTextToSize(text, maxWidth);

    lines.forEach(line => {
      this.doc.text(line, this.margin + 10, this.yPos);
      this.yPos += 5;
    });
  }

  // Info box
  addInfoBox(title, content, icon = '\uD83D\uDCA1') {
    this.checkPageBreak(30);

    const boxWidth = this.pageWidth - 2 * this.margin;
    const maxWidth = boxWidth - 10;
    const lines = this.doc.splitTextToSize(content, maxWidth);
    const boxHeight = 14 + (lines.length * 4.5) + 5;

    this.doc.setFillColor(...colors.lightBlue);
    this.doc.roundedRect(this.margin, this.yPos, boxWidth, boxHeight, 3, 3, 'F');

    this.yPos += 7;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.text);
    this.doc.text(`${icon} ${title}`, this.margin + 5, this.yPos);

    this.yPos += 7;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    lines.forEach(line => {
      this.doc.text(line, this.margin + 5, this.yPos);
      this.yPos += 4.5;
    });

    this.yPos += 8;
  }

  // Warning box
  addWarning(title, content) {
    this.checkPageBreak(30);

    const boxWidth = this.pageWidth - 2 * this.margin;
    const maxWidth = boxWidth - 10;
    const lines = this.doc.splitTextToSize(content, maxWidth);
    const boxHeight = 14 + (lines.length * 4.5) + 5;

    this.doc.setFillColor(254, 243, 199);
    this.doc.roundedRect(this.margin, this.yPos, boxWidth, boxHeight, 3, 3, 'F');

    this.yPos += 7;
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(217, 119, 6);
    this.doc.text(`\u26A0\uFE0F ${title}`, this.margin + 5, this.yPos);

    this.yPos += 7;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(120, 53, 15);

    lines.forEach(line => {
      this.doc.text(line, this.margin + 5, this.yPos);
      this.yPos += 4.5;
    });

    this.yPos += 8;
  }

  // Simple table
  addSimpleTable(headers, rows) {
    this.checkPageBreak(30);

    const cellHeight = 8;
    const tableWidth = this.pageWidth - 2 * this.margin;
    const cellWidth = tableWidth / headers.length;

    // Header
    this.doc.setFillColor(...colors.primary);
    this.doc.rect(this.margin, this.yPos, tableWidth, cellHeight, 'F');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.white);

    headers.forEach((header, i) => {
      const x = this.margin + (i * cellWidth) + 2;
      this.doc.text(header, x, this.yPos + 6);
    });

    this.yPos += cellHeight;

    // Rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...colors.text);
    this.doc.setFontSize(9);

    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(cellHeight);

      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(...colors.bg);
        this.doc.rect(this.margin, this.yPos, tableWidth, cellHeight, 'F');
      }

      row.forEach((cell, i) => {
        const x = this.margin + (i * cellWidth) + 2;
        this.doc.text(cell.toString().substring(0, 30), x, this.yPos + 6);
      });

      this.yPos += cellHeight;
    });

    // Border
    this.doc.setDrawColor(...colors.textLight);
    this.doc.rect(this.margin, this.yPos - (rows.length * cellHeight) - cellHeight, tableWidth, (rows.length + 1) * cellHeight);

    this.yPos += 5;
  }

  // Generate content
  generate() {
    this.addCover();

    // 1. Introduction
    this.addSection('1. Introduction et premiers pas');
    this.addText(
      'Bienvenue dans Chronodil ! Cette application moderne vous permet de g\u00E9rer efficacement votre temps, ' +
      'vos t\u00E2ches et vos projets au sein de votre organisation. Que vous soyez employ\u00E9, manager ou administrateur, ' +
      'Chronodil s\'adapte \u00E0 votre r\u00F4le et vos besoins.'
    );

    this.yPos += 3;
    this.addSubtitle('\uD83D\uDD10 Connexion \u00E0 l\'application');

    this.addBullet('Ouvrez votre navigateur web et acc\u00E9dez \u00E0 l\'URL de Chronodil');
    this.addBullet('Saisissez votre adresse email professionnelle');
    this.addBullet('Entrez votre mot de passe');
    this.addBullet('Cliquez sur le bouton "Se connecter"');

    this.yPos += 3;
    this.addInfoBox(
      'Comptes par d\u00E9faut',
      'Apr\u00E8s installation : Admin (admin@chronodil.com / Admin2025!), ' +
      'Manager (manager@chronodil.com / Manager2025!), ' +
      'Employ\u00E9 (employe@chronodil.com / Employee2025!)'
    );

    this.yPos += 3;
    this.addSubtitle('\uD83D\uDDA5\uFE0F Interface principale');
    this.addText(
      'Une fois connect\u00E9, vous acc\u00E9dez au Dashboard qui affiche une vue d\'ensemble de vos activit\u00E9s. ' +
      'La barre lat\u00E9rale gauche contient la navigation principale avec toutes les sections de l\'application.'
    );

    this.yPos += 3;
    this.addSimpleTable(
      ['Ic\u00F4ne', 'Section', 'Description'],
      [
        ['\uD83C\uDFE0', 'Dashboard', 'Vue d\'ensemble et statistiques'],
        ['\u2705', 'T\u00E2ches', 'Gestion de vos t\u00E2ches quotidiennes'],
        ['\uD83D\uDCC1', 'Projets', 'Vos projets et leurs \u00E9quipes'],
        ['\uD83D\uDCCB', 'Feuilles RH', 'Activit\u00E9s RH hebdomadaires'],
        ['\uD83D\uDCCA', 'Rapports', 'Analyses et exports de donn\u00E9es'],
        ['\uD83D\uDCAC', 'Chat', 'Messagerie d\'\u00E9quipe']
      ]
    );

    // 2. Rôles
    this.addSection('2. R\u00F4les et permissions');
    this.addText(
      'Chronodil utilise un syst\u00E8me de 5 r\u00F4les avec des permissions sp\u00E9cifiques. ' +
      'Chaque r\u00F4le h\u00E9rite des permissions des r\u00F4les inf\u00E9rieurs et ajoute des fonctionnalit\u00E9s suppl\u00E9mentaires.'
    );

    this.yPos += 5;
    this.addSubtitle('\uD83D\uDFE2 EMPLOYEE (Employ\u00E9)');
    this.addText('Acc\u00E8s de base pour g\u00E9rer son travail quotidien.', { fontStyle: 'italic', fontSize: 9 });
    this.addBullet('Cr\u00E9er et g\u00E9rer ses propres t\u00E2ches');
    this.addBullet('Voir les projets auxquels il est affect\u00E9');
    this.addBullet('Cr\u00E9er et soumettre ses feuilles de temps RH');
    this.addBullet('Communiquer via le chat');

    this.yPos += 5;
    this.addSubtitle('\uD83D\uDD35 MANAGER (Responsable)');
    this.addText('Gestion d\'\u00E9quipe et validation des temps.', { fontStyle: 'italic', fontSize: 9 });
    this.addBullet('Toutes les permissions de l\'employ\u00E9');
    this.addBullet('Valider les feuilles de temps RH (premi\u00E8re approbation)');
    this.addBullet('Cr\u00E9er et g\u00E9rer des projets');
    this.addBullet('Affecter des membres aux projets');

    this.yPos += 5;
    this.addSubtitle('\uD83D\uDFE3 HR (Ressources Humaines)');
    this.addText('Gestion RH globale et validation finale.', { fontStyle: 'italic', fontSize: 9 });
    this.addBullet('Toutes les permissions du Manager');
    this.addBullet('Validation finale des feuilles de temps (signature Odillon)');
    this.addBullet('Gestion des utilisateurs et d\u00E9partements');
    this.addBullet('Acc\u00E8s aux logs d\'audit complets');

    this.yPos += 5;
    this.addSubtitle('\uD83D\uDD34 ADMIN (Administrateur)');
    this.addText('Contr\u00F4le total de l\'application.', { fontStyle: 'italic', fontSize: 9 });
    this.addBullet('Toutes les permissions du syst\u00E8me');
    this.addBullet('Gestion des param\u00E8tres de l\'application');
    this.addBullet('Gestion compl\u00E8te des utilisateurs et r\u00F4les');

    // 4. Tâches
    this.addSection('4. Gestion des t\u00E2ches');
    this.addText(
      'Le module T\u00E2ches est le c\u0153ur de votre gestion quotidienne. Il offre 5 modes de visualisation ' +
      'adapt\u00E9s \u00E0 diff\u00E9rents styles de travail et besoins.'
    );

    this.yPos += 5;
    this.addSubtitle('\uD83D\uDCCA Les 5 vues disponibles');
    this.addSimpleTable(
      ['Vue', 'Utilisation'],
      [
        ['Liste \uD83D\uDCDD', 'Vue d\u00E9taill\u00E9e avec tri et filtres avanc\u00E9s'],
        ['Kanban \uD83D\uDCCA', 'Colonnes par statut (TODO, IN_PROGRESS, DONE)'],
        ['Calendrier \uD83D\uDCC5', 'Organisation par dates d\'\u00E9ch\u00E9ance'],
        ['Gantt \uD83D\uDDD3\uFE0F', 'Planification avec timeline et d\u00E9pendances'],
        ['Roadmap \uD83D\uDDFA\uFE0F', 'Vue strat\u00E9gique long terme']
      ]
    );

    this.yPos += 5;
    this.addSubtitle('\u2795 Cr\u00E9er une t\u00E2che');
    this.addBullet('Cliquez sur le bouton "+" en haut \u00E0 droite de la page');
    this.addBullet('Remplissez le nom de la t\u00E2che (obligatoire)');
    this.addBullet('Ajoutez une description d\u00E9taill\u00E9e (recommand\u00E9)');
    this.addBullet('S\u00E9lectionnez un projet ou laissez "Aucun projet"');
    this.addBullet('D\u00E9finissez le statut : TODO (\u00C0 faire), IN_PROGRESS (En cours), DONE (Termin\u00E9)');
    this.addBullet('Choisissez la priorit\u00E9 : LOW (Basse), MEDIUM (Moyenne), HIGH (Haute)');
    this.addBullet('D\u00E9finissez la complexit\u00E9 : FAIBLE, MOYEN, \u00C9LEV\u00C9');

    this.yPos += 3;
    this.addInfoBox(
      'Synchronisation bidirectionnelle',
      'Si vous cr\u00E9ez une activit\u00E9 RH en mode "Saisie manuelle", Chronodil cr\u00E9e automatiquement ' +
      'une t\u00E2che correspondante. Les modifications sont synchronis\u00E9es dans les deux sens pour ' +
      'assurer la coh\u00E9rence des donn\u00E9es.'
    );

    this.yPos += 3;
    this.addWarning(
      'Suppression d\u00E9finitive',
      'La suppression d\'une t\u00E2che est d\u00E9finitive et ne peut pas \u00EAtre annul\u00E9e. ' +
      'Assurez-vous de vouloir vraiment supprimer la t\u00E2che avant de confirmer.'
    );

    // 6. Feuilles de temps RH
    this.addSection('6. Feuilles de temps RH');
    this.addText(
      'Les feuilles de temps RH permettent de suivre vos activit\u00E9s hebdomadaires professionnelles. ' +
      'Elles suivent un workflow de validation structur\u00E9 pour garantir la conformit\u00E9.'
    );

    this.yPos += 5;
    this.addSubtitle('\uD83D\uDD04 Workflow de validation');
    this.addText('Une feuille de temps passe par 4 \u00E9tapes de validation :');

    this.addBullet('DRAFT (Brouillon) : Feuille en cours de r\u00E9daction');
    this.addBullet('PENDING (Soumis) : En attente de validation manager');
    this.addBullet('MANAGER_APPROVED : Valid\u00E9e par le manager');
    this.addBullet('APPROVED (Final) : Validation RH finale effectu\u00E9e');

    this.yPos += 5;
    this.addSubtitle('\u2795 Cr\u00E9er une feuille de temps');
    this.addBullet('Cliquez sur "Nouvelle feuille de temps"');
    this.addBullet('S\u00E9lectionnez la semaine de r\u00E9f\u00E9rence');
    this.addBullet('Remplissez les informations d\'en-t\u00EAte (poste, site)');
    this.addBullet('Ajoutez vos activit\u00E9s (t\u00E2che existante ou saisie manuelle)');
    this.addBullet('Pour chaque activit\u00E9 : d\u00E9finir les dates, heures, p\u00E9riodicit\u00E9');
    this.addBullet('V\u00E9rifiez le total des heures');
    this.addBullet('Cliquez sur "Soumettre pour validation"');

    this.yPos += 3;
    this.addInfoBox(
      'Deux m\u00E9thodes de saisie',
      'M\u00E9thode 1 - T\u00E2che existante : S\u00E9lectionnez une t\u00E2che, les infos sont pr\u00E9-remplies. ' +
      'M\u00E9thode 2 - Saisie manuelle : Remplissez manuellement, une t\u00E2che sera cr\u00E9\u00E9e automatiquement ' +
      'pour maintenir la synchronisation.'
    );

    // FAQ
    this.addSection('12. FAQ et support');
    this.addSubtitle('\u2753 Questions fr\u00E9quentes');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...colors.primary);
    this.doc.text('Q : Pourquoi je ne vois pas le s\u00E9lecteur de t\u00E2che ?', this.margin, this.yPos);
    this.yPos += 6;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...colors.text);
    this.addText(
      'R : Le s\u00E9lecteur n\'appara\u00EEt que si vous avez des t\u00E2ches actives (TODO ou IN_PROGRESS) dont vous \u00EAtes ' +
      'cr\u00E9ateur ou membre. Cr\u00E9ez d\'abord une t\u00E2che, puis cr\u00E9ez votre feuille de temps.',
      { fontSize: 9 }
    );

    this.yPos += 3;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...colors.primary);
    this.doc.text('Q : Ma feuille est bloqu\u00E9e au statut PENDING ?', this.margin, this.yPos);
    this.yPos += 6;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...colors.text);
    this.addText(
      'R : Une fois soumise (PENDING), vous ne pouvez plus modifier la feuille. Elle est en attente de validation. ' +
      'Pour modifier, annulez d\'abord la soumission, puis \u00E9ditez et resoumettez.',
      { fontSize: 9 }
    );

    this.yPos += 5;
    this.addInfoBox(
      'Besoin d\'aide ?',
      '1. Consultez ce guide PDF. ' +
      '2. V\u00E9rifiez les logs dans la console du navigateur (F12). ' +
      '3. Contactez votre manager pour les questions de processus. ' +
      '4. Contactez l\'administrateur pour les probl\u00E8mes techniques. ' +
      '5. Email support : contact@chronodil.com'
    );

    // Conclusion
    this.addSection('Conclusion');
    this.addText(
      'Chronodil est un outil puissant con\u00E7u pour simplifier la gestion de votre temps et de vos projets. ' +
      'N\'h\u00E9sitez pas \u00E0 explorer toutes les fonctionnalit\u00E9s et \u00E0 personnaliser l\'application selon vos besoins.'
    );

    this.yPos += 10;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.primary);
    this.doc.text('\uD83D\uDE80 G\u00E9rez vos temps efficacement avec Chronodil !', this.pageWidth / 2, this.yPos, { align: 'center' });

    // Save
    this.doc.save('Chronodil_Guide_Utilisateur.pdf');
    console.log('\u2705 PDF g\u00E9n\u00E9r\u00E9 avec succ\u00E8s : Chronodil_Guide_Utilisateur.pdf');
  }
}

// Execute
const guide = new UserGuide();
guide.generate();
