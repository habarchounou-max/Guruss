// Base de données
let db = JSON.parse(localStorage.getItem('guruss_kitti')) || {
    current: { mandat: 0, fees: 0, dettes: [], depenses: [], marche: [] },
    archives: [], dark: false, pin: '1234'
};
if(!db.current.marche) db.current.marche = [];
if(!db.current.depenses) db.current.depenses = [];
if(!db.current.dettes) db.current.dettes = [];

let pinBuffer = '';

// Formateur de montant
const fmt = v => new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' F';

// Gestion du PIN
function pinPress(n) { 
    if(pinBuffer.length >= 4) return; 
    pinBuffer += n; 
    for(let i = 0; i < 4; i++) 
        document.getElementById('d'+i).classList.toggle('filled', i < pinBuffer.length); 
    if(pinBuffer.length === 4) setTimeout(checkPin, 120); 
}

function pinDel() { 
    pinBuffer = pinBuffer.slice(0, -1); 
    for(let i = 0; i < 4; i++) 
        document.getElementById('d'+i).classList.toggle('filled', i < pinBuffer.length); 
}

function checkPin() { 
    if(pinBuffer === db.pin) { 
        document.getElementById('pin-screen').classList.add('fade-out'); 
        setTimeout(()=>{ 
            document.getElementById('pin-screen').style.display = 'none'; 
            document.getElementById('app').classList.add('visible'); 
            initApp(); 
        }, 400); 
    } else { 
        pinBuffer = ''; 
        for(let i = 0; i < 4; i++) 
            document.getElementById('d'+i).classList.remove('filled'); 
        const err = document.getElementById('pin-error'); 
        err.classList.add('show'); 
        setTimeout(()=>err.classList.remove('show'), 1800); 
    } 
}

// Initialisation
function initApp() { 
    if(db.dark) { 
        document.body.classList.add('dark'); 
        document.getElementById('theme-icon').className = 'fas fa-sun'; 
    } 
    updateUI(); 
}

// Calcul du solde (reste à vivre)
function getSolde() {
    const net = db.current.mandat - db.current.fees;
    const totalDep = db.current.depenses.reduce((s,e)=>s+e.amount, 0);
    const totalMarche = db.current.marche.reduce((s,m)=>s+m.amount, 0);
    return net - totalDep - totalMarche;
}

// Mise à jour de l'interface
function updateUI() {
    const net = db.current.mandat - db.current.fees;
    const totalDettes = db.current.dettes.reduce((s,d)=>s+d.amount, 0);
    const totalDep = db.current.depenses.reduce((s,e)=>s+e.amount, 0);
    const totalMarche = db.current.marche.reduce((s,m)=>s+m.amount, 0);
    const totalOut = totalDep + totalMarche;
    const solde = getSolde();

    document.getElementById('hero-balance').innerText = fmt(solde);
    document.getElementById('net-val').innerText = fmt(net);
    document.getElementById('exp-total-val').innerText = fmt(totalOut);
    document.getElementById('debt-total-preview').innerText = fmt(totalDettes);
    document.getElementById('debt-count-label').innerText = `${db.current.dettes.length} ardoise(s)`;

    const today = new Date(), lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    const daysLeft = Math.max(1, lastDay - today.getDate() + 1);
    document.getElementById('days-left-val').innerText = daysLeft+'j';
    document.getElementById('daily-val').innerText = fmt(Math.max(0, solde / daysLeft));

    renderLists();
    saveDB();
}

// Rendu des listes
function renderLists() {
    const depDiv = document.getElementById('expense-list');
    if(!db.current.depenses.length) 
        depDiv.innerHTML = '<div class="empty-state"><i class="fas fa-bowl-food"></i><br>Aucune dépense mensuelle</div>';
    else 
        depDiv.innerHTML = [...db.current.depenses].reverse().map(e => `
            <div class="list-item">
                <div class="item-icon cat-depense"><i class="fas fa-receipt"></i></div>
                <div class="item-info">
                    <div class="item-title">${escapeHtml(e.desc)}</div>
                    <div class="item-sub">${e.cat} • ${e.date}</div>
                </div>
                <div class="item-amount" style="color:var(--danger)">−${fmt(e.amount)}</div>
                <button class="item-del" onclick="deleteItem('depenses',${e.id})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('');

    const marcheDiv = document.getElementById('marche-list');
    if(!db.current.marche.length) 
        marcheDiv.innerHTML = '<div class="empty-state"><i class="fas fa-leaf"></i><br>Aucun achat marché</div>';
    else 
        marcheDiv.innerHTML = [...db.current.marche].reverse().map(m => `
            <div class="list-item">
                <div class="item-icon cat-marche"><i class="fas fa-basket-shopping"></i></div>
                <div class="item-info">
                    <div class="item-title">${escapeHtml(m.produit)}</div>
                    <div class="item-sub">Marché • ${m.date}</div>
                </div>
                <div class="item-amount" style="color:var(--plum)">−${fmt(m.amount)}</div>
                <button class="item-del" onclick="deleteItem('marche',${m.id})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('');

    const dl = document.getElementById('debt-list');
    if(!db.current.dettes.length) 
        dl.innerHTML = '<div class="empty-state"><i class="fas fa-hand-peace"></i><br>Aucune ardoise en cours</div>';
    else 
        dl.innerHTML = db.current.dettes.map(d => `
            <div class="list-item">
                <div class="item-icon cat-dette"><i class="fas fa-hand-holding-dollar"></i></div>
                <div class="item-info">
                    <div class="item-title">${escapeHtml(d.label)}</div>
                    <div class="item-sub">À régler</div>
                </div>
                <div class="item-amount" style="color:var(--warning)">${fmt(d.amount)}</div>
                <button class="item-del" onclick="reglerDette(${d.id})" title="Régler cette dette"><i class="fas fa-circle-check"></i></button>
            </div>
        `).join('');

    const al = document.getElementById('archive-list');
    if(!db.archives.length) 
        al.innerHTML = '<div class="empty-state"><i class="fas fa-archive"></i><br>Aucune archive</div>';
    else 
        al.innerHTML = [...db.archives].reverse().map(a => `
            <div class="list-item" onclick="viewArchiveDetails(${a.id})">
                <div class="item-icon cat-marche"><i class="fas fa-calendar-alt"></i></div>
                <div class="item-info">
                    <div class="item-title">${a.month}</div>
                    <div class="item-sub">Net: ${fmt(a.net)}</div>
                </div>
                <div class="item-amount" style="color:${a.solde>=0?'var(--success)':'var(--danger)'}">${fmt(a.solde)}</div>
                <i class="fas fa-chevron-right" style="margin-left:6px; color:var(--text-muted)"></i>
            </div>
        `).join('');
}

// Règlement d'une dette
function reglerDette(id) {
    const dette = db.current.dettes.find(d => d.id === id);
    if (!dette) return;
    if (!confirm(`Régler la dette de ${fmt(dette.amount)} à ${dette.label} ?\nCela va diminuer votre reste à vivre.`)) return;
    db.current.mandat -= dette.amount;
    db.current.dettes = db.current.dettes.filter(d => d.id !== id);
    updateUI();
    toast(`✓ Dette réglée — −${fmt(dette.amount)} sur votre solde`);
}

// Suppression d'un élément
function deleteItem(type, id) {
    if(type === 'depenses') db.current.depenses = db.current.depenses.filter(i=>i.id!==id);
    if(type === 'marche') db.current.marche = db.current.marche.filter(i=>i.id!==id);
    updateUI(); 
    toast('Supprimé');
}

// Sauvegarde du mandat
function saveMandat() {
    let amount = parseFloat(document.getElementById('m-amount').value);
    let fees = parseFloat(document.getElementById('m-fees').value)||0;
    if(!amount||amount<=0) return toast('Montant valide requis');
    db.current.mandat = amount; 
    db.current.fees = fees;
    closeSheets(); 
    updateUI(); 
    toast('✓ Mandat mis à jour');
}

// Sauvegarde d'une dépense
function saveDepense() {
    const cat = document.getElementById('exp-cat').value;
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value);
    if(!desc||!amount||amount<=0) return toast('Remplissez les champs');
    db.current.depenses.push({ 
        id: Date.now(), 
        cat, 
        desc, 
        amount, 
        date: new Date().toLocaleDateString('fr-FR') 
    });
    closeSheets(); 
    updateUI(); 
    toast('✓ Dépense ajoutée');
}

// Sauvegarde d'un achat marché
function saveMarche() {
    const produit = document.getElementById('marche-produit').value.trim();
    const amount = parseFloat(document.getElementById('marche-prix').value);
    if(!produit||!amount||amount<=0) return toast('Produit et prix valide');
    db.current.marche.push({ 
        id: Date.now(), 
        produit, 
        amount, 
        date: new Date().toLocaleDateString('fr-FR') 
    });
    closeSheets(); 
    updateUI(); 
    toast(`✓ ${produit} ajouté au marché`);
}

// Sauvegarde d'une dette
function saveDette() {
    const label = document.getElementById('d-label').value.trim();
    const amount = parseFloat(document.getElementById('d-amount').value);
    if(!label||!amount||amount<=0) return toast('Créditeur et montant requis');
    db.current.dettes.push({ id: Date.now(), label, amount });
    closeSheets(); 
    updateUI(); 
    toast(`📝 Ardoise notée — votre solde n'a pas changé`);
}

// Clôture du mois
function cloturerMandat() {
    if(db.current.mandat===0 && db.current.depenses.length===0 && db.current.marche.length===0 && db.current.dettes.length===0) 
        return toast('Rien à archiver');
    if(!confirm('Clôturer le mois ? Les données seront archivées.')) return;
    const net = db.current.mandat - db.current.fees;
    const solde = getSolde();
    const mois = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    db.archives.push({ 
        id: Date.now(), 
        month: mois.charAt(0).toUpperCase()+mois.slice(1), 
        net, 
        solde, 
        depenses: [...db.current.depenses], 
        dettes: [...db.current.dettes], 
        marche: [...db.current.marche] 
    });
    db.current = { mandat:0, fees:0, dettes:[], depenses:[], marche:[] };
    updateUI(); 
    toast('Mois archivé avec succès'); 
    switchTab('archive', document.querySelectorAll('.nav-item')[2]);
}

// Visualisation des détails d'archive
function viewArchiveDetails(id){
    const a = db.archives.find(a=>a.id===id);
    if(!a) return;
    document.getElementById('arch-det-title').innerText = a.month;
    document.getElementById('arch-det-content').innerHTML = `
        <div style="display:flex; gap:12px; margin-bottom:20px;">
            <div style="background:var(--card-bg); padding:14px; border-radius:24px; flex:1;">
                <div style="font-size:0.7rem; color:var(--text-muted);">Mandat net</div>
                <div style="font-weight:800;">${fmt(a.net)}</div>
            </div>
            <div style="background:var(--card-bg); padding:14px; border-radius:24px; flex:1;">
                <div style="font-size:0.7rem; color:var(--text-muted);">Solde final</div>
                <div style="color:${a.solde>=0?'var(--success)':'var(--danger)'}; font-weight:800;">${fmt(a.solde)}</div>
            </div>
        </div>
        <div style="font-weight:700; margin-bottom:10px;"><i class="fas fa-utensils"></i> Dépenses mensuelles</div>
        ${a.depenses.length ? a.depenses.map(e=>`
            <div class="list-item" style="padding:10px 0;">
                <div class="item-icon cat-depense"><i class="fas fa-receipt"></i></div>
                <div class="item-info">
                    <div>${escapeHtml(e.desc)}</div>
                    <div class="item-sub">${e.cat}</div>
                </div>
                <div class="item-amount">${fmt(e.amount)}</div>
            </div>
        `).join('') : '<div class="empty-state">Aucune</div>'}
        <div style="font-weight:700; margin:16px 0 10px;"><i class="fas fa-leaf"></i> Marché</div>
        ${(a.marche||[]).length ? a.marche.map(m=>`
            <div class="list-item" style="padding:10px 0;">
                <div class="item-icon cat-marche"><i class="fas fa-basket-shopping"></i></div>
                <div class="item-info">
                    <div>${escapeHtml(m.produit)}</div>
                    <div class="item-sub">${m.date}</div>
                </div>
                <div class="item-amount">${fmt(m.amount)}</div>
            </div>
        `).join('') : '<div class="empty-state">Aucun</div>'}
        <div style="font-weight:700; margin:16px 0 10px;"><i class="fas fa-hand-holding-dollar"></i> Dettes archivées</div>
        ${a.dettes.length ? a.dettes.map(d=>`
            <div class="list-item">
                <div class="item-icon cat-dette"><i class="fas fa-file-invoice"></i></div>
                <div class="item-info">
                    <div>${escapeHtml(d.label)}</div>
                </div>
                <div class="item-amount">${fmt(d.amount)}</div>
            </div>
        `).join('') : '<div class="empty-state">Aucune dette</div>'}
    `;
    openSheet('sheet-archive-details');
}

// Modification du PIN
function updatePin() { 
    const old = document.getElementById('pin-old').value; 
    const newp = document.getElementById('pin-new').value; 
    if(old !== db.pin) return toast("Ancien code invalide"); 
    if(!/^\d{4}$/.test(newp)) return toast("Code à 4 chiffres"); 
    db.pin = newp; 
    saveDB(); 
    closeSheets(); 
    toast("PIN modifié"); 
}

// Mode sombre
function toggleDark() { 
    db.dark = !db.dark; 
    document.body.classList.toggle('dark', db.dark); 
    document.getElementById('theme-icon').className = db.dark ? 'fas fa-sun' : 'fas fa-moon'; 
    saveDB(); 
}

// Gestion des modales
function openSheet(id){ 
    document.getElementById(id).classList.add('show'); 
    setTimeout(()=>{
        let inp = document.querySelector(`#${id} input`); 
        if(inp) inp.focus();
    }, 80);
}

function closeSheets(){ 
    document.querySelectorAll('.overlay').forEach(o=>{
        o.classList.remove('show'); 
        o.querySelectorAll('input,select').forEach(i=>i.value='');
    });
}

function closeIfOverlay(e, id){ 
    if(e.target.id === id) closeSheets();
}

// Sauvegarde dans localStorage
function saveDB(){ 
    localStorage.setItem('guruss_kitti', JSON.stringify(db)); 
}

// Notification toast
function toast(msg){ 
    let el = document.getElementById('toast'); 
    document.getElementById('toast-msg').innerText = msg; 
    el.classList.add('show'); 
    clearTimeout(window.toastTimer); 
    window.toastTimer = setTimeout(()=>el.classList.remove('show'), 2800);
}

// Changement d'onglet
function switchTab(tabId, btn){ 
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); 
    document.getElementById('view-'+tabId).classList.add('active'); 
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active')); 
    if(btn) btn.classList.add('active'); 
}

// Échappement HTML
function escapeHtml(s){ 
    if(!s) return ''; 
    return s.replace(/[&<>]/g, function(m){ 
        if(m === '&') return '&amp;'; 
        if(m === '<') return '&lt;'; 
        if(m === '>') return '&gt;'; 
        return m;
    }); 
}