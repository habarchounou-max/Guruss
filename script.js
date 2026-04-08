/**
 * Guruss Kitti Pro - Application de gestion financière
 * Version avec Abonnements et Dépenses Journalières
 */

// Configuration
const APP_NAME = 'Guruss Kitti';

// Formatter monétaire
const formatMoney = (value) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0
    }).format(Math.round(value)).replace('FCFA', 'F');
};

// Échappement HTML
const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// Haptique
const haptic = {
    light: () => navigator.vibrate?.(10),
    success: () => navigator.vibrate?.([10, 30, 20]),
    error: () => navigator.vibrate?.([30, 50, 30])
};

// Stockage
let db = {
    current: {
        mandat: 0,
        fees: 0,
        depenses: [],
        marche: [],
        dettes: [],
        abonnements: [], // NOUVEAU
        journalieres: [] // NOUVEAU
    },
    archives: [],
    dark: false,
    pin: '1234'
};

let pinBuffer = '';
let currentArchiveForPDF = null;

// ==================== INITIALISATION ====================
function loadDatabase() {
    try {
        const saved = localStorage.getItem('guruss_kitti_pro');
        if (saved) {
            const parsed = JSON.parse(saved);
            db = { ...db, ...parsed };
            // Vérification et initialisation des tableaux si manquants (pour la compatibilité)
            ['depenses', 'marche', 'dettes', 'abonnements', 'journalieres'].forEach(key => {
                if (!db.current[key]) db.current[key] = [];
            });
            if (!db.archives) db.archives = [];
        }
    } catch (e) {
        console.error('Erreur chargement DB:', e);
    }
}

function saveDatabase() {
    try {
        localStorage.setItem('guruss_kitti_pro', JSON.stringify(db));
    } catch (e) {
        console.error('Erreur sauvegarde DB:', e);
    }
}

// ==================== CALCULS ====================
function getTotals() {
    const sum = (arr) => (arr || []).reduce((acc, item) => acc + (item.amount || 0), 0);
    
    const net = db.current.mandat - db.current.fees;
    const depenses = sum(db.current.depenses);
    const marche = sum(db.current.marche);
    const dettes = sum(db.current.dettes);
    const journalieres = sum(db.current.journalieres);
    
    // Calcul des abonnements actifs uniquement
    const today = new Date().toISOString().split('T')[0];
    const abonnementsActifs = (db.current.abonnements || []).reduce((acc, abo) => {
        if (today >= abo.dateDebut && today <= abo.dateFin) {
            return acc + (parseFloat(abo.amount) || 0);
        }
        return acc;
    }, 0);

    const totalOut = depenses + marche + journalieres + abonnementsActifs;
    const solde = net - totalOut;
    
    return { net, depenses, marche, dettes, journalieres, abonnementsActifs, totalOut, solde };
}

function getDailyBudget() {
    const { solde } = getTotals();
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, lastDay - today.getDate() + 1);
    return { daysLeft, daily: solde / daysLeft };
}

// ==================== INTERFACE UTILISATEUR ====================
function updateUI() {
    const { net, totalOut, dettes, solde } = getTotals();
    const { daysLeft, daily } = getDailyBudget();
    
    document.getElementById('hero-balance').innerText = formatMoney(solde);
    document.getElementById('net-val').innerText = formatMoney(net);
    document.getElementById('exp-total-val').innerText = formatMoney(totalOut);
    document.getElementById('days-left-val').innerText = `${daysLeft}j`;
    document.getElementById('daily-val').innerText = formatMoney(Math.max(0, daily));
    document.getElementById('debt-total-preview').innerText = formatMoney(dettes);
    document.getElementById('debt-count-label').innerText = `${db.current.dettes.length} ardoise(s)`;
    
    renderAbonnementList();
    renderJournaliereList();
    renderExpenseList();
    renderMarcheList();
    renderDebtList();
    renderArchiveList();
    
    saveDatabase();
}

function renderAbonnementList() {
    const container = document.getElementById('abonnement-list');
    const items = db.current.abonnements || [];
    const today = new Date().toISOString().split('T')[0];
    
    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-check"></i><br>Aucun contrat enregistré</div>`;
        return;
    }
    
    container.innerHTML = [...items].reverse().map(abo => {
        const isActive = today >= abo.dateDebut && today <= abo.dateFin;
        const statusColor = isActive ? '#3B82F6' : 'var(--text-muted)';
        const statusText = isActive ? 'En cours (déduit)' : (today > abo.dateFin ? 'Terminé' : 'À venir');
        
        return `
        <div class="list-item">
            <div class="item-icon cat-abonnement" style="color: ${statusColor}">
                <i class="fas fa-sync"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(abo.nom)}</div>
                <div class="item-sub">${statusText} • Du ${abo.dateDebut} au ${abo.dateFin}</div>
            </div>
            <div class="item-amount" style="color: ${isActive ? 'var(--danger)' : 'var(--text-muted)'}">
                ${isActive ? '-' : ''}${formatMoney(abo.amount)}
            </div>
            <button class="item-del" onclick="deleteAbonnement(${abo.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `}).join('');
}

function renderJournaliereList() {
    const container = document.getElementById('journaliere-list');
    const items = db.current.journalieres || [];
    
    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-coffee"></i><br>Aucune dépense journalière</div>`;
        return;
    }
    
    container.innerHTML = [...items].reverse().map(jour => `
        <div class="list-item">
            <div class="item-icon cat-journaliere">
                <i class="fas fa-wallet"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(jour.motif)}</div>
                <div class="item-sub">${jour.date}</div>
            </div>
            <div class="item-amount" style="color: var(--danger)">-${formatMoney(jour.amount)}</div>
            <button class="item-del" onclick="deleteJournaliere(${jour.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function renderExpenseList() {
    const container = document.getElementById('expense-list');
    const items = db.current.depenses;
    
    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-bowl-food"></i><br>Aucune dépense mensuelle</div>`;
        return;
    }
    
    container.innerHTML = [...items].reverse().map(exp => `
        <div class="list-item">
            <div class="item-icon cat-depense">
                <i class="fas fa-receipt"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(exp.desc)}</div>
                <div class="item-sub">${escapeHtml(exp.cat)} • ${exp.date || ''}</div>
            </div>
            <div class="item-amount" style="color: var(--danger)">-${formatMoney(exp.amount)}</div>
            <button class="item-del" onclick="deleteExpense(${exp.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function renderMarcheList() {
    const container = document.getElementById('marche-list');
    const items = db.current.marche;
    
    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-leaf"></i><br>Aucun achat marché</div>`;
        return;
    }
    
    container.innerHTML = [...items].reverse().map(item => `
        <div class="list-item">
            <div class="item-icon cat-marche">
                <i class="fas fa-basket-shopping"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(item.produit)}</div>
                <div class="item-sub">Marché • ${item.date || ''}</div>
            </div>
            <div class="item-amount" style="color: var(--plum)">-${formatMoney(item.amount)}</div>
            <button class="item-del" onclick="deleteMarche(${item.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function renderDebtList() {
    const container = document.getElementById('debt-list');
    const items = db.current.dettes;
    
    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-hand-peace"></i><br>Aucune ardoise en cours</div>`;
        return;
    }
    
    container.innerHTML = [...items].reverse().map(debt => `
        <div class="list-item">
            <div class="item-icon cat-dette">
                <i class="fas fa-hand-holding-dollar"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(debt.label)}</div>
                <div class="item-sub">À régler</div>
            </div>
            <div class="item-amount" style="color: var(--warning)">${formatMoney(debt.amount)}</div>
            <button class="item-del" onclick="settleDebt(${debt.id})" title="Régler cette dette">
                <i class="fas fa-circle-check"></i>
            </button>
        </div>
    `).join('');
}

function renderArchiveList() {
    const container = document.getElementById('archive-list');
    const archives = db.archives;
    
    if (!archives.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-archive"></i><br>Aucune archive</div>`;
        return;
    }
    
    container.innerHTML = [...archives].reverse().map(arch => `
        <div class="list-item" onclick="viewArchiveDetails(${arch.id})" style="cursor: pointer;">
            <div class="item-icon cat-marche">
                <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="item-info">
                <div class="item-title">${escapeHtml(arch.month)}</div>
                <div class="item-sub">Net: ${formatMoney(arch.net)}</div>
            </div>
            <div class="item-amount" style="color: ${arch.solde >= 0 ? 'var(--success)' : 'var(--danger)'}">
                ${formatMoney(arch.solde)}
            </div>
            <i class="fas fa-chevron-right" style="margin-left: 8px; color: var(--text-muted);"></i>
        </div>
    `).join('');
}

// ==================== ACTIONS / DELETE ====================
function deleteAbonnement(id) {
    db.current.abonnements = db.current.abonnements.filter(a => a.id !== id);
    updateUI();
    showToast('Abonnement supprimé');
}

function deleteJournaliere(id) {
    db.current.journalieres = db.current.journalieres.filter(j => j.id !== id);
    updateUI();
    showToast('Dépense journalière supprimée');
}

function deleteExpense(id) {
    db.current.depenses = db.current.depenses.filter(e => e.id !== id);
    updateUI();
    showToast('Dépense supprimée');
}

function deleteMarche(id) {
    db.current.marche = db.current.marche.filter(m => m.id !== id);
    updateUI();
    showToast('Article supprimé');
}

function settleDebt(id) {
    const debt = db.current.dettes.find(d => d.id === id);
    if (!debt) return;
    
    if (confirm(`Régler l'ardoise de ${formatMoney(debt.amount)} à ${debt.label} ?\nVotre solde va diminuer.`)) {
        haptic.success();
        db.current.mandat -= debt.amount;
        db.current.dettes = db.current.dettes.filter(d => d.id !== id);
        updateUI();
        showToast(`✓ Dette réglée — -${formatMoney(debt.amount)}`);
    }
}

// ==================== ACTIONS / SAVE ====================
function saveMandat() {
    const amount = parseFloat(document.getElementById('m-amount').value) || 0;
    const fees = parseFloat(document.getElementById('m-fees').value) || 0;
    
    if (amount <= 0) {
        showToast('Montant valide requis', true);
        return;
    }
    
    haptic.success();
    db.current.mandat = amount;
    db.current.fees = fees;
    closeSheets();
    updateUI();
    showToast('✓ Mandat mis à jour');
}

function saveAbonnement() {
    const nom = document.getElementById('abo-nom').value.trim();
    const amount = parseFloat(document.getElementById('abo-montant').value) || 0;
    const debut = document.getElementById('abo-debut').value;
    const fin = document.getElementById('abo-fin').value;

    if (!nom || amount <= 0 || !debut || !fin) {
        showToast('Veuillez remplir tous les champs', true);
        return;
    }

    if (debut > fin) {
        showToast('La date de fin doit être après le début', true);
        return;
    }

    haptic.success();
    if (!db.current.abonnements) db.current.abonnements = [];

    db.current.abonnements.push({
        id: Date.now(),
        nom: nom,
        amount: amount,
        dateDebut: debut,
        dateFin: fin
    });

    closeSheets();
    updateUI();
    showToast('✓ Abonnement enregistré');
}

function saveJournaliere() {
    const motif = document.getElementById('jour-motif').value.trim();
    const amount = parseFloat(document.getElementById('jour-montant').value) || 0;

    if (!motif || amount <= 0) {
        showToast('Motif et montant valides requis', true);
        return;
    }

    haptic.success();
    if (!db.current.journalieres) db.current.journalieres = [];

    db.current.journalieres.push({
        id: Date.now(),
        motif: motif,
        amount: amount,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    });

    closeSheets();
    updateUI();
    showToast('✓ Dépense journalière ajoutée');
}

function saveExpense() {
    const cat = document.getElementById('exp-cat').value;
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    
    if (!desc || amount <= 0) {
        showToast('Remplissez tous les champs', true);
        return;
    }
    
    haptic.success();
    db.current.depenses.push({
        id: Date.now(),
        cat: cat,
        desc: desc,
        amount: amount,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    });
    closeSheets();
    updateUI();
    showToast('✓ Dépense mensuelle ajoutée');
}

function saveMarche() {
    const produit = document.getElementById('marche-produit').value.trim();
    const amount = parseFloat(document.getElementById('marche-prix').value) || 0;
    
    if (!produit || amount <= 0) {
        showToast('Produit et prix valides requis', true);
        return;
    }
    
    haptic.success();
    db.current.marche.push({
        id: Date.now(),
        produit: produit,
        amount: amount,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    });
    closeSheets();
    updateUI();
    showToast(`✓ ${produit} ajouté`);
}

function saveDette() {
    const label = document.getElementById('d-label').value.trim();
    const amount = parseFloat(document.getElementById('d-amount').value) || 0;
    
    if (!label || amount <= 0) {
        showToast('Créditeur et montant requis', true);
        return;
    }
    
    haptic.success();
    db.current.dettes.push({
        id: Date.now(),
        label: label,
        amount: amount
    });
    closeSheets();
    updateUI();
    showToast(`📝 Ardoise notée`);
}

function cloturerMandat() {
    const { net, totalOut, solde } = getTotals();
    
    if (net === 0 && totalOut === 0 && db.current.dettes.length === 0) {
        showToast('Rien à archiver ce mois-ci', true);
        return;
    }
    
    if (!confirm('Clôturer ce mois ? Les données seront archivées et remises à zéro.')) return;
    
    haptic.success();
    const mois = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = mois.charAt(0).toUpperCase() + mois.slice(1);
    
    db.archives.push({
        id: Date.now(),
        month: capitalizedMonth,
        net: net,
        solde: solde,
        depenses: [...db.current.depenses],
        dettes: [...db.current.dettes],
        marche: [...db.current.marche],
        abonnements: [...(db.current.abonnements || [])],
        journalieres: [...(db.current.journalieres || [])]
    });
    
    db.current = {
        mandat: 0,
        fees: 0,
        depenses: [],
        marche: [],
        dettes: [],
        abonnements: [],
        journalieres: []
    };
    
    updateUI();
    showToast('✓ Mois archivé avec succès');
    
    // Basculer vers l'onglet archives
    switchTab('archive');
}

// ==================== EXPORT PDF ====================
function generatePDFContent(archive, isFullArchive = false) {
    const date = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    if (isFullArchive) {
        let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${APP_NAME} - Archives complètes</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1F2937; }
                    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #7C3AED; }
                    .header h1 { color: #7C3AED; font-size: 28px; margin-bottom: 8px; }
                    .report-date { text-align: right; margin-bottom: 30px; color: #6B7280; font-size: 12px; }
                    .archive-section { margin-bottom: 50px; page-break-after: avoid; }
                    .archive-title { background: #F3F4F6; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; }
                    .archive-title h2 { color: #7C3AED; font-size: 20px; margin: 0; }
                    .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
                    .summary-card { flex: 1; background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #E5E7EB; }
                    .summary-card .label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
                    .summary-card .value { font-size: 24px; font-weight: 700; color: #7C3AED; margin-top: 8px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
                    th { background: #F3F4F6; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #E5E7EB; }
                    td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; }
                    .amount { text-align: right; }
                    .footer { margin-top: 50px; padding-top: 20px; text-align: center; border-top: 1px solid #E5E7EB; color: #9CA3AF; font-size: 11px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 ${APP_NAME}</h1>
                    <p>Rapport complet des archives mensuelles</p>
                </div>
                <div class="report-date">Généré le ${date}</div>
        `;
        
        archive.forEach(a => {
            html += `
                <div class="archive-section">
                    <div class="archive-title"><h2>📅 ${escapeHtml(a.month)}</h2></div>
                    <div class="summary-cards">
                        <div class="summary-card"><div class="label">Mandat net</div><div class="value">${formatMoney(a.net)}</div></div>
                        <div class="summary-card"><div class="label">Solde final</div><div class="value" style="color: ${a.solde >= 0 ? '#10B981' : '#EF4444'}">${formatMoney(a.solde)}</div></div>
                    </div>
                    
                    <h3>🔄 Abonnements</h3>
                    <table><thead><tr><th>Contrat</th><th>Période</th><th class="amount">Montant</th></tr></thead><tbody>
                        ${a.abonnements?.length ? a.abonnements.map(ab => `<tr><td>${escapeHtml(ab.nom)}</td><td>${ab.dateDebut} / ${ab.dateFin}</td><td class="amount">${formatMoney(ab.amount)}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center">Aucun abonnement</td></tr>'}
                    </tbody></table>

                    <h3>☕ Dépenses journalières</h3>
                    <table><thead><tr><th>Motif</th><th>Date</th><th class="amount">Montant</th></tr></thead><tbody>
                        ${a.journalieres?.length ? a.journalieres.map(j => `<tr><td>${escapeHtml(j.motif)}</td><td>${j.date}</td><td class="amount">${formatMoney(j.amount)}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center">Aucune dépense journalière</td></tr>'}
                    </tbody></table>

                    <h3>🛒 Dépenses mensuelles</h3>
                    <table><thead><tr><th>Description</th><th>Catégorie</th><th class="amount">Montant</th></tr></thead><tbody>
                        ${a.depenses?.length ? a.depenses.map(d => `<tr><td>${escapeHtml(d.desc)}</td><td>${escapeHtml(d.cat)}</td><td class="amount">${formatMoney(d.amount)}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center">Aucune dépense mensuelle</td></tr>'}
                    </tbody></table>
                    
                    <h3>🥬 Marché</h3>
                    <table><thead><tr><th>Produit</th><th class="amount">Montant</th></tr></thead><tbody>
                        ${a.marche?.length ? a.marche.map(m => `<tr><td>${escapeHtml(m.produit)}</td><td class="amount">${formatMoney(m.amount)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center">Aucun achat</td></tr>'}
                    </tbody></table>
                    
                    <h3>📝 Dettes</h3>
                    <table><thead><tr><th>Créancier</th><th class="amount">Montant</th></tr></thead><tbody>
                        ${a.dettes?.length ? a.dettes.map(d => `<tr><td>${escapeHtml(d.label)}</td><td class="amount">${formatMoney(d.amount)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center">Aucune dette</td></tr>'}
                    </tbody></table>
                </div>
                <div style="page-break-after: always;"></div>
            `;
        });
        
        html += `<div class="footer"><p>${APP_NAME} - Document généré automatiquement</p></div></body></html>`;
        return html;
    }
    
    // PDF pour une archive unique
    return `
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${APP_NAME} - ${archive.month}</title>
            <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1F2937; }
                .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #7C3AED; }
                .header h1 { color: #7C3AED; font-size: 28px; margin-bottom: 8px; }
                .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #F9FAFB; border-radius: 12px; }
                .meta-item { text-align: center; }
                .meta-label { font-size: 11px; color: #6B7280; text-transform: uppercase; }
                .meta-value { font-size: 20px; font-weight: 700; color: #7C3AED; margin-top: 5px; }
                .section-title { font-size: 16px; font-weight: 600; margin: 25px 0 10px; padding-bottom: 5px; border-bottom: 2px solid #E5E7EB; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
                th { background: #F3F4F6; padding: 10px; text-align: left; font-weight: 600; }
                td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; }
                .amount { text-align: right; }
                .footer { margin-top: 40px; padding-top: 20px; text-align: center; border-top: 1px solid #E5E7EB; color: #9CA3AF; font-size: 11px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📄 RAPPORT MENSUEL</h1>
                <p>${APP_NAME} - Gestion financière</p>
            </div>
            <div class="invoice-meta">
                <div class="meta-item"><div class="meta-label">Période</div><div class="meta-value">${escapeHtml(archive.month)}</div></div>
                <div class="meta-item"><div class="meta-label">Mandat net</div><div class="meta-value">${formatMoney(archive.net)}</div></div>
                <div class="meta-item"><div class="meta-label">Solde final</div><div class="meta-value" style="color: ${archive.solde >= 0 ? '#10B981' : '#EF4444'}">${formatMoney(archive.solde)}</div></div>
            </div>
            
            <div class="section-title">🔄 Abonnements et contrats</div>
            <table><thead><tr><th>Contrat</th><th>Période</th><th class="amount">Montant</th></tr></thead><tbody>
                ${archive.abonnements?.length ? archive.abonnements.map(ab => `<tr><td>${escapeHtml(ab.nom)}</td><td>${ab.dateDebut} / ${ab.dateFin}</td><td class="amount">${formatMoney(ab.amount)}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center">Aucun abonnement</td></tr>'}
            </tbody></table>

            <div class="section-title">☕ Dépenses journalières</div>
            <table><thead><tr><th>Motif</th><th>Date</th><th class="amount">Montant</th></tr></thead><tbody>
                ${archive.journalieres?.length ? archive.journalieres.map(j => `<tr><td>${escapeHtml(j.motif)}</td><td>${j.date}</td><td class="amount">${formatMoney(j.amount)}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center">Aucune dépense journalière</td></tr>'}
            </tbody></table>

            <div class="section-title">📋 Dépenses mensuelles</div>
            <table><thead><tr><th>Description</th><th>Catégorie</th><th class="amount">Montant</th></tr></thead><tbody>
                ${archive.depenses?.length ? archive.depenses.map(d => `<tr><td>${escapeHtml(d.desc)}</td><td>${escapeHtml(d.cat)}</td><td class="amount">${formatMoney(d.amount)}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center">Aucune dépense mensuelle</td></tr>'}
            </tbody></table>
            
            <div class="section-title">🥬 Achats marché</div>
            <table><thead><tr><th>Produit</th><th class="amount">Montant</th></tr></thead><tbody>
                ${archive.marche?.length ? archive.marche.map(m => `<tr><td>${escapeHtml(m.produit)}</td><td class="amount">${formatMoney(m.amount)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center">Aucun achat</td></tr>'}
            </tbody></table>
            
            <div class="section-title">📝 Dettes enregistrées</div>
            <table><thead><tr><th>Créancier</th><th class="amount">Montant</th></tr></thead><tbody>
                ${archive.dettes?.length ? archive.dettes.map(d => `<tr><td>${escapeHtml(d.label)}</td><td class="amount">${formatMoney(d.amount)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center">Aucune dette</td></tr>'}
            </tbody></table>
            
            <div class="footer">
                <p>Document généré le ${new Date().toLocaleDateString('fr-FR')}</p>
                <p>${APP_NAME} - Gestion financière intelligente</p>
            </div>
        </body>
        </html>
    `;
}

async function exportSingleArchivePDF(archive) {
    if (!archive) return;
    const element = document.createElement('div');
    element.innerHTML = generatePDFContent(archive);
    const opt = {
        margin: 0.5,
        filename: `archive_${archive.month}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
    showToast(`Export PDF: ${archive.month}`);
}

async function exportAllArchivesPDF() {
    if (!db.archives.length) {
        showToast('Aucune archive à exporter', true);
        return;
    }
    const element = document.createElement('div');
    element.innerHTML = generatePDFContent(db.archives, true);
    const opt = {
        margin: 0.5,
        filename: `archives_completes.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
    showToast('Export de toutes les archives...');
}

// ==================== ARCHIVE DETAILS ====================
function viewArchiveDetails(id) {
    const archive = db.archives.find(a => a.id === id);
    if (!archive) return;
    
    currentArchiveForPDF = archive;
    document.getElementById('arch-det-title').innerHTML = `<i class="fas fa-calendar-alt"></i> ${escapeHtml(archive.month)}`;
    
    const renderList = (items, icon, iconClass, nameProp, subProp = null) => {
        if (!items || !items.length) return '<div class="empty-state" style="padding: 20px"><i class="fas fa-inbox"></i><br>Aucun élément</div>';
        return items.map(item => `
            <div class="list-item" style="padding: 12px 0;">
                <div class="item-icon ${iconClass}"><i class="${icon}"></i></div>
                <div class="item-info">
                    <div class="item-title">${escapeHtml(item[nameProp])}</div>
                    ${subProp && item[subProp] ? `<div class="item-sub">${escapeHtml(item[subProp])}</div>` : ''}
                </div>
                <div class="item-amount">${formatMoney(item.amount)}</div>
            </div>
        `).join('');
    };
    
    document.getElementById('arch-det-content').innerHTML = `
        <div class="summary-cards">
            <div class="stat-card"><div class="stat-label">Mandat net</div><div class="stat-value">${formatMoney(archive.net)}</div></div>
            <div class="stat-card"><div class="stat-label">Solde final</div><div class="stat-value" style="color: ${archive.solde >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatMoney(archive.solde)}</div></div>
        </div>
        
        <h4 style="margin: 20px 0 12px; font-weight: 700;"><i class="fas fa-sync"></i> Abonnements</h4>
        ${renderList(archive.abonnements, 'fas fa-sync', 'cat-abonnement', 'nom', 'dateFin')}
        
        <h4 style="margin: 20px 0 12px; font-weight: 700;"><i class="fas fa-wallet"></i> Dépenses Journalières</h4>
        ${renderList(archive.journalieres, 'fas fa-coffee', 'cat-journaliere', 'motif', 'date')}

        <h4 style="margin: 20px 0 12px; font-weight: 700;"><i class="fas fa-utensils"></i> Dépenses mensuelles</h4>
        ${renderList(archive.depenses, 'fas fa-receipt', 'cat-depense', 'desc', 'cat')}
        
        <h4 style="margin: 20px 0 12px; font-weight: 700;"><i class="fas fa-shopping-basket"></i> Marché</h4>
        ${renderList(archive.marche, 'fas fa-leaf', 'cat-marche', 'produit')}
        
        <h4 style="margin: 20px 0 12px; font-weight: 700;"><i class="fas fa-hand-holding-usd"></i> Dettes</h4>
        ${renderList(archive.dettes, 'fas fa-file-invoice', 'cat-dette', 'label')}
    `;
    
    openSheet('sheet-archive-details');
}

// ==================== IMPORT/EXPORT DATABASE ====================
function exportDatabase() {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guruss_kitti_backup_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Base de données exportée');
}

function importDatabase(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.current && imported.archives !== undefined && imported.pin !== undefined) {
                db = imported;
                saveDatabase();
                updateUI();
                showToast('Base de données importée avec succès');
                closeSheets();
            } else {
                throw new Error('Format invalide');
            }
        } catch (err) {
            showToast('Fichier invalide', true);
        }
    };
    reader.readAsText(file);
}

// ==================== PIN & THEME ====================
function checkPin() {
    if (pinBuffer === db.pin) {
        haptic.success();
        document.getElementById('pin-screen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('pin-screen').style.display = 'none';
            document.getElementById('app').classList.add('visible');
            loadDatabase();
            updateUI();
        }, 500);
    } else {
        haptic.error();
        pinBuffer = '';
        for (let i = 0; i < 4; i++) {
            document.getElementById(`d${i}`).classList.remove('filled');
        }
        const err = document.getElementById('pin-error');
        err.classList.add('show');
        setTimeout(() => err.classList.remove('show'), 2000);
    }
}

function updatePin() {
    const oldPin = document.getElementById('pin-old').value;
    const newPin = document.getElementById('pin-new').value;
    
    if (oldPin !== db.pin) {
        showToast('Ancien code incorrect', true);
        return;
    }
    if (!/^\d{4}$/.test(newPin)) {
        showToast('Le code doit contenir 4 chiffres', true);
        return;
    }
    
    haptic.success();
    db.pin = newPin;
    saveDatabase();
    closeSheets();
    showToast('✓ Code PIN modifié');
}

function toggleDarkMode() {
    db.dark = !db.dark;
    document.body.classList.toggle('dark', db.dark);
    document.getElementById('theme-icon').className = db.dark ? 'fas fa-sun' : 'fas fa-moon';
    saveDatabase();
}

// ==================== UI UTILITIES ====================
function openSheet(id) {
    haptic.light();
    document.getElementById(id).classList.add('show');
    setTimeout(() => {
        const input = document.querySelector(`#${id} input`);
        if (input) input.focus();
    }, 100);
}

function closeSheets() {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.remove('show');
        overlay.querySelectorAll('input, select').forEach(input => input.value = '');
    });
}

let toastTimeout;
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const msgSpan = document.getElementById('toast-msg');
    
    if (isError) {
        toast.style.background = 'var(--danger)';
        haptic.error();
    } else {
        toast.style.background = 'var(--text-main)';
        haptic.success();
    }
    
    msgSpan.innerText = msg;
    toast.classList.add('show');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.style.background = '', 300);
    }, 2500);
}

function switchTab(tabId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${tabId}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
}

// ==================== INITIALISATION ====================
function initPinPad() {
    document.querySelectorAll('.pin-key[data-num]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (pinBuffer.length >= 4) return;
            haptic.light();
            pinBuffer += btn.getAttribute('data-num');
            for (let i = 0; i < 4; i++) {
                document.getElementById(`d${i}`).classList.toggle('filled', i < pinBuffer.length);
            }
            if (pinBuffer.length === 4) checkPin();
        });
    });
    
    document.querySelector('.pin-key.del').addEventListener('click', () => {
        if (pinBuffer.length === 0) return;
        haptic.light();
        pinBuffer = pinBuffer.slice(0, -1);
        for (let i = 0; i < 4; i++) {
            document.getElementById(`d${i}`).classList.toggle('filled', i < pinBuffer.length);
        }
    });
}

function initEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Boutons d'action
    document.getElementById('mandat-btn').addEventListener('click', () => openSheet('sheet-mandat'));
    document.getElementById('cloture-btn').addEventListener('click', cloturerMandat);
    document.getElementById('export-all-pdf').addEventListener('click', exportAllArchivesPDF);
    document.getElementById('export-db-btn').addEventListener('click', exportDatabase);
    document.getElementById('change-pin-btn').addEventListener('click', () => openSheet('sheet-pin'));
    document.getElementById('import-db-btn').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);
    document.getElementById('export-single-pdf').addEventListener('click', () => {
        if (currentArchiveForPDF) exportSingleArchivePDF(currentArchiveForPDF);
    });
    
    // Modales
    document.querySelectorAll('[data-sheet]').forEach(btn => {
        btn.addEventListener('click', () => openSheet(`sheet-${btn.dataset.sheet}`));
    });
    document.querySelectorAll('.close-sheet').forEach(btn => {
        btn.addEventListener('click', closeSheets);
    });
    
    // Formulaires
    document.getElementById('save-mandat').addEventListener('click', saveMandat);
    document.getElementById('save-abonnement').addEventListener('click', saveAbonnement); // NOUVEAU
    document.getElementById('save-journaliere').addEventListener('click', saveJournaliere); // NOUVEAU
    document.getElementById('save-expense').addEventListener('click', saveExpense);
    document.getElementById('save-marche').addEventListener('click', saveMarche);
    document.getElementById('save-dette').addEventListener('click', saveDette);
    document.getElementById('update-pin').addEventListener('click', updatePin);
    
    // Import fichier
    document.getElementById('import-file').addEventListener('change', (e) => {
        if (e.target.files.length) importDatabase(e.target.files[0]);
        e.target.value = '';
    });
    
    // Fermeture overlay
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeSheets();
        });
    });
}

// Exporter les fonctions globales pour les événements 'onclick' dans le HTML généré
window.deleteAbonnement = deleteAbonnement;
window.deleteJournaliere = deleteJournaliere;
window.deleteExpense = deleteExpense;
window.deleteMarche = deleteMarche;
window.settleDebt = settleDebt;
window.viewArchiveDetails = viewArchiveDetails;
window.closeSheets = closeSheets;
window.openSheet = openSheet;

// Démarrage
loadDatabase();
initPinPad();
initEventListeners();
