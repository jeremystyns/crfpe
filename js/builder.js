/* ============================================================================
   ATELIER APPLI : le constructeur (charte graphique CRFPE).
   100 % local : aucune requête réseau, aucune bibliothèque externe.
   Sauvegarde automatique dans le navigateur (IndexedDB) + export .json / .html.
   ============================================================================ */
(function () {
  'use strict';

  const H = window.MonAppRuntime(null, null, { helpersOnly: true });
  const ICONS = window.CRFPE_ICONS || {};
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------------ utilitaires */
  const $ = (s, r) => (r || document).querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 8);
  const str = (v) => (v == null ? '' : String(v));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* Pictogramme du jeu CRFPE, dessiné nœud par nœud */
  function icon(name, size, cls) {
    const def = ICONS[name];
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
    s.setAttribute('width', String(size || 18)); s.setAttribute('height', String(size || 18));
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    if (!def) return s;
    s.setAttribute('viewBox', '0 0 ' + def.v + ' ' + def.v);
    def.p.forEach((p) => {
      const g = document.createElementNS(SVGNS, 'g'); g.setAttribute('transform', p[0]);
      const path = document.createElementNS(SVGNS, 'path'); path.setAttribute('d', p[1]);
      g.appendChild(path); s.appendChild(g);
    });
    return s;
  }
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
  const btn = (label, ic, props) => el('button', Object.assign({ type: 'button', class: 'btn' }, props), [ic ? icon(ic, 16) : null, label]);
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

  /* ------------------------------------------------------------------ thèmes : équipes CRFPE */
  const BLUE = '#004c8e', CYAN = '#41c8f4';
  const TEAM_LIST = [
    { key: 'instit', name: 'Institutionnel', dots: ['#58889e', '#b7ddff'] },
    { key: 'eje', name: 'EJE', dots: ['#6cc067', '#e6efc1'] },
    { key: 'fc', name: 'Formation Continue', dots: ['#c00000', '#f3a59f'] },
    { key: 'sesame', name: 'Espace Sésame', dots: ['#dc8319', '#ffe4af'] }
  ];
  const ICON_LABELS = {
    building: 'Bâtiment', 'graduation-cap': 'Diplôme', calendar: 'Calendrier', folder: 'Dossier', phone: 'Téléphone', 'map-marker': 'Lieu', users: 'Groupe', user: 'Personne',
    child: 'Enfant', book: 'Livre', comments: 'Discussion', comment: 'Message', envelope: 'Courriel', 'file-text': 'Document', lightbulb: 'Idée', heart: 'Cœur', star: 'Étoile',
    trophy: 'Trophée', euro: 'Euro', tree: 'Arbre', 'puzzle-piece': 'Puzzle', rocket: 'Fusée', bell: 'Cloche', bullhorn: 'Annonce', briefcase: 'Mallette', university: 'Institution',
    clock: 'Horloge', 'question-circle': 'Question', 'info-circle': 'Information', flag: 'Drapeau', link: 'Lien', print: 'Imprimante', wheelchair: 'Accessibilité', sitemap: 'Organisation',
    'bar-chart': 'Statistiques', search: 'Recherche', cog: 'Réglages', 'paper-plane': 'Envoi', download: 'Téléchargement', 'check-circle': 'Validation', file: 'Fichier', paperclip: 'Pièce jointe'
  };
  const LEGACY_EMOJI = { '🏠': 'building', '📚': 'graduation-cap', '📅': 'calendar', '🗓️': 'clock', '🗂️': 'folder', '📞': 'phone', '📍': 'map-marker', '👥': 'users', '👋': 'star', '🧩': 'puzzle-piece', '🏁': 'flag', '1️⃣': 'puzzle-piece', '2️⃣': 'puzzle-piece', '🏆': 'trophy', '📄': 'file-text', '🎓': 'graduation-cap' };

  /* ------------------------------------------------------------------ catalogue des blocs */
  const OPT = {
    tone: [['info', 'Information'], ['warn', 'Attention'], ['ok', 'Réussite, bon à savoir'], ['alert', 'Urgent']],
    pages: () => [['', 'Aucune page']].concat(app.pages.map((p) => [p.id, p.title]))
  };
  const MD_HELP = 'Astuce : **gras**, *italique*, [texte du lien](https://…). Une ligne qui commence par « - » devient une liste.';

  const BLOCKS = {
    hero: {
      label: 'Bandeau d’accueil', icon: 'flag', group: 'Mise en avant', desc: 'Grand titre sur aplat de couleur, avec image facultative.',
      make: () => ({ title: 'Titre du bandeau', text: '', image: '' }),
      summary: (b) => b.title,
      fields: [
        { k: 'title', l: 'Titre', t: 'text', ph: 'Ex : Bienvenue au CRFPE' },
        { k: 'text', l: 'Sous-titre (facultatif)', t: 'text', ph: 'Ex : Rentrée le lundi 2 septembre' },
        { k: 'image', l: 'Image (facultatif)', t: 'image', max: 1600, help: 'Sans image, le bandeau est un aplat aux couleurs de l’appli.' }
      ]
    },
    title: {
      label: 'Titre', icon: 'list-ul', group: 'Texte et médias', desc: 'Un intertitre pour organiser la page.',
      make: () => ({ text: 'Nouveau titre', level: 2 }),
      summary: (b) => b.text,
      fields: [
        { k: 'text', l: 'Texte', t: 'text' },
        { k: 'level', l: 'Taille', t: 'select', num: true, o: [[2, 'Grand titre'], [3, 'Sous-titre']] }
      ]
    },
    text: {
      label: 'Texte', icon: 'file-text', group: 'Texte et médias', desc: 'Paragraphes, listes, liens, gras, italique.',
      make: () => ({ text: '' }),
      summary: (b) => b.text.replace(/\s+/g, ' ').slice(0, 60),
      fields: [{ k: 'text', l: 'Texte', t: 'textarea', md: true, rows: 6, help: MD_HELP }]
    },
    image: {
      label: 'Image', icon: 'file', group: 'Texte et médias', desc: 'Une photo, compressée automatiquement.',
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
      label: 'Vidéo', icon: 'desktop', group: 'Texte et médias', desc: 'YouTube, Vimeo, Dailymotion, PeerTube ou fichier .mp4.',
      make: () => ({ url: '', title: '' }),
      summary: (b) => b.title || b.url || 'Aucune vidéo',
      fields: [
        { k: 'url', l: 'Adresse de la vidéo', t: 'text', ph: 'https://www.youtube.com/watch?v=…', status: (b) => {
          if (!b.url.trim()) return { level: 'info', t: 'Collez l’adresse de la page de la vidéo (celle de la barre d’adresse).' };
          const v = H.videoInfo(b.url);
          if (!v) return { level: 'bad', t: 'Adresse non reconnue. Essayez YouTube, Vimeo, Dailymotion, PeerTube ou un fichier .mp4.' };
          return { level: 'ok', t: v.file ? 'Fichier vidéo détecté.' : 'Vidéo reconnue (' + new URL(v.src).hostname + ').' };
        } },
        { k: 'title', l: 'Titre de la vidéo (accessibilité)', t: 'text', ph: 'Ex : Visite virtuelle de la salle de motricité' }
      ]
    },
    callout: {
      label: 'Encadré', icon: 'lightbulb', group: 'Texte et médias', desc: 'Information importante, alerte ou bon à savoir.',
      make: () => ({ tone: 'info', title: '', text: '' }),
      summary: (b) => b.title || b.text.slice(0, 50),
      fields: [
        { k: 'tone', l: 'Type', t: 'select', o: OPT.tone },
        { k: 'title', l: 'Titre (facultatif)', t: 'text', ph: 'Ex : Rentrée' },
        { k: 'text', l: 'Texte', t: 'textarea', md: true, rows: 3, help: MD_HELP }
      ]
    },
    button: {
      label: 'Bouton', icon: 'arrow-right', group: 'Navigation', desc: 'Ouvre une page de l’appli, un site, un courriel ou un appel.',
      make: () => ({ label: 'Mon bouton', kind: 'page', page: '', url: '', mail: '', tel: '', style: 'solid', width: 'full' }),
      summary: (b) => b.label,
      fields: [
        { k: 'label', l: 'Texte du bouton', t: 'text', ph: 'Ex : Consulter le planning' },
        { k: 'kind', l: 'Que fait le bouton ?', t: 'select', refresh: true, o: [['page', 'Ouvre une page de l’appli'], ['url', 'Ouvre un site ou un document'], ['mail', 'Écrit un courriel'], ['tel', 'Lance un appel']] },
        { k: 'page', l: 'Page à ouvrir', t: 'page', show: (b) => b.kind === 'page' },
        { k: 'url', l: 'Adresse', t: 'text', ph: 'https://… ou documents/livret.pdf', show: (b) => b.kind === 'url', help: 'Un chemin relatif (documents/livret.pdf) fonctionne si le fichier est hébergé à côté de l’appli.' },
        { k: 'mail', l: 'Adresse de courriel', t: 'text', ph: 'secretariat@exemple.org', show: (b) => b.kind === 'mail' },
        { k: 'tel', l: 'Numéro de téléphone', t: 'text', ph: '+33 (0)3 20 14 93 00', show: (b) => b.kind === 'tel' },
        { k: 'style', l: 'Style', t: 'select', o: [['solid', 'Plein (couleur principale)'], ['outline', 'Contour'], ['accent', 'Accent (cyan de la charte)']] },
        { k: 'width', l: 'Largeur', t: 'select', o: [['full', 'Pleine largeur'], ['auto', 'Ajustée au texte']] }
      ]
    },
    links: {
      label: 'Liens et documents', icon: 'paperclip', group: 'Navigation', desc: 'Liste de liens : PDF, plateforme, sites, pages.',
      make: () => ({ items: [{ label: 'Mon document', desc: '', url: '', page: '' }] }),
      summary: (b) => b.items.length + ' lien' + (b.items.length > 1 ? 's' : ''),
      fields: [{
        k: 'items', t: 'items', l: 'Liens', add: 'Ajouter un lien', itemTitle: (it) => it.label || 'Lien',
        make: () => ({ label: 'Nouveau lien', desc: '', url: '', page: '' }),
        fields: [
          { k: 'label', l: 'Intitulé', t: 'text', ph: 'Ex : Règlement intérieur' },
          { k: 'desc', l: 'Précision (facultatif)', t: 'text', ph: 'Ex : PDF, deux pages' },
          { k: 'url', l: 'Adresse', t: 'text', ph: 'https://… ou documents/reglement.pdf' },
          { k: 'page', l: 'ou page de l’appli', t: 'page', help: 'Si une page est choisie, elle remplace l’adresse.' }
        ]
      }]
    },
    separator: {
      label: 'Séparateur', icon: 'minus', group: 'Navigation', desc: 'Une ligne ou un espace pour aérer.',
      make: () => ({ style: 'line' }),
      summary: (b) => (b.style === 'space' ? 'Espace' : 'Ligne'),
      fields: [{ k: 'style', l: 'Aspect', t: 'select', o: [['line', 'Ligne'], ['space', 'Espace vide']] }]
    },
    cards: {
      label: 'Cartes', icon: 'sitemap', group: 'Listes', desc: 'Actualités, formations, équipe, stands, en liste, en grille ou en portraits.',
      make: () => ({ style: 'liste', items: [{ title: 'Première carte', text: '', tag: '', image: '', page: '', url: '' }] }),
      summary: (b) => b.items.length + ' carte' + (b.items.length > 1 ? 's' : ''),
      fields: [
        { k: 'style', l: 'Présentation', t: 'select', o: [['liste', 'Liste (petite image à gauche)'], ['grille', 'Grille (image en haut)'], ['portraits', 'Portraits carrés (équipe)']] },
        {
          k: 'items', t: 'items', l: 'Cartes', add: 'Ajouter une carte', itemTitle: (it) => it.title || 'Carte',
          make: () => ({ title: 'Nouvelle carte', text: '', tag: '', image: '', page: '', url: '' }),
          fields: [
            { k: 'title', l: 'Titre', t: 'text', ph: 'Ex : Marie Dupont' },
            { k: 'tag', l: 'Étiquette (facultatif)', t: 'text', ph: 'Ex : Formatrice, Actualité' },
            { k: 'text', l: 'Description', t: 'textarea', rows: 2 },
            { k: 'image', l: 'Image (facultatif)', t: 'image', max: 480 },
            { k: 'page', l: 'Ouvre une page de l’appli (facultatif)', t: 'page' },
            { k: 'url', l: 'ou ouvre cette adresse (facultatif)', t: 'text', ph: 'https://…' }
          ]
        }
      ]
    },
    events: {
      label: 'Agenda', icon: 'calendar', group: 'Listes', desc: 'Dates triées automatiquement, avec « Ajouter à mon agenda ».',
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
      label: 'Questions fréquentes', icon: 'question-circle', group: 'Listes', desc: 'Questions et réponses repliables.',
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
      label: 'Compte à rebours', icon: 'clock', group: 'Listes', desc: 'Affiche « J-12 » avant une date importante.',
      make: () => ({ date: '', label: '' }),
      summary: (b) => b.date || 'Choisissez une date',
      fields: [
        { k: 'date', l: 'Date de l’événement', t: 'date' },
        { k: 'label', l: 'Texte sous le compteur', t: 'text', ph: 'Ex : avant la rentrée' }
      ]
    },
    contact: {
      label: 'Contact', icon: 'phone', group: 'Infos pratiques', desc: 'Adresse, téléphone, courriel, horaires, site web.',
      make: () => ({ org: '', address: '', phone: '', email: '', hours: '', website: '' }),
      summary: (b) => b.org || b.email || b.phone || 'Coordonnées',
      fields: [
        { k: 'org', l: 'Nom', t: 'text', ph: 'Ex : CRFPE' },
        { k: 'address', l: 'Adresse', t: 'textarea', rows: 2, ph: '465 rue Courtois\n59000 Lille' },
        { k: 'phone', l: 'Téléphone', t: 'text', ph: '+33 (0)3 20 14 93 00' },
        { k: 'email', l: 'Courriel', t: 'text', ph: 'contact@exemple.org' },
        { k: 'hours', l: 'Horaires', t: 'textarea', rows: 2, ph: 'Du lundi au vendredi\n8 h 30 – 17 h 30' },
        { k: 'website', l: 'Site web', t: 'text', ph: 'https://www.crfpe.fr' }
      ]
    },
    map: {
      label: 'Plan d’accès', icon: 'map-marker', group: 'Infos pratiques', desc: 'Carte OpenStreetMap, sans compte ni clé.',
      make: () => ({ where: '', label: 'Plan d’accès' }),
      summary: (b) => b.label || b.where,
      fields: [
        { k: 'where', l: 'Lien de la carte ou coordonnées', t: 'text', ph: 'https://www.openstreetmap.org/#map=17/50.6292/3.0573', status: (b) => {
          if (!b.where.trim()) return { level: 'info', t: 'Sur openstreetmap.org : cherchez votre adresse, puis copiez le lien de la barre d’adresse. Ou collez des coordonnées : 50.6292, 3.0573.' };
          return H.mapInfo(b.where) ? { level: 'ok', t: 'Position reconnue.' } : { level: 'bad', t: 'Position non reconnue. Collez un lien OpenStreetMap, un lien Google Maps (avec @lat,lon) ou « 50.6292, 3.0573 ».' };
        } },
        { k: 'label', l: 'Légende', t: 'text' }
      ]
    },
    embed: {
      label: 'Formulaire ou contenu intégré', icon: 'puzzle-piece', group: 'Formulaires et contenus', desc: 'Tally, Microsoft Forms, Google Forms, Framaforms, LearningApps, Genially, Padlet…',
      make: () => ({ url: '', mode: 'inline', label: 'Ouvrir le formulaire', title: '', height: 700 }),
      summary: (b) => { const i = H.embedInfo(b.url); return i ? i.service + (b.mode === 'button' ? ' (bouton)' : '') : 'Aucune adresse'; },
      fields: [
        { k: 'url', l: 'Adresse ou code d’intégration', t: 'textarea', rows: 3, ph: 'https://tally.so/r/abc123\nou <iframe src="https://forms.office.com/…" …></iframe>', refresh: true,
          help: 'Collez l’adresse de partage OU le code « intégrer » fourni par le service : l’appli en extrait l’adresse toute seule.',
          status: (b) => {
            if (!b.url.trim()) return { level: 'info', t: 'Tally : Partager, lien. Microsoft Forms : Collecter les réponses, Intégrer. Google Forms : Envoyer, onglet « < > ».' };
            const i = H.embedInfo(b.url);
            if (!i) return { level: 'bad', t: 'Adresse non reconnue : elle doit commencer par https://' };
            return { level: i.warn ? 'warn' : 'ok', t: i.service + ' détecté.' + (i.warn ? ' ' + i.warn : '') };
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
    const hexOk = (c) => /^#[0-9a-f]{6}$/i.test(c);
    const team = ['instit', 'eje', 'fc', 'sesame', 'custom'].includes(th.team) ? th.team : (th.preset === 'ocean' || !th.preset ? 'instit' : 'custom');
    const theme = { team, primary: hexOk(th.primary) ? th.primary : BLUE, accent: hexOk(th.accent) ? th.accent : CYAN, dark: !!th.dark };
    if (team !== 'custom') { theme.primary = BLUE; theme.accent = CYAN; }
    const a = {
      v: 2, id: str(raw.id) || uid(), title: str(raw.title) || 'Mon appli', subtitle: str(raw.subtitle), logo: str(raw.logo),
      lang: raw.lang === 'en' ? 'en' : 'fr', theme, pages: []
    };
    const ids = [];
    raw.pages.forEach((p, i) => {
      if (!p || typeof p !== 'object') return;
      const id = newId(ids, /^[\w-]+$/.test(str(p.id)) ? p.id : p.title);
      ids.push(id);
      let ic = str(p.icon);
      if (!ICONS[ic]) ic = LEGACY_EMOJI[ic] || '';
      const page = { id, title: str(p.title) || 'Page ' + (i + 1), icon: ic, tab: p.tab !== false, showTitle: p.showTitle !== false, blocks: [] };
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
    if (!a.pages.length) a.pages.push({ id: 'accueil', title: 'Accueil', icon: 'building', tab: true, showTitle: true, blocks: [] });
    a.pages[0].tab = true;
    return a;
  }

  /* ------------------------------------------------------------------ état + historique */
  let app = null;
  const view = { pageId: null, openBlock: null, gotoPending: true, focusBlock: null };
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
      st.replaceChildren(icon('check', 14), 'Enregistré dans ce navigateur à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      st.className = 'save-status';
    } catch (e) {
      st.replaceChildren(icon('exclamation-circle', 14), 'Enregistrement automatique impossible : téléchargez votre projet (.json).');
      st.className = 'save-status warn';
    }
  };
  const scheduleSave = debounce(doSave, 700);

  /* ------------------------------------------------------------------ aperçu */
  function exportable(a) {
    const icons = {};
    H.iconNames(a).forEach((n) => { if (ICONS[n]) icons[n] = ICONS[n]; });
    return Object.assign({}, a, { icons });
  }
  let previewReady = false;
  const frame = $('#preview');
  const postPreview = () => {
    if (!previewReady || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: 'app', app: exportable(app), goto: view.gotoPending ? view.pageId : null, focus: view.focusBlock || null }, '*');
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
    const b = (label, title, fn, cls) => el('button', { type: 'button', class: 'tb ' + (cls || ''), title, 'aria-label': title, onclick: fn, text: label });
    return el('div', { class: 'md-tools', role: 'toolbar', 'aria-label': 'Mise en forme' }, [
      b('G', 'Gras', () => wrapSel(ta, '**', '**', 'texte'), 'b'),
      b('I', 'Italique', () => wrapSel(ta, '*', '*', 'texte'), 'i'),
      el('button', { type: 'button', class: 'tb', title: 'Lien', 'aria-label': 'Lien', onclick: () => {
        const s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || 'texte du lien';
        ta.setRangeText('[' + sel + '](https://)', s, e, 'end');
        const p = s + sel.length + 3; ta.setSelectionRange(p, p + 8); ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
      } }, icon('link', 14)),
      el('button', { type: 'button', class: 'tb', title: 'Liste à puces', 'aria-label': 'Liste à puces', onclick: () => {
        const s = ta.selectionStart, e = ta.selectionEnd, a = ta.value.lastIndexOf('\n', s - 1) + 1;
        const chunk = ta.value.slice(a, e) || '';
        ta.setRangeText(chunk.split('\n').map((l) => (l.startsWith('- ') ? l : '- ' + l)).join('\n'), a, e, 'end');
        ta.focus(); ta.dispatchEvent(new Event('input', { bubbles: true }));
      } }, icon('list-ul', 14))
    ]);
  }

  /* Sélecteur d'image : miniature + actions. def.extra : boutons supplémentaires */
  function imageField(def, obj, onChange) {
    const wrap = el('div', { class: 'img-field' });
    const input = el('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', class: 'sr-only', tabindex: '-1', 'aria-label': def.l || 'Choisir une image' });
    function draw() {
      wrap.querySelectorAll('.img-row').forEach((n) => n.remove());
      const v = obj[def.k];
      const thumb = v ? el('img', { src: v, alt: '', class: 'thumb' + (def.onBlue ? ' on-blue' : '') }) : el('span', { class: 'thumb empty', 'aria-hidden': 'true' }, icon('file', 22));
      const pick = btn(v ? 'Changer l’image…' : 'Choisir une image…', null, { class: 'btn small', onclick: () => input.click() });
      const rm = v ? btn('Retirer', null, { class: 'btn small ghost', onclick: () => { obj[def.k] = ''; draw(); onChange(def, true); } }) : null;
      const size = v ? el('span', { class: 'muted', text: fmtBytes(Math.round(v.length * 0.75)) }) : null;
      const extra = def.extra ? def.extra(obj, () => { draw(); onChange(def, true); }) : null;
      wrap.insertBefore(el('div', { class: 'img-row' }, [thumb, el('div', { class: 'img-actions' }, [pick, extra, rm, size])]), input);
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

  const STATUS_ICON = { ok: 'check-circle', info: 'info-circle', warn: 'exclamation-circle', bad: 'exclamation-circle' };

  /* Rend un champ. onChange(def, immediate) est appelé après chaque modification. */
  let fieldSeq = 0;
  function field(def, obj, onChange) {
    const id = 'f' + (++fieldSeq);
    let ctl, statusEl = null;
    const updateStatus = () => {
      const r = def.status(obj);
      statusEl.className = 'status ' + r.level;
      statusEl.replaceChildren(icon(STATUS_ICON[r.level] || 'info-circle', 16), el('span', { text: r.t }));
    };
    const fire = (immediate) => { onChange(def, immediate); if (statusEl) updateStatus(); };
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
          OPT.pages().map((o) => el('option', { value: o[0], text: o[1], selected: obj[def.k] === o[0] })));
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
      ? el('div', { class: 'field check' }, [ctl, label, help])
      : el('div', { class: 'field' }, [label, ctl, statusEl, help]);
  }

  const mini = (ic, title, fn, dis) => el('button', { type: 'button', class: 'mini', title, 'aria-label': title, disabled: dis, onclick: (e) => { e.preventDefault(); e.stopPropagation(); fn(e); } }, icon(ic, 16));
  const grip = (fixed) => el('span', { class: 'grip' + (fixed ? ' fixed' : ''), draggable: fixed ? null : 'true', title: fixed ? 'Page d’accueil : position fixe' : 'Glisser pour réordonner', 'aria-hidden': 'true' });

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
        const det = el('details', { class: 'item', open: i === open }, [
          el('summary', null, [grip(false), sum, el('span', { class: 'item-btns' }, [
            mini('arrow-up', 'Monter', () => move(i, i - 1), i === 0),
            mini('arrow-down', 'Descendre', () => move(i, i + 1), i === arr().length - 1),
            mini('trash', 'Supprimer', () => { arr().splice(i, 1); open = -1; draw(); onChange(def, true); })
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
    sortable(list, 'details.item', '.grip', (from, to) => move(from, to));
    draw();
    box.appendChild(el('div', { class: 'items-head' }, [el('span', { class: 'items-title', text: def.l })]));
    box.appendChild(list);
    box.appendChild(btn(def.add, 'plus', { class: 'btn small', onclick: () => { arr().push(def.make()); open = arr().length - 1; draw(); onChange(def, true); const d = list.lastElementChild; if (d) { const f = d.querySelector('input,textarea'); if (f) f.focus(); } } }));
    return box;
  }

  /* Glisser-déposer natif (+ boutons de flèche pour le clavier et le tactile) */
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
        el('p', { class: 'empty-t', text: 'Cette page ne contient encore aucun bloc.' }),
        el('p', { class: 'muted', text: 'Utilisez le bouton « Ajouter un bloc », sous la liste des pages : titre, texte, image, formulaire…' })
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
      el('span', { class: 'blk-icon' }, icon(def.icon, 18)),
      el('span', { class: 'blk-name', text: def.label }), sumEl
    ]);
    const head = el('header', { class: 'blk-head' }, [
      grip(false),
      toggle,
      el('span', { class: 'blk-btns' }, [
        mini('arrow-up', 'Monter le bloc', () => moveBlock(page, i, i - 1), i === 0),
        mini('arrow-down', 'Descendre le bloc', () => moveBlock(page, i, i + 1), i === page.blocks.length - 1),
        mini('plus', 'Dupliquer le bloc', () => { const c = clone(b); c.id = uid(); page.blocks.splice(i + 1, 0, c); view.openBlock = c.id; renderBlocks(); changed({ now: true }); }),
        mini('trash', 'Supprimer le bloc', () => {
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

  /* ------------------------------------------------------------------ colonne de gauche : pages */
  function renderPagesList() {
    const ul = $('#pages-list'); ul.replaceChildren();
    app.pages.forEach((p, i) => {
      const sel = p.id === currentPage().id;
      ul.appendChild(el('li', { class: 'page-row' + (sel ? ' sel' : ''), 'data-id': p.id }, [
        grip(i === 0),
        el('button', { type: 'button', class: 'page-btn', 'aria-current': sel ? 'true' : null, onclick: () => selectPage(p.id) }, [
          icon(p.icon || 'file-text', 18, 'pg-ico'), el('span', { class: 'pg-t', text: p.title }),
          p.tab === false ? el('span', { class: 'pg-hidden', title: 'Page cachée : on y accède par un bouton ou une carte', text: 'cachée' }) : null
        ])
      ]));
    });
  }
  sortable($('#pages-list'), 'li.page-row', '.grip', (from, to) => {
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
    const iconBtn = el('span', { class: 'cur-ico' }, icon(p.icon || 'file-text', 20));
    host.appendChild(el('div', { class: 'row' }, [
      el('div', { class: 'field grow' }, [
        el('label', { for: 'pg-title', text: 'Nom de la page' }),
        el('input', { id: 'pg-title', type: 'text', value: p.title, oninput: (e) => { p.title = e.target.value; refreshList(); changed(); } })
      ])
    ]));
    const grid = el('div', { class: 'icon-grid', role: 'group', 'aria-label': 'Pictogrammes' });
    Object.keys(ICON_LABELS).forEach((n) => {
      if (!ICONS[n]) return;
      grid.appendChild(el('button', { type: 'button', class: 'icon-opt' + (p.icon === n ? ' sel' : ''), title: ICON_LABELS[n], 'aria-label': ICON_LABELS[n], 'aria-pressed': String(p.icon === n),
        onclick: () => { p.icon = n; refreshList(); renderPageSettings(); changed({ now: true }); } }, icon(n, 20)));
    });
    host.appendChild(el('details', { class: 'icon-pick' }, [
      el('summary', null, [iconBtn, el('span', { text: 'Pictogramme de la page' }), icon('chevron-down', 12, 'chev')]),
      grid
    ]));
    host.appendChild(el('div', { class: 'checks' }, [
      el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked: p.tab !== false, disabled: idx === 0, onchange: (e) => { p.tab = e.target.checked; refreshList(); renderPageSettings(); changed({ now: true }); } }),
        el('span', { text: idx === 0 ? 'Page d’accueil (toujours dans la barre d’onglets)' : 'Afficher dans la barre d’onglets' })]),
      el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked: p.showTitle !== false, onchange: (e) => { p.showTitle = e.target.checked; changed({ now: true }); } }),
        el('span', { text: 'Afficher le nom de la page en titre' })])
    ]));
    if (idx !== 0 && p.tab === false) host.appendChild(el('p', { class: 'help', text: 'Page cachée : les visiteurs l’atteignent par un bouton, une carte ou un lien. Pratique pour un parcours ou une énigme.' }));
    host.appendChild(el('div', { class: 'row actions' }, [
      btn('Dupliquer la page', null, { class: 'btn small', onclick: () => duplicatePage(p) }),
      idx === 0 ? null : btn('Supprimer la page', 'trash', { class: 'btn small danger', onclick: () => deletePage(p) })
    ]));
  }

  function addPage() {
    const title = 'Nouvelle page';
    const p = { id: newId(app.pages.map((x) => x.id), title), title, icon: 'file-text', tab: true, showTitle: true, blocks: [] };
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

  /* ------------------------------------------------------------------ fenêtre Configuration */
  function renderTheme() {
    const t = app.theme, host = $('#theme-panel'); host.replaceChildren();
    const apply = () => { renderTheme(); changed({ now: true }); };
    host.appendChild(el('h3', { class: 'cfg-h', text: 'Équipe' }));
    host.appendChild(el('p', { class: 'help', text: 'Le bleu et le cyan du CRFPE sont communs à toutes les équipes. Chaque équipe ajoute ses couleurs d’accompagnement (filets, étiquettes, motif du bandeau).' }));
    const cards = TEAM_LIST.map((tm) => el('button', { type: 'button', class: 'team' + (t.team === tm.key ? ' sel' : ''), role: 'radio', 'aria-checked': String(t.team === tm.key),
      onclick: () => { Object.assign(t, { team: tm.key, primary: BLUE, accent: CYAN }); apply(); } }, [
      el('span', { class: 'team-dots', 'aria-hidden': 'true' }, [el('i', { style: 'background:' + BLUE }), el('i', { style: 'background:' + CYAN }), el('i', { style: 'background:' + tm.dots[0] }), el('i', { style: 'background:' + tm.dots[1] })]),
      el('span', { class: 'team-n', text: tm.name })
    ]));
    cards.push(el('button', { type: 'button', class: 'team' + (t.team === 'custom' ? ' sel' : ''), role: 'radio', 'aria-checked': String(t.team === 'custom'),
      onclick: () => { t.team = 'custom'; apply(); } }, [
      el('span', { class: 'team-dots', 'aria-hidden': 'true' }, [el('i', { style: 'background:' + t.primary }), el('i', { style: 'background:' + t.accent })]),
      el('span', { class: 'team-n', text: 'Couleur libre' })
    ]));
    host.appendChild(el('div', { class: 'teams', role: 'radiogroup', 'aria-label': 'Équipe' }, cards));
    if (t.team === 'custom') {
      const colour = (label, key) => el('div', { class: 'field' }, [
        el('label', { for: 'th-' + key, text: label }),
        el('input', { id: 'th-' + key, type: 'color', value: t[key], oninput: (e) => { t[key] = e.target.value; changed(); } })
      ]);
      host.appendChild(el('div', { class: 'row' }, [colour('Couleur principale', 'primary'), colour('Couleur d’accent', 'accent')]));
      host.appendChild(el('p', { class: 'help', text: 'Les textes restent lisibles quelle que soit la couleur : l’Atelier choisit lui-même blanc ou bleu nuit sur vos couleurs.' }));
    }
    host.appendChild(el('h3', { class: 'cfg-h', text: 'Affichage' }));
    host.appendChild(el('label', { class: 'check' }, [el('input', { type: 'checkbox', checked: t.dark, onchange: (e) => { t.dark = e.target.checked; changed({ now: true }); } }), el('span', { text: 'Mode sombre' })]));
    host.appendChild(el('p', { class: 'help', text: 'Variante ajoutée par l’Atelier : elle ne figure pas dans la charte graphique du CRFPE.' }));
  }

  function renderInfo() {
    const host = $('#info-panel'); host.replaceChildren();
    const f = (def) => field(def, app, () => { changed(); });
    host.appendChild(f({ k: 'title', l: 'Nom de l’appli', t: 'text', ph: 'Ex : Livret d’accueil EJE' }));
    host.appendChild(f({ k: 'subtitle', l: 'Sous-titre (facultatif)', t: 'text', ph: 'Ex : Promotion 2026-2029' }));
    host.appendChild(field({
      k: 'logo', l: 'Logo', t: 'image', max: 192, onBlue: true,
      help: 'Le logo est détaché du fond par un filet blanc, comme l’exige la charte.',
      extra: (obj, redraw) => btn('Logo du CRFPE', null, { class: 'btn small', onclick: () => { obj.logo = window.CRFPE_LOGO; redraw(); } })
    }, app, () => changed({ now: true })));
    host.appendChild(f({ k: 'lang', l: 'Langue de l’appli', t: 'select', o: [['fr', 'Français'], ['en', 'English']], help: 'Sert aux dates (lundi 2 septembre) et à l’accessibilité.' }));
  }

  function renderAll() { renderInfo(); renderTheme(); renderPagesList(); renderPageSettings(); renderBlocks(); }

  const cfg = $('#dlg-config');
  function showTab(id) {
    document.querySelectorAll('#dlg-config [role=tab]').forEach((t) => {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $('#panel-' + t.dataset.tab).hidden = !on;
    });
  }
  function openConfig(tab) {
    showTab(tab || 'theme');
    if (!cfg.open) cfg.show();       // fenêtre non modale : l'aperçu reste visible et réagit en direct
    $('#btn-config').setAttribute('aria-expanded', 'true');
    const f = cfg.querySelector('[role=tab][aria-selected=true]'); if (f) f.focus();
  }
  function closeConfig() { cfg.close(); $('#btn-config').setAttribute('aria-expanded', 'false'); $('#btn-config').focus(); }
  cfg.querySelectorAll('[role=tab]').forEach((t, i, all) => {
    t.addEventListener('click', () => showTab(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
      showTab(n.dataset.tab); n.focus();
    });
  });
  cfg.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closeConfig(); } });
  $('#cfg-done').addEventListener('click', closeConfig);
  $('#cfg-close').addEventListener('click', closeConfig);
  $('#btn-config').addEventListener('click', () => { if (cfg.open) closeConfig(); else openConfig(); });

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
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="5" fill="' + a.theme.primary + '"/><text x="32" y="43" font-size="30" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#fff">' + ini.replace(/[<&]/g, '') + '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /* Fabrique le document HTML complet. o.preview : version pour l'iframe d'aperçu. */
  async function buildHTML(a, o) {
    o = o || {};
    const runtime = '(' + window.MonAppRuntime.toString() + ')';
    const css = (window.MONAPP_FONT_CSS || '') + window.MONAPP_CSS;
    const exp = a ? exportable(a) : null;
    const origins = a ? H.frameOrigins(a) : [];
    const data = exp ? JSON.stringify(exp).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') : '';
    const boot = o.preview
      ? runtime + '(document.getElementById("monapp"),null,{preview:true});'
      : runtime + '(document.getElementById("monapp"),JSON.parse(document.getElementById("monapp-data").textContent),{});';
    let csp = '';
    if (!o.preview) {
      const hs = await sha256b64(boot), hc = await sha256b64(css);
      csp = "default-src 'none'; script-src " + (hs ? "'sha256-" + hs + "'" : "'unsafe-inline'") +
        "; style-src " + (hc ? "'sha256-" + hc + "'" : "'unsafe-inline'") +
        "; font-src data:; img-src 'self' data: https:; media-src 'self' https: data:; frame-src " + (origins.join(' ') || "'none'") +
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
  document.querySelectorAll('dialog.modal').forEach(closeOnBackdrop);

  /* Ajouter un bloc */
  function openAddBlock() {
    const grid = $('#add-grid'); grid.replaceChildren();
    GROUPS.forEach((g) => {
      const types = Object.keys(BLOCKS).filter((k) => BLOCKS[k].group === g);
      if (!types.length) return;
      grid.appendChild(el('h3', { text: g }));
      grid.appendChild(el('div', { class: 'add-cards' }, types.map((k) => el('button', { type: 'button', class: 'add-card', onclick: () => addBlock(k) }, [
        el('span', { class: 'ac-ico' }, icon(BLOCKS[k].icon, 22)),
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
          btn(app && r.id === app.id ? 'En cours' : 'Ouvrir', null, { class: 'btn small primary', disabled: app && r.id === app.id, onclick: () => { loadApp(r.data); dlg.close(); } }),
          btn('Dupliquer', null, { class: 'btn small', onclick: async () => { const c = clone(r.data); c.id = uid(); c.title += ' (copie)'; await DB.put({ id: c.id, title: c.title, updated: Date.now(), pages: c.pages.length, data: c }); openHome(first); } }),
          btn('Supprimer', 'trash', { class: 'btn small danger', onclick: async () => {
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
      el('span', { class: 'tpl-ico' }, icon(t.icon, 24)), el('b', { text: t.name }), el('small', { text: t.desc })
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
        raw = JSON.parse(s.textContent); delete raw.icons;
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
  // Pictogrammes des boutons déclarés dans le HTML par data-icon
  document.querySelectorAll('[data-icon]').forEach((n) => { n.insertBefore(icon(n.dataset.icon, +n.dataset.size || 16), n.firstChild); if (!n.title && n.textContent.trim()) n.title = n.textContent.trim(); });
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
  document.querySelectorAll('dialog.modal [data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
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

  sortable($('#blocks'), 'article.blk', '.grip', (from, to) => moveBlock(currentPage(), from, to));

  /* ------------------------------------------------------------------ démarrage */
  (async function init() {
    buildHTML(null, { preview: true }).then((h) => { frame.srcdoc = h; });
    let rec = null;
    try { const last = mem('atelier:last'); if (last) rec = await DB.get(last); } catch (e) { /* ignore */ }
    if (rec && rec.data) { loadApp(rec.data); }
    else {
      app = normalizeApp(window.MONAPP_TEMPLATES[3].make());
      view.pageId = app.pages[0].id; snapshot(); renderAll();
      openHome(true);
    }
    // Pour les tests automatisés et le débogage
    window.__atelier = { get app() { return app; }, buildHTML, normalizeApp, BLOCKS };
  })();
})();
