/**
 * Guruss Kitti Pro - Version 3.0 ULTIME
 * Développé par Bichara Abakar
 * Architecture orientée objet : Models · Views · Controllers
 * MCD local avec UUIDs et clés étrangères
 * Moteur NLP, Streak, Upload reçu base64, Graphique SVG natif
 */

'use strict';

/* ============================================================
   CONSTANTES GLOBALES
   ============================================================ */

const APP = {
    NAME: 'Guruss Kitti Pro',
    DEVELOPER: 'Bichara Abakar',
    VERSION: '3.0 ULTIME',
    STORAGE_KEY: 'guruss_kitti_ultime_v3',
    PASSWORD_SALT: 'guruss_kitti_salt_v3',
    MAX_PASSWORD_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30000
};

const WALLET_TYPES = {
    CASH: 'cash',
    MOBILE: 'mobile',
    BANK: 'bank',
    SAVINGS: 'savings'
};

const CATEGORY_COLORS = {
    journalieres: '#10B981',
    depenses: '#F43F5E',
    marche: '#8B5CF6',
    abonnements: '#3B82F6',
    dettes: '#F59E0B'
};

const ESSENTIAL_KEYWORDS = [
    'loyer', 'électricité', 'electricite', 'eau', 'santé', 'sante',
    'médicament', 'medicament', 'pharmacie', 'docteur', 'médecin', 'medecin',
    'scolarité', 'scolarite', 'école', 'ecole', 'transport', 'carburant',
    'nourriture', 'riz', 'huile', 'sucre', 'farine', 'pain'
];

const NLP_CATEGORY_MAP = {
    'transport': { type: 'journaliere', cat: 'Transport' },
    'taxi': { type: 'journaliere', cat: 'Taxi' },
    'moto': { type: 'journaliere', cat: 'Moto / Keke' },
    'keke': { type: 'journaliere', cat: 'Moto / Keke' },
    'bus': { type: 'journaliere', cat: 'Bus' },
    'beignets': { type: 'journaliere', cat: 'Beignets' },
    'pain': { type: 'journaliere', cat: 'Pain' },
    'café': { type: 'journaliere', cat: 'Thé / Café' },
    'cafe': { type: 'journaliere', cat: 'Thé / Café' },
    'thé': { type: 'journaliere', cat: 'Thé / Café' },
    'the': { type: 'journaliere', cat: 'Thé / Café' },
    'eau': { type: 'journaliere', cat: 'Eau' },
    'jus': { type: 'journaliere', cat: 'Jus / Boisson' },
    'déjeuner': { type: 'journaliere', cat: 'Déjeuner' },
    'dejeuner': { type: 'journaliere', cat: 'Déjeuner' },
    'dîner': { type: 'journaliere', cat: 'Dîner' },
    'diner': { type: 'journaliere', cat: 'Dîner' },
    'snack': { type: 'journaliere', cat: 'Snack' },
    'fruits': { type: 'journaliere', cat: 'Fruits' },
    'légumes': { type: 'journaliere', cat: 'Légumes' },
    'legumes': { type: 'journaliere', cat: 'Légumes' },
    'pharmacie': { type: 'journaliere', cat: 'Pharmacie' },
    'crédit': { type: 'journaliere', cat: 'Crédit téléphone' },
    'credit': { type: 'journaliere', cat: 'Crédit téléphone' },
    'téléphone': { type: 'journaliere', cat: 'Crédit téléphone' },
    'telephone': { type: 'journaliere', cat: 'Crédit téléphone' },
    'internet': { type: 'journaliere', cat: 'Internet' },
    'divers': { type: 'journaliere', cat: 'Divers' },
    'riz': { type: 'mensuelle', cat: 'Riz' },
    'huile': { type: 'mensuelle', cat: 'Huile' },
    'sucre': { type: 'mensuelle', cat: 'Sucre' },
    'farine': { type: 'mensuelle', cat: 'Farine' },
    'savon': { type: 'mensuelle', cat: 'Savon' },
    'dentifrice': { type: 'mensuelle', cat: 'Dentifrice' },
    'papier': { type: 'mensuelle', cat: 'Papier' },
    'gaz': { type: 'mensuelle', cat: 'Gaz' },
    'électricité': { type: 'mensuelle', cat: 'Électricité' },
    'electricite': { type: 'mensuelle', cat: 'Électricité' },
    'loyer': { type: 'mensuelle', cat: 'Loyer' },
    'carburant': { type: 'mensuelle', cat: 'Carburant' },
    'médicaments': { type: 'mensuelle', cat: 'Médicaments' },
    'medicaments': { type: 'mensuelle', cat: 'Médicaments' },
    'tomates': { type: 'marche', cat: 'Marché' },
    'oignons': { type: 'marche', cat: 'Marché' },
    'poisson': { type: 'marche', cat: 'Marché' },
    'viande': { type: 'marche', cat: 'Marché' },
    'poulet': { type: 'marche', cat: 'Marché' },
    'marché': { type: 'marche', cat: 'Marché' },
    'marche': { type: 'marche', cat: 'Marché' }
};

/* ============================================================
   UTILITAIRES GLOBAUX
   ============================================================ */

const Utils = {
    /**
     * Génère un UUID v4-like
     */
    uuid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Échappe le HTML pour éviter les injections XSS
     */
    escapeHtml: function (str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * Formate un montant selon la devise courante
     */
    formatMoney: function (value, currency) {
        const num = parseFloat(value) || 0;
        const curr = currency || { code: 'XAF', symbol: 'F' };
        try {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: curr.code,
                maximumFractionDigits: 0
            }).format(Math.round(num)).replace(/[A-Z]{3}/g, curr.symbol).trim();
        } catch (e) {
            return Math.round(num).toLocaleString('fr-FR') + ' ' + curr.symbol;
        }
    },

    /**
     * Retourne la date du jour au format ISO (YYYY-MM-DD)
     */
    todayISO: function () {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Retourne la date courte (JJ/MM)
     */
    formatDateShort: function (date) {
        const d = date ? new Date(date) : new Date();
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    },

    /**
     * Retourne la date longue (JJ/MM/YYYY)
     */
    formatDateLong: function (date) {
        const d = date ? new Date(date) : new Date();
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    /**
     * Vérifie si l'utilisateur préfère les animations réduites
     */
    prefersReducedMotion: function () {
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (e) {
            return false;
        }
    },

    /**
     * Animate une valeur numérique (compteur)
     */
    animateValue: function (element, start, end, duration, formatter) {
        if (!element) return;
        if (typeof duration !== 'number') duration = 600;
        if (typeof formatter !== 'function') formatter = function (v) { return String(v); };

        if (Utils.prefersReducedMotion() || duration <= 0) {
            element.innerText = formatter(end);
            return;
        }

        const range = end - start;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = start + (range * easeProgress);
            element.innerText = formatter(current);
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.innerText = formatter(end);
            }
        }
        requestAnimationFrame(update);
    },

    /**
     * Hash un mot de passe (simple, non cryptographique — usage local)
     */
    hashPassword: function (pwd) {
        let hash = 0;
        const str = APP.PASSWORD_SALT + pwd;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'gk_' + Math.abs(hash).toString(36);
    },

    /**
     * Vérifie si une chaîne contient un mot-clé essentiel
     */
    isEssential: function (text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        return ESSENTIAL_KEYWORDS.some(function (kw) { return lower.includes(kw); });
    },

    /**
     * Retourne le nombre de jours entre deux dates
     */
    daysBetween: function (date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    },

    /**
     * Charge une image et la convertit en base64 (avec compression)
     */
    fileToBase64: function (file, maxWidth, maxHeight) {
        return new Promise(function (resolve, reject) {
            if (!file || !file.type.match(/^image\//)) {
                reject(new Error('Fichier non-image'));
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    try {
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        resolve(dataUrl);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = function () { reject(new Error('Image invalide')); };
                img.src = e.target.result;
            };
            reader.onerror = function () { reject(new Error('Erreur de lecture')); };
            reader.readAsDataURL(file);
        });
    }
};

/* ============================================================
   HAPTIC (respecte la politique Chrome)
   ============================================================ */

const Haptic = (function () {
    let userHasInteracted = false;

    ['touchstart', 'click', 'keydown'].forEach(function (evt) {
        document.addEventListener(evt, function () {
            userHasInteracted = true;
        }, { once: true, passive: true });
    });

    function canVibrate() {
        return userHasInteracted && navigator.vibrate && State.get('alertHaptic');
    }

    return {
        light: function () { try { if (canVibrate()) navigator.vibrate(8); } catch (e) {} },
        success: function () { try { if (canVibrate()) navigator.vibrate([10, 30, 20]); } catch (e) {} },
        error: function () { try { if (canVibrate()) navigator.vibrate([30, 50, 30]); } catch (e) {} },
        premium: function () { try { if (canVibrate()) navigator.vibrate([15, 30, 15, 30, 50]); } catch (e) {} }
    };
})();

/* ============================================================
   MODEL : Database (MCD local relationnel)
   ============================================================ */

const Database = (function () {
    let state = {
        // Tables relationnelles avec UUIDs
        wallets: [],          // { id, name, type, icon, balance, isDefault, createdAt }
        categories: [],       // { id, name, type, color, icon }
        transactions: [],     // { id, type, amount, wallet_id, category_id, description, date, isEssential, receiptData, notes, createdAt }
        savings: [],          // { id, name, target, current, deadline, wallet_id, createdAt }
        archives: [],         // { id, month, transactions[], net, solde, createdAt }
        abonnements: [],      // { id, name, amount, dateDebut, dateFin, wallet_id, createdAt }

        // Métadonnées
        mandat: 0,
        fees: 0,

        // Préférences utilisateur
        dark: true,
        privacyMode: false,
        userName: null,
        password: null,
        tutorialCompleted: false,
        currency: { code: 'XAF', symbol: 'F' },
        alertThreshold: 80,
        alertHaptic: true,
        alertVisual: true,

        // Streak
        streak: {
            current: 0,
            record: 0,
            lastNonEssentialDate: null,
            lastCheckDate: null
        }
    };

    const DEFAULT_WALLETS = [
        { id: 'wallet_cash', name: 'Espèces', type: 'cash', icon: 'fa-money-bill-wave', balance: 0, isDefault: true },
        { id: 'wallet_airtel', name: 'Airtel Money', type: 'mobile', icon: 'fa-mobile-screen', balance: 0, isDefault: true },
        { id: 'wallet_moov', name: 'Moov Money', type: 'mobile', icon: 'fa-mobile-screen', balance: 0, isDefault: true },
        { id: 'wallet_wave', name: 'Wave', type: 'mobile', icon: 'fa-mobile-screen', balance: 0, isDefault: true },
        { id: 'wallet_bank', name: 'Compte Bancaire', type: 'bank', icon: 'fa-building-columns', balance: 0, isDefault: true }
    ];

    const DEFAULT_CATEGORIES = [
        // Journalières
        { id: 'cat_beignets', name: 'Beignets', type: 'journaliere', color: '#10B981', icon: 'fa-cookie' },
        { id: 'cat_pain', name: 'Pain', type: 'journaliere', color: '#10B981', icon: 'fa-bread-slice' },
        { id: 'cat_cafe', name: 'Thé / Café', type: 'journaliere', color: '#10B981', icon: 'fa-mug-hot' },
        { id: 'cat_eau', name: 'Eau', type: 'journaliere', color: '#10B981', icon: 'fa-bottle-water' },
        { id: 'cat_jus', name: 'Jus / Boisson', type: 'journaliere', color: '#10B981', icon: 'fa-glass-water' },
        { id: 'cat_dejeuner', name: 'Déjeuner', type: 'journaliere', color: '#10B981', icon: 'fa-utensils' },
        { id: 'cat_diner', name: 'Dîner', type: 'journaliere', color: '#10B981', icon: 'fa-utensils' },
        { id: 'cat_snack', name: 'Snack', type: 'journaliere', color: '#10B981', icon: 'fa-cookie-bite' },
        { id: 'cat_fruits', name: 'Fruits', type: 'journaliere', color: '#10B981', icon: 'fa-apple-whole' },
        { id: 'cat_legumes', name: 'Légumes', type: 'journaliere', color: '#10B981', icon: 'fa-carrot' },
        { id: 'cat_taxi', name: 'Taxi', type: 'journaliere', color: '#10B981', icon: 'fa-taxi' },
        { id: 'cat_moto', name: 'Moto / Keke', type: 'journaliere', color: '#10B981', icon: 'fa-motorcycle' },
        { id: 'cat_bus', name: 'Bus', type: 'journaliere', color: '#10B981', icon: 'fa-bus' },
        { id: 'cat_credit', name: 'Crédit téléphone', type: 'journaliere', color: '#10B981', icon: 'fa-phone' },
        { id: 'cat_pharmacie', name: 'Pharmacie', type: 'journaliere', color: '#10B981', icon: 'fa-prescription-bottle' },
        { id: 'cat_divers', name: 'Divers', type: 'journaliere', color: '#10B981', icon: 'fa-ellipsis' },
        // Mensuelles
        { id: 'cat_riz', name: 'Riz', type: 'mensuelle', color: '#F43F5E', icon: 'fa-wheat-awn' },
        { id: 'cat_huile', name: 'Huile', type: 'mensuelle', color: '#F43F5E', icon: 'fa-bottle-droplet' },
        { id: 'cat_sucre', name: 'Sucre', type: 'mensuelle', color: '#F43F5E', icon: 'fa-cube' },
        { id: 'cat_farine', name: 'Farine', type: 'mensuelle', color: '#F43F5E', icon: 'fa-wheat-awn' },
        { id: 'cat_savon', name: 'Savon', type: 'mensuelle', color: '#F43F5E', icon: 'fa-soap' },
        { id: 'cat_dentifrice', name: 'Dentifrice', type: 'mensuelle', color: '#F43F5E', icon: 'fa-tooth' },
        { id: 'cat_papier', name: 'Papier', type: 'mensuelle', color: '#F43F5E', icon: 'fa-toilet-paper' },
        { id: 'cat_gaz', name: 'Gaz', type: 'mensuelle', color: '#F43F5E', icon: 'fa-fire-flame-simple' },
        { id: 'cat_electricite', name: 'Électricité', type: 'mensuelle', color: '#F43F5E', icon: 'fa-bolt' },
        { id: 'cat_loyer', name: 'Loyer', type: 'mensuelle', color: '#F43F5E', icon: 'fa-house' },
        { id: 'cat_carburant', name: 'Carburant', type: 'mensuelle', color: '#F43F5E', icon: 'fa-gas-pump' },
        { id: 'cat_medicaments', name: 'Médicaments', type: 'mensuelle', color: '#F43F5E', icon: 'fa-pills' },
        // Marché
        { id: 'cat_marche', name: 'Marché', type: 'marche', color: '#8B5CF6', icon: 'fa-basket-shopping' },
        // Income
        { id: 'cat_income', name: 'Entrée', type: 'income', color: '#10B981', icon: 'fa-arrow-down' },
        { id: 'cat_vente', name: 'Vente', type: 'income', color: '#10B981', icon: 'fa-tag' },
        { id: 'cat_don', name: 'Don', type: 'income', color: '#10B981', icon: 'fa-gift' },
        // Dette
        { id: 'cat_dette', name: 'Dette', type: 'dette', color: '#F59E0B', icon: 'fa-hand-holding-heart' }
    ];

    function load() {
        try {
            const saved = localStorage.getItem(APP.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    Object.keys(parsed).forEach(function (key) {
                        if (key in state) {
                            state[key] = parsed[key];
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Erreur chargement DB:', e);
        }

        // Initialiser les tables si vides
        if (!Array.isArray(state.wallets) || !state.wallets.length) {
            state.wallets = JSON.parse(JSON.stringify(DEFAULT_WALLETS));
        }
        if (!Array.isArray(state.categories) || !state.categories.length) {
            state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
        }
        if (!Array.isArray(state.transactions)) state.transactions = [];
        if (!Array.isArray(state.savings)) state.savings = [];
        if (!Array.isArray(state.archives)) state.archives = [];
        if (!Array.isArray(state.abonnements)) state.abonnements = [];

        // Sanitize
        state.mandat = parseFloat(state.mandat) || 0;
        state.fees = parseFloat(state.fees) || 0;
        if (typeof state.dark !== 'boolean') state.dark = true;
        if (typeof state.privacyMode !== 'boolean') state.privacyMode = false;
        if (typeof state.tutorialCompleted !== 'boolean') state.tutorialCompleted = false;
        if (typeof state.alertThreshold !== 'number') state.alertThreshold = 80;
        if (typeof state.alertHaptic !== 'boolean') state.alertHaptic = true;
        if (typeof state.alertVisual !== 'boolean') state.alertVisual = true;
        if (!state.currency || typeof state.currency !== 'object') {
            state.currency = { code: 'XAF', symbol: 'F' };
        }
        if (!state.streak || typeof state.streak !== 'object') {
            state.streak = {
                current: 0,
                record: 0,
                lastNonEssentialDate: null,
                lastCheckDate: null
            };
        }
    }

    function save() {
        try {
            localStorage.setItem(APP.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Erreur sauvegarde DB:', e);
        }
    }

    function reset() {
        localStorage.removeItem(APP.STORAGE_KEY);
        location.reload();
    }

    return {
        getState: function () { return state; },
        setState: function (key, value) { state[key] = value; },
        load: load,
        save: save,
        reset: reset
    };
})();

/* ============================================================
   STATE : façade pour l'accès aux données
   ============================================================ */

const State = (function () {
    let db = null;

    function ensure() {
        if (!db) db = Database.getState();
        return db;
    }

    return {
        get: function (key) {
            if (key === undefined) return ensure();
            return ensure()[key];
        },
        set: function (key, value) {
            ensure()[key] = value;
        },
        save: function () {
            Database.save();
        },
        reset: function () {
            Database.reset();
        }
    };
})();

/* ============================================================
   MODEL : Wallet
   ============================================================ */

const WalletModel = {
    getAll: function () {
        return State.get('wallets');
    },

    getById: function (id) {
        return State.get('wallets').find(function (w) { return w.id === id; });
    },

    /**
     * Calcule le solde effectif d'un portefeuille
     * = solde initial + incomes - dépenses
     */
    getBalance: function (walletId) {
        const wallet = this.getById(walletId);
        if (!wallet) return 0;

        let balance = parseFloat(wallet.balance) || 0;
        const transactions = State.get('transactions');

        transactions.forEach(function (tx) {
            if (tx.wallet_id !== walletId) return;
            const amount = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') {
                balance += amount;
            } else if (tx.type === 'expense' || tx.type === 'debt_payment') {
                balance -= amount;
            }
        });

        return balance;
    },

    getTotalBalance: function () {
        const self = this;
        return State.get('wallets').reduce(function (acc, w) {
            return acc + self.getBalance(w.id);
        }, 0);
    },

    create: function (data) {
        const wallet = {
            id: Utils.uuid(),
            name: data.name,
            type: data.type || WALLET_TYPES.CASH,
            icon: data.icon || 'fa-money-bill-wave',
            balance: parseFloat(data.balance) || 0,
            isDefault: false,
            createdAt: new Date().toISOString()
        };
        State.get('wallets').push(wallet);
        State.save();
        return wallet;
    },

    delete: function (id) {
        const wallet = this.getById(id);
        if (!wallet || wallet.isDefault) return false;

        // Réassigner les transactions au wallet cash
        State.get('transactions').forEach(function (tx) {
            if (tx.wallet_id === id) tx.wallet_id = 'wallet_cash';
        });

        State.set('wallets', State.get('wallets').filter(function (w) { return w.id !== id; }));
        State.save();
        return true;
    }
};

/* ============================================================
   MODEL : Category
   ============================================================ */

const CategoryModel = {
    getAll: function () {
        return State.get('categories');
    },

    getById: function (id) {
        return State.get('categories').find(function (c) { return c.id === id; });
    },

    getByName: function (name, type) {
        return State.get('categories').find(function (c) {
            return c.name.toLowerCase() === name.toLowerCase() && (!type || c.type === type);
        });
    },

    getByType: function (type) {
        return State.get('categories').filter(function (c) { return c.type === type; });
    }
};

/* ============================================================
   MODEL : Transaction
   ============================================================ */

const TransactionModel = {
    getAll: function () {
        return State.get('transactions');
    },

    getByType: function (type) {
        return State.get('transactions').filter(function (t) { return t.type === type; });
    },

    /**
     * Type 'expense' + categoryType 'journaliere' → dépenses journalières
     */
    getByCategoryType: function (catType) {
        const categoryIds = CategoryModel.getByType(catType).map(function (c) { return c.id; });
        return State.get('transactions').filter(function (t) {
            return categoryIds.includes(t.category_id);
        });
    },

    create: function (data) {
        const tx = {
            id: Utils.uuid(),
            type: data.type,                    // 'expense' | 'income' | 'debt' | 'debt_payment'
            amount: parseFloat(data.amount) || 0,
            wallet_id: data.wallet_id || 'wallet_cash',
            category_id: data.category_id || null,
            description: data.description || '',
            date: data.date || Utils.todayISO(),
            isEssential: typeof data.isEssential === 'boolean' ? data.isEssential : Utils.isEssential(data.description),
            receiptData: data.receiptData || null,
            notes: data.notes || '',
            createdAt: new Date().toISOString()
        };
        State.get('transactions').push(tx);
        State.save();
        return tx;
    },

    delete: function (id) {
        State.set('transactions', State.get('transactions').filter(function (t) { return t.id !== id; }));
        State.save();
        return true;
    },

    /**
     * Somme des montants pour un type donné (et optionnellement un intervalle de dates)
     */
    sumByType: function (type, startDate, endDate) {
        return State.get('transactions')
            .filter(function (t) {
                if (t.type !== type) return false;
                if (startDate && t.date < startDate) return false;
                if (endDate && t.date > endDate) return false;
                return true;
            })
            .reduce(function (acc, t) { return acc + (parseFloat(t.amount) || 0); }, 0);
    },

    sumByCategoryType: function (catType) {
        const categoryIds = CategoryModel.getByType(catType).map(function (c) { return c.id; });
        return State.get('transactions')
            .filter(function (t) { return categoryIds.includes(t.category_id); })
            .reduce(function (acc, t) { return acc + (parseFloat(t.amount) || 0); }, 0);
    }
};

/* ============================================================
   MODEL : Savings
   ============================================================ */

const SavingsModel = {
    getAll: function () {
        return State.get('savings');
    },

    getById: function (id) {
        return State.get('savings').find(function (s) { return s.id === id; });
    },

    create: function (data) {
        const savings = {
            id: Utils.uuid(),
            name: data.name,
            target: parseFloat(data.target) || 0,
            current: parseFloat(data.current) || 0,
            deadline: data.deadline || null,
            wallet_id: data.wallet_id || null,
            createdAt: new Date().toISOString()
        };
        State.get('savings').push(savings);
        State.save();
        return savings;
    },

    delete: function (id) {
        State.set('savings', State.get('savings').filter(function (s) { return s.id !== id; }));
        State.save();
        return true;
    },

    /**
     * Transfert d'argent du solde principal vers une cagnotte
     */
    transfer: function (id, amount) {
        const savings = this.getById(id);
        if (!savings) return false;
        savings.current = (parseFloat(savings.current) || 0) + amount;
        State.save();
        return true;
    }
};

/* ============================================================
   MODEL : Abonnement
   ============================================================ */

const AbonnementModel = {
    getAll: function () {
        return State.get('abonnements');
    },

    getActive: function () {
        const today = Utils.todayISO();
        return State.get('abonnements').filter(function (a) {
            return today >= a.dateDebut && today <= a.dateFin;
        });
    },

    create: function (data) {
        const abo = {
            id: Utils.uuid(),
            name: data.name,
            amount: parseFloat(data.amount) || 0,
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            wallet_id: data.wallet_id || 'wallet_cash',
            createdAt: new Date().toISOString()
        };
        State.get('abonnements').push(abo);
        State.save();
        return abo;
    },

    delete: function (id) {
        State.set('abonnements', State.get('abonnements').filter(function (a) { return a.id !== id; }));
        State.save();
        return true;
    },

    sumActive: function () {
        return this.getActive().reduce(function (acc, a) {
            return acc + (parseFloat(a.amount) || 0);
        }, 0);
    }
};

/* ============================================================
   MODEL : Archive
   ============================================================ */

const ArchiveModel = {
    getAll: function () {
        return State.get('archives');
    },

    getById: function (id) {
        return State.get('archives').find(function (a) { return a.id === id; });
    },

    create: function (data) {
        const archive = {
            id: Utils.uuid(),
            month: data.month,
            transactions: data.transactions || [],
            abonnements: data.abonnements || [],
            net: data.net,
            solde: data.solde,
            createdAt: new Date().toISOString()
        };
        State.get('archives').push(archive);
        State.save();
        return archive;
    }
};

/* ============================================================
   MODEL : Streak
   ============================================================ */

const StreakModel = {
    get: function () {
        return State.get('streak');
    },

    /**
     * Met à jour le streak en fonction des transactions du jour
     * Streak = jours consécutifs sans dépense NON essentielle
     */
    update: function () {
        const streak = State.get('streak');
        const today = Utils.todayISO();

        if (streak.lastCheckDate === today) {
            return streak; // Déjà vérifié aujourd'hui
        }

        // Chercher les dépenses non essentielles du jour
        const todayNonEssential = State.get('transactions').filter(function (t) {
            return t.date === today && t.type === 'expense' && !t.isEssential;
        });

        if (todayNonEssential.length > 0) {
            // Il y a des dépenses non essentielles aujourd'hui → streak break
            if (streak.current > streak.record) {
                streak.record = streak.current;
            }
            streak.current = 0;
            streak.lastNonEssentialDate = today;
        } else {
            // Pas de dépense non essentielle → streak continue
            if (streak.lastCheckDate) {
                const daysSinceLastCheck = Utils.daysBetween(streak.lastCheckDate, today);
                if (daysSinceLastCheck === 1) {
                    streak.current += 1;
                } else if (daysSinceLastCheck > 1) {
                    // Reprise après pause
                    streak.current = 1;
                }
            } else {
                streak.current = 1;
            }

            if (streak.current > streak.record) {
                streak.record = streak.current;
            }
        }

        streak.lastCheckDate = today;
        State.save();
        return streak;
    },

    reset: function () {
        State.set('streak', {
            current: 0,
            record: 0,
            lastNonEssentialDate: null,
            lastCheckDate: null
        });
        State.save();
    }
};

/* ============================================================
   MODEL : Totals (calculs financiers)
   ============================================================ */

const TotalsModel = {
    get: function () {
        const incomes = TransactionModel.sumByType('income');
        const journalieres = TransactionModel.sumByCategoryType('journaliere');
        const mensuelles = TransactionModel.sumByCategoryType('mensuelle');
        const marche = TransactionModel.sumByCategoryType('marche');
        const abonnementsActifs = AbonnementModel.sumActive();
        const dettes = TransactionModel.sumByType('debt');

        const mandatNet = (parseFloat(State.get('mandat')) || 0) - (parseFloat(State.get('fees')) || 0);
        const totalOut = journalieres + mensuelles + marche + abonnementsActifs;
        const solde = mandatNet + incomes - totalOut;

        const percentUsed = (mandatNet + incomes) > 0
            ? Math.min(100, (totalOut / (mandatNet + incomes)) * 100)
            : (totalOut > 0 ? 100 : 0);

        return {
            net: mandatNet,
            incomes: incomes,
            journalieres: journalieres,
            mensuelles: mensuelles,
            marche: marche,
            abonnementsActifs: abonnementsActifs,
            dettes: dettes,
            totalOut: totalOut,
            solde: solde,
            isOverBudget: solde < 0,
            deficit: solde < 0 ? Math.abs(solde) : 0,
            percentUsed: percentUsed
        };
    }
};

/* ============================================================
   MODEL : Projection (épuisement du solde)
   ============================================================ */

const ProjectionModel = {
    compute: function () {
        const totals = TotalsModel.get();
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const daysElapsed = Math.max(1, today.getDate());
        const daysLeft = Math.max(0, lastDay - today.getDate());

        const spentThisMonth = totals.totalOut;
        const avgDailySpend = spentThisMonth / daysElapsed;

        let depletionDateText = '—';
        let depletionDays = 0;

        if (avgDailySpend > 0 && totals.solde > 0) {
            depletionDays = Math.floor(totals.solde / avgDailySpend);

            if (depletionDays <= daysLeft) {
                const depletionDate = new Date(today);
                depletionDate.setDate(depletionDate.getDate() + depletionDays);
                depletionDateText = depletionDate.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long'
                });
            } else {
                depletionDateText = 'Fin de mois OK';
            }
        } else if (totals.solde <= 0) {
            depletionDateText = 'Déjà épuisé';
        } else if (spentThisMonth === 0) {
            depletionDateText = 'Aucune dépense';
        }

        const monthProgress = (daysElapsed / lastDay) * 100;
        const budgetProgress = totals.percentUsed;

        return {
            avgDailySpend: avgDailySpend,
            depletionDateText: depletionDateText,
            depletionDays: depletionDays,
            monthProgress: monthProgress,
            budgetProgress: budgetProgress,
            daysLeft: daysLeft
        };
    }
};

/* ============================================================
   MODEL : Health (santé financière)
   ============================================================ */

const HealthModel = {
    compute: function () {
        const totals = TotalsModel.get();

        if ((State.get('mandat') || 0) <= 0) {
            return {
                level: 'none',
                title: 'En attente de données',
                value: 'Définissez votre mandat pour commencer',
                badge: '—'
            };
        }

        const percentUsed = totals.percentUsed;
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const monthProgress = (today.getDate() / lastDay) * 100;
        const gap = monthProgress - percentUsed;

        if (totals.solde <= 0 || percentUsed >= 100) {
            return {
                level: 'critical',
                title: 'Situation critique',
                value: 'Budget épuisé - Réduisez vos dépenses immédiatement',
                badge: 'Critique'
            };
        }

        if (gap >= 20 && percentUsed < 60) {
            return {
                level: 'excellent',
                title: 'Excellente gestion',
                value: 'Vous êtes en avance sur votre budget',
                badge: 'Excellent'
            };
        }

        if (gap >= 5) {
            return {
                level: 'good',
                title: 'Bonne gestion',
                value: 'Votre rythme est sain',
                badge: 'Bon'
            };
        }

        if (gap >= -10) {
            return {
                level: 'moderate',
                title: 'Gestion modérée',
                value: 'Restez vigilant sur vos dépenses',
                badge: 'Modéré'
            };
        }

        return {
            level: 'warning',
            title: 'Attention requise',
            value: 'Vos dépenses dépassent votre rythme',
            badge: 'Alerte'
        };
    }
};

/* ============================================================
   MODEL : Budget check (peut-on dépenser ?)
   ============================================================ */

const BudgetModel = {
    canSpend: function (amount) {
        const totals = TotalsModel.get();
        const mandat = parseFloat(State.get('mandat')) || 0;

        if (mandat <= 0) {
            return {
                ok: false,
                reason: 'no-mandate',
                message: 'Aucun mandat défini.\n\nDéfinissez votre mandat avant d\'enregistrer une dépense.'
            };
        }

        if (totals.solde <= 0) {
            return {
                ok: false,
                reason: 'zero',
                message: 'Reste à vivre insuffisant.\n\nVotre reste à vivre est de ' +
                    Utils.formatMoney(totals.solde, State.get('currency')) + '.'
            };
        }

        if (amount > totals.solde) {
            return {
                ok: false,
                reason: 'exceeds',
                message: 'Dépense refusée.\n\n' +
                    'Reste à vivre : ' + Utils.formatMoney(totals.solde, State.get('currency')) + '\n' +
                    'Dépense : ' + Utils.formatMoney(amount, State.get('currency')) + '\n' +
                    'Manque : ' + Utils.formatMoney(amount - totals.solde, State.get('currency'))
            };
        }

        const threshold = (State.get('alertThreshold') || 80) / 100;
        if (amount >= totals.solde * threshold) {
            return {
                ok: true,
                warning: true,
                message: 'Attention : dépense élevée.\n\n' +
                    'Reste à vivre : ' + Utils.formatMoney(totals.solde, State.get('currency')) + '\n' +
                    'Cette dépense représente ' + Math.round((amount / totals.solde) * 100) + '% de votre reste à vivre.\n\n' +
                    'Confirmer ?'
            };
        }

        return { ok: true };
    }
};

/* ============================================================
   SERVICE : NLP Parser (Barre Magique)
   ============================================================ */

const NLPParser = {
    /**
     * Analyse une phrase pour en extraire montant, catégorie, date
     */
    parse: function (input) {
        if (!input || typeof input !== 'string') return null;
        const text = input.trim().toLowerCase();

        const result = {
            amount: null,
            categoryName: null,
            categoryType: null,
            date: Utils.todayISO(),
            description: '',
            wallet_id: 'wallet_cash',
            rawInput: input
        };

        // 1. Extraire le montant
        const amountMatch = text.match(/(\d[\d\s]*)(k|f|fcfa|francs?)?/i);
        if (amountMatch) {
            let amount = parseInt(amountMatch[1].replace(/\s/g, ''), 10);
            if (amountMatch[2] && amountMatch[2].toLowerCase() === 'k') {
                amount *= 1000;
            }
            result.amount = amount;
        }

        // 2. Extraire la date
        const today = new Date();
        if (text.includes('hier')) {
            const d = new Date(today);
            d.setDate(d.getDate() - 1);
            result.date = d.toISOString().split('T')[0];
        } else if (text.includes('avant-hier') || text.includes('avant hier')) {
            const d = new Date(today);
            d.setDate(d.getDate() - 2);
            result.date = d.toISOString().split('T')[0];
        } else if (text.includes('demain')) {
            const d = new Date(today);
            d.setDate(d.getDate() + 1);
            result.date = d.toISOString().split('T')[0];
        } else if (text.includes('aujourd') || text.includes('ce matin') ||
                   text.includes('ce midi') || text.includes('ce soir') ||
                   text.includes('maintenant')) {
            result.date = Utils.todayISO();
        }

        // 3. Extraire la catégorie
        for (const keyword in NLP_CATEGORY_MAP) {
            if (text.includes(keyword)) {
                const mapping = NLP_CATEGORY_MAP[keyword];
                result.categoryName = mapping.cat;
                result.categoryType = mapping.type;
                break;
            }
        }

        // 4. Détecter le mot-clé "income"
        if (text.includes('reçu') || text.includes('salaire') || text.includes('vendu') ||
            text.includes('vente') || text.includes('don') || text.includes('rentrée')) {
            result.categoryType = 'income';
            if (!result.categoryName) result.categoryName = 'Entrée';
        }

        // 5. Détecter le mot-clé "dette"
        if (text.includes('dette') || text.includes('ardoise') || text.includes('emprunt')) {
            result.categoryType = 'dette';
            if (!result.categoryName) result.categoryName = 'Dette';
        }

        // 6. Description par défaut
        if (result.categoryName) {
            result.description = result.categoryName;
        } else {
            // Nettoyer le texte pour la description
            result.description = input
                .replace(/\d[\d\s]*k?/gi, '')
                .replace(/\b(aujourd'hui|hier|avant-hier|demain|ce matin|ce midi|ce soir)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim() || 'Dépense';
        }

        return result.amount ? result : null;
    },

    /**
     * Convertit le résultat NLP en données de transaction
     */
    toTransactionData: function (parsed) {
        let type = 'expense';
        let category = null;

        if (parsed.categoryType === 'income') {
            type = 'income';
            category = CategoryModel.getByType('income')[0];
        } else if (parsed.categoryType === 'dette') {
            type = 'debt';
            category = CategoryModel.getByName('Dette');
        } else {
            // Chercher la catégorie
            const types = ['journaliere', 'mensuelle', 'marche'];
            for (const t of types) {
                const found = CategoryModel.getByName(parsed.categoryName, t);
                if (found) {
                    category = found;
                    break;
                }
            }
            // Fallback
            if (!category) {
                category = CategoryModel.getByName('Divers') ||
                           CategoryModel.getByType('journaliere')[0];
            }
        }

        return {
            type: type,
            amount: parsed.amount,
            category_id: category ? category.id : null,
            wallet_id: parsed.wallet_id,
            description: parsed.description,
            date: parsed.date,
            isEssential: Utils.isEssential(parsed.description)
        };
    }
};

/* ============================================================
   VIEW : Toast
   ============================================================ */

const ToastView = {
    timeout: null,

    show: function (msg, isError) {
        const toast = document.getElementById('toast');
        const msgSpan = document.getElementById('toast-msg');
        if (!toast || !msgSpan) return;

        const icon = toast.querySelector('i');

        if (isError) {
            toast.style.background = 'linear-gradient(135deg, #BE123C 0%, #881337 100%)';
            if (icon) icon.className = 'fas fa-exclamation-circle';
            Haptic.error();
        } else {
            toast.style.background = 'linear-gradient(135deg, #1A142F 0%, #0F0A1F 100%)';
            if (icon) icon.className = 'fas fa-check-circle';
            Haptic.success();
        }

        msgSpan.innerText = msg;
        toast.classList.add('show');

        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(function () {
            toast.classList.remove('show');
        }, 2500);
    },

    showPremium: function (msg, type) {
        const toast = document.getElementById('toast');
        const msgSpan = document.getElementById('toast-msg');
        if (!toast || !msgSpan) return;

        const icon = toast.querySelector('i');

        if (type === 'success') {
            toast.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)';
            if (icon) icon.className = 'fas fa-crown';
            Haptic.premium();
        } else if (type === 'error') {
            toast.style.background = 'linear-gradient(135deg, #BE123C 0%, #881337 100%)';
            if (icon) icon.className = 'fas fa-exclamation-triangle';
            Haptic.error();
        } else {
            toast.style.background = 'linear-gradient(135deg, #1A142F 0%, #0F0A1F 100%)';
            if (icon) icon.className = 'fas fa-gem';
        }

        msgSpan.innerText = msg;
        toast.classList.add('show');

        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(function () {
            toast.classList.remove('show');
        }, 3000);
    }
};

/* ============================================================
   VIEW : Sheet (Bottom Sheet management)
   ============================================================ */

const SheetView = {
    open: function (id) {
        Haptic.light();
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('show');

        setTimeout(function () {
            const firstInput = el.querySelector('input:not([disabled]):not([type="file"]), select');
            if (firstInput && window.innerWidth >= 480) {
                try { firstInput.focus({ preventScroll: true }); } catch (e) {}
            }
        }, 200);
    },

    close: function (force) {
        const isUnlocked = !AppController.isPasswordEnabled() || AppController.isUnlocked();
        const hasName = AppController.hasUserName();

        document.querySelectorAll('.overlay').forEach(function (overlay) {
            if (!force && overlay.id === 'sheet-password-lock' && AppController.isPasswordEnabled() && !isUnlocked) {
                return;
            }
            if (!force && overlay.id === 'sheet-first-launch' && !hasName) {
                return;
            }

            overlay.classList.remove('show');

            overlay.querySelectorAll('input, select').forEach(function (input) {
                if (input.type !== 'file' && input.type !== 'checkbox') input.value = '';
            });
        });
    }
};

/* ============================================================
   VIEW : Wallet
   ============================================================ */

const WalletView = {
    render: function () {
        const container = document.getElementById('wallets-grid');
        if (!container) return;

        const wallets = WalletModel.getAll();

        if (!wallets.length) {
            container.innerHTML = '<div class="wallets-empty"><i class="fas fa-wallet"></i>Aucun portefeuille</div>';
            return;
        }

        const currency = State.get('currency');
        let html = '';

        wallets.forEach(function (wallet) {
            const balance = WalletModel.getBalance(wallet.id);
            const balanceColor = balance >= 0 ? 'var(--text-primary)' : 'var(--rose-500)';
            const typeLabels = {
                cash: 'Espèces',
                mobile: 'Mobile Money',
                bank: 'Banque',
                savings: 'Épargne'
            };
            const typeLabel = typeLabels[wallet.type] || wallet.type;

            html += '<div class="wallet-item" data-wallet-id="' + wallet.id + '">' +
                '<div class="wallet-item-header">' +
                    '<div class="wallet-icon ' + wallet.type + '">' +
                        '<i class="fas ' + wallet.icon + '"></i>' +
                    '</div>' +
                    (!wallet.isDefault ?
                        '<button class="wallet-delete" data-delete-wallet="' + wallet.id + '" aria-label="Supprimer">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' : '') +
                '</div>' +
                '<div class="wallet-name">' + Utils.escapeHtml(wallet.name) + '</div>' +
                '<div class="wallet-balance" style="color: ' + balanceColor + '">' +
                    Utils.formatMoney(balance, currency) +
                '</div>' +
                '<div class="wallet-type-badge">' + typeLabel + '</div>' +
            '</div>';
        });

        container.innerHTML = html;

        // Attach delete handlers
        container.querySelectorAll('[data-delete-wallet]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                WalletController.delete(btn.dataset.deleteWallet);
            });
        });
    },

    /**
     * Peuple tous les selects de portefeuille
     */
    populateSelects: function () {
        const wallets = WalletModel.getAll();
        document.querySelectorAll('.wallet-select').forEach(function (select) {
            const currentValue = select.value;
            select.innerHTML = '';
            wallets.forEach(function (w) {
                const opt = document.createElement('option');
                opt.value = w.id;
                opt.textContent = w.name;
                select.appendChild(opt);
            });
            if (currentValue && wallets.some(function (w) { return w.id === currentValue; })) {
                select.value = currentValue;
            }
        });
    }
};

/* ============================================================
   VIEW : Savings
   ============================================================ */

const SavingsView = {
    render: function () {
        const container = document.getElementById('savings-list');
        if (!container) return;

        const savings = SavingsModel.getAll();
        const currency = State.get('currency');

        if (!savings.length) {
            container.innerHTML = '<div class="savings-empty"><i class="fas fa-piggy-bank"></i>Aucune cagnotte active</div>';
            return;
        }

        let html = '';

        savings.forEach(function (s) {
            const current = parseFloat(s.current) || 0;
            const target = parseFloat(s.target) || 1;
            const percent = Math.min(100, (current / target) * 100);
            const isCompleted = current >= target;

            let deadlineHtml = '';
            if (s.deadline) {
                const deadlineDate = new Date(s.deadline);
                const today = new Date();
                const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
                if (daysLeft > 0) {
                    deadlineHtml = '<span class="savings-deadline"><i class="fas fa-calendar"></i> ' + daysLeft + 'j restants</span>';
                } else if (daysLeft === 0) {
                    deadlineHtml = '<span class="savings-deadline"><i class="fas fa-calendar"></i> Aujourd\'hui</span>';
                } else {
                    deadlineHtml = '<span class="savings-deadline"><i class="fas fa-calendar"></i> Échéance passée</span>';
                }
            }

            html += '<div class="savings-item' + (isCompleted ? ' completed' : '') + '">' +
                '<div class="savings-item-header">' +
                    '<div class="savings-name-wrap">' +
                        '<div class="savings-icon">' +
                            '<i class="fas ' + (isCompleted ? 'fa-trophy' : 'fa-piggy-bank') + '"></i>' +
                        '</div>' +
                        '<div class="savings-info">' +
                            '<div class="savings-name">' + Utils.escapeHtml(s.name) + '</div>' +
                            '<div class="savings-sub">' + (isCompleted ? 'Objectif atteint !' : 'En cours') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="savings-actions">' +
                        '<button class="savings-action-btn" data-transfer-savings="' + s.id + '" title="Alimenter" aria-label="Alimenter">' +
                            '<i class="fas fa-plus"></i>' +
                        '</button>' +
                        '<button class="savings-action-btn delete" data-delete-savings="' + s.id + '" title="Supprimer" aria-label="Supprimer">' +
                            '<i class="fas fa-trash-alt"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="savings-progress-info">' +
                    '<span class="savings-amount">' + Utils.formatMoney(current, currency) + '</span>' +
                    '<span class="savings-target">/ ' + Utils.formatMoney(target, currency) + '</span>' +
                '</div>' +
                '<div class="savings-progress-bar">' +
                    '<div class="savings-progress-fill" style="width: ' + percent + '%"></div>' +
                '</div>' +
                '<div class="savings-footer">' +
                    '<span class="savings-percent">' + percent.toFixed(0) + '%</span>' +
                    deadlineHtml +
                '</div>' +
            '</div>';
        });

        container.innerHTML = html;

        // Handlers
        container.querySelectorAll('[data-transfer-savings]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                SavingsController.openTransfer(btn.dataset.transferSavings);
            });
        });

        container.querySelectorAll('[data-delete-savings]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                SavingsController.delete(btn.dataset.deleteSavings);
            });
        });
    }
};

/* ============================================================
   VIEW : Transaction Lists
   ============================================================ */

const TransactionListView = {
    renderCategoryType: function (containerId, catType, iconClass, iconName, emptyMsg) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const items = TransactionModel.getByCategoryType(catType).slice().reverse();
        const currency = State.get('currency');

        if (!items.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas ' + iconName + '"></i><div>' + emptyMsg + '</div></div>';
            return;
        }

        let html = '';
        items.forEach(function (tx) {
            const category = CategoryModel.getById(tx.category_id);
            const wallet = WalletModel.getById(tx.wallet_id);
            const catName = category ? category.name : '';
            const walletName = wallet ? wallet.name : '';
            const subParts = [];
            if (catName) subParts.push(catName);
            if (walletName) subParts.push(walletName);
            if (tx.date) subParts.push(Utils.formatDateShort(tx.date));

            html += '<div class="list-item">' +
                '<div class="item-icon ' + iconClass + '"><i class="fas ' + iconName + '"></i></div>' +
                '<div class="item-info">' +
                    '<div class="item-title">' + Utils.escapeHtml(tx.description) + '</div>' +
                    '<div class="item-sub">' + Utils.escapeHtml(subParts.join(' · ')) + '</div>' +
                '</div>' +
                '<div class="item-amount" style="color: var(--rose-500)">-' +
                    Utils.formatMoney(tx.amount, currency) +
                '</div>' +
                '<button class="item-del" data-delete-tx="' + tx.id + '" aria-label="Supprimer">' +
                    '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
            '</div>';
        });

        container.innerHTML = html;

        container.querySelectorAll('[data-delete-tx]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                TransactionController.delete(btn.dataset.deleteTx);
            });
        });
    },

    renderJournalieres: function () {
        this.renderCategoryType('journaliere-list', 'journaliere', 'cat-journaliere', 'fa-coffee', 'Aucune dépense journalière');
    },

    renderMensuelles: function () {
        this.renderCategoryType('expense-list', 'mensuelle', 'cat-depense', 'fa-receipt', 'Aucune dépense mensuelle');
    },

    renderMarche: function () {
        this.renderCategoryType('marche-list', 'marche', 'cat-marche', 'fa-basket-shopping', 'Aucun achat marché');
    },

    renderIncomes: function () {
        const container = document.getElementById('income-list');
        if (!container) return;

        const items = TransactionModel.getByType('income').slice().reverse();
        const currency = State.get('currency');

        if (!items.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-arrow-down"></i><div>Aucune entrée</div></div>';
            return;
        }

        let html = '';
        items.forEach(function (tx) {
            const wallet = WalletModel.getById(tx.wallet_id);
            const subParts = [];
            if (wallet) subParts.push(wallet.name);
            if (tx.date) subParts.push(Utils.formatDateShort(tx.date));

            html += '<div class="list-item">' +
                '<div class="item-icon cat-income"><i class="fas fa-arrow-down"></i></div>' +
                '<div class="item-info">' +
                    '<div class="item-title">' + Utils.escapeHtml(tx.description) + '</div>' +
                    '<div class="item-sub">' + Utils.escapeHtml(subParts.join(' · ')) + '</div>' +
                '</div>' +
                '<div class="item-amount" style="color: var(--emerald-500)">+' +
                    Utils.formatMoney(tx.amount, currency) +
                '</div>' +
                '<button class="item-del" data-delete-tx="' + tx.id + '" aria-label="Supprimer">' +
                    '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
            '</div>';
        });

        container.innerHTML = html;

        container.querySelectorAll('[data-delete-tx]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                TransactionController.delete(btn.dataset.deleteTx);
            });
        });
    },

    renderDebts: function () {
        const container = document.getElementById('debt-list');
        if (!container) return;

        const items = TransactionModel.getByType('debt');
        const currency = State.get('currency');

        if (!items.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-hand-peace"></i><div>Aucune ardoise en cours</div></div>';
            return;
        }

        let html = '';
        items.slice().reverse().forEach(function (tx) {
            html += '<div class="list-item">' +
                '<div class="item-icon cat-dette"><i class="fas fa-hand-holding-dollar"></i></div>' +
                '<div class="item-info">' +
                    '<div class="item-title">' + Utils.escapeHtml(tx.description) + '</div>' +
                    '<div class="item-sub">À régler</div>' +
                '</div>' +
                '<div class="item-amount" style="color: var(--gold-500)">' +
                    Utils.formatMoney(tx.amount, currency) +
                '</div>' +
                '<button class="item-del" data-settle-debt="' + tx.id + '" title="Régler" aria-label="Régler">' +
                    '<i class="fas fa-circle-check"></i>' +
                '</button>' +
            '</div>';
        });

        container.innerHTML = html;

        container.querySelectorAll('[data-settle-debt]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                DebtController.settle(btn.dataset.settleDebt);
            });
        });
    },

    renderAbonnements: function () {
        const container = document.getElementById('abonnement-list');
        if (!container) return;

        const items = AbonnementModel.getAll();
        const currency = State.get('currency');
        const today = Utils.todayISO();

        if (!items.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-check"></i><div>Aucun contrat</div></div>';
            return;
        }

        let html = '';
        items.slice().reverse().forEach(function (abo) {
            const isActive = today >= abo.dateDebut && today <= abo.dateFin;
            const statusText = isActive ? 'En cours (déduit)' : (today > abo.dateFin ? 'Terminé' : 'À venir');
            const statusColor = isActive ? 'var(--blue-500)' : 'var(--text-tertiary)';

            html += '<div class="list-item">' +
                '<div class="item-icon cat-abonnement" style="color: ' + statusColor + '">' +
                    '<i class="fas fa-sync"></i>' +
                '</div>' +
                '<div class="item-info">' +
                    '<div class="item-title">' + Utils.escapeHtml(abo.name) + '</div>' +
                    '<div class="item-sub">' + statusText + ' · ' + Utils.escapeHtml(abo.dateDebut) + ' → ' + Utils.escapeHtml(abo.dateFin) + '</div>' +
                '</div>' +
                '<div class="item-amount" style="color: ' + (isActive ? 'var(--rose-500)' : 'var(--text-tertiary)') + '">' +
                    (isActive ? '-' : '') + Utils.formatMoney(abo.amount, currency) +
                '</div>' +
                '<button class="item-del" data-delete-abo="' + abo.id + '" aria-label="Supprimer">' +
                    '<i class="fas fa-trash-alt"></i>' +
                '</button>' +
            '</div>';
        });

        container.innerHTML = html;

        container.querySelectorAll('[data-delete-abo]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                AbonnementController.delete(btn.dataset.deleteAbo);
            });
        });
    },

    renderArchives: function () {
        const container = document.getElementById('archive-list');
        if (!container) return;

        const archives = ArchiveModel.getAll();
        const currency = State.get('currency');

        if (!archives.length) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-archive"></i><div>Aucune archive</div></div>';
            return;
        }

        let html = '';
        archives.slice().reverse().forEach(function (arch) {
            const soldeColor = arch.solde >= 0 ? 'var(--emerald-500)' : 'var(--rose-500)';

            html += '<div class="list-item" data-archive-id="' + arch.id + '" style="cursor: pointer;">' +
                '<div class="item-icon cat-marche"><i class="fas fa-calendar-alt"></i></div>' +
                '<div class="item-info">' +
                    '<div class="item-title">' + Utils.escapeHtml(arch.month) + '</div>' +
                    '<div class="item-sub">Net : ' + Utils.formatMoney(arch.net, currency) + '</div>' +
                '</div>' +
                '<div class="item-amount" style="color: ' + soldeColor + '">' +
                    Utils.formatMoney(arch.solde, currency) +
                '</div>' +
                '<i class="fas fa-chevron-right" style="color: var(--text-tertiary); font-size: 0.8rem;"></i>' +
            '</div>';
        });

        container.innerHTML = html;

        container.querySelectorAll('[data-archive-id]').forEach(function (el) {
            el.addEventListener('click', function () {
                ArchiveController.viewDetails(el.dataset.archiveId);
            });
        });
    }
};

/* ============================================================
   VIEW : Dashboard (balance, gauge, chart, health, streak, projection)
   ============================================================ */

const DashboardView = {
    previousValues: {},

    render: function () {
        this.renderBalance();
        this.renderGauge();
        this.renderChart();
        this.renderHealth();
        this.renderStreak();
        this.renderProjection();
        this.renderMandatStatus();
        this.renderStepIndicator();
    },

    renderBalance: function () {
        const totals = TotalsModel.get();
        const currency = State.get('currency');
        const dailyInfo = this.getDailyBudget();

        const heroBalance = document.getElementById('hero-balance');
        const netVal = document.getElementById('net-val');
        const expTotalVal = document.getElementById('exp-total-val');
        const daysLeftVal = document.getElementById('days-left-val');
        const dailyVal = document.getElementById('daily-val');

        if (!heroBalance) return;

        const self = this;
        if (self.previousValues.solde !== totals.solde) {
            Utils.animateValue(heroBalance, self.previousValues.solde || 0, totals.solde, 700, function (v) {
                return Utils.formatMoney(v, currency);
            });
            self.previousValues.solde = totals.solde;
        } else {
            heroBalance.innerText = Utils.formatMoney(totals.solde, currency);
        }

        if (totals.isOverBudget) {
            heroBalance.classList.add('negative');
        } else {
            heroBalance.classList.remove('negative');
        }

        if (self.previousValues.net !== totals.net) {
            Utils.animateValue(netVal, self.previousValues.net || 0, totals.net, 700, function (v) {
                return Utils.formatMoney(v, currency);
            });
            self.previousValues.net = totals.net;
        } else {
            netVal.innerText = Utils.formatMoney(totals.net, currency);
        }

        if (self.previousValues.totalOut !== totals.totalOut) {
            Utils.animateValue(expTotalVal, self.previousValues.totalOut || 0, totals.totalOut, 700, function (v) {
                return Utils.formatMoney(v, currency);
            });
            self.previousValues.totalOut = totals.totalOut;
        } else {
            expTotalVal.innerText = Utils.formatMoney(totals.totalOut, currency);
        }

        daysLeftVal.innerText = dailyInfo.daysLeft + 'j';
        dailyVal.innerText = Utils.formatMoney(Math.max(0, dailyInfo.daily), currency);
        dailyVal.style.color = (dailyInfo.daily <= 0 && totals.isOverBudget) ? 'var(--rose-500)' : '';

        // Dettes
        const debtTotalPreview = document.getElementById('debt-total-preview');
        const debtCountLabel = document.getElementById('debt-count-label');
        if (debtTotalPreview) debtTotalPreview.innerText = Utils.formatMoney(totals.dettes, currency);
        if (debtCountLabel) {
            const count = TransactionModel.getByType('debt').length;
            debtCountLabel.innerText = count + ' ardoise' + (count > 1 ? 's' : '');
        }
    },

    getDailyBudget: function () {
        const totals = TotalsModel.get();
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysLeft = Math.max(1, lastDay - today.getDate() + 1);
        const daily = totals.solde <= 0 ? 0 : totals.solde / daysLeft;
        return { daysLeft: daysLeft, daily: daily };
    },

    renderGauge: function () {
        const totals = TotalsModel.get();
        const gaugeProgress = document.getElementById('gauge-progress');
        const gaugePercent = document.getElementById('gauge-percent');
        if (!gaugeProgress || !gaugePercent) return;

        const circumference = 2 * Math.PI * 52;
        const percent = Math.max(0, Math.min(100, totals.percentUsed));
        const dashoffset = circumference * (1 - percent / 100);

        gaugeProgress.style.strokeDasharray = circumference;
        gaugeProgress.style.strokeDashoffset = dashoffset;

        const threshold = State.get('alertThreshold') || 80;

        if (percent >= 100) {
            gaugeProgress.style.stroke = '#F43F5E';
            gaugeProgress.style.filter = 'drop-shadow(0 0 6px rgba(244, 63, 94, 0.6))';
        } else if (percent >= threshold) {
            gaugeProgress.style.stroke = '#F59E0B';
            gaugeProgress.style.filter = 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))';
        } else {
            gaugeProgress.style.stroke = '#8B5CF6';
            gaugeProgress.style.filter = 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))';
        }

        const prevValue = parseInt(gaugePercent.dataset.prev || '0', 10);
        Utils.animateValue(gaugePercent, prevValue, Math.round(percent), 700, function (v) {
            return Math.round(v) + '%';
        });
        gaugePercent.dataset.prev = Math.round(percent);
    },

    renderChart: function () {
        const svg = document.getElementById('spending-chart');
        const legendEl = document.getElementById('chart-legend');
        if (!svg || !legendEl) return;

        const totals = TotalsModel.get();
        const currency = State.get('currency');

        const categories = [
            { key: 'journalieres', label: 'Journalières', color: CATEGORY_COLORS.journalieres, value: totals.journalieres },
            { key: 'mensuelles', label: 'Mensuelles', color: CATEGORY_COLORS.depenses, value: totals.mensuelles },
            { key: 'marche', label: 'Marché', color: CATEGORY_COLORS.marche, value: totals.marche },
            { key: 'abonnements', label: 'Abonnements', color: CATEGORY_COLORS.abonnements, value: totals.abonnementsActifs },
            { key: 'dettes', label: 'Dettes', color: CATEGORY_COLORS.dettes, value: totals.dettes }
        ];

        const total = categories.reduce(function (acc, c) { return acc + c.value; }, 0);
        const activeCategories = categories.filter(function (c) { return c.value > 0; });

        svg.innerHTML = '';

        const cx = 100, cy = 100;
        const outerR = 88, innerR = 58;

        if (total === 0) {
            const emptyCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            emptyCircle.setAttribute('cx', cx);
            emptyCircle.setAttribute('cy', cy);
            emptyCircle.setAttribute('r', (outerR + innerR) / 2);
            emptyCircle.setAttribute('fill', 'none');
            emptyCircle.setAttribute('stroke', 'rgba(148, 163, 184, 0.15)');
            emptyCircle.setAttribute('stroke-width', outerR - innerR);
            svg.appendChild(emptyCircle);

            const emptyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            emptyText.setAttribute('x', cx);
            emptyText.setAttribute('y', cy + 4);
            emptyText.setAttribute('text-anchor', 'middle');
            emptyText.setAttribute('class', 'chart-center-label');
            emptyText.textContent = 'Aucune donnée';
            svg.appendChild(emptyText);

            legendEl.innerHTML = '<div class="chart-legend-item"><span class="chart-legend-dot" style="background:#52525B"></span>Aucune dépense</div>';
            return;
        }

        let startAngle = -90;

        activeCategories.forEach(function (cat) {
            const sliceAngle = (cat.value / total) * 360;
            const endAngle = startAngle + sliceAngle;
            const path = DashboardView.describeArc(cx, cy, outerR, innerR, startAngle, endAngle);

            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', path);
            pathEl.setAttribute('fill', cat.color);
            pathEl.setAttribute('class', 'slice');
            pathEl.setAttribute('data-label', cat.label);
            pathEl.setAttribute('data-value', Utils.formatMoney(cat.value, currency));
            pathEl.setAttribute('data-percent', ((cat.value / total) * 100).toFixed(0) + '%');

            const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            titleEl.textContent = cat.label + ' : ' + Utils.formatMoney(cat.value, currency) +
                ' (' + ((cat.value / total) * 100).toFixed(0) + '%)';
            pathEl.appendChild(titleEl);

            svg.appendChild(pathEl);
            startAngle += sliceAngle;
        });

        const centerValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerValue.setAttribute('x', cx);
        centerValue.setAttribute('y', cy - 2);
        centerValue.setAttribute('text-anchor', 'middle');
        centerValue.setAttribute('class', 'chart-center-text');
        centerValue.textContent = Utils.formatMoney(total, currency);
        svg.appendChild(centerValue);

        const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerLabel.setAttribute('x', cx);
        centerLabel.setAttribute('y', cy + 12);
        centerLabel.setAttribute('text-anchor', 'middle');
        centerLabel.setAttribute('class', 'chart-center-label');
        centerLabel.textContent = 'TOTAL';
        svg.appendChild(centerLabel);

        let legendHtml = '';
        activeCategories.forEach(function (cat) {
            const percent = ((cat.value / total) * 100).toFixed(0);
            legendHtml += '<div class="chart-legend-item">' +
                '<span class="chart-legend-dot" style="background:' + cat.color + '; color:' + cat.color + '"></span>' +
                '<span>' + cat.label + ' · ' + percent + '%</span>' +
            '</div>';
        });
        legendEl.innerHTML = legendHtml;
    },

    describeArc: function (cx, cy, outerR, innerR, startAngle, endAngle) {
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = cx + outerR * Math.cos(startRad);
        const y1 = cy + outerR * Math.sin(startRad);
        const x2 = cx + outerR * Math.cos(endRad);
        const y2 = cy + outerR * Math.sin(endRad);

        const x3 = cx + innerR * Math.cos(endRad);
        const y3 = cy + innerR * Math.sin(endRad);
        const x4 = cx + innerR * Math.cos(startRad);
        const y4 = cy + innerR * Math.sin(startRad);

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return [
            'M', x1, y1,
            'A', outerR, outerR, 0, largeArc, 1, x2, y2,
            'L', x3, y3,
            'A', innerR, innerR, 0, largeArc, 0, x4, y4,
            'Z'
        ].join(' ');
    },

    renderHealth: function () {
        const statusEl = document.getElementById('health-status-display');
        const titleEl = document.getElementById('health-title');
        const valueEl = document.getElementById('health-value');
        const badgeTextEl = document.getElementById('health-badge-text');
        const iconEl = document.getElementById('health-icon');

        if (!statusEl) return;

        const health = HealthModel.compute();

        statusEl.className = 'health-status';
        if (health.level !== 'none') statusEl.classList.add(health.level);

        titleEl.textContent = health.title;
        valueEl.textContent = health.value;
        badgeTextEl.textContent = health.badge;

        const iconMap = {
            excellent: 'fa-heart-pulse',
            good: 'fa-heart-pulse',
            moderate: 'fa-heart-pulse',
            warning: 'fa-triangle-exclamation',
            critical: 'fa-circle-exclamation',
            none: 'fa-heart-pulse'
        };
        iconEl.innerHTML = '<i class="fas ' + (iconMap[health.level] || 'fa-heart-pulse') + '"></i>';
    },

    renderStreak: function () {
        const streak = StreakModel.get();
        const card = document.getElementById('streak-display');
        const titleEl = document.getElementById('streak-title');
        const subEl = document.getElementById('streak-sub');
        const recordEl = document.getElementById('streak-record');

        if (!card || !titleEl) return;

        const current = streak.current || 0;

        titleEl.textContent = current + ' jour' + (current > 1 ? 's' : '');

        if (current === 0) {
            subEl.textContent = 'Commencez votre série aujourd\'hui';
            card.classList.add('inactive');
        } else if (current === 1) {
            subEl.textContent = 'Premier jour, continuez !';
            card.classList.remove('inactive');
        } else if (current < 7) {
            subEl.textContent = 'Belle série, ne cassez pas le rythme';
            card.classList.remove('inactive');
        } else if (current < 30) {
            subEl.textContent = 'Impressionnant ! Continuez ainsi';
            card.classList.remove('inactive');
        } else {
            subEl.textContent = 'Légendaire 🔥';
            card.classList.remove('inactive');
        }

        recordEl.textContent = (streak.record || 0) + 'j';
    },

    renderProjection: function () {
        const avgEl = document.getElementById('avg-daily-spend');
        const depletionEl = document.getElementById('depletion-date');
        const barEl = document.getElementById('projection-bar');
        if (!avgEl) return;

        const proj = ProjectionModel.compute();
        const currency = State.get('currency');

        avgEl.textContent = Utils.formatMoney(proj.avgDailySpend, currency);
        depletionEl.textContent = proj.depletionDateText;

        depletionEl.classList.remove('projection-warning', 'projection-danger');

        if (proj.depletionDateText === 'Déjà épuisé') {
            depletionEl.classList.add('projection-danger');
        } else if (proj.depletionDays > 0 && proj.depletionDays <= proj.daysLeft) {
            depletionEl.classList.add('projection-warning');
        }

        const barWidth = Math.min(100, Math.max(0, proj.budgetProgress));
        barEl.style.width = barWidth + '%';
        barEl.classList.remove('warning', 'danger');

        if (proj.budgetProgress >= 100) {
            barEl.classList.add('danger');
        } else if (proj.budgetProgress > proj.monthProgress + 15) {
            barEl.classList.add('warning');
        }
    },

    renderMandatStatus: function () {
        const hasMandat = (State.get('mandat') || 0) > 0;
        const statusIcon = document.getElementById('mandat-status-icon');
        const statusTitle = document.getElementById('mandat-status-title');
        const statusValue = document.getElementById('mandat-status-value');
        const quickMandatBtn = document.getElementById('quick-mandat-btn');

        if (!statusIcon) return;

        if (hasMandat) {
            statusIcon.className = 'mandat-status-icon set';
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusTitle.textContent = 'Mandat défini';
            statusValue.textContent = 'Net : ' + Utils.formatMoney(
                (State.get('mandat') || 0) - (State.get('fees') || 0),
                State.get('currency')
            );
            if (quickMandatBtn) {
                quickMandatBtn.style.opacity = '0.55';
                quickMandatBtn.style.pointerEvents = 'none';
            }
        } else {
            statusIcon.className = 'mandat-status-icon not-set';
            statusIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            statusTitle.textContent = 'Aucun mandat défini';
            statusValue.textContent = 'Cliquez sur la carte ci-dessous';
            if (quickMandatBtn) {
                quickMandatBtn.style.opacity = '1';
                quickMandatBtn.style.pointerEvents = 'auto';
            }
        }
    },

    renderStepIndicator: function () {
        const hasMandat = (State.get('mandat') || 0) > 0;
        const hasExpenses = State.get('transactions').length > 0;

        const step1Dot = document.getElementById('step1-dot');
        const step1Line = document.getElementById('step1-line');
        const step2Dot = document.getElementById('step2-dot');
        const step2Line = document.getElementById('step2-line');
        const step3Dot = document.getElementById('step3-dot');

        if (step1Dot) {
            if (hasMandat) {
                step1Dot.classList.add('completed');
                step1Dot.innerHTML = '<i class="fas fa-check"></i>';
                if (step1Line) step1Line.classList.add('completed');
            } else {
                step1Dot.classList.remove('completed');
                step1Dot.innerHTML = '1';
                if (step1Line) step1Line.classList.remove('completed');
            }
        }

        if (step2Dot) {
            if (hasExpenses) {
                step2Dot.classList.add('completed');
                step2Dot.innerHTML = '<i class="fas fa-check"></i>';
                if (step2Line) step2Line.classList.add('completed');
            } else {
                step2Dot.classList.remove('completed');
                step2Dot.innerHTML = '2';
                if (step2Line) step2Line.classList.remove('completed');
            }
        }

        if (step3Dot) {
            if (hasMandat && hasExpenses) {
                step3Dot.classList.add('active');
                if (!State.get('tutorialCompleted')) {
                    State.set('tutorialCompleted', true);
                    State.save();
                    ToastView.showPremium('Félicitations ! Vous maîtrisez Guruss Kitti', 'success');
                }
            } else {
                step3Dot.classList.remove('active');
            }
        }
    },

    renderBudgetAlert: function () {
        const totals = TotalsModel.get();
        const currency = State.get('currency');
        let alertEl = document.getElementById('budget-alert');

        if (!alertEl) {
            alertEl = document.createElement('div');
            alertEl.id = 'budget-alert';
            alertEl.className = 'budget-alert';
            const balanceCard = document.querySelector('.balance-card');
            if (balanceCard && balanceCard.parentNode) {
                balanceCard.parentNode.insertBefore(alertEl, balanceCard.nextSibling);
            }
        }

        if (!alertEl) return;

        const alertThreshold = State.get('alertThreshold') || 80;

        if (totals.isOverBudget) {
            alertEl.innerHTML =
                '<div class="alert-content danger">' +
                    '<div class="alert-icon"><i class="fas fa-exclamation-triangle"></i></div>' +
                    '<div class="alert-text">' +
                        '<strong>Budget dépassé</strong>' +
                        '<span>Déficit de ' + Utils.formatMoney(totals.deficit, currency) + '</span>' +
                    '</div>' +
                    '<div class="alert-actions">' +
                        '<button onclick="AppController.switchTab(\'ops\')" class="alert-btn">' +
                            '<i class="fas fa-eye"></i> Voir' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="progress-bar-container">' +
                    '<div class="progress-bar danger" style="width: 100%"></div>' +
                '</div>';
            alertEl.style.display = 'block';
        } else if (totals.percentUsed >= alertThreshold && State.get('alertVisual')) {
            alertEl.innerHTML =
                '<div class="alert-content warning">' +
                    '<div class="alert-icon"><i class="fas fa-exclamation-circle"></i></div>' +
                    '<div class="alert-text">' +
                        '<strong>Attention</strong>' +
                        '<span>' + totals.percentUsed.toFixed(0) + '% du budget utilisé</span>' +
                    '</div>' +
                '</div>' +
                '<div class="progress-bar-container">' +
                    '<div class="progress-bar warning" style="width: ' + totals.percentUsed + '%"></div>' +
                '</div>';
            alertEl.style.display = 'block';
        } else if (totals.percentUsed > 0) {
            alertEl.innerHTML =
                '<div class="progress-bar-container" style="border-radius: var(--r-lg);">' +
                    '<div class="progress-bar" style="width: ' + totals.percentUsed + '%"></div>' +
                '</div>';
            alertEl.style.display = 'block';
        } else {
            alertEl.style.display = 'none';
        }
    }
};

/* ============================================================
   CONTROLLER : App
   ============================================================ */

const AppController = {
    isUnlockedFlag: false,
    passwordAttempts: 0,

    start: function () {
        try {
            Database.load();
            this.injectSVGGradient();

            // Appliquer le thème
            if (State.get('dark')) {
                document.body.classList.add('dark');
                const icon = document.getElementById('theme-icon');
                if (icon) icon.className = 'fas fa-sun';
            } else {
                document.body.classList.remove('dark');
                const icon = document.getElementById('theme-icon');
                if (icon) icon.className = 'fas fa-moon';
            }

            // Appliquer le privacy mode
            if (State.get('privacyMode')) {
                document.body.classList.add('privacy-mode');
                const pIcon = document.getElementById('privacy-icon');
                if (pIcon) pIcon.className = 'fas fa-eye-slash';
            }

            this.attachGlobalListeners();

            if (!this.hasUserName()) {
                this.showFirstNameScreen();
                return;
            }

            this.updateUserInterface();

            if (this.isPasswordEnabled()) {
                this.showLockScreen();
            } else {
                this.isUnlockedFlag = true;
                const appEl = document.getElementById('app');
                if (appEl) appEl.style.display = 'block';
                this.refreshUI();

                setTimeout(function () {
                    ToastView.showPremium('Bienvenue ' + State.get('userName'), 'success');
                }, 500);
            }

            this.registerServiceWorker();
        } catch (err) {
            console.error('Erreur au démarrage:', err);
            const appEl = document.getElementById('app');
            if (appEl) appEl.style.display = 'block';
            try { ToastView.show('Erreur : ' + err.message, true); } catch (e) {}
        }
    },

    injectSVGGradient: function () {
        const svg = document.querySelector('.budget-gauge');
        if (!svg || svg.querySelector('#gaugeGradient')) return;

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'gaugeGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#8B5CF6');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#F59E0B');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
    },

    hasUserName: function () {
        const name = State.get('userName');
        return typeof name === 'string' && name.trim().length > 0;
    },

    isPasswordEnabled: function () {
        const pwd = State.get('password');
        return typeof pwd === 'string' && pwd.length > 0;
    },

    isUnlocked: function () {
        return this.isUnlockedFlag;
    },

    updateUserInterface: function () {
        this.updateUserName();
        SettingsController.updateLabels();
    },

    updateUserName: function () {
        const welcomeEl = document.getElementById('welcome-username');
        if (!welcomeEl) return;
        if (this.hasUserName()) {
            welcomeEl.textContent = 'Bienvenue, ' + State.get('userName');
        } else {
            welcomeEl.textContent = 'Bienvenue';
        }

        const label = document.getElementById('current-name-label');
        if (label) {
            if (this.hasUserName()) {
                label.textContent = State.get('userName');
                label.style.color = '';
            } else {
                label.textContent = 'Non défini';
                label.style.color = 'var(--gold-500)';
            }
        }
    },

    showFirstNameScreen: function () {
        const appEl = document.getElementById('app');
        if (appEl) appEl.style.display = 'none';
        SheetView.open('sheet-first-launch');
        setTimeout(function () {
            const input = document.getElementById('first-name-input');
            if (input) { input.value = ''; input.focus(); }
        }, 400);
    },

    showLockScreen: function () {
        this.isUnlockedFlag = false;
        const appEl = document.getElementById('app');
        if (appEl) appEl.style.display = 'none';
        SheetView.open('sheet-password-lock');
        setTimeout(function () {
            const input = document.getElementById('unlock-password');
            if (input) { input.value = ''; input.disabled = false; input.focus(); }
        }, 400);
    },

    refreshUI: function () {
        DashboardView.render();
        DashboardView.renderBudgetAlert();
        TransactionListView.renderJournalieres();
        TransactionListView.renderMensuelles();
        TransactionListView.renderMarche();
        TransactionListView.renderIncomes();
        TransactionListView.renderDebts();
        TransactionListView.renderAbonnements();
        TransactionListView.renderArchives();
        WalletView.render();
        WalletView.populateSelects();
        SavingsView.render();
        StreakModel.update();
        State.save();
    },

    switchTab: function (tabId) {
        document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
        const target = document.getElementById('view-' + tabId);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
        const navBtn = document.querySelector('.nav-item[data-tab="' + tabId + '"]');
        if (navBtn) navBtn.classList.add('active');

        Haptic.light();

        try {
            window.scrollTo({ top: 0, behavior: Utils.prefersReducedMotion() ? 'auto' : 'smooth' });
        } catch (e) {
            window.scrollTo(0, 0);
        }

        if (tabId === 'home') {
            setTimeout(function () { DashboardView.renderChart(); }, 100);
        }
    },

    attachGlobalListeners: function () {
        const self = this;

        // Navigation
        document.querySelectorAll('.nav-item').forEach(function (btn) {
            btn.addEventListener('click', function () { self.switchTab(btn.dataset.tab); });
        });

        // Quick actions
        document.getElementById('quick-expense-btn')?.addEventListener('click', function () { SheetView.open('sheet-journaliere'); });
        document.getElementById('quick-debt-btn')?.addEventListener('click', function () { SheetView.open('sheet-dette'); });
        document.getElementById('quick-income-btn')?.addEventListener('click', function () { SheetView.open('sheet-income'); });
        document.getElementById('quick-savings-btn')?.addEventListener('click', function () { SheetView.open('sheet-savings'); });

        // Mandat
        const quickMandat = document.getElementById('quick-mandat-btn');
        if (quickMandat) {
            quickMandat.addEventListener('click', function () { SheetView.open('sheet-mandat'); });
            quickMandat.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    SheetView.open('sheet-mandat');
                }
            });
        }

        // Actions topbar
        document.getElementById('info-btn')?.addEventListener('click', function () { SheetView.open('sheet-about'); });
        document.getElementById('theme-toggle')?.addEventListener('click', function () { self.toggleTheme(); });
        document.getElementById('privacy-toggle')?.addEventListener('click', function () { self.togglePrivacy(); });

        // Clôture
        document.getElementById('cloture-btn')?.addEventListener('click', function () { MonthController.cloture(); });

        // Archives
        document.getElementById('export-all-pdf')?.addEventListener('click', function () { ArchiveController.exportAllPDF(); });
        document.getElementById('export-db-btn')?.addEventListener('click', function () { SettingsController.exportDatabase(); });

        // Filtres
        document.querySelectorAll('.filter-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                document.querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');
                self.applyFilter(chip.dataset.filter);
            });
        });

        // Magic bar (NLP)
        const magicSubmit = document.getElementById('magic-submit');
        const magicInput = document.getElementById('magic-input');
        if (magicSubmit) magicSubmit.addEventListener('click', function () { NLPController.submit(); });
        if (magicInput) {
            magicInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') NLPController.submit();
            });
        }

        // Portefeuille / Savings
        document.getElementById('save-wallet')?.addEventListener('click', function () { WalletController.create(); });
        document.getElementById('save-savings')?.addEventListener('click', function () { SavingsController.create(); });
        document.getElementById('save-transfer')?.addEventListener('click', function () { SavingsController.saveTransfer(); });

        // Transactions
        document.getElementById('save-mandat')?.addEventListener('click', function () { MandatController.save(); });
        document.getElementById('save-journaliere')?.addEventListener('click', function () { TransactionController.saveJournaliere(); });
        document.getElementById('save-expense')?.addEventListener('click', function () { TransactionController.saveMensuelle(); });
        document.getElementById('save-income')?.addEventListener('click', function () { TransactionController.saveIncome(); });
        document.getElementById('save-marche')?.addEventListener('click', function () { TransactionController.saveMarche(); });
        document.getElementById('save-dette')?.addEventListener('click', function () { DebtController.save(); });
        document.getElementById('save-abonnement')?.addEventListener('click', function () { AbonnementController.save(); });
        document.getElementById('save-nlp')?.addEventListener('click', function () { NLPController.confirm(); });

        // Settings
        document.getElementById('edit-name-btn')?.addEventListener('click', function () { SettingsController.editName(); });
        document.getElementById('password-settings-btn')?.addEventListener('click', function () { SettingsController.openPasswordSettings(); });
        document.getElementById('save-password-btn')?.addEventListener('click', function () { SettingsController.savePassword(); });
        document.getElementById('budget-alert-settings-btn')?.addEventListener('click', function () { SettingsController.openBudgetAlerts(); });
        document.getElementById('save-alerts-btn')?.addEventListener('click', function () { SettingsController.saveBudgetAlerts(); });
        document.getElementById('currency-settings-btn')?.addEventListener('click', function () { SettingsController.openCurrency(); });
        document.getElementById('save-currency-btn')?.addEventListener('click', function () { SettingsController.saveCurrency(); });
        document.getElementById('import-db-btn')?.addEventListener('click', function () {
            document.getElementById('import-file')?.click();
        });
        document.getElementById('import-file')?.addEventListener('change', function (e) {
            if (e.target.files.length) SettingsController.importDatabase(e.target.files[0]);
            e.target.value = '';
        });
        document.getElementById('reset-tutorial-btn')?.addEventListener('click', function () { SettingsController.resetTutorial(); });
        document.getElementById('reset-data-btn')?.addEventListener('click', function () { SettingsController.resetAllData(); });

        // Unlock
        document.getElementById('unlock-btn')?.addEventListener('click', function () { self.attemptUnlock(); });
        document.getElementById('unlock-password')?.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') self.attemptUnlock();
        });

        // First name
        document.getElementById('save-first-name-btn')?.addEventListener('click', function () { self.saveFirstName(); });
        document.getElementById('first-name-input')?.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') self.saveFirstName();
        });

        // Sheet buttons [data-sheet]
        document.querySelectorAll('[data-sheet]').forEach(function (btn) {
            btn.addEventListener('click', function () { SheetView.open('sheet-' + btn.dataset.sheet); });
        });

        // Close buttons
        document.querySelectorAll('.close-sheet').forEach(function (btn) {
            btn.addEventListener('click', function () { SheetView.close(); });
        });

        // Overlay click
        document.querySelectorAll('.overlay').forEach(function (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    if (overlay.id === 'sheet-password-lock' && self.isPasswordEnabled() && !self.isUnlockedFlag) return;
                    if (overlay.id === 'sheet-first-launch' && !self.hasUserName()) return;
                    SheetView.close();
                }
            });
        });

        // Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const lockEl = document.getElementById('sheet-password-lock');
                if (lockEl && lockEl.classList.contains('show') && self.isPasswordEnabled() && !self.isUnlockedFlag) return;
                const firstEl = document.getElementById('sheet-first-launch');
                if (firstEl && firstEl.classList.contains('show') && !self.hasUserName()) return;
                SheetView.close();
            }
        });

        // Resize
        window.addEventListener('resize', function () {
            clearTimeout(self._resizeTimer);
            self._resizeTimer = setTimeout(function () {
                document.querySelectorAll('.overlay.show .sheet').forEach(function (s) {
                    s.style.maxHeight = '';
                });
                DashboardView.renderChart();
            }, 150);
        });

        // Quick amounts
        this.initQuickAmounts();

        // Receipt upload
        this.initReceiptUpload();
    },

    initQuickAmounts: function () {
        document.querySelectorAll('.quick-amount').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const targetId = btn.getAttribute('data-target');
                const value = btn.getAttribute('data-value');
                if (!targetId || value === null) return;
                const target = document.getElementById(targetId);
                if (!target) return;
                target.value = value;
                Haptic.light();
                btn.parentNode?.querySelectorAll('.quick-amount').forEach(function (sib) {
                    sib.classList.remove('active');
                });
                btn.classList.add('active');
                setTimeout(function () { btn.classList.remove('active'); }, 1200);
                try { target.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
            });
        });
    },

    initReceiptUpload: function () {
        const input = document.getElementById('exp-receipt');
        const preview = document.getElementById('exp-receipt-preview');
        const label = document.getElementById('exp-receipt-label');

        if (!input || !preview) return;

        input.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            Utils.fileToBase64(file, 800, 800).then(function (base64) {
                AppController._receiptData = base64;
                preview.innerHTML = '<img src="' + base64 + '" alt="Reçu">' +
                    '<button class="receipt-preview-remove" type="button" aria-label="Retirer">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>';
                preview.classList.add('show');
                if (label) label.textContent = 'Reçu ajouté';

                preview.querySelector('.receipt-preview-remove').addEventListener('click', function () {
                    AppController._receiptData = null;
                    preview.innerHTML = '';
                    preview.classList.remove('show');
                    if (label) label.textContent = 'Ajouter un reçu';
                    input.value = '';
                });

                Haptic.success();
            }).catch(function (err) {
                console.error('Erreur upload reçu:', err);
                ToastView.show('Impossible de charger l\'image', true);
            });
        });
    },

    saveFirstName: function () {
        const input = document.getElementById('first-name-input');
        if (!input) return;
        const name = input.value.trim();

        if (!name || name.length < 2) {
            ToastView.show('Nom invalide (minimum 2 caractères)', true);
            return;
        }
        if (name.length > 40) {
            ToastView.show('Nom trop long (maximum 40 caractères)', true);
            return;
        }

        State.set('userName', name);
        State.save();
        this.updateUserName();
        SheetView.close(true);
        Haptic.premium();

        if (this.isPasswordEnabled()) {
            this.showLockScreen();
        } else {
            this.isUnlockedFlag = true;
            const appEl = document.getElementById('app');
            if (appEl) appEl.style.display = 'block';
            this.refreshUI();

            setTimeout(function () {
                ToastView.showPremium('Bienvenue ' + name, 'success');
            }, 400);
        }
    },

    attemptUnlock: function () {
        const input = document.getElementById('unlock-password');
        const errorEl = document.getElementById('unlock-error');
        if (!input || !errorEl) return;

        const pwd = input.value;

        if (!pwd) {
            errorEl.style.display = 'flex';
            errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Veuillez entrer un mot de passe</span>';
            Haptic.error();
            return;
        }

        if (Utils.hashPassword(pwd) === State.get('password')) {
            this.isUnlockedFlag = true;
            this.passwordAttempts = 0;
            SheetView.close(true);

            const appEl = document.getElementById('app');
            if (appEl) appEl.style.display = 'block';

            this.refreshUI();
            Haptic.premium();
            ToastView.showPremium('Déverrouillé avec succès', 'success');

            input.value = '';
            errorEl.style.display = 'none';
        } else {
            this.passwordAttempts++;
            Haptic.error();
            errorEl.style.display = 'flex';

            if (this.passwordAttempts >= APP.MAX_PASSWORD_ATTEMPTS) {
                errorEl.innerHTML = '<i class="fas fa-lock"></i><span>Trop de tentatives. Patientez 30 secondes.</span>';
                input.disabled = true;

                setTimeout(function () {
                    input.disabled = false;
                    AppController.passwordAttempts = 0;
                    errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Mot de passe incorrect</span>';
                }, APP.LOCKOUT_DURATION);
            } else {
                const remaining = APP.MAX_PASSWORD_ATTEMPTS - this.passwordAttempts;
                errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Mot de passe incorrect (' + remaining + ' essais restants)</span>';
            }

            input.classList.add('password-error');
            setTimeout(function () { input.classList.remove('password-error'); }, 600);
            input.value = '';
            input.focus();
        }
    },

    toggleTheme: function () {
        const dark = !State.get('dark');
        State.set('dark', dark);
        document.body.classList.toggle('dark', dark);

        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';

        State.save();
        Haptic.light();
    },

    togglePrivacy: function () {
        const privacy = !State.get('privacyMode');
        State.set('privacyMode', privacy);
        document.body.classList.toggle('privacy-mode', privacy);

        const icon = document.getElementById('privacy-icon');
        if (icon) icon.className = privacy ? 'fas fa-eye-slash' : 'fas fa-eye';

        State.save();
        Haptic.light();
        ToastView.show(privacy ? 'Montants masqués' : 'Montants visibles');
    },

    applyFilter: function (filter) {
        document.querySelectorAll('#view-ops .card').forEach(function (card) {
            if (filter === 'all') {
                card.classList.remove('filtered-out');
            } else {
                card.classList.toggle('filtered-out', card.dataset.category !== filter);
            }
        });
    },

    registerServiceWorker: function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(function () {
                // Silencieux
            });
        }
    }
};

/* ============================================================
   CONTROLLER : NLP
   ============================================================ */

const NLPController = {
    _lastParsed: null,

    submit: function () {
        const input = document.getElementById('magic-input');
        if (!input) return;

        const text = input.value.trim();
        if (!text) {
            ToastView.show('Décrivez votre opération', true);
            return;
        }

        const parsed = NLPParser.parse(text);
        if (!parsed || !parsed.amount) {
            ToastView.show('Impossible de détecter le montant', true);
            Haptic.error();
            return;
        }

        this._lastParsed = parsed;
        this.renderPreview(parsed);
        SheetView.open('sheet-nlp-confirm');
    },

    renderPreview: function (parsed) {
        const container = document.getElementById('nlp-preview');
        if (!container) return;

        const currency = State.get('currency');
        const category = parsed.categoryName || 'Non détectée';
        const dateFormatted = Utils.formatDateLong(parsed.date);

        container.innerHTML =
            '<div class="nlp-row">' +
                '<div class="nlp-row-icon"><i class="fas fa-money-bill"></i></div>' +
                '<div class="nlp-row-label">Montant</div>' +
                '<div class="nlp-row-value">' + Utils.formatMoney(parsed.amount, currency) + '</div>' +
            '</div>' +
            '<div class="nlp-row">' +
                '<div class="nlp-row-icon"><i class="fas fa-tag"></i></div>' +
                '<div class="nlp-row-label">Catégorie</div>' +
                '<div class="nlp-row-value">' + Utils.escapeHtml(category) + '</div>' +
            '</div>' +
            '<div class="nlp-row">' +
                '<div class="nlp-row-icon"><i class="fas fa-calendar"></i></div>' +
                '<div class="nlp-row-label">Date</div>' +
                '<div class="nlp-row-value">' + dateFormatted + '</div>' +
            '</div>' +
            '<div class="nlp-row">' +
                '<div class="nlp-row-icon"><i class="fas fa-pen"></i></div>' +
                '<div class="nlp-row-label">Description</div>' +
                '<div class="nlp-row-value">' + Utils.escapeHtml(parsed.description) + '</div>' +
            '</div>';
    },

    confirm: function () {
        if (!this._lastParsed) return;

        const data = NLPParser.toTransactionData(this._lastParsed);

        // Vérification budget si c'est une dépense
        if (data.type === 'expense') {
            const check = BudgetModel.canSpend(data.amount);
            if (!check.ok) {
                Haptic.error();
                alert(check.message);
                ToastView.showPremium('Dépense refusée', 'error');
                return;
            }
            if (check.warning && !confirm(check.message)) return;
        }

        TransactionModel.create(data);

        Haptic.success();
        SheetView.close();

        const input = document.getElementById('magic-input');
        if (input) input.value = '';

        AppController.refreshUI();

        if (data.type === 'income') {
            ToastView.showPremium('Entrée de ' + Utils.formatMoney(data.amount, State.get('currency')) + ' ajoutée', 'success');
        } else if (data.type === 'debt') {
            ToastView.show('Ardoise notée');
        } else {
            ToastView.show('Dépense ajoutée via la Barre Magique');
        }

        this._lastParsed = null;
    }
};

/* ============================================================
   CONTROLLER : Mandat
   ============================================================ */

const MandatController = {
    save: function () {
        const amountInput = document.getElementById('m-amount');
        const feesInput = document.getElementById('m-fees');
        const walletInput = document.getElementById('m-wallet');
        if (!amountInput || !feesInput) return;

        const amount = parseFloat(amountInput.value) || 0;
        const fees = parseFloat(feesInput.value) || 0;
        const walletId = walletInput ? walletInput.value : 'wallet_cash';

        if (amount <= 0) {
            ToastView.show('Montant valide requis', true);
            return;
        }
        if (fees < 0) {
            ToastView.show('Les frais ne peuvent pas être négatifs', true);
            return;
        }
        if (fees >= amount) {
            ToastView.show('Les frais ne peuvent pas dépasser le montant', true);
            return;
        }

        State.set('mandat', amount);
        State.set('fees', fees);

        // Créditer le portefeuille
        const wallet = WalletModel.getById(walletId);
        if (wallet) {
            wallet.balance = (parseFloat(wallet.balance) || 0) + (amount - fees);
        }

        State.save();
        SheetView.close();
        AppController.refreshUI();
        Haptic.premium();
        ToastView.showPremium('Mandat de ' + Utils.formatMoney(amount - fees, State.get('currency')) + ' net enregistré', 'success');
    }
};

/* ============================================================
   CONTROLLER : Transaction
   ============================================================ */

const TransactionController = {
    saveJournaliere: function () {
        const motifInput = document.getElementById('jour-motif');
        const amountInput = document.getElementById('jour-montant');
        const walletInput = document.getElementById('jour-wallet');
        const essentialInput = document.getElementById('jour-essential');

        if (!motifInput || !amountInput) return;

        const motif = motifInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        const walletId = walletInput ? walletInput.value : 'wallet_cash';
        const isEssential = essentialInput ? essentialInput.checked : Utils.isEssential(motif);

        if (!motif || amount <= 0) {
            ToastView.show('Motif et montant valides requis', true);
            return;
        }

        const check = BudgetModel.canSpend(amount);
        if (!check.ok) {
            Haptic.error();
            alert(check.message);
            ToastView.showPremium('Dépense refusée', 'error');
            return;
        }
        if (check.warning && !confirm(check.message)) return;

        const category = CategoryModel.getByName(motif, 'journaliere') ||
                         CategoryModel.getByName('Divers');

        TransactionModel.create({
            type: 'expense',
            amount: amount,
            wallet_id: walletId,
            category_id: category ? category.id : null,
            description: motif,
            date: Utils.todayISO(),
            isEssential: isEssential
        });

        Haptic.success();
        SheetView.close();
        AppController.refreshUI();

        const totals = TotalsModel.get();
        if (totals.solde === 0) {
            ToastView.showPremium('Dépense ajoutée - Reste à vivre épuisé', 'info');
        } else if (totals.percentUsed >= (State.get('alertThreshold') || 80)) {
            ToastView.showPremium('Dépense ajoutée - ' + Math.round(totals.percentUsed) + '% utilisé', 'info');
        } else {
            ToastView.show('Dépense journalière ajoutée');
        }
    },

    saveMensuelle: function () {
        const catInput = document.getElementById('exp-cat');
        const descInput = document.getElementById('exp-desc');
        const amountInput = document.getElementById('exp-amount');
        const walletInput = document.getElementById('exp-wallet');

        if (!catInput || !descInput || !amountInput) return;

        const catName = catInput.value;
        const desc = descInput.value.trim() || catName;
        const amount = parseFloat(amountInput.value) || 0;
        const walletId = walletInput ? walletInput.value : 'wallet_cash';

        if (amount <= 0) {
            ToastView.show('Montant valide requis', true);
            return;
        }

        const check = BudgetModel.canSpend(amount);
        if (!check.ok) {
            Haptic.error();
            alert(check.message);
            ToastView.showPremium('Dépense refusée', 'error');
            return;
        }
        if (check.warning && !confirm(check.message)) return;

        const category = CategoryModel.getByName(catName, 'mensuelle') ||
                         CategoryModel.getByName('Autre');

        TransactionModel.create({
            type: 'expense',
            amount: amount,
            wallet_id: walletId,
            category_id: category ? category.id : null,
            description: desc,
            date: Utils.todayISO(),
            isEssential: Utils.isEssential(desc),
            receiptData: AppController._receiptData || null
        });

        // Reset receipt
        AppController._receiptData = null;
        const preview = document.getElementById('exp-receipt-preview');
        const label = document.getElementById('exp-receipt-label');
        if (preview) {
            preview.innerHTML = '';
            preview.classList.remove('show');
        }
        if (label) label.textContent = 'Ajouter un reçu';

        Haptic.success();
        SheetView.close();
        AppController.refreshUI();

        const totals = TotalsModel.get();
        if (totals.solde === 0) {
            ToastView.showPremium('Dépense ajoutée - Reste à vivre épuisé', 'info');
        } else if (totals.percentUsed >= (State.get('alertThreshold') || 80)) {
            ToastView.showPremium('Dépense ajoutée - ' + Math.round(totals.percentUsed) + '% utilisé', 'info');
        } else {
            ToastView.show('Dépense mensuelle ajoutée');
        }
    },

    saveIncome: function () {
        const sourceInput = document.getElementById('inc-source');
        const amountInput = document.getElementById('inc-amount');
        const walletInput = document.getElementById('inc-wallet');

        if (!sourceInput || !amountInput) return;

        const source = sourceInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        const walletId = walletInput ? walletInput.value : 'wallet_cash';

        if (!source || amount <= 0) {
            ToastView.show('Source et montant requis', true);
            return;
        }

        const category = CategoryModel.getByType('income')[0] || CategoryModel.getByName('Entrée');

        TransactionModel.create({
            type: 'income',
            amount: amount,
            wallet_id: walletId,
            category_id: category ? category.id : null,
            description: source,
            date: Utils.todayISO()
        });

        Haptic.success();
        SheetView.close();
        AppController.refreshUI();
        ToastView.showPremium('Entrée de ' + Utils.formatMoney(amount, State.get('currency')) + ' ajoutée', 'success');
    },

    saveMarche: function () {
        const produitInput = document.getElementById('marche-produit');
        const prixInput = document.getElementById('marche-prix');
        const walletInput = document.getElementById('marche-wallet');

        if (!produitInput || !prixInput) return;

        const produit = produitInput.value.trim();
        const amount = parseFloat(prixInput.value) || 0;
        const walletId = walletInput ? walletInput.value : 'wallet_cash';

        if (!produit || amount <= 0) {
            ToastView.show('Produit et prix valides requis', true);
            return;
        }

        const check = BudgetModel.canSpend(amount);
        if (!check.ok) {
            Haptic.error();
            alert(check.message);
            ToastView.showPremium('Achat refusé', 'error');
            return;
        }
        if (check.warning && !confirm(check.message)) return;

        const category = CategoryModel.getByName('Marché', 'marche');

        TransactionModel.create({
            type: 'expense',
            amount: amount,
            wallet_id: walletId,
            category_id: category ? category.id : null,
            description: produit,
            date: Utils.todayISO(),
            isEssential: Utils.isEssential(produit)
        });

        Haptic.success();
        SheetView.close();
        AppController.refreshUI();
        ToastView.show(produit + ' ajouté');
    },

    delete: function (id) {
        Haptic.light();
        TransactionModel.delete(id);
        AppController.refreshUI();
        ToastView.show('Transaction supprimée');
    }
};

/* ============================================================
   CONTROLLER : Debt
   ============================================================ */

const DebtController = {
    save: function () {
        const labelInput = document.getElementById('d-label');
        const amountInput = document.getElementById('d-amount');

        if (!labelInput || !amountInput) return;

        const label = labelInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;

        if (!label || amount <= 0) {
            ToastView.show('Créancier et montant requis', true);
            return;
        }

        const category = CategoryModel.getByName('Dette');

        TransactionModel.create({
            type: 'debt',
            amount: amount,
            wallet_id: 'wallet_cash',
            category_id: category ? category.id : null,
            description: label,
            date: Utils.todayISO()
        });

        Haptic.success();
        SheetView.close();
        AppController.refreshUI();
        ToastView.show('Ardoise notée');
    },

    settle: function (id) {
        const tx = State.get('transactions').find(function (t) { return t.id === id; });
        if (!tx) return;

        const totals = TotalsModel.get();
        const currency = State.get('currency');

        if (tx.amount > totals.solde) {
            Haptic.error();
            ToastView.showPremium('Reste à vivre insuffisant', 'error');
            alert('Impossible de régler cette ardoise.\n\n' +
                'Reste à vivre : ' + Utils.formatMoney(totals.solde, currency) + '\n' +
                'Dette : ' + Utils.formatMoney(tx.amount, currency));
            return;
        }

        if (!confirm('Régler l\'ardoise de ' + Utils.formatMoney(tx.amount, currency) +
            ' à ' + tx.description + ' ?')) return;

        Haptic.premium();
        State.set('mandat', (State.get('mandat') || 0) - tx.amount);

        // Marquer comme réglée + convertir en dépense
        tx.type = 'debt_payment';

        State.save();
        AppController.refreshUI();
        ToastView.showPremium('Dette réglée - ' + Utils.formatMoney(tx.amount, currency), 'success');
    }
};

/* ============================================================
   CONTROLLER : Wallet
   ============================================================ */

const WalletController = {
    create: function () {
        const nameInput = document.getElementById('w-name');
        const typeInput = document.getElementById('w-type');
        const balanceInput = document.getElementById('w-balance');
        const iconInput = document.getElementById('w-icon');

        if (!nameInput || !typeInput || !balanceInput || !iconInput) return;

        const name = nameInput.value.trim();
        const type = typeInput.value;
        const balance = parseFloat(balanceInput.value) || 0;
        const icon = iconInput.value;

        if (!name || name.length < 2) {
            ToastView.show('Nom invalide', true);
            return;
        }

        WalletModel.create({ name: name, type: type, balance: balance, icon: icon });

        Haptic.success();
        SheetView.close();
        AppController.refreshUI();
        ToastView.show('Portefeuille "' + name + '" créé');
    },

    delete: function (id) {
        const wallet = WalletModel.getById(id);
        if (!wallet) return;

        if (wallet.isDefault) {
            ToastView.show('Impossible de supprimer un portefeuille par défaut', true);
            return;
        }

        const hasOps = State.get('transactions').some(function (t) { return t.wallet_id === id; });

        const msg = hasOps
            ? 'Ce portefeuille contient des opérations. Supprimer quand même ?'
            : 'Supprimer le portefeuille "' + wallet.name + '" ?';

        if (!confirm(msg)) return;

        WalletModel.delete(id);
        Haptic.success();
        AppController.refreshUI();
        ToastView.show('Portefeuille supprimé');
    }
};

/* ============================================================
   CONTROLLER : Savings
   ============================================================ */

const SavingsController = {
    _currentTransferId: null,

    create: function () {
        const nameInput = document.getElementById('s-name');
        const targetInput = document.getElementById('s-target');
        const deadlineInput = document.getElementById('s-deadline');
        const initialInput = document.getElementById('s-initial');

        if (!nameInput || !targetInput || !initialInput) return;

        const name = nameInput.value.trim();
        const target = parseFloat(targetInput.value) || 0;
        const deadline = deadlineInput ? deadlineInput.value : '';
        const initial = parseFloat(initialInput.value) || 0;

        if (!name || name.length < 2) {
            ToastView.show('Nom invalide', true);
            return;
        }
        if (target <= 0) {
            ToastView.show('Montant cible requis', true);
            return;
        }

        const totals = TotalsModel.get();
        if (initial > totals.solde) {
            ToastView.show('Montant initial supérieur au solde', true);
            Haptic.error();
            return;
        }

        SavingsModel.create({
            name: name,
            target: target,
            current: initial,
            deadline: deadline || null
        });

        if (initial > 0) {
            State.set('mandat', (State.get('mandat') || 0) - initial);
            State.save();
        }

        Haptic.premium();
        SheetView.close();
        AppController.refreshUI();
        ToastView.showPremium('Cagnotte "' + name + '" créée', 'success');
    },

    delete: function (id) {
        const savings = SavingsModel.getById(id);
        if (!savings) return;

        if (!confirm('Supprimer la cagnotte "' + savings.name + '" ?\nLe montant épargné sera remboursé.')) return;

        State.set('mandat', (State.get('mandat') || 0) + (parseFloat(savings.current) || 0));
        SavingsModel.delete(id);
        State.save();

        Haptic.success();
        AppController.refreshUI();
        ToastView.show('Cagnotte supprimée, montant remboursé');
    },

    openTransfer: function (id) {
        const savings = SavingsModel.getById(id);
        if (!savings) return;

        this._currentTransferId = id;

        const infoEl = document.getElementById('transfer-info-text');
        if (infoEl) {
            const remaining = Math.max(0, savings.target - savings.current);
            infoEl.textContent = 'Cagnotte : ' + savings.name + ' — Reste à atteindre : ' +
                Utils.formatMoney(remaining, State.get('currency'));
        }

        const idInput = document.getElementById('transfer-savings-id');
        const amountInput = document.getElementById('transfer-amount');
        if (idInput) idInput.value = id;
        if (amountInput) amountInput.value = '';

        SheetView.open('sheet-savings-transfer');
    },

    saveTransfer: function () {
        if (!this._currentTransferId) return;

        const amountInput = document.getElementById('transfer-amount');
        if (!amountInput) return;

        const amount = parseFloat(amountInput.value) || 0;

        if (amount <= 0) {
            ToastView.show('Montant invalide', true);
            return;
        }

        const totals = TotalsModel.get();
        if (amount > totals.solde) {
            ToastView.show('Solde insuffisant', true);
            Haptic.error();
            return;
        }

        const savings = SavingsModel.getById(this._currentTransferId);
        if (!savings) return;

        SavingsModel.transfer(this._currentTransferId, amount);
        State.set('mandat', (State.get('mandat') || 0) - amount);
        State.save();

        Haptic.premium();
        SheetView.close();
        AppController.refreshUI();

        if (savings.current >= savings.target) {
            ToastView.showPremium('Objectif atteint ! ' + savings.name, 'success');
        } else {
            ToastView.show(Utils.formatMoney(amount, State.get('currency')) + ' transféré vers ' + savings.name);
        }

        this._currentTransferId = null;
    }
};

/* ============================================================
   CONTROLLER : Abonnement
   ============================================================ */

const AbonnementController = {
    save: function () {
        const nameInput = document.getElementById('abo-nom');
        const amountInput = document.getElementById('abo-montant');
        const startInput = document.getElementById('abo-debut');
        const endInput = document.getElementById('abo-fin');

        if (!nameInput || !amountInput || !startInput || !endInput) return;

        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        const dateDebut = startInput.value;
        const dateFin = endInput.value;

        if (!name || amount <= 0 || !dateDebut || !dateFin) {
            ToastView.show('Remplissez tous les champs', true);
            return;
        }
        if (dateDebut > dateFin) {
            ToastView.show('La date de fin doit être après le début', true);
            return;
        }

        AbonnementModel.create({
            name: name,
            amount: amount,
            dateDebut: dateDebut,
            dateFin: dateFin
        });

        Haptic.success();
        SheetView.close();
        AppController.refreshUI();
        ToastView.show('Abonnement enregistré');
    },

    delete: function (id) {
        Haptic.light();
        AbonnementModel.delete(id);
        AppController.refreshUI();
        ToastView.show('Abonnement supprimé');
    }
};

/* ============================================================
   CONTROLLER : Month (clôture)
   ============================================================ */

const MonthController = {
    cloture: function () {
        const totals = TotalsModel.get();
        const transactions = State.get('transactions');

        if (transactions.length === 0 && totals.net === 0) {
            ToastView.show('Rien à archiver ce mois-ci', true);
            return;
        }

        if (!confirm('Clôturer ce mois ? Les données seront archivées et remises à zéro.')) return;

        Haptic.premium();
        const monthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

        ArchiveModel.create({
            month: capitalized,
            transactions: transactions.slice(),
            abonnements: AbonnementModel.getAll().slice(),
            net: totals.net,
            solde: totals.solde
        });

        // Reset
        State.set('transactions', []);
        State.set('abonnements', []);
        State.set('mandat', 0);
        State.set('fees', 0);
        State.get('wallets').forEach(function (w) { w.balance = 0; });

        // Reset streak sur clôture
        StreakModel.reset();

        State.save();
        DashboardView.previousValues = {};
        AppController.refreshUI();
        ToastView.showPremium('Mois archivé avec succès', 'success');
        AppController.switchTab('archive');
    }
};

/* ============================================================
   CONTROLLER : Archive
   ============================================================ */

const ArchiveController = {
    _currentPDF: null,

    viewDetails: function (id) {
        const archive = ArchiveModel.getById(id);
        if (!archive) return;

        this._currentPDF = archive;

        const titleEl = document.getElementById('arch-det-title');
        if (titleEl) {
            titleEl.innerHTML = '<i class="fas fa-calendar-alt"></i> ' + Utils.escapeHtml(archive.month);
        }

        const contentEl = document.getElementById('arch-det-content');
        if (!contentEl) return;

        const currency = State.get('currency');
        const soldeColor = archive.solde >= 0 ? 'var(--emerald-500)' : 'var(--rose-500)';

        const txs = archive.transactions || [];
        const journalieres = txs.filter(function (t) {
            const cat = CategoryModel.getById(t.category_id);
            return cat && cat.type === 'journaliere';
        });
        const mensuelles = txs.filter(function (t) {
            const cat = CategoryModel.getById(t.category_id);
            return cat && cat.type === 'mensuelle';
        });
        const marche = txs.filter(function (t) {
            const cat = CategoryModel.getById(t.category_id);
            return cat && cat.type === 'marche';
        });
        const incomes = txs.filter(function (t) { return t.type === 'income'; });
        const dettes = txs.filter(function (t) { return t.type === 'debt'; });

        function renderList(items, icon, iconClass, nameProp) {
            if (!items || !items.length) {
                return '<div class="empty-state" style="padding: 20px"><i class="fas fa-inbox"></i><div>Aucun élément</div></div>';
            }
            let html = '';
            items.forEach(function (item) {
                html += '<div class="list-item" style="padding: 12px 0;">' +
                    '<div class="item-icon ' + iconClass + '"><i class="' + icon + '"></i></div>' +
                    '<div class="item-info">' +
                        '<div class="item-title">' + Utils.escapeHtml(item[nameProp]) + '</div>' +
                        '<div class="item-sub">' + Utils.escapeHtml(item.date || '') + '</div>' +
                    '</div>' +
                    '<div class="item-amount">' + Utils.formatMoney(item.amount, currency) + '</div>' +
                '</div>';
            });
            return html;
        }

        contentEl.innerHTML =
            '<div class="summary-cards">' +
                '<div class="stat-card"><div class="stat-label">Mandat net</div><div class="stat-value">' + Utils.formatMoney(archive.net, currency) + '</div></div>' +
                '<div class="stat-card"><div class="stat-label">Solde final</div><div class="stat-value" style="color: ' + soldeColor + '">' + Utils.formatMoney(archive.solde, currency) + '</div></div>' +
            '</div>' +
            '<h4 style="margin: 20px 0 12px; font-weight: 700; font-family: Outfit, sans-serif;"><i class="fas fa-coffee"></i> Dépenses Journalières</h4>' +
            renderList(journalieres, 'fas fa-coffee', 'cat-journaliere', 'description') +
            '<h4 style="margin: 20px 0 12px; font-weight: 700; font-family: Outfit, sans-serif;"><i class="fas fa-receipt"></i> Dépenses mensuelles</h4>' +
            renderList(mensuelles, 'fas fa-receipt', 'cat-depense', 'description') +
            '<h4 style="margin: 20px 0 12px; font-weight: 700; font-family: Outfit, sans-serif;"><i class="fas fa-arrow-down"></i> Entrées d\'argent</h4>' +
            renderList(incomes, 'fas fa-arrow-down', 'cat-income', 'description') +
            '<h4 style="margin: 20px 0 12px; font-weight: 700; font-family: Outfit, sans-serif;"><i class="fas fa-leaf"></i> Marché</h4>' +
            renderList(marche, 'fas fa-leaf', 'cat-marche', 'description') +
            '<h4 style="margin: 20px 0 12px; font-weight: 700; font-family: Outfit, sans-serif;"><i class="fas fa-hand-holding-usd"></i> Dettes</h4>' +
            renderList(dettes, 'fas fa-file-invoice', 'cat-dette', 'description');

        SheetView.open('sheet-archive-details');
    },

    exportAllPDF: function () {
        const archives = ArchiveModel.getAll();
        if (!archives.length) {
            ToastView.show('Aucune archive à exporter', true);
            return;
        }
        if (typeof html2pdf === 'undefined') {
            ToastView.show('Module PDF non disponible', true);
            return;
        }

        const element = document.createElement('div');
        element.innerHTML = this.generateFullPDFContent(archives);

        const opt = {
            margin: 0.5,
            filename: 'archives_completes.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
        ToastView.showPremium('Export de toutes les archives', 'success');
    },

    exportSinglePDF: function (archive) {
        if (!archive || typeof html2pdf === 'undefined') return;

        const element = document.createElement('div');
        element.innerHTML = this.generateSinglePDFContent(archive);

        const opt = {
            margin: 0.5,
            filename: 'archive_' + archive.month.replace(/\s+/g, '_') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, letterRendering: true, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
        ToastView.showPremium('Export PDF : ' + archive.month, 'success');
    },

    generateBaseStyles: function () {
        return '<style>' +
            'body { font-family: Inter, sans-serif; padding: 40px; color: #1F2937; }' +
            '.header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #8B5CF6; }' +
            '.header h1 { color: #8B5CF6; font-size: 28px; margin-bottom: 8px; }' +
            '.header .author { color: #F59E0B; font-size: 14px; letter-spacing: 2px; }' +
            '.report-date { text-align: right; margin-bottom: 30px; color: #6B7280; font-size: 12px; }' +
            '.archive-section { margin-bottom: 50px; page-break-after: avoid; }' +
            '.archive-title { background: #F3F4F6; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; }' +
            '.archive-title h2 { color: #8B5CF6; font-size: 20px; margin: 0; }' +
            '.summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }' +
            '.summary-card { flex: 1; background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #E5E7EB; }' +
            '.summary-card .label { font-size: 12px; color: #6B7280; text-transform: uppercase; }' +
            '.summary-card .value { font-size: 24px; font-weight: 700; color: #8B5CF6; margin-top: 8px; }' +
            'table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }' +
            'th { background: #F3F4F6; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #E5E7EB; }' +
            'td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; }' +
            '.amount { text-align: right; }' +
            '</style>';
    },

    generateArchiveBlock: function (a) {
        const currency = State.get('currency');
        let html = '<div class="archive-section">';
        html += '<div class="archive-title"><h2>' + Utils.escapeHtml(a.month) + '</h2></div>';
        html += '<div class="summary-cards">' +
            '<div class="summary-card"><div class="label">Mandat net</div><div class="value">' + Utils.formatMoney(a.net, currency) + '</div></div>' +
            '<div class="summary-card"><div class="label">Solde final</div><div class="value" style="color: ' + (a.solde >= 0 ? '#10B981' : '#F43F5E') + '">' + Utils.formatMoney(a.solde, currency) + '</div></div>' +
        '</div>';

        const txs = a.transactions || [];
        const rows = txs.map(function (t) {
            const cat = CategoryModel.getById(t.category_id);
            return [Utils.escapeHtml(t.description), cat ? cat.name : '', Utils.formatMoney(t.amount, currency)];
        });

        html += '<h3>Transactions</h3><table><thead><tr><th>Description</th><th>Catégorie</th><th class="amount">Montant</th></tr></thead><tbody>';
        if (rows.length) {
            rows.forEach(function (r) {
                html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td class="amount">' + r[2] + '</td></tr>';
            });
        } else {
            html += '<tr><td colspan="3" style="text-align:center">Aucune transaction</td></tr>';
        }
        html += '</tbody></table></div>';
        return html;
    },

    generateSinglePDFContent: function (archive) {
        const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        const signature =
            '<div style="margin-top: 40px; padding-top: 20px; text-align: center; border-top: 2px solid #E5E7EB;">' +
                '<p style="font-family: Outfit, sans-serif; font-size: 16px; font-weight: 700; color: #8B5CF6;">' + APP.DEVELOPER + '</p>' +
                '<p style="font-size: 10px; color: #9CA3AF;">' + APP.NAME + ' ' + APP.VERSION + ' - Généré le ' + date + '</p>' +
            '</div>';

        return '<html><head><meta charset="UTF-8"><title>' + APP.NAME + ' - ' + archive.month + '</title>' +
            this.generateBaseStyles() + '</head><body>' +
            '<div class="header"><h1>RAPPORT MENSUEL</h1><p>' + APP.NAME + '</p><p class="author">' + APP.DEVELOPER + '</p></div>' +
            '<div class="report-date">Généré le ' + date + '</div>' +
            this.generateArchiveBlock(archive) +
            signature + '</body></html>';
    },

    generateFullPDFContent: function (archives) {
        const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        const self = this;

        const signature =
            '<div style="margin-top: 40px; padding-top: 20px; text-align: center; border-top: 2px solid #E5E7EB;">' +
                '<p style="font-family: Outfit, sans-serif; font-size: 16px; font-weight: 700; color: #8B5CF6;">' + APP.DEVELOPER + '</p>' +
                '<p style="font-size: 10px; color: #9CA3AF;">' + APP.NAME + ' ' + APP.VERSION + ' - Généré le ' + date + '</p>' +
            '</div>';

        let html = '<html><head><meta charset="UTF-8"><title>' + APP.NAME + ' - Archives</title>' +
            this.generateBaseStyles() + '</head><body>' +
            '<div class="header"><h1>' + APP.NAME + '</h1><p>Rapport complet</p><p class="author">' + APP.DEVELOPER + '</p></div>' +
            '<div class="report-date">Généré le ' + date + '</div>';

        archives.forEach(function (a) {
            html += self.generateArchiveBlock(a);
            html += '<div style="page-break-after: always;"></div>';
        });

        html += signature + '</body></html>';
        return html;
    }
};

/* ============================================================
   CONTROLLER : Settings
   ============================================================ */

const SettingsController = {
    editName: function () {
        const currentName = State.get('userName') || '';
        const newName = prompt('Entrez votre nouveau nom :', currentName);

        if (newName === null) return;
        const trimmed = newName.trim();

        if (!trimmed || trimmed.length < 2) {
            ToastView.show('Nom invalide', true);
            return;
        }

        State.set('userName', trimmed);
        State.save();
        AppController.updateUserName();
        Haptic.premium();
        ToastView.showPremium('Nom mis à jour', 'success');
    },

    updateLabels: function () {
        // Password
        const pwdLabel = document.getElementById('password-status-label');
        if (pwdLabel) {
            if (AppController.isPasswordEnabled()) {
                pwdLabel.textContent = 'Activé';
                pwdLabel.style.color = 'var(--emerald-500)';
            } else {
                pwdLabel.textContent = 'Désactivé';
                pwdLabel.style.color = '';
            }
        }

        // Alert threshold
        const alertLabel = document.getElementById('budget-alert-status-label');
        if (alertLabel) {
            alertLabel.textContent = 'Seuil : ' + (State.get('alertThreshold') || 80) + '%';
        }

        // Currency
        const currencyLabel = document.getElementById('currency-label');
        if (currencyLabel) {
            const curr = State.get('currency') || { code: 'XAF', symbol: 'F' };
            currencyLabel.textContent = curr.code + ' (' + curr.symbol + ')';
        }
    },

    openPasswordSettings: function () {
        const currentField = document.getElementById('pwd-current');
        const currentGroup = currentField ? currentField.closest('.fg') : null;

        if (currentGroup) {
            currentGroup.style.display = AppController.isPasswordEnabled() ? 'block' : 'none';
        }

        const newField = document.getElementById('pwd-new');
        const confirmField = document.getElementById('pwd-confirm');
        if (newField) newField.value = '';
        if (confirmField) confirmField.value = '';

        SheetView.open('sheet-password-settings');
    },

    savePassword: function () {
        const currentField = document.getElementById('pwd-current');
        const newField = document.getElementById('pwd-new');
        const confirmField = document.getElementById('pwd-confirm');
        if (!newField || !confirmField) return;

        const currentPwd = currentField ? currentField.value : '';
        const newPwd = newField.value;
        const confirmPwd = confirmField.value;

        if (AppController.isPasswordEnabled()) {
            if (!currentPwd) {
                ToastView.show('Entrez votre mot de passe actuel', true);
                return;
            }
            if (Utils.hashPassword(currentPwd) !== State.get('password')) {
                ToastView.show('Mot de passe actuel incorrect', true);
                return;
            }
        }

        if (!newPwd && !confirmPwd) {
            if (AppController.isPasswordEnabled()) {
                if (confirm('Désactiver la protection par mot de passe ?')) {
                    State.set('password', null);
                    State.save();
                    this.updateLabels();
                    SheetView.close();
                    ToastView.show('Protection désactivée');
                }
            }
            return;
        }

        if (newPwd.length < 4) {
            ToastView.show('Minimum 4 caractères requis', true);
            return;
        }
        if (newPwd !== confirmPwd) {
            ToastView.show('Les mots de passe ne correspondent pas', true);
            return;
        }

        State.set('password', Utils.hashPassword(newPwd));
        State.save();
        this.updateLabels();
        SheetView.close();
        Haptic.premium();
        ToastView.showPremium('Mot de passe enregistré', 'success');
    },

    openBudgetAlerts: function () {
        const thresholdInput = document.getElementById('alert-threshold');
        const hapticInput = document.getElementById('alert-haptic');
        const visualInput = document.getElementById('alert-visual');

        if (thresholdInput) thresholdInput.value = State.get('alertThreshold') || 80;
        if (hapticInput) hapticInput.checked = State.get('alertHaptic') !== false;
        if (visualInput) visualInput.checked = State.get('alertVisual') !== false;

        SheetView.open('sheet-budget-alerts');
    },

    saveBudgetAlerts: function () {
        const thresholdInput = document.getElementById('alert-threshold');
        const hapticInput = document.getElementById('alert-haptic');
        const visualInput = document.getElementById('alert-visual');

        const threshold = parseFloat(thresholdInput ? thresholdInput.value : 80) || 80;

        if (threshold < 10 || threshold > 100) {
            ToastView.show('Seuil entre 10% et 100%', true);
            return;
        }

        State.set('alertThreshold', threshold);
        State.set('alertHaptic', hapticInput ? hapticInput.checked : true);
        State.set('alertVisual', visualInput ? visualInput.checked : true);
        State.save();

        SheetView.close();
        AppController.refreshUI();
        this.updateLabels();
        ToastView.showPremium('Alertes configurées', 'success');
    },

    openCurrency: function () {
        const select = document.getElementById('currency-select');
        if (!select) return;
        const curr = State.get('currency') || { code: 'XAF', symbol: 'F' };
        select.value = curr.code + '|' + curr.symbol;
        SheetView.open('sheet-currency');
    },

    saveCurrency: function () {
        const select = document.getElementById('currency-select');
        if (!select) return;

        const parts = select.value.split('|');
        if (parts.length !== 2) return;

        State.set('currency', { code: parts[0], symbol: parts[1] });
        State.save();

        SheetView.close();
        AppController.refreshUI();
        this.updateLabels();
        ToastView.showPremium('Devise : ' + parts[1], 'success');
    },

    exportDatabase: function () {
        const dataStr = JSON.stringify({
            wallets: State.get('wallets'),
            categories: State.get('categories'),
            transactions: State.get('transactions'),
            savings: State.get('savings'),
            archives: State.get('archives'),
            abonnements: State.get('abonnements'),
            mandat: State.get('mandat'),
            fees: State.get('fees'),
            dark: State.get('dark'),
            privacyMode: State.get('privacyMode'),
            userName: State.get('userName'),
            password: State.get('password'),
            tutorialCompleted: State.get('tutorialCompleted'),
            currency: State.get('currency'),
            alertThreshold: State.get('alertThreshold'),
            alertHaptic: State.get('alertHaptic'),
            alertVisual: State.get('alertVisual'),
            streak: State.get('streak'),
            _metadata: {
                developer: APP.DEVELOPER,
                version: APP.VERSION,
                exportDate: new Date().toISOString(),
                schemaVersion: 3
            }
        }, null, 2);

        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'guruss_kitti_backup_' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
        a.click();
        URL.revokeObjectURL(url);
        ToastView.showPremium('Base de données exportée', 'success');
    },

    importDatabase: function (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (!imported || !imported.transactions) {
                    throw new Error('Format invalide');
                }

                // Réinjecter toutes les données
                State.set('wallets', imported.wallets || State.get('wallets'));
                State.set('categories', imported.categories || State.get('categories'));
                State.set('transactions', imported.transactions || []);
                State.set('savings', imported.savings || []);
                State.set('archives', imported.archives || []);
                State.set('abonnements', imported.abonnements || []);
                State.set('mandat', parseFloat(imported.mandat) || 0);
                State.set('fees', parseFloat(imported.fees) || 0);
                State.set('dark', typeof imported.dark === 'boolean' ? imported.dark : true);
                State.set('privacyMode', typeof imported.privacyMode === 'boolean' ? imported.privacyMode : false);
                State.set('userName', imported.userName || null);
                State.set('password', imported.password || null);
                State.set('tutorialCompleted', !!imported.tutorialCompleted);
                State.set('currency', imported.currency || { code: 'XAF', symbol: 'F' });
                State.set('alertThreshold', imported.alertThreshold || 80);
                State.set('alertHaptic', imported.alertHaptic !== false);
                State.set('alertVisual', imported.alertVisual !== false);
                State.set('streak', imported.streak || { current: 0, record: 0 });

                State.save();
                AppController.refreshUI();
                SettingsController.updateLabels();
                AppController.updateUserName();

                SheetView.close();

                const meta = imported._metadata;
                if (meta) {
                    ToastView.showPremium('Base importée - ' + (meta.developer || 'Inconnu'), 'success');
                } else {
                    ToastView.show('Base importée');
                }
            } catch (err) {
                console.error('Erreur import:', err);
                ToastView.show('Fichier invalide', true);
            }
        };
        reader.readAsText(file);
    },

    resetTutorial: function () {
        State.set('tutorialCompleted', false);
        State.save();
        DashboardView.renderStepIndicator();
        ToastView.showPremium('Tutoriel réinitialisé', 'info');
    },

    resetAllData: function () {
        if (!confirm('ATTENTION : Toutes vos données seront effacées.\n\nContinuer ?')) return;
        if (!confirm('Êtes-vous vraiment sûr ? Cette action est IRRÉVERSIBLE.')) return;
        State.reset();
    }
};

/* ============================================================
   POINT D'ENTRÉE
   ============================================================ */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        AppController.start();
    });
} else {
    AppController.start();
}

// Fonctions globales exposées pour les onclick HTML
window.AppController = AppController;
window.SheetView = SheetView;
window.ArchiveController = ArchiveController;

// Signature console
console.log(
    '%c' + APP.NAME + ' ' + APP.VERSION + '%c\nDéveloppé par ' + APP.DEVELOPER,
    'font-size: 16px; font-weight: bold; color: #8B5CF6; padding: 4px 8px; background: rgba(139,92,246,0.1); border-radius: 4px;',
    'font-size: 12px; color: #F59E0B; padding: 4px 8px;'
);