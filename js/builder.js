/* ============================================================================
   ATELIER APPLI — le constructeur.
   100 % local : aucune requête réseau, aucune bibliothèque externe.
   Sauvegarde automatique dans le navigateur (IndexedDB) + export .json / .html.
   ============================================================================ */
(function () {
  'use strict';

  const H = window.MonAppRuntime(null, null, { helpersOnly: true });

  /* ------------------------------------------------------------------ utilitaires */
  const $ = (s, r) => (r || document).querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 8);
  const str = (v) => (v == null ? '' : String(v));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function el(tag, props, kids) {
    const n = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden') n[k] = v;
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function slug(s) {
    return str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'appli';
  }
  function fmtBytes(n) { return n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(n / 1024)) + ' Ko'; }
  function toast(msg, kind) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'toast show ' + (kind || '');
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = 'toast'; }, 4200);
  }
  function download(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /* ------------------------------------------------------------------ stockage local (IndexedDB) */
  const DB = {
    _db: null,
    open() {
      if (this._db) return this._db;
      this._db = new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('IndexedDB indisponible'));
        const r = indexedDB.open('atelier-appli', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('projects', { keyPath: 'id' });
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      return this._db;
    },
    async tx(mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction('projects', mode), s = t.objectStore('projects');
        const rq = fn(s);
        t.oncomplete = () => res(rq && rq.result);
        t.onerror = t.onabort = () => rej(t.error);
      });
    },
    put(rec) { return this.tx('readwrite', (s) => s.put(rec)); },
    get(id) { return this.tx('readonly', (s) => s.get(id)); },
    all() { return this.tx('readonly', (s) => s.getAll()); },
    del(id) { return this.tx('readwrite', (s) => s.delete(id)); }
  };
  const mem = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  /* ------------------------------------------------------------------ préréglages de thème */
  const PRESETS = [
    { key: 'ocean', name: 'Océan', primary: '#2563eb', accent: '#f59e0b', dark: false },
    { key: 'forest', name: 'Forêt', primary: '#15803d', accent: '#f97316', dark: false },
    { key: 'plum', name: 'Prune', primary: '#7e22ce', accent: '#ec4899', dark: false },
    { key: 'sun', name: 'Soleil', primary: '#ea580c', accent: '#0ea5e9', dark: false },
    { key: 'slate', name: 'Ardoise', primary: '#334155', accent: '#14b8a6', dark: false },
    { key: 'night', name: 'Nuit', primary: '#60a5fa', accent: '#fbbf24', dark: true }
  ];
  const DEFAULT_THEME = { preset: 'ocean', primary: '#2563eb', accent: '#f59e0b', dark: false, radius: 'doux', font: 'moderne' };
  const EMOJIS = ['🏠', '📚', '📅', '🗂️', '📞', '📍', '👥', '🎓', '📰', '❓', '📝', '💬', '🎯', '🏆', '🧩', '🍽️', '🚌', '🏥', '💼', '🔧', '💻', '🎨', '🎵', '⚽', '🌍', '🔒', '⭐', '❤️', '1️⃣', '2️⃣', '3️⃣'];

  /* ------------------------------------------------------------------ catalogue des blocs */
  const OPT = {
    tone: [['info', 'ℹ️ Information'], ['warn', '⚠️ Attention'], ['ok', '✅ Réussite / bon à savoir'], ['alert', '🚨 Urgent']],
    yesNoPage: () => [['', '— Aucune page —']].concat(app.pages.map((p) => [p.id, (p.icon ? p.icon + ' ' : '') + p.title]))
  };
  const MD_HELP = 'Astuce : **gras**, *italique*, [texte du lien](https://…). Une ligne qui commence par « - » devient une liste.';

  const BLOCKS = {
    hero: {
      label: 'Bandeau d’accueil', icon: '🏷️', group: 'Mise en avant', desc: 'Grand titre avec image de fond ou dégradé.',
      make: () => ({ title: 'Titre du bandeau', text: '', image: '' }),
      summary: (b) => b.title,
      fields: [
        { k: 'title', l: 'Titre', t: 'text', ph: 'Ex : Bienvenue au centre Horizon' },
        { k: 'text', l: 'Sous-titre (facultatif)', t: 'text', ph: 'Ex : Rentrée le lundi 2 septembre' },
        { k: 'image', l: 'Image de fond (facultatif)', t: 'image', max: 1600, help: 'Sans image, le bandeau prend les couleurs de l’appli.' }
      ]
    },
    title: {
      label: 'Titre', icon: '🔤', group: 'Texte et médias', desc: 'Un intertitre pour organiser la page.',
      make: () => ({ text: 'Nouveau titre', level: 2 }),
      summary: (b) => b.text,
      fields: [
        { k: 'text', l: 'Texte', t: 'text' },
        { k: 'level', l: 'Taille', t: 'select', num: true, o: [[2, 'Grand titre'], [3, 'Sous-titre']] }
      ]
    },
    text: {
      label: 'Texte', icon: '📝', group: 'Texte et médias', desc: 'Paragraphes, listes, liens, gras, italique.',
      make: () => ({ text: '' }),
      summary: (b) => b.text.replace(/\s+/g, ' ').slice(0, 60),
      fields: [{ k: 'text', l: 'Texte', t: 'textarea', md: true, rows: 6, help: MD_HELP }]
    },
    image: {
      label: 'Image', icon: '🖼️', group: 'Texte et médias', desc: 'Une photo ou une illustration, compressée automatiquement.',
      make: () => ({ src: '', alt: '', caption: '', size: 'full' }),
      summary: (b) => b.caption || b.alt || (b.src ? 'Image' : 'Aucune image choisie'),
      fields: [
        { k: 'src', l: 'Image', t: 'image', max: 1280 },
        { k: 'alt', l: 'Description de l’image (accessibilité)', t: 'text', ph: 'Ex : Façade du centre vue de la rue', help: 'Lue par les lecteurs d’écran. Laissez vide si l’image est purement décorative.' },
        { k: 'caption', l: 'Légende (facultatif)', t: 'text' },
        { k: 'size', l: 'Taille', t: 'select', o: [['full', 'Pleine largeur'], ['medium', 'Moyenne, centrée']] }
      ]
    },
    video: {
      label: 'Vidéo', icon: '🎬', group: 'Texte et médias', desc: 'YouTube, Vimeo, Dailymotion, PeerTube ou fichier .mp4.',
      make: () => ({ url: '', title: '' }),
      summary: (b) => b.title || b.url || 'Aucune vidéo',
      fields: [
        { k: 'url', l: 'Adresse de la vidéo', t: 'text', ph: 'https://www.youtube.com/watch?v=…', status: (b) => {
          if (!b.url.trim()) return { level: 'info', t: 'Collez l’adresse de la page de la vidéo (celle de la barre d’adresse).' };
          const v = H.videoInfo(b.url);
          if (!v) return { level: 'bad', t: 'Adresse non reconnue. Essayez YouTube, Vimeo, Dailymotion, PeerTube ou un fichier .mp4.' };
          return { level: 'ok', t: v.file ? '✔ Fichier vidéo détecté' : '✔ Vidéo reconnue (' + new URL(v.src).hostname + ')' };
        } },
        { k: 'title', l: 'Titre de la vidéo (accessibilité)', t: 'text', ph: 'Ex : Visite virtuelle de l’atelier' }
      ]
    },
    callout: {
      label: 'Encadré', icon: '💡', group: 'Texte et médias', desc: 'Information importante, alerte ou bon à savoir.',
      make: () => ({ tone: 'info', title: '', text: '' }),
      summary: (b) => b.title || b.text.slice(0, 50),
      fields: [
        { k: 'tone', l: 'Type', t: 'select', o: OPT.tone },
        { k: 'title', l: 'Titre (facultatif)', t: 'text', ph: 'Ex : Rentrée' },
        { k: 'text', l: 'Texte', t: 'textarea', md: true, rows: 3, help: MD_HELP }
      ]
    },
    button: {
      label: 'Bouton', icon: '🔘', group: 'Navigation', desc: 'Ouvre une page de l’appli, un site, un mail ou un appel.',
      make: () => ({ label: 'Mon bouton', kind: 'page', page: '', url: '', mail: '', tel: '', style: 'solid', width: 'full' }),
      summary: (b) => b.label,
      fields: [
        { k: 'label', l: 'Texte du bouton', t: 'text', ph: 'Ex : Voir le planning' },
        { k: 'kind', l: 'Que fait le bouton ?', t: 'select', refresh: true, o: [['page', 'Ouvre une page de l’appli'], ['url', 'Ouvre un site ou un document'], ['mail', 'Écrit un mail'], ['tel', 'Lance un appel']] },
        { k: 'page', l: 'Page à ouvrir', t: 'page', show: (b) => b.kind === 'page' },
        { k: 'url', l: 'Adresse', t: 'text', ph: 'https://… ou documents/livret.pdf', show: (b) => b.kind === 'url', help: 'Un chemin relatif (documents/livret.pdf) fonctionne si le fichier est hébergé à côté de l’appli.' },
        { k: 'mail', l: 'Adresse mail', t: 'text', ph: 'secretariat@exemple.org', show: (b) => b.kind === 'mail' },
        { k: 'tel', l: 'Numéro de téléphone', t: 'text', ph: '01 23 45 67 89', show: (b) => b.kind === 'tel' },
        { k: 'style', l: 'Style', t: 'select', o: [['solid', 'Plein'], ['outline', 'Contour']] },
        { k: 'width', l: 'Largeur', t: 'select', o: [['full', 'Pleine largeur'], ['auto', 'Ajustée au texte']] }
      ]
    },
    links: {
      label: 'Liens et documents', icon: '📎', group: 'Navigation', desc: 'Liste de liens : PDF, plateforme, sites, pages.',
      make: () => ({ items: [{ label: 'Mon document', desc: '', url: '', page: '' }] }),
      summary: (b) => b.items.length + ' lien' + (b.items.length > 1 ? 's' : ''),
      fields: [{
        k: 'items', t: 'items', l: 'Liens', add: 'Ajouter un lien', itemTitle: (it) => it.label || 'Lien',
        make: () => ({ label: 'Nouveau lien', desc: '', url: '', page: '' }),
        fields: [
          { k: 'label', l: 'Intitulé', t: 'text', ph: 'Ex : Règlement intérieur' },
          { k: 'desc', l: 'Précision (facultatif)', t: 'text', ph: 'Ex : PDF · 2 pages' },
          { k: 'url', l: 'Adresse', t: 'text', ph: 'https://… ou documents/reglement.pdf' },
          { k: 'page', l: 'ou page de l’appli', t: 'page', help: 'Si une page est choisie, elle remplace l’adresse.' }
        ]
      }]
    },
    separator: {
      label: 'Séparateur', icon: '➖', group: 'Navigation', desc: 'Une ligne ou un espace pour aérer.',
      make: () => ({ style: 'line' }),
      summary: (b) => (b.style === 'space' ? 'Espace' : 'Ligne'),
      fields: [{ k: 'style', l: 'Aspect', t: 'select', o: [['line', 'Ligne'], ['space', 'Espace vide']] }]
    },
    cards: {
      label: 'Cartes', icon: '🗃️', group: 'Listes', desc: 'Actualités, formations, équipe, stands… en liste, grille ou portraits.',
      make: () => ({ style: 'liste', items: [{ title: 'Première carte', text: '', tag: '', image: '', page: '', url: '' }] }),
      summary: (b) => b.items.length + ' carte' + (b.items.length > 1 ? 's' : ''),
      fields: [
        { k: 'style', l: 'Présentation', t: 'select', o: [['liste', 'Liste (petite image à gauche)'], ['grille', 'Grille (image en haut)'], ['portraits', 'Portraits ronds (équipe)']] },
        {
          k: 'items', t: 'items', l: 'Cartes', add: 'Ajouter une carte', itemTitle: (it) => it.title || 'Carte',
          make: () => ({ title: 'Nouvelle carte', text: '', tag: '', image: '', page: '', url: '' }),
          fields: [
            { k: 'title', l: 'Titre', t: 'text', ph: 'Ex : Marie Dupont' },
            { k: 'tag', l: 'Étiquette (facultatif)', t: 'text', ph: 'Ex : Formatrice, Actualité…' },
            { k: 'text', l: 'Description', t: 'textarea', rows: 2 },
            { k: 'image', l: 'Image (facultatif)', t: 'image', max: 480 },
            { k: 'page', l: 'Ouvre une page de l’appli (facultatif)', t: 'page' },
            { k: 'url', l: 'ou ouvre cette adresse (facultatif)', t: 'text', ph: 'https://…' }
          ]
        }
      ]
    },
    events: {
      label: 'Agenda', icon: '📅', group: 'Listes', desc: 'Dates triées automatiquement, avec « Ajouter à mon agenda ».',
      make: () => ({ hidePast: true, calendar: true, items: [{ date: '', time: '', title: 'Nouvel événement', place: '', text: '' }] }),
      summary: (b) => b.items.length + ' date' + (b.items.length > 1 ? 's' : ''),
      fields: [
        { k: 'hidePast', l: 'Masquer les dates passées', t: 'checkbox' },
        { k: 'calendar', l: 'Proposer « Ajouter à mon agenda » (fichier .ics)', t: 'checkbox' },
        {
          k: 'items', t: 'items', l: 'Dates', add: 'Ajouter une date', itemTitle: (it) => [it.date, it.title].filter(Boolean).join(' · ') || 'Date',
          make: () => ({ date: '', time: '', title: 'Nouvel événement', place: '', text: '' }),
          fields: [
            { k: 'date', l: 'Date', t: 'date' },
            { k: 'time', l: 'Heure (facultatif)', t: 'time' },
            { k: 'title', l: 'Titre', t: 'text', ph: 'Ex : Réunion de rentrée' },
            { k: 'place', l: 'Lieu (facultatif)', t: 'text', ph: 'Ex : Salle 1' },
            { k: 'text', l: 'Détails (facultatif)', t: 'textarea', rows: 2 }
          ]
        }
      ]
    },
    faq: {
      label: 'Questions fréquentes', icon: '❓', group: 'Listes', desc: 'Questions / réponses repliables.',
      make: () => ({ items: [{ q: 'Votre question ?', a: 'Votre réponse.' }] }),
      summary: (b) => b.items.length + ' question' + (b.items.length > 1 ? 's' : ''),
      fields: [{
        k: 'items', t: 'items', l: 'Questions', add: 'Ajouter une question', itemTitle: (it) => it.q || 'Question',
        make: () => ({ q: 'Nouvelle question ?', a: '' }),
        fields: [
          { k: 'q', l: 'Question', t: 'text' },
          { k: 'a', l: 'Réponse', t: 'textarea', md: true, rows: 3, help: MD_HELP }
        ]
      }]
    },
    countdown: {
      label: 'Compte à rebours', icon: '⏳', group: 'Listes', desc: 'Affiche « J-12 » avant une date importante.',
      make: () => ({ date: '', label: '' }),
      summary: (b) => b.date || 'Choisissez une date',
      fields: [
        { k: 'date', l: 'Date de l’événement', t: 'date' },
        { k: 'label', l: 'Texte sous le compteur', t: 'text', ph: 'Ex : avant la rentrée' }
      ]
    },
    contact: {
      label: 'Contact', icon: '📞', group: 'Infos pratiques', desc: 'Adresse, téléphone, mail, horaires, site web.',
      make: () => ({ org: '', address: '', phone: '', email: '', hours: '', website: '' }),
      summary: (b) => b.org || b.email || b.phone || 'Coordonnées',
      fields: [
        { k: 'org', l: 'Nom', t: 'text', ph: 'Ex : Centre de formation Horizon' },
        { k: 'address', l: 'Adresse', t: 'textarea', rows: 2, ph: '12 rue des Écoles\n75000 Paris' },
        { k: 'phone', l: 'Téléphone', t: 'text', ph: '01 23 45 67 89' },
        { k: 'email', l: 'Mail', t: 'text', ph: 'contact@exemple.org' },
        { k: 'hours', l: 'Horaires', t: 'textarea', rows: 2, ph: 'Du lundi au vendredi\n8 h 30 – 17 h 30' },
        { k: 'website', l: 'Site web', t: 'text', ph: 'https://exemple.org' }
      ]
    },
    map: {
      label: 'Plan d’accès', icon: '🗺️', group: 'Infos pratiques', desc: 'Carte OpenStreetMap, sans compte ni clé.',
      make: () => ({ where: '', label: 'Plan d’accès' }),
      summary: (b) => b.label || b.where,
      fields: [
        { k: 'where', l: 'Lien de la carte ou coordonnées', t: 'text', ph: 'https://www.openstreetmap.org/#map=17/48.8584/2.2945', status: (b) => {
          if (!b.where.trim()) return { level: 'info', t: 'Sur openstreetmap.org : cherchez votre adresse, puis copiez le lien de la barre d’adresse. Ou collez des coordonnées : 48.8584, 2.2945.' };
          return H.mapInfo(b.where) ? { level: 'ok', t: '✔ Position reconnue' } : { level: 'bad', t: 'Position non reconnue. Collez un lien OpenStreetMap, un lien Google Maps (avec @lat,lon) ou « 48.8584, 2.2945 ».' };
        } },
        { k: 'label', l: 'Légende', t: 'text' }
      ]
    },
    embed: {
      label: 'Formulaire / contenu intégré', icon: '🧾', group: 'Formulaires et contenus', desc: 'Tally, Microsoft Forms, Google Forms, Framaforms, LearningApps, Genially, Padlet…',
      make: () => ({ url: '', mode: 'inline', label: 'Ouvrir le formulaire', title: '', height: 700 }),
      summary: (b) => { const i = H.embedInfo(b.url); return i ? i.service + (b.mode === 'button' ? ' (bouton)' : '') : 'Aucune adresse'; },
      fields: [
        { k: 'url', l: 'Adresse ou code d’intégration', t: 'textarea', rows: 3, ph: 'https://tally.so/r/abc123\nou <iframe src="https://forms.office.com/…" …></iframe>', refresh: true,
          help: 'Collez l’adresse de partage OU le code « intégrer / embed » fourni par le service : l’appli en extrait l’adresse toute seule.',
          status: (b) => {
            if (!b.url.trim()) return { level: 'info', t: 'Tally : Partager › lien. Microsoft Forms : Collecter les réponses › Intégrer. Google Forms : Envoyer › < > .' };
            const i = H.embedInfo(b.url);
            if (!i) return { level: 'bad', t: 'Adresse non reconnue : elle doit commencer par https://' };
            return { level: i.warn ? 'warn' : 'ok', t: '✔ ' + i.service + ' détecté' + (i.warn ? ' — ' + i.warn : '') };
          } },
        { k: 'mode', l: 'Affichage', t: 'select', refresh: true, o: [['inline', 'Dans la page (cadre intégré)'], ['button', 'Bouton qui ouvre dans un nouvel onglet']], help: 'Le bouton est la solution de secours si le service refuse d’être affiché dans un cadre.' },
        { k: 'label', l: 'Texte du bouton', t: 'text', show: (b) => b.mode === 'button' },
        { k: 'title', l: 'Titre du cadre (accessibilité)', t: 'text', ph: 'Ex : Questionnaire de satisfaction', show: (b) => b.mode !== 'button' },
        { k: 'height', l: 'Hauteur du cadre (pixels)', t: 'number', min: 200, max: 2000, step: 50, show: (b) => b.mode !== 'button' }
      ]
    }
  };
  const GROUPS = ['Mise en avant', 'Texte et médias', 'Navigation', 'Listes', 'Infos pratiques', 'Formulaires et contenus'];

  /* ------------------------------------------------------------------ modèle de données */
  function newId(taken, base) {
    base = slug(base) || 'page';
    let id = base, n = 2;
    while (taken.includes(id)) id = base + '-' + n++;
    return id;
  }
  function newBlock(type) { return Object.assign({ id: uid(), type }, BLOCKS[type].make()); }

  function normalizeApp(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.pages)) throw new Error('Ce fichier n’est pas une appli reconnue.');
    const th = raw.theme || {};
    const a = {
      v: 1, id: str(raw.id) || uid(), title: str(raw.title) || 'Mon appli', subtitle: str(raw.subtitle), logo: str(raw.logo),
      lang: raw.lang === 'en' ? 'en' : 'fr',
      theme: {
        preset: str(th.preset) || 'custom',
        primary: /^#[0-9a-f]{6}$/i.test(th.primary) ? th.primary : DEFAULT_THEME.primary,
        accent: /^#[0-9a-f]{6}$/i.test(th.accent) ? th.accent : DEFAULT_THEME.accent,
        dark: !!th.dark,
        radius: ['carre', 'doux', 'rond'].includes(th.radius) ? th.radius : 'doux',
        font: ['moderne', 'classique', 'arrondi'].includes(th.font) ? th.font : 'moderne'
      },
      pages: []
    };
    const ids = [];
    raw.pages.forEach((p, i) => {
      if (!p || typeof p !== 'object') return;
      const id = newId(ids, /^[\w-]+$/.test(str(p.id)) ? p.id : p.title);
      ids.push(id);
      const page = { id, title: str(p.title) || 'Page ' + (i + 1), icon: str(p.icon).slice(0, 8), tab: p.tab !== false, showTitle: p.showTitle !== false, blocks: [] };
      (Array.isArray(p.blocks) ? p.blocks : []).forEach((b) => {
        if (!b || !BLOCKS[b.type]) return;
        const nb = Object.assign({}, BLOCKS[b.type].make(), b, { id: str(b.id) || uid(), type: b.type });
        BLOCKS[b.type].fields.filter((f) => f.t === 'items').forEach((f) => {
          nb[f.k] = (Array.isArray(nb[f.k]) ? nb[f.k] : []).filter((x) => x && typeof x === 'object').map((x) => Object.assign({}, f.make(), x));
        });
        page.blocks.push(nb);
      });
      a.pages.push(page);
    });
    if (!a.pages.length) a.pages.push({ id: 'accueil', title: 'Accueil', icon: '🏠', tab: true, showTitle: true, blocks: [] });
    a.pages[0].tab = true;
    return a;
  }

  /* ------------------------------------------------------------------ état + historique */
  let app = null;
  const view = { pageId: null, openBlock: null, gotoPending: true };
  let hist = [], hi = -1, dirtyFile = false;

  function currentPage() { return app.pages.find((p) => p.id === view.pageId) || app.pages[0]; }

  function snapshot() {
    const s = JSON.stringify(app);
    if (hist[hi] === s) return;
    hist = hist.slice(0, hi + 1); hist.push(s); hi = hist.length - 1;
    let total = hist.reduce((n, x) => n + x.length, 0);
    while ((hist.length > 60 || total > 60e6) && hist.length > 2) { total -= hist[0].length; hist.shift(); hi--; }
    updateUndoButtons();
  }
  function restore(i) {
    if (i < 0 || i >= hist.length) return;
    hi = i; app = JSON.parse(hist[hi]);
    if (!app.pages.some((p) => p.id === view.pageId)) view.pageId = app.pages[0].id;
    dirtyFile = true; renderAll(); schedulePreview(); scheduleSave(); updateUndoButtons();
  }
  function updateUndoButtons() { $('#btn-undo').disabled = hi <= 0; $('#btn-redo').disabled = hi >= hist.length - 1; }

  const commitSoon = debounce(() => { snapshot(); }, 500);
  /* À appeler après toute modification du modèle */
  function changed(opts) {
    dirtyFile = true;
    schedulePreview(); scheduleSave();
    if (opts && opts.now) snapshot(); else commitSoon();
  }

  /* ------------------------------------------------------------------ enregistrement automatique */
  const doSave = async () => {
    const st = $('#save-status');
    try {
      await DB.put({ id: app.id, title: app.title, updated: Date.now(), pages: app.pages.length, data: app });
      mem('atelier:last', app.id);
      st.textContent = '✔ Enregistré dans ce navigateur à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      st.className = 'save-status';
    } catch (e) {
      st.textContent = '⚠ Enregistrement automatique impossible : téléchargez votre projet (.json)';
      st.className = 'save-status warn';
    }
  };
  const scheduleSave = debounce(doSave, 700);

  /* ------------------------------------------------------------------ aperçu */
  let previewReady = false;
  const frame = $('#preview');
  const postPreview = () => {
    if (!previewReady || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'app', app, goto: view.gotoPending ? view.pageId : null, focus: view.focusBlock || null }, '*');
    view.gotoPending = false; view.focusBlock = null;
  };
  const schedulePreview = debounce(postPreview, 120);
  window.addEventListener('message', (e) => {
    if (e.source === frame.contentWindow && e.data && e.data.type === 'preview-ready') { previewReady = true; view.gotoPending = true; postPreview(); }
  });

  /* ------------------------------------------------------------------ images */
  function readAsDataURL(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
  }
  async function processImage(file, max) {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error('Format non pris en charge. Utilisez PNG, JPEG, WebP ou GIF.');
    if (file.type === 'image/gif' && file.size < 800 * 1024) return readAsDataURL(file);
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Image illisible.')); i.src = url; });
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
      let alpha = false;
      if (file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif') {
        const probe = document.createElement('canvas'); probe.width = probe.height = 48;
        const pc = probe.getContext('2d'); pc.drawImage(c, 0, 0, 48, 48);
        const d = pc.getImageData(0, 0, 48, 48).data;
        for (let i = 3; i < d.length; i += 4) if (d[i] < 250) { alpha = true; break; }
      }
      if (alpha) return c.toDataURL('image/png');
      let out = c.toDataURL('image/webp', 0.82);
      if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', 0.85);
      return out;
    } finally { URL.revokeObjectURL(url); }
  }

  /* ------------------------------------------------------------------ éléments de formulaire génériques */
  function wrapSel(ta, before, after, placeholder) {
    const s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || placeholder;
    ta.setRangeText(before + sel + after, s, e, 'end');
    ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function mdToolbar(ta) {
    const b = (label, title, fn) => el('button', { type: 'button', class: 'tb', title, 'aria-label': title, onclick: fn, text: label });
    return el('div', { class: 'md-tools', role: 'toolbar', 'aria-label': 'Mise en forme' }, [
      b('G', 'Gras', () => wrapSel(ta, '**', '**', 'texte')),
      b('I', 'Italique', () => wrapSel(ta, '*', '*', 'texte')),
      b('🔗', 'Lien', () => {
        const s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || 'texte du lien';
        ta.setRangeText('[' + sel + '](https://)', s, e, 'end');
        const p = s + sel.length + 3; ta.setSelectionRange(p, p + 8); ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
      }),
      b('• Liste', 'Liste à puces', () => {
        const s = ta.selectionStart, e = ta.selectionEnd, a = ta.value.lastIndexOf('\n', s - 1) + 1;
        const chunk = ta.value.slice(a, e) || '';
        ta.setRangeText(chunk.split('\n').map((l) => (l.startsWith('- ') ? l : '- ' + l)).join('\n'), a, e, 'end');
        ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
      })
    ]);
  }

  function imageField(def, obj, onChange) {
    const wrap = el('div', { class: 'img-field' });
    const input = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', class: 'sr-only', tabindex: '-1' });
    function draw() {
      wrap.querySelectorAll('.img-row').forEach((n) => n.remove());
      const v = obj[def.k];
      const thumb = v ? el('img', { src: v, alt: '', class: 'thumb' }) : el('span', { class: 'thumb empty', 'aria-hidden': 'true', text: '🖼️' });
      const pick = el('button', { type: 'button', class: 'btn small', text: v ? 'Changer l’image…' : 'Choisir une image…', onclick: () => input.click() });
      const rm = v ? el('button', { type: 'button', class: 'btn small ghost', text: 'Retirer', onclick: () => { obj[def.k] = ''; draw(); onChange(def, true); } }) : null;
      const size = v ? el('span', { class: 'muted', text: fmtBytes(Math.round(v.length * 0.75)) }) : null;
      wrap.insertBefore(el('div', { class: 'img-row' }, [thumb, el('div', { class: 'img-actions' }, [pick, rm, size])]), input);
    }
    input.addEventListener('change', async () => {
      const f = input.files && input.files[0]; input.value = '';
      if (!f) return;
      try { obj[def.k] = await processImage(f, def.max || 1280); draw(); onChange(def, true); }
      catch (e) { toast(e.message, 'bad'); }
    });
    wrap.appendChild(input); draw();
    return wrap;
  }

  /* Rend un champ. onChange(def, immediate) est appelé après chaque modification. */
  let fieldSeq = 0;
  function field(def, obj, onChange) {
    const id = 'f' + (++fieldSeq);
    let ctl;
    const fire = (immediate) => { onChange(def, immediate); if (statusEl) updateStatus(); };
    const wrapCls = 'field' + (def.t === 'checkbox' ? ' check' : '');
    let statusEl = null;
    const updateStatus = () => {
      const r = def.status(obj);
      statusEl.className = 'status ' + r.level; statusEl.textContent = r.t;
    };
    switch (def.t) {
      case 'text': case 'date': case 'time': case 'number':
        ctl = el('input', { id, type: def.t, value: obj[def.k] == null ? '' : obj[def.k], placeholder: def.ph, min: def.min, max: def.max, step: def.step, autocomplete: 'off',
          oninput: (e) => { obj[def.k] = def.t === 'number' ? Number(e.target.value) : e.target.value; fire(); } });
        break;
      case 'textarea': {
        const ta = el('textarea', { id, rows: def.rows || 3, value: str(obj[def.k]), placeholder: def.ph,
          oninput: (e) => { obj[def.k] = e.target.value; fire(); } });
        ctl = def.md ? el('div', { class: 'md-wrap' }, [mdToolbar(ta), ta]) : ta;
        break;
      }
      case 'select':
        ctl = el('select', { id, onchange: (e) => { obj[def.k] = def.num ? Number(e.target.value) : e.target.value; fire(true); } },
          def.o.map((o) => el('option', { value: o[0], text: o[1], selected: String(obj[def.k]) === String(o[0]) })));
        break;
      case 'page':
        ctl = el('select', { id, onchange: (e) => { obj[def.k] = e.target.value; fire(true); } },
          OPT.yesNoPage().map((o) => el('option', { value: o[0], text: o[1], selected: obj[def.k] === o[0] })));
        break;
      case 'checkbox':
        ctl = el('input', { id, type: 'checkbox', checked: !!obj[def.k], onchange: (e) => { obj[def.k] = e.target.checked; fire(true); } });
        break;
      case 'image': ctl = imageField(def, obj, onChange); break;
      case 'items': return itemsEditor(def, obj, onChange);
      default: ctl = el('span');
    }
    const label = def.l ? el('label', { for: def.t === 'image' ? null : id, text: def.l }) : null;
    const help = def.help ? el('p', { class: 'help', text: def.help }) : null;
    if (def.status) { statusEl = el('p', { class: 'status', role: 'status' }); updateStatus(); }
    return def.t === 'checkbox'
      ? el('div', { class: wrapCls }, [ctl, label, help])
      : el('div', { class: wrapCls }, [label, ctl, statusEl, help]);
  }

  /* Liste d'éléments (cartes, dates, questions, liens) : réordonnable, repliable */
  function itemsEditor(def, obj, onChange) {
    const box = el('div', { class: 'items' });
    const list = el('div', { class: 'items-list' });
    let open = -1;
    const arr = () => obj[def.k];
    function draw() {
      list.replaceChildren();
      arr().forEach((it, i) => {
        const sum = el('span', { class: 'item-sum', text: def.itemTitle(it) });
        const handle = el('span', { class: 'handle', draggable: 'true', title: 'Glisser pour réordonner', 'aria-hidden': 'true', text: '⠿' });
        const mini = (txt, title, fn, dis) => el('button', { type: 'button', class: 'mini', title, 'aria-label': title, disabled: dis, text: txt, onclick: (e) => { e.preventDefault(); e.stopPropagation(); fn(); } });
        const det = el('details', { class: 'item', open: i === open }, [
          el('summary', null, [handle, sum, el('span', { class: 'item-btns' }, [
            mini('↑', 'Monter', () => move(i, i - 1), i === 0),
            mini('↓', 'Descendre', () => move(i, i + 1), i === arr().length - 1),
            mini('✕', 'Supprimer', () => { arr().splice(i, 1); open = -1; draw(); onChange(def, true); })
          ])]),
          el('div', { class: 'item-body' }, def.fields.map((f) => field(f, it, (fd, imm) => { sum.textContent = def.itemTitle(it); onChange(def, imm); })))
        ]);
        det.addEventListener('toggle', () => { if (det.open) open = i; else if (open === i) open = -1; });
        list.appendChild(det);
      });
    }
    function move(from, to) {
      if (to < 0 || to >= arr().length || from === to) return;
      const [x] = arr().splice(from, 1); arr().splice(to, 0, x); open = to; draw(); onChange(def, true);
    }
    sortable(list, 'details.item', '.handle', (from, to) => move(from, to));
    draw();
    box.appendChild(el('div', { class: 'items-head' }, [el('span', { class: 'items-title', text: def.l })]));
    box.appendChild(list);
    box.appendChild(el('button', { type: 'button', class: 'btn small', text: '+ ' + def.add, onclick: () => { arr().push(def.make()); open = arr().length - 1; draw(); onChange(def, true); const d = list.lastElementChild; if (d) { const f = d.querySelector('input,textarea'); if (f) f.focus(); } } }));
    return box;
  }

  /* Glisser-déposer natif (+ boutons ↑ ↓ pour le clavier et le tactile) */
  function sortable(container, itemSel, handleSel, onMove) {
    let from = null;
    const items = () => Array.from(container.querySelectorAll(':scope > ' + itemSel));
    const clear = () => items().forEach((n) => n.classList.remove('drop-before', 'drop-after', 'dragging'));
    container.addEventListener('dragstart', (e) => {
      const h = e.target.closest && e.target.closest(handleSel);
      if (!h || !container.contains(h)) return;
      const it = h.closest(itemSel); from = items().indexOf(it);
      if (from < 0) return;
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'x'); e.dataTransfer.setDragImage(it, 20, 20); } catch (err) { /* ignore */ }
      it.classList.add('dragging');
    });
    container.addEventListener('dragover', (e) => {
      if (from == null) return;
      e.preventDefault();
      const its = items(); clear();
      if (!its.length) return;
      its[from] && its[from].classList.add('dragging');
      let target = null, after = false;
      for (const n of its) { const r = n.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { target = n; break; } }
      if (!target) { target = its[its.length - 1]; after = true; }
      target.classList.add(after ? 'drop-after' : 'drop-before');
      container._drop = { idx: its.indexOf(target), after };
    });
    container.addEventListener('drop', (e) => {
      if (from == null) return;
      e.preventDefault();
      const d = container._drop; const f = from; from = null; clear();
      if (!d) return;
      let to = d.idx + (d.after ? 1 : 0); if (f < to) to--;
      onMove(f, to);
    });
    container.addEventListener('dragend', () => { from = null; clear(); });
  }

  /* ------------------------------------------------------------------ colonne des blocs */
  function renderBlocks() {
    const page = currentPage();
    const host = $('#blocks');
    host.replaceChildren();
    if (!page.blocks.length) {
      host.appendChild(el('div', { class: 'empty-blocks' }, [
        el('p', { text: 'Cette page est vide.' }),
        el('p', { class: 'muted', text: 'Ajoutez un premier bloc : un titre, du texte, une image, un formulaire…' })
      ]));
    }
    page.blocks.forEach((b, i) => host.appendChild(blockCard(page, b, i)));
  }

  function moveBlock(page, from, to) {
    if (to < 0 || to >= page.blocks.length || from === to) return;
    const [x] = page.blocks.splice(from, 1); page.blocks.splice(to, 0, x);
    renderBlocks(); changed({ now: true });
  }

  function blockCard(page, b, i) {
    const def = BLOCKS[b.type], isOpen = view.openBlock === b.id;
    const sumEl = el('span', { class: 'blk-sum', text: def.summary(b) || '…' });
    const toggle = el('button', { type: 'button', class: 'blk-toggle', 'aria-expanded': String(isOpen), 'aria-controls': 'body-' + b.id,
      onclick: () => { view.openBlock = isOpen ? null : b.id; if (!isOpen) { view.focusBlock = b.id; schedulePreview(); } renderBlocks(); } }, [
      el('span', { class: 'blk-icon', 'aria-hidden': 'true', text: def.icon }),
      el('span', { class: 'blk-name', text: def.label }), sumEl
    ]);
    const mini = (txt, title, fn, dis) => el('button', { type: 'button', class: 'mini', title, 'aria-label': title, disabled: dis, text: txt, onclick: fn });
    const head = el('header', { class: 'blk-head' }, [
      el('span', { class: 'handle', draggable: 'true', title: 'Glisser pour déplacer', 'aria-hidden': 'true', text: '⠿' }),
      toggle,
      el('span', { class: 'blk-btns' }, [
        mini('↑', 'Monter le bloc', () => moveBlock(page, i, i - 1), i === 0),
        mini('↓', 'Descendre le bloc', () => moveBlock(page, i, i + 1), i === page.blocks.length - 1),
        mini('⧉', 'Dupliquer le bloc', () => { const c = clone(b); c.id = uid(); page.blocks.splice(i + 1, 0, c); view.openBlock = c.id; renderBlocks(); changed({ now: true }); }),
        mini('🗑', 'Supprimer le bloc', () => {
          if (!confirm('Supprimer ce bloc « ' + def.label + ' » ?')) return;
          page.blocks.splice(i, 1); if (view.openBlock === b.id) view.openBlock = null; renderBlocks(); changed({ now: true });
        })
      ])
    ]);
    const card = el('article', { class: 'blk' + (isOpen ? ' open' : ''), 'data-id': b.id }, head);
    if (isOpen) {
      const body = el('div', { class: 'blk-body', id: 'body-' + b.id });
      const build = () => {
        body.replaceChildren();
        def.fields.forEach((f) => {
          if (f.show && !f.show(b)) return;
          body.appendChild(field(f, b, (fd, imm) => {
            sumEl.textContent = def.summary(b) || '…';
            changed({ now: !!imm });
            if (fd.refresh) build();
          }));
        });
      };
      build();
      card.appendChild(body);
    }
    return card;
  }

  /* ------------------------------------------------------------------ colonne de gauche : pages / apparence / infos */
  function renderPagesList() {
    const ul = $('#pages-list'); ul.replaceChildren();
    app.pages.forEach((p, i) => {
      const sel = p.id === currentPage().id;
      ul.appendChild(el('li', { class: 'page-row' + (sel ? ' sel' : ''), 'data-id': p.id }, [
        el('span', { class: 'handle' + (i === 0 ? ' fixed' : ''), draggable: i === 0 ? null : 'true', title: i === 0 ? 'Page d’accueil (position fixe)' : 'Glisser pour réordonner', 'aria-hidden': 'true', text: i === 0 ? '⌂' : '⠿' }),
        el('button', { type: 'button', class: 'page-btn', 'aria-current': sel ? 'true' : null, onclick: () => selectPage(p.id) }, [
          el('span', { class: 'pg-ico', 'aria-hidden': 'true', text: p.icon || '•' }), el('span', { class: 'pg-t', text: p.title }),
          p.tab === false ? el('span', { class: 'pg-hidden', title: 'Page cachée : on y accède par un bouton ou une carte', text: 'cachée' }) : null
        ])
      ]));
    });
  }
  sortable($('#pages-list'), 'li.page-row', '.handle', (from, to) => {
    if (from === 0 || to === 0) { toast('La première page est la page d’accueil.'); return; }
    const [x] = app.pages.splice(from, 1); app.pages.splice(to, 0, x);
    renderPagesList(); changed({ now: true });
  });

  function selectPage(id) {
    view.pageId = id; view.openBlock = null; view.gotoPending = true;
    renderPagesList(); renderPageSettings(); renderBlocks(); schedulePreview();
  }

  function renderPageSettings() {
    const p = currentPage(), idx = app.pages.indexOf(p), host = $('#page-settings');
    host.replaceChildren();
    const refreshList = () => renderPagesList();
    host.appendChild(el('div', { class: 'row' }, [
      el('div', { class: 'field grow' }, [
        el('label', { for: 'pg-title', text: 'Nom de la page' }),
        el('input', { id: 'pg-title', type: 'text', value: p.title, oninput: (e) => { p.title = e.target.value; refreshList(); changed(); } })
      ]),
      el('div', { class: 'field icon-field' }, [
        el('label', { for: 'pg-icon', text: 'Pictogramme' }),
        el('input', { id: 'pg-icon', type: 'text', value: p.icon, maxlength: '8', 'aria-describedby': 'pg-icon-help', oninput: (e) => { p.icon = e.target.value; refreshList(); changed(); } })
      ])
    ]));
    const emojiBox = el('details', { class: 'emoji-pick' }, [
      el('summary', { text: 'Choisir un pictogramme' }),
      el('div', { class: 'emoji-grid' }, EMOJIS.map((em) => el('button', { type: 'button', class: 'emoji', text: em, 'aria-label': em, onclick: () => { p.icon = em; $('#pg-icon').value = em; refreshList(); changed({ now: true }); } })))
    ]);
    host.appendChild(emojiBox);
    host.appendChild(el('div', { class: 'checks' }, [
      el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked: p.tab !== false, disabled: idx === 0, onchange: (e) => { p.tab = e.target.checked; refreshList(); renderPageSettings(); changed({ now: true }); } }),
        el('span', { text: idx === 0 ? 'Page d’accueil (toujours dans la barre d’onglets)' : 'Afficher dans la barre d’onglets' })]),
      el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked: p.showTitle !== false, onchange: (e) => { p.showTitle = e.target.checked; changed({ now: true }); } }),
        el('span', { text: 'Afficher le nom de la page en titre' })])
    ]));
    if (idx !== 0 && p.tab === false) host.appendChild(el('p', { class: 'help', text: 'Page cachée : les visiteurs l’atteignent par un bouton, une carte ou un lien. Pratique pour un parcours ou une énigme.' }));
    host.appendChild(el('div', { class: 'row actions' }, [
      el('button', { type: 'button', class: 'btn small', text: 'Dupliquer la page', onclick: () => duplicatePage(p) }),
      idx === 0 ? null : el('button', { type: 'button', class: 'btn small danger', text: 'Supprimer la page', onclick: () => deletePage(p) })
    ]));
  }

  function addPage() {
    const title = 'Nouvelle page';
    const p = { id: newId(app.pages.map((x) => x.id), title), title, icon: '📄', tab: true, showTitle: true, blocks: [] };
    app.pages.push(p); selectPage(p.id); changed({ now: true });
    const t = $('#pg-title'); if (t) { t.focus(); t.select(); }
  }
  function duplicatePage(p) {
    const c = clone(p); c.id = newId(app.pages.map((x) => x.id), p.title + ' copie'); c.title = p.title + ' (copie)';
    c.blocks.forEach((b) => { b.id = uid(); });
    app.pages.splice(app.pages.indexOf(p) + 1, 0, c); selectPage(c.id); changed({ now: true });
  }
  function deletePage(p) {
    if (!confirm('Supprimer la page « ' + p.title + ' » et tous ses blocs ?')) return;
    app.pages.splice(app.pages.indexOf(p), 1);
    let n = 0;
    app.pages.forEach((pg) => pg.blocks.forEach((b) => {
      if (b.page === p.id) { b.page = ''; n++; }
      (b.items || []).forEach((it) => { if (it.page === p.id) { it.page = ''; n++; } });
    }));
    selectPage(app.pages[0].id); changed({ now: true });
    toast('Page supprimée.' + (n ? ' ' + n + ' lien(s) vers cette page ont été retirés.' : ''));
  }

  function renderTheme() {
    const t = app.theme, host = $('#theme-panel'); host.replaceChildren();
    const apply = () => { renderTheme(); changed({ now: true }); };
    host.appendChild(el('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'Palettes' }, PRESETS.map((pr) =>
      el('button', { type: 'button', class: 'swatch' + (t.preset === pr.key ? ' sel' : ''), role: 'radio', 'aria-checked': String(t.preset === pr.key), title: pr.name,
        onclick: () => { Object.assign(t, { preset: pr.key, primary: pr.primary, accent: pr.accent, dark: pr.dark }); apply(); } }, [
        el('span', { class: 'sw-dots', style: 'background:' + pr.primary }, el('i', { style: 'background:' + pr.accent })),
        el('span', { text: pr.name })
      ]))));
    const colour = (label, key) => el('div', { class: 'field' }, [
      el('label', { for: 'th-' + key, text: label }),
      el('input', { id: 'th-' + key, type: 'color', value: t[key], oninput: (e) => { t[key] = e.target.value; t.preset = 'custom'; changed(); host.querySelectorAll('.swatch').forEach((s) => { s.classList.remove('sel'); s.setAttribute('aria-checked', 'false'); }); } })
    ]);
    host.appendChild(el('div', { class: 'row' }, [colour('Couleur principale', 'primary'), colour('Couleur d’accent', 'accent')]));
    host.appendChild(el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked: t.dark, onchange: (e) => { t.dark = e.target.checked; changed({ now: true }); } }), el('span', { text: 'Mode sombre' })]));
    const sel = (label, key, opts) => el('div', { class: 'field' }, [
      el('label', { for: 'th-' + key, text: label }),
      el('select', { id: 'th-' + key, onchange: (e) => { t[key] = e.target.value; changed({ now: true }); } }, opts.map((o) => el('option', { value: o[0], text: o[1], selected: t[key] === o[0] })))
    ]);
    host.appendChild(el('div', { class: 'row' }, [
      sel('Coins', 'radius', [['carre', 'Droits'], ['doux', 'Arrondis'], ['rond', 'Très arrondis']]),
      sel('Police', 'font', [['moderne', 'Moderne'], ['classique', 'Classique (serif)'], ['arrondi', 'Arrondie']])
    ]));
  }

  function renderInfo() {
    const host = $('#info-panel'); host.replaceChildren();
    const f = (def) => field(def, app, () => { changed(); });
    host.appendChild(f({ k: 'title', l: 'Nom de l’appli', t: 'text', ph: 'Ex : Centre Horizon' }));
    host.appendChild(f({ k: 'subtitle', l: 'Sous-titre (facultatif)', t: 'text', ph: 'Ex : Livret d’accueil' }));
    host.appendChild(field({ k: 'logo', l: 'Logo (facultatif)', t: 'image', max: 192 }, app, () => changed({ now: true })));
    host.appendChild(f({ k: 'lang', l: 'Langue de l’appli', t: 'select', o: [['fr', 'Français'], ['en', 'English']], help: 'Sert aux dates (lundi 2 septembre) et à l’accessibilité.' }));
  }

  function renderAll() { renderInfo(); renderTheme(); renderPagesList(); renderPageSettings(); renderBlocks(); }

  /* ------------------------------------------------------------------ export */
  async function sha256b64(text) {
    if (!(window.crypto && crypto.subtle)) return null;
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      let s = ''; new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); });
      return btoa(s);
    } catch (e) { return null; }
  }
  const escAttr = (s) => str(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  function faviconHref(a) {
    if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(a.logo)) return a.logo;
    const ini = (a.title.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || 'A').toUpperCase();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="' + a.theme.primary + '"/><text x="32" y="43" font-size="30" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff">' + ini.replace(/[<&]/g, '') + '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /* Fabrique le document HTML complet. preview=true : version pour l'iframe d'aperçu. */
  async function buildHTML(a, o) {
    o = o || {};
    const runtime = '(' + window.MonAppRuntime.toString() + ')';
    const css = window.MONAPP_CSS;
    const origins = a ? H.frameOrigins(a) : [];
    const data = a ? JSON.stringify(a).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') : '';
    const boot = o.preview
      ? runtime + '(document.getElementById("monapp"),null,{preview:true});'
      : runtime + '(document.getElementById("monapp"),JSON.parse(document.getElementById("monapp-data").textContent),{});';
    let csp = '';
    if (!o.preview) {
      const hs = await sha256b64(boot), hc = await sha256b64(css);
      csp = "default-src 'none'; script-src " + (hs ? "'sha256-" + hs + "'" : "'unsafe-inline'") +
        "; style-src " + (hc ? "'sha256-" + hc + "'" : "'unsafe-inline'") +
        "; img-src 'self' data: https:; media-src 'self' https: data:; frame-src " + (origins.join(' ') || "'none'") +
        "; connect-src 'none'; form-action 'none'; base-uri 'none'";
    }
    const title = a ? a.title : 'Aperçu';
    return '<!doctype html>\n<html lang="' + (a ? a.lang : 'fr') + '">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      (csp ? '<meta http-equiv="Content-Security-Policy" content="' + escAttr(csp) + '">\n' : '') +
      '<meta name="referrer" content="strict-origin-when-cross-origin">\n' +
      '<meta name="generator" content="Atelier Appli">\n' +
      (a ? '<meta name="theme-color" content="' + a.theme.primary + '">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<link rel="icon" href="' + escAttr(faviconHref(a)) + '">\n' : '') +
      '<title>' + escAttr(title).replace(/&quot;/g, '"') + '</title>\n<style>' + css + '</style>\n</head>\n<body>\n' +
      '<div id="monapp"></div>\n<noscript><p style="padding:16px;font-family:sans-serif">Cette appli a besoin de JavaScript pour s’afficher.</p></noscript>\n' +
      (a ? '<script type="application/json" id="monapp-data">' + data + '</script>\n' : '') +
      '<script>' + boot + '</script>\n</body>\n</html>\n';
  }

  /* ------------------------------------------------------------------ boîtes de dialogue */
  function closeOnBackdrop(d) { d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); }
  document.querySelectorAll('dialog').forEach(closeOnBackdrop);

  /* Ajouter un bloc */
  function openAddBlock() {
    const grid = $('#add-grid'); grid.replaceChildren();
    GROUPS.forEach((g) => {
      const types = Object.keys(BLOCKS).filter((k) => BLOCKS[k].group === g);
      if (!types.length) return;
      grid.appendChild(el('h3', { text: g }));
      grid.appendChild(el('div', { class: 'add-cards' }, types.map((k) => el('button', { type: 'button', class: 'add-card', onclick: () => addBlock(k) }, [
        el('span', { class: 'ac-ico', 'aria-hidden': 'true', text: BLOCKS[k].icon }),
        el('span', null, [el('b', { text: BLOCKS[k].label }), el('small', { text: BLOCKS[k].desc })])
      ]))));
    });
    $('#dlg-add').showModal();
  }
  function addBlock(type) {
    const page = currentPage(), b = newBlock(type);
    const at = page.blocks.findIndex((x) => x.id === view.openBlock);
    page.blocks.splice(at < 0 ? page.blocks.length : at + 1, 0, b);
    view.openBlock = b.id; view.focusBlock = b.id;
    $('#dlg-add').close(); renderBlocks(); changed({ now: true });
    const card = $('.blk[data-id="' + b.id + '"]');
    if (card) { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); const f = card.querySelector('input:not([type=file]),textarea,select'); if (f) f.focus({ preventScroll: true }); }
  }

  /* Mes applis / modèles / import */
  async function openHome(first) {
    const dlg = $('#dlg-home');
    $('#home-title').textContent = first ? 'Bienvenue dans l’Atelier Appli' : 'Mes applis';
    const mine = $('#home-mine'); mine.replaceChildren();
    let list = [];
    try { list = (await DB.all()).sort((a, b) => b.updated - a.updated); } catch (e) { /* stockage indisponible */ }
    if (list.length) {
      mine.appendChild(el('h3', { text: 'Mes applis enregistrées dans ce navigateur' }));
      const ul = el('ul', { class: 'proj-list' });
      list.forEach((r) => ul.appendChild(el('li', { class: 'proj' + (app && r.id === app.id ? ' cur' : '') }, [
        el('div', { class: 'proj-t' }, [el('b', { text: r.title || 'Sans titre' }), el('small', { text: r.pages + ' page' + (r.pages > 1 ? 's' : '') + ' · modifiée le ' + new Date(r.updated).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) })]),
        el('div', { class: 'proj-a' }, [
          el('button', { type: 'button', class: 'btn small primary', text: app && r.id === app.id ? 'En cours' : 'Ouvrir', disabled: app && r.id === app.id, onclick: () => { loadApp(r.data); dlg.close(); } }),
          el('button', { type: 'button', class: 'btn small', text: 'Dupliquer', onclick: async () => { const c = clone(r.data); c.id = uid(); c.title += ' (copie)'; await DB.put({ id: c.id, title: c.title, updated: Date.now(), pages: c.pages.length, data: c }); openHome(first); } }),
          el('button', { type: 'button', class: 'btn small danger', text: 'Supprimer', onclick: async () => {
            if (!confirm('Supprimer définitivement « ' + r.title + ' » de ce navigateur ?\n(Un fichier .json ou .html déjà téléchargé n’est pas concerné.)')) return;
            await DB.del(r.id);
            if (app && r.id === app.id) { dlg.close(); loadApp(window.MONAPP_TEMPLATES[3].make(), true); } else openHome(first);
          } })
        ])
      ])));
      mine.appendChild(ul);
    }
    const tpl = $('#home-templates'); tpl.replaceChildren();
    window.MONAPP_TEMPLATES.forEach((t) => tpl.appendChild(el('button', { type: 'button', class: 'tpl', onclick: () => { loadApp(t.make(), true); dlg.close(); } }, [
      el('span', { class: 'tpl-ico', 'aria-hidden': 'true', text: t.icon }), el('b', { text: t.name }), el('small', { text: t.desc })
    ])));
    $('#home-close').hidden = !!first && !app;
    if (!dlg.open) dlg.showModal();
  }

  /* Export */
  async function openExport() {
    const dlg = $('#dlg-export');
    const nBlocks = app.pages.reduce((n, p) => n + p.blocks.length, 0);
    const html = await buildHTML(clone(app));
    const size = new Blob([html]).size;
    $('#exp-summary').textContent = app.pages.length + ' page' + (app.pages.length > 1 ? 's' : '') + ' · ' + nBlocks + ' bloc' + (nBlocks > 1 ? 's' : '') + ' · ' + fmtBytes(size);
    const warn = $('#exp-warn');
    warn.hidden = size < 3 * 1048576;
    warn.textContent = size >= 3 * 1048576 ? 'Ce fichier est lourd (' + fmtBytes(size) + ') : le chargement sera lent sur mobile. Réduisez le nombre d’images ou utilisez des images plus petites.' : '';
    const issues = checkApp();
    const ul = $('#exp-issues'); ul.replaceChildren(); ul.hidden = !issues.length;
    issues.forEach((i) => ul.appendChild(el('li', { text: i })));
    $('#exp-name').textContent = ($('#exp-index').checked ? 'index' : slug(app.title)) + '.html';
    dlg.showModal();
  }
  function checkApp() {
    const out = [];
    app.pages.forEach((p) => p.blocks.forEach((b) => {
      const d = BLOCKS[b.type], w = '« ' + p.title + ' › ' + d.label + ' » : ';
      if (b.type === 'button' && b.kind === 'page' && !b.page) out.push(w + 'le bouton n’a pas de page de destination.');
      if (b.type === 'button' && b.kind === 'url' && !H.safeUrl(b.url)) out.push(w + 'adresse manquante ou invalide.');
      if (b.type === 'embed' && !H.embedInfo(b.url)) out.push(w + 'adresse du formulaire manquante.');
      if (b.type === 'video' && !H.videoInfo(b.url)) out.push(w + 'vidéo non reconnue.');
      if (b.type === 'map' && !H.mapInfo(b.where)) out.push(w + 'position non reconnue.');
      if (b.type === 'image' && !b.src) out.push(w + 'aucune image choisie.');
      if (b.type === 'image' && b.src && !b.alt.trim()) out.push(w + 'pensez à décrire l’image (accessibilité).');
      if (b.type === 'countdown' && !b.date) out.push(w + 'aucune date.');
    }));
    return out.slice(0, 8);
  }
  async function doExport() {
    const html = await buildHTML(clone(app));
    const name = ($('#exp-index').checked ? 'index' : slug(app.title)) + '.html';
    download(name, new Blob([html], { type: 'text/html;charset=utf-8' }));
    dirtyFile = false;
    toast('Fichier « ' + name + ' » téléchargé.', 'ok');
  }

  /* Projet .json */
  function saveProject() {
    download(slug(app.title) + '.atelier.json', new Blob([JSON.stringify(app)], { type: 'application/json' }));
    dirtyFile = false; toast('Projet enregistré (.json).', 'ok');
  }
  async function importFile(file) {
    try {
      const text = await file.text();
      let raw;
      if (/\.html?$/i.test(file.name) || /^\s*<!doctype|^\s*<html/i.test(text)) {
        const d = new DOMParser().parseFromString(text, 'text/html');
        const s = d.getElementById('monapp-data');
        if (!s) throw new Error('Ce fichier HTML n’a pas été créé avec l’Atelier Appli (données introuvables).');
        raw = JSON.parse(s.textContent);
      } else raw = JSON.parse(text);
      const a = normalizeApp(raw);
      a.id = uid();
      loadApp(a, true);
      toast('« ' + a.title + ' » importée.', 'ok');
      $('#dlg-home').close();
    } catch (e) { toast(e instanceof SyntaxError ? 'Fichier illisible.' : e.message, 'bad'); }
  }

  /* ------------------------------------------------------------------ chargement d'une appli */
  function loadApp(raw, isNew) {
    try { app = normalizeApp(raw); } catch (e) { toast(e.message, 'bad'); return; }
    if (isNew) app.id = uid();
    view.pageId = app.pages[0].id; view.openBlock = null; view.gotoPending = true;
    hist = []; hi = -1; snapshot(); dirtyFile = false;
    renderAll(); schedulePreview(); doSave();
  }

  /* ------------------------------------------------------------------ branchements */
  $('#btn-add-block').addEventListener('click', openAddBlock);
  $('#btn-add-page').addEventListener('click', addPage);
  $('#btn-undo').addEventListener('click', () => { snapshot(); restore(hi - 1); });
  $('#btn-redo').addEventListener('click', () => restore(hi + 1));
  $('#btn-home').addEventListener('click', () => openHome(false));
  $('#btn-save').addEventListener('click', saveProject);
  $('#btn-export').addEventListener('click', openExport);
  $('#exp-index').addEventListener('change', () => { $('#exp-name').textContent = ($('#exp-index').checked ? 'index' : slug(app.title)) + '.html'; });
  $('#exp-go').addEventListener('click', doExport);
  $('#home-import').addEventListener('click', () => $('#file-import').click());
  $('#file-import').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  document.querySelectorAll('[data-device]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-device]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#preview-box').dataset.device = b.dataset.device;
  }));
  $('#btn-preview-toggle').addEventListener('click', () => {
    const open = document.body.classList.toggle('show-preview');
    $('#btn-preview-toggle').setAttribute('aria-pressed', String(open));
  });
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && !['input', 'textarea', 'select'].includes(tag)) {
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); snapshot(); restore(hi - 1); }
      else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); restore(hi + 1); }
    }
  });
  window.addEventListener('beforeunload', (e) => { if (dirtyFile) { e.preventDefault(); e.returnValue = ''; } });

  sortable($('#blocks'), 'article.blk', '.handle', (from, to) => moveBlock(currentPage(), from, to));

  /* ------------------------------------------------------------------ démarrage */
  (async function init() {
    buildHTML(null, { preview: true }).then((h) => { frame.srcdoc = h; });
    let rec = null;
    try { const last = mem('atelier:last'); if (last) rec = await DB.get(last); } catch (e) { /* ignore */ }
    if (rec && rec.data) { loadApp(rec.data); }
    else {
      app = window.MONAPP_TEMPLATES[3].make(); app = normalizeApp(app);
      view.pageId = app.pages[0].id; snapshot(); renderAll();
      openHome(true);
    }
    // Pour les tests automatisés et le débogage
    window.__atelier = { get app() { return app; }, buildHTML, normalizeApp, BLOCKS };
  })();
})();
