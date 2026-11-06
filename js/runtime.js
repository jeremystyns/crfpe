/* ============================================================================
   MOTEUR D'AFFICHAGE de l'appli.

   Cette fonction est utilisée à deux endroits :
     1. dans l'aperçu du constructeur (iframe) ;
     2. recopiée telle quelle (Function.prototype.toString) dans le fichier HTML exporté.

   Elle doit donc rester AUTONOME : aucune variable externe, aucune dépendance.
   Règles de sécurité : jamais de innerHTML / eval ; tout passe par createElement
   (et createElementNS pour les icônes) + textContent ; chaque URL passe par safeUrl() ;
   chaque iframe est « sandboxée ».

   Les pictogrammes (jeu CRFPE) arrivent dans app.icons = { nom: { v, p:[[transform, d], …] } }.
   ============================================================================ */
window.MonAppRuntime = function (root, initial, opts) {
  'use strict';
  opts = opts || {};
  var doc = root ? root.ownerDocument : document;
  var win = doc.defaultView || window;

  /* ------------------------------------------------------------------ utilitaires */
  function S(v) { return v == null ? '' : String(v); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function isHex(c) { return /^#[0-9a-f]{6}$/i.test(S(c)); }

  function el(tag, props, kids) {
    var n = doc.createElement(tag);
    if (props) {
      for (var k in props) {
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      }
    }
    add(n, kids);
    return n;
  }
  function add(n, kids) {
    if (kids == null) return;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c);
    });
  }

  /* Pictogramme CRFPE : SVG construit nœud par nœud (jamais de innerHTML). */
  var NS = 'http://www.w3.org/2000/svg';
  function ico(name, size) {
    var def = app && app.icons && app.icons[name];
    var s = doc.createElementNS(NS, 'svg');
    s.setAttribute('class', 'ma-svg');
    s.setAttribute('width', String(size || 20));
    s.setAttribute('height', String(size || 20));
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    if (!def || !+def.v) return s;
    s.setAttribute('viewBox', '0 0 ' + (+def.v) + ' ' + (+def.v));
    arr(def.p).forEach(function (p) {
      var t = S(p[0]), d = S(p[1]);
      if (!/^[a-z]+\([\d\s.,\-]*\)(\s*[a-z]+\([\d\s.,\-]*\))*$/i.test(t) || !/^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+\-]*$/.test(d)) return;
      var g = doc.createElementNS(NS, 'g'); g.setAttribute('transform', t);
      var path = doc.createElementNS(NS, 'path'); path.setAttribute('d', d);
      g.appendChild(path); s.appendChild(g);
    });
    return s;
  }
  var FIXED_ICONS = ['info-circle', 'exclamation-circle', 'check-circle', 'bullhorn', 'map-marker', 'phone', 'envelope', 'clock', 'link', 'file-text', 'chevron-right', 'arrow-right', 'calendar', 'file'];

  /* URL « sûre » : http(s), mailto, tel, ou chemin relatif (ex. documents/reglement.pdf).
     Tout autre schéma (javascript:, data:, vbscript:…) est refusé. */
  function safeUrl(u) {
    u = S(u).replace(/[\u0000-\u001f\u007f]/g, '').trim();
    if (!u) return null;
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return null;
    if (u.slice(0, 2) === '//') return null;
    return u;
  }
  function imgSrc(u) {
    u = S(u).trim();
    if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+\/=]+$/i.test(u)) return u;
    if (/^data:/i.test(u)) return null;
    var s = safeUrl(u);
    return s && !/^(mailto|tel):/i.test(s) ? s : null;
  }

  /* ------------------------------------------------------------------ couleurs et palettes d'équipe (charte CRFPE) */
  function rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function hex(a) { return '#' + a.map(function (x) { x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] * (1 - t) + y[i] * t; })); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  /* Rapproche une couleur du noir (ou du blanc) jusqu'à un contraste lisible (4,5:1). */
  function readable(color, bg, toWhite) {
    var c = color, i = 0;
    while (contrast(c, bg) < 4.5 && i < 14) { c = mix(c, toWhite ? '#ffffff' : '#000000', 0.12); i++; }
    return c;
  }
  /* Texte posé sur une couleur : blanc ou presque noir, selon le meilleur contraste. */
  function onColor(bg) { return contrast(bg, '#ffffff') >= contrast(bg, '#0b1f33') ? '#ffffff' : '#0b1f33'; }

  /* Palettes d'équipe : socle bleu/cyan commun ; filet, étiquettes et demi-lentille changent. */
  var TEAMS = {
    instit: { name: 'Institutionnel', team: '#58889e', soft: '#b7ddff', lens: '#41c8f4' },
    eje: { name: 'EJE', team: '#6cc067', soft: '#e6efc1', lens: '#b9d774' },
    fc: { name: 'Formation Continue', team: '#c00000', soft: '#f3a59f', lens: '#ed9977' },
    sesame: { name: 'Espace Sésame', team: '#dc8319', soft: '#ffe4af', lens: '#f99d1d' }
  };
  var FONT = '"Mulish","Bliss Pro","Trebuchet MS",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

  function themeVars(t) {
    t = t || {};
    var primary = isHex(t.primary) ? t.primary : '#004c8e';
    var accent = isHex(t.accent) ? t.accent : '#41c8f4';
    var dark = !!t.dark;
    var tm = TEAMS[t.team];
    var team = tm ? tm.team : accent, soft = tm ? tm.soft : mix(accent, '#ffffff', 0.78), lens = tm ? tm.lens : accent;
    var surface = dark ? '#13233a' : '#ffffff';
    var bg = dark ? '#0c1626' : '#f2f4f7';
    var text = dark ? '#e6ecf4' : '#2f3342';
    var head = dark ? mix(primary, '#000000', 0.4) : primary;
    var btn = dark ? accent : primary;
    var link = readable(dark ? accent : primary, surface, dark);
    var title = dark ? '#f2f6fb' : readable(primary, surface, false);
    var v = {
      '--c-primary': primary,
      '--c-head': head, '--c-on-head': onColor(head),
      '--c-hero': head, '--c-on-hero': onColor(head), '--c-lens': lens, '--c-lens-o': (!tm || t.team === 'instit') ? '.55' : '.92',
      '--c-btn': btn, '--c-on-btn': onColor(btn), '--c-btn-hover': mix(btn, dark ? '#ffffff' : '#000000', dark ? 0.15 : 0.22),
      '--c-accent': accent, '--c-on-accent': onColor(accent), '--c-accent-hover': mix(accent, dark ? '#ffffff' : '#000000', dark ? 0.15 : 0.12),
      '--c-bg': bg, '--c-surface': surface, '--c-text': text, '--c-muted': dark ? '#a5b3c7' : '#566074',
      '--c-border': dark ? '#263b57' : 'rgba(0,0,0,.12)',
      '--c-link': link, '--c-link-hover': dark ? mix(link, '#ffffff', 0.2) : '#00799f', '--c-title': title,
      '--c-soft': dark ? mix(primary, surface, 0.7) : mix(primary, '#ffffff', 0.9),
      '--c-team': team, '--c-team-soft': dark ? mix(team, surface, 0.7) : soft, '--c-on-soft': dark ? '#e6ecf4' : '#2f3342',
      '--c-focus': '#00b0f0',
      '--font': FONT
    };
    var tones = dark
      ? { info: ['#14304f', '#2b5a8a', '#7cc8f0'], warn: ['#3a2c12', '#7a5a1d', '#f0b55a'], ok: ['#16331f', '#2f6a3c', '#7fd08a'], alert: ['#3a1a1a', '#8a3030', '#f08a82'] }
      : { info: ['#e8f4fc', '#b7ddff', '#004c8e'], warn: ['#fff4dc', '#ffe4af', '#8a4b00'], ok: ['#eaf5e9', '#c0e1bf', '#2b6e27'], alert: ['#fbe9e7', '#f3a59f', '#a00000'] };
    var tx = dark ? { bleu: '#7cc8f0', cyan: '#41c8f4', rouge: '#f08a82', orange: '#f0b55a', vert: '#7fd08a', gris: '#a5b3c7' } : { bleu: '#004c8e', cyan: '#00799f', rouge: '#c00000', orange: '#9a5700', vert: '#2b6e27', gris: '#566074' };
    for (var kt in tx) v['--tx-' + kt] = tx[kt];
    var hl = { jaune: '#ffeb7a', vert: '#c0e1bf', rose: '#f3a59f', bleu: '#b7ddff' };
    for (var kh in hl) v['--hl-' + kh] = hl[kh];
    var tr = { cyan: '#41c8f4', orange: '#f99d1d', rose: '#e75145', vert: '#6cc067', bleu: dark ? '#7cc8f0' : '#004c8e' };
    for (var kr in tr) v['--tr-' + kr] = tr[kr];
    for (var k in tones) { v['--t-' + k + '-bg'] = tones[k][0]; v['--t-' + k + '-b'] = tones[k][1]; v['--t-' + k + '-i'] = tones[k][2]; }
    return v;
  }

  /* ------------------------------------------------------------------ analyse des liens (partagé avec le constructeur) */
  function parseIframe(raw) {
    raw = S(raw).trim();
    var s = raw.match(/<iframe[^>]*?\ssrc\s*=\s*["']([^"']+)["']/i);
    var h = raw.match(/<iframe[^>]*?\sheight\s*=\s*["']?(\d{2,4})/i);
    return { url: (s ? s[1] : raw).replace(/&amp;/g, '&').trim(), height: h ? parseInt(h[1], 10) : null };
  }

  /* Adresse d'un formulaire / contenu intégré → { src, origin, service, height, warn } ou null */
  function embedInfo(raw) {
    var p = parseIframe(raw), u;
    try { u = new URL(p.url); } catch (e) { return null; }
    if (u.protocol !== 'https:') return null;
    var h = u.hostname.replace(/^www\./, ''), service = 'Contenu externe', warn = '', m;
    if (h === 'tally.so') {
      service = 'Tally';
      m = u.pathname.match(/^\/r\/([\w-]+)/);
      if (m) u = new URL('https://tally.so/embed/' + m[1] + '?alignLeft=1&hideTitle=1&transparentBackground=1');
    } else if (h === 'docs.google.com' && /\/forms\//.test(u.pathname)) {
      service = 'Google Forms'; u.searchParams.set('embedded', 'true');
    } else if (h === 'forms.gle') {
      service = 'Google Forms'; warn = 'Ce lien court ne peut pas être intégré : utilisez « Envoyer › </> intégrer » dans Google Forms, ou choisissez le mode « bouton ».';
    } else if (h === 'forms.office.com' || h === 'forms.microsoft.com') {
      service = 'Microsoft Forms';
      if (/ResponsePage/i.test(u.pathname)) u.searchParams.set('embed', 'true');
      else if (/^\/r\//.test(u.pathname)) warn = 'Ce lien court s’ouvre mieux dans un nouvel onglet : choisissez le mode « bouton », ou collez le code « Intégrer » de Microsoft Forms.';
    } else if (/(^|\.)framaforms\.org$/.test(h)) service = 'Framaforms';
    else if (/(^|\.)typeform\.com$/.test(h)) service = 'Typeform';
    else if (/(^|\.)learningapps\.org$/.test(h)) service = 'LearningApps';
    else if (/(^|\.)genial\.ly$/.test(h) || /(^|\.)genially\.com$/.test(h)) service = 'Genially';
    else if (/(^|\.)padlet\.com$/.test(h)) service = 'Padlet';
    else if (/(^|\.)canva\.com$/.test(h)) service = 'Canva';
    else if (/(^|\.)wooclap\.com$/.test(h)) service = 'Wooclap';
    else if (/(^|\.)h5p\./.test(h) || /(^|\.)h5p\.org$/.test(h)) service = 'H5P';
    return { src: u.href, origin: u.origin, service: service, height: p.height, warn: warn, open: p.url };
  }

  /* Activité H5P créée ailleurs : adresse d'intégration (H5P.org, Lumi, Moodle, Éléa, WordPress…) */
  function h5pInfo(raw) {
    var i = embedInfo(raw), u, m;
    if (!i) return null;
    try { u = new URL(i.src); } catch (e) { return null; }
    var h = u.hostname.replace(/^www\./, '');
    i.service = 'H5P';
    if (h === 'h5p.org' || h === 'h5p.com' || /\.h5p\.com$/.test(h)) {
      m = u.pathname.match(/^\/(?:node|h5p)\/(\d+)\/?$/);
      if (m) { u = new URL(u.origin + '/h5p/embed/' + m[1]); i.src = u.href; i.origin = u.origin; }
    }
    if (/\/mod\/h5pactivity\//.test(u.pathname)) i.warn = 'Cette page de Moodle demande une connexion : utilisez « Partager › Intégrer » depuis la banque de contenus, ou un lien public.';
    else if (!/embed|h5p|run|lumi/i.test(u.href)) i.warn = 'Vérifiez qu’il s’agit bien de l’adresse d’intégration de l’activité (elle contient souvent « embed » ou « h5p »).';
    return i;
  }

  /* Vidéo : YouTube, Vimeo, Dailymotion, PeerTube, ou fichier .mp4/.webm */
  function videoInfo(raw) {
    var p = parseIframe(raw), u, id, m;
    try { u = new URL(p.url, 'https://exemple.invalid/'); } catch (e) { return null; }
    var rel = !/^[a-z]+:/i.test(p.url);
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname) && (rel || u.protocol === 'https:')) {
      return { file: rel ? p.url : u.href };
    }
    if (u.protocol !== 'https:') return null;
    var h = u.hostname.replace(/^www\.|^m\./, '');
    if (h === 'youtu.be') id = u.pathname.slice(1);
    else if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) id = u.searchParams.get('v') || ((u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/) || [])[1]);
    if (id && /^[\w-]{6,20}$/.test(id)) return { src: 'https://www.youtube-nocookie.com/embed/' + id, origin: 'https://www.youtube-nocookie.com' };
    if (h === 'vimeo.com' || h === 'player.vimeo.com') {
      m = u.pathname.match(/(\d{5,})/);
      if (m) return { src: 'https://player.vimeo.com/video/' + m[1], origin: 'https://player.vimeo.com' };
    }
    if (h === 'dailymotion.com' || h === 'dai.ly') {
      m = u.pathname.match(/\/(?:video\/)?([a-z0-9]{5,})$/i);
      if (m) return { src: 'https://www.dailymotion.com/embed/video/' + m[1], origin: 'https://www.dailymotion.com' };
    }
    m = u.pathname.match(/^\/(?:w|videos\/watch)\/([\w-]+)/);
    if (m) return { src: u.origin + '/videos/embed/' + m[1], origin: u.origin };
    if (/\/videos\/embed\//.test(u.pathname)) return { src: u.href, origin: u.origin };
    return null;
  }

  /* Carte : lien OpenStreetMap / Google Maps ou « lat, lon » */
  function mapInfo(raw) {
    raw = S(raw).trim();
    var m, r = null;
    if ((m = raw.match(/#map=(\d+)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/))) r = { zoom: +m[1], lat: +m[2], lon: +m[3] };
    else if ((m = raw.match(/mlat=(-?\d+(?:\.\d+)?)[\s\S]*?mlon=(-?\d+(?:\.\d+)?)/))) r = { zoom: 16, lat: +m[1], lon: +m[2] };
    else if ((m = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+(?:\.\d+)?)z)?/))) r = { zoom: Math.round(+m[3] || 16), lat: +m[1], lon: +m[2] };
    else if ((m = raw.match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/))) r = { zoom: 16, lat: +m[1], lon: +m[2] };
    if (!r || Math.abs(r.lat) > 85 || Math.abs(r.lon) > 180) return null;
    r.zoom = Math.max(3, Math.min(19, r.zoom));
    var dLon = 360 * 600 / (256 * Math.pow(2, r.zoom)) / 2;
    var dLat = dLon * 0.5 * Math.cos(r.lat * Math.PI / 180);
    r.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + [r.lon - dLon, r.lat - dLat, r.lon + dLon, r.lat + dLat].map(function (x) { return x.toFixed(5); }).join(',') +
      '&layer=mapnik&marker=' + r.lat + ',' + r.lon;
    r.open = 'https://www.openstreetmap.org/?mlat=' + r.lat + '&mlon=' + r.lon + '#map=' + r.zoom + '/' + r.lat + '/' + r.lon;
    r.origin = 'https://www.openstreetmap.org';
    return r;
  }

  /* Hôtes à autoriser dans la Content-Security-Policy de l'export */
  function frameOrigins(a) {
    var out = {};
    arr(a && a.pages).forEach(function (p) {
      arr(p.blocks).forEach(function (b) {
        var i = null;
        if (b.type === 'embed' && b.mode !== 'button') i = embedInfo(b.url);
        else if (b.type === 'h5p' && b.mode !== 'button') i = h5pInfo(b.url);
        else if (b.type === 'video') i = videoInfo(b.url);
        else if (b.type === 'map') i = mapInfo(b.where);
        if (i && i.origin) out[i.origin] = 1;
      });
    });
    return Object.keys(out);
  }

  /* Noms des pictogrammes dont l'appli a besoin (pour n'embarquer que ceux-là dans l'export) */
  function iconNames(a) {
    var n = {};
    FIXED_ICONS.forEach(function (k) { n[k] = 1; });
    arr(a && a.pages).forEach(function (p) { if (p.icon) n[p.icon] = 1; });
    return Object.keys(n);
  }

  if (opts.helpersOnly) {
    return { safeUrl: safeUrl, embedInfo: embedInfo, h5pInfo: h5pInfo, videoInfo: videoInfo, mapInfo: mapInfo, parseIframe: parseIframe, frameOrigins: frameOrigins, iconNames: iconNames, themeVars: themeVars, contrast: contrast, TEAMS: TEAMS };
  }

  /* ------------------------------------------------------------------ texte enrichi (mini-Markdown sûr) */
  function link(href, kids, cls) {
    var ext = /^https?:/i.test(href);
    return el('a', { href: href, class: cls, target: ext ? '_blank' : null, rel: ext ? 'noopener noreferrer' : null }, kids);
  }
  function inline(text, parent) {
    var re = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]+[^\s<.,;:!?)\]]))/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(doc.createTextNode(text.slice(last, m.index)));
      if (m[2] != null) parent.appendChild(el('strong', { text: m[2] }));
      else if (m[3] != null) parent.appendChild(el('em', { text: m[3] }));
      else if (m[4] != null) { var h = safeUrl(m[5]); parent.appendChild(h ? link(h, m[4]) : doc.createTextNode(m[4])); }
      else parent.appendChild(link(m[6], m[6]));
      last = re.lastIndex;
    }
    if (last < text.length) parent.appendChild(doc.createTextNode(text.slice(last)));
  }
  /* Texte structuré produit par l'éditeur visuel : { b:[ {k:'p'|'ul'|'ol', al, r:[…] | i:[[…]]} ] } */
  var TXK = { bleu: 1, cyan: 1, rouge: 1, orange: 1, vert: 1, gris: 1 }, HLK = { jaune: 1, vert: 1, rose: 1, bleu: 1 }, TRK = { cyan: 1, orange: 1, rose: 1, vert: 1, bleu: 1 }, SZK = { s: 1, l: 1, xl: 1 }, ALK = { center: 1, right: 1, justify: 1 };
  function runs(rs, parent) {
    arr(rs).forEach(function (r) {
      if (!r) return;
      if (r.br) { parent.appendChild(el('br')); return; }
      var t = S(r.t); if (!t) return;
      var out = doc.createTextNode(t), cls = [];
      if (TXK[r.c]) cls.push('ma-c-' + r.c);
      if (HLK[r.h]) cls.push('ma-h-' + r.h);
      if (SZK[r.s]) cls.push('ma-s-' + r.s);
      if (r.u) cls.push('ma-u');
      if (TRK[r.uc]) cls.push('ma-t-' + r.uc);
      if (cls.length) out = el('span', { class: cls.join(' ') }, out);
      if (r.i) out = el('em', null, out);
      if (r.b) out = el('strong', null, out);
      var h = r.a ? safeUrl(r.a) : null;
      if (h) out = link(h, out);
      parent.appendChild(out);
    });
  }
  function richDoc(d) {
    var box = el('div', { class: 'ma-rich' });
    arr(d.b).forEach(function (blk) {
      if (!blk) return;
      var al = ALK[blk.al] ? 'ma-al-' + blk.al : null;
      if (blk.k === 'ul' || blk.k === 'ol') {
        var list = el(blk.k, { class: al });
        arr(blk.i).forEach(function (it) { var li = el('li'); runs(it, li); if (li.childNodes.length) list.appendChild(li); });
        if (list.childNodes.length) box.appendChild(list);
      } else {
        var p = el('p', { class: al });
        runs(blk.r, p);
        if (p.childNodes.length) box.appendChild(p);
      }
    });
    return box;
  }
  function rich(text) {
    if (text && typeof text === 'object' && Array.isArray(text.b)) return richDoc(text);
    var box = el('div', { class: 'ma-rich' });
    S(text).replace(/\r/g, '').split(/\n{2,}/).forEach(function (blk) {
      var lines = blk.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      var ul = lines.every(function (l) { return /^\s*[-*•]\s+/.test(l); });
      var ol = lines.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); });
      if (ul || ol) {
        var list = el(ul ? 'ul' : 'ol');
        lines.forEach(function (l) { var li = el('li'); inline(l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ''), li); list.appendChild(li); });
        box.appendChild(list);
      } else {
        var p = el('p');
        lines.forEach(function (l, i) { if (i) p.appendChild(el('br')); inline(l, p); });
        box.appendChild(p);
      }
    });
    return box;
  }

  /* ------------------------------------------------------------------ dates */
  function parseDate(s) {
    var m = S(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function lang() { return S(app && app.lang) || 'fr'; }

  function downloadIcs(ev) {
    var d = parseDate(ev.date); if (!d) return;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function ymd(x) { return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()); }
    function esc(t) { return S(t).replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n'); }
    var t = S(ev.time).match(/^(\d{1,2}):(\d{2})$/), start, end, now = new Date();
    if (t) {
      start = 'DTSTART:' + ymd(d) + 'T' + pad(+t[1]) + t[2] + '00';
      end = 'DTEND:' + ymd(d) + 'T' + pad(Math.min(23, +t[1] + 1)) + t[2] + '00';
    } else {
      var n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      start = 'DTSTART;VALUE=DATE:' + ymd(d); end = 'DTEND;VALUE=DATE:' + ymd(n);
    }
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Atelier Appli//FR', 'BEGIN:VEVENT',
      'UID:' + now.getTime() + Math.floor(Math.random() * 1e6) + '@atelier-appli',
      'DTSTAMP:' + ymd(now) + 'T' + pad(now.getHours()) + pad(now.getMinutes()) + '00',
      start, end, 'SUMMARY:' + esc(ev.title), ev.place ? 'LOCATION:' + esc(ev.place) : '', ev.text ? 'DESCRIPTION:' + esc(ev.text) : '',
      'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    var url = win.URL.createObjectURL(new win.Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    var a = el('a', { href: url, download: 'evenement.ics' });
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { win.URL.revokeObjectURL(url); }, 4000);
  }

  /* ------------------------------------------------------------------ rendu des blocs */
  var app = null, current = null, navCount = 0;

  function pageById(id) { return arr(app.pages).filter(function (p) { return p.id === id; })[0]; }
  function pageHref(id) { return pageById(id) ? '#/' + id : null; }

  function frame(src, title, height, ratio, h5p) {
    var f = el('iframe', {
      'data-h5p': h5p ? '1' : null,
      src: src, title: title || 'Contenu intégré', loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin',
      allow: 'fullscreen', allowfullscreen: true,
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads',
      height: ratio ? null : String(height || 600)
    });
    return el('div', { class: 'ma-frame' + (ratio ? ' ma-ratio' : '') }, f);
  }
  /* Les activités H5P demandent à la page de les redimensionner (postMessage « h5p ») */
  win.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.context !== 'h5p' || !e.source) return;
    var f = null;
    arr(Array.prototype.slice.call(doc.querySelectorAll('iframe[data-h5p]'))).forEach(function (x) { if (x.contentWindow === e.source) f = x; });
    if (!f) return;
    try {
      if (d.action === 'hello') e.source.postMessage({ context: 'h5p', action: 'ready' }, '*');
      else if (d.action === 'prepareResize') e.source.postMessage({ context: 'h5p', action: 'resizePrepared' }, '*');
      else if (d.action === 'resize' && +d.scrollHeight > 0) f.style.height = Math.min(4000, Math.ceil(+d.scrollHeight)) + 'px';
    } catch (err) { /* ignore */ }
  });
  function warn(msg) { return opts.preview ? el('p', { class: 'ma-warn', text: 'Attention : ' + msg }) : null; }

  var R = {
    hero: function (b) {
      var img = imgSrc(b.image);
      var s = el('div', { class: 'ma-hero' });
      if (img) {
        var im = el('div', { class: 'ma-hero-img', 'aria-hidden': 'true' });
        im.style.backgroundImage = 'url("' + img.replace(/["\\\n]/g, encodeURIComponent) + '")';
        s.appendChild(im);
      }
      add(s, el('div', { class: 'ma-hero-body' }, [el('h2', { text: S(b.title) }), b.text ? el('p', { text: S(b.text) }) : null]));
      return s;
    },
    title: function (b) {
      return el(b.level === 3 ? 'h3' : 'h2', { class: b.level === 3 ? 'ma-h3' : 'ma-h2', text: S(b.text) });
    },
    text: function (b) { return rich(b.text); },
    image: function (b) {
      var src = imgSrc(b.src);
      if (!src) return warn('image manquante.');
      var f = el('figure', { class: 'ma-fig' + (b.size === 'medium' ? ' ma-medium' : '') });
      add(f, [el('img', { src: src, alt: S(b.alt), loading: 'lazy' }), b.caption ? el('figcaption', { text: S(b.caption) }) : null]);
      return f;
    },
    button: function (b) {
      var href = null;
      if (b.kind === 'page') href = pageHref(b.page);
      else if (b.kind === 'mail' && b.mail) href = 'mailto:' + S(b.mail).trim();
      else if (b.kind === 'tel' && b.tel) href = 'tel:' + S(b.tel).replace(/[^\d+]/g, '');
      else if (b.kind === 'url') href = safeUrl(b.url);
      if (!href) return warn('bouton « ' + S(b.label) + ' » : destination manquante.');
      var cls = 'ma-btn' + (b.style === 'outline' ? ' ma-outline' : '') + (b.style === 'accent' ? ' ma-accent' : '') + (b.width === 'auto' ? '' : ' ma-full');
      return link(href, S(b.label) || 'Bouton', cls);
    },
    callout: function (b) {
      var icons = { info: 'info-circle', warn: 'exclamation-circle', ok: 'check-circle', alert: 'bullhorn' };
      var tone = icons[b.tone] ? b.tone : 'info';
      var d = el('div', { class: 'ma-callout ma-tone-' + tone, role: tone === 'alert' ? 'alert' : null });
      add(d, [el('span', { class: 'ma-ico' }, ico(icons[tone], 24)),
        el('div', null, [b.title ? el('strong', { class: 'ma-callout-t', text: S(b.title) }) : null, rich(b.text)])]);
      return d;
    },
    cards: function (b) {
      var style = { grille: 'grille', portraits: 'portraits' }[b.style] || 'liste';
      var ul = el('ul', { class: 'ma-cards ma-cards-' + style });
      arr(b.items).forEach(function (it) {
        var href = it.page ? pageHref(it.page) : safeUrl(it.url);
        var src = imgSrc(it.image);
        var li = el('li', { class: 'ma-card' });
        if (src) li.appendChild(el('img', { src: src, alt: '', loading: 'lazy' }));
        else if (style === 'portraits') li.appendChild(el('span', { class: 'ma-avatar', 'aria-hidden': 'true', text: S(it.title).trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() }));
        var h = el('h3');
        if (href) h.appendChild(link(href, S(it.title))); else h.textContent = S(it.title);
        li.appendChild(el('div', { class: 'ma-card-t' }, [it.tag ? el('span', { class: 'ma-tag', text: S(it.tag) }) : null, h, it.text ? el('p', { text: S(it.text) }) : null]));
        ul.appendChild(li);
      });
      return ul;
    },
    events: function (b) {
      var t0 = today(), list = arr(b.items).map(function (e) { return { e: e, d: parseDate(e.date) }; })
        .filter(function (x) { return x.d && !(b.hidePast && x.d < t0); })
        .sort(function (a, c) { return a.d - c.d || S(a.e.time).localeCompare(S(c.e.time)); });
      if (!list.length) return el('p', { class: 'ma-empty', text: 'Aucune date à venir pour le moment.' });
      var ul = el('ul', { class: 'ma-events' });
      list.forEach(function (x) {
        var meta = [x.d.toLocaleDateString(lang(), { weekday: 'long', day: 'numeric', month: 'long' }), S(x.e.time), S(x.e.place)].filter(Boolean).join(' · ');
        var add1 = b.calendar !== false ? el('button', { type: 'button', class: 'ma-ev-add', onclick: function () { downloadIcs(x.e); } }, [ico('calendar', 16), 'Ajouter à mon agenda']) : null;
        ul.appendChild(el('li', { class: 'ma-ev' }, [
          el('div', { class: 'ma-date', 'aria-hidden': 'true' }, [el('b', { text: String(x.d.getDate()) }), el('span', { text: x.d.toLocaleDateString(lang(), { month: 'short' }).replace('.', '') })]),
          el('div', null, [el('h3', { text: S(x.e.title) }), el('p', { class: 'ma-ev-m', text: meta }), x.e.text ? el('p', { class: 'ma-ev-x', text: S(x.e.text) }) : null, add1])
        ]));
      });
      return ul;
    },
    faq: function (b) {
      var d = el('div', { class: 'ma-faq' });
      arr(b.items).forEach(function (it) {
        d.appendChild(el('details', null, [el('summary', { text: S(it.q) }), rich(it.a)]));
      });
      return d;
    },
    contact: function (b) {
      var dl = el('dl'), rows = 0;
      function row(icon, label, content) {
        if (!content) return; rows++;
        dl.appendChild(el('dt', { 'aria-label': label }, ico(icon, 20)));
        dl.appendChild(el('dd', null, content));
      }
      row('map-marker', 'Adresse', b.address ? S(b.address) : null);
      row('phone', 'Téléphone', b.phone ? link('tel:' + S(b.phone).replace(/[^\d+]/g, ''), S(b.phone)) : null);
      row('envelope', 'Courriel', b.email ? link('mailto:' + S(b.email).trim(), S(b.email)) : null);
      row('clock', 'Horaires', b.hours ? S(b.hours) : null);
      var w = safeUrl(b.website);
      row('link', 'Site web', w ? link(w, S(b.website).replace(/^https?:\/\//, '')) : null);
      return el('section', { class: 'ma-contact' }, [b.org ? el('h3', { text: S(b.org) }) : null, rows ? dl : null]);
    },
    map: function (b) {
      var m = mapInfo(b.where);
      if (!m) return warn('carte : collez un lien OpenStreetMap, un lien Google Maps ou des coordonnées (ex. 48.8584, 2.2945).');
      var wrap = el('div');
      add(wrap, [frame(m.src, b.label || 'Plan d’accès', 300, false), el('p', { class: 'ma-sub' }, [link(m.open, [ico('map-marker', 18), (S(b.label) || 'Ouvrir la carte') + ' (grande carte)'])])]);
      return wrap;
    },
    video: function (b) {
      var v = videoInfo(b.url);
      if (!v) return warn('vidéo : adresse non reconnue (YouTube, Vimeo, Dailymotion, PeerTube ou fichier .mp4).');
      if (v.file) return el('div', { class: 'ma-frame' }, el('video', { src: v.file, controls: true, preload: 'metadata', 'aria-label': S(b.title) || 'Vidéo' }));
      return frame(v.src, b.title || 'Vidéo', 0, true);
    },
    embed: function (b) {
      var i = embedInfo(b.url);
      if (!i) return warn('contenu intégré : collez une adresse https:// ou le code « <iframe …> » fourni par le service.');
      if (b.mode === 'button') return link(i.open, S(b.label) || 'Ouvrir', 'ma-btn ma-full');
      var wrap = el('div');
      add(wrap, [frame(i.src, b.title || i.service, parseInt(b.height, 10) || i.height || 700, false),
        el('p', { class: 'ma-sub' }, [link(i.open, 'Ouvrir dans un nouvel onglet')])]);
      return wrap;
    },
    h5p: function (b) {
      var i = h5pInfo(b.url);
      if (!i) return warn('activité H5P : collez l’adresse d’intégration (https://…) ou le code « <iframe …> » fourni par le site qui héberge l’activité.');
      if (b.mode === 'button') return link(i.open, S(b.label) || 'Ouvrir l’activité', 'ma-btn ma-full');
      var wrap = el('div');
      add(wrap, [frame(i.src, b.title || 'Activité H5P', parseInt(b.height, 10) || i.height || 500, false, true),
        el('p', { class: 'ma-sub' }, [link(i.open, 'Ouvrir l’activité dans un nouvel onglet')])]);
      return wrap;
    },
    links: function (b) {
      var ul = el('ul', { class: 'ma-links' });
      arr(b.items).forEach(function (it) {
        var href = it.page ? pageHref(it.page) : safeUrl(it.url);
        if (!href) return;
        var file = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|zip)(\?|#|$)/i.test(href);
        var icon = file ? 'file-text' : (/^mailto:/i.test(href) ? 'envelope' : (/^tel:/i.test(href) ? 'phone' : 'link'));
        var a = link(href, [
          el('span', { class: 'ma-ico' }, ico(icon, 22)),
          el('span', null, [el('b', { text: S(it.label) || href }), it.desc ? el('small', { text: S(it.desc) }) : null]),
          el('span', { class: 'ma-go' }, ico('chevron-right', 16))
        ]);
        ul.appendChild(el('li', null, a));
      });
      return ul;
    },
    countdown: function (b) {
      var d = parseDate(b.date);
      if (!d) return warn('compte à rebours : choisissez une date.');
      var n = Math.round((d - today()) / 864e5), big, small;
      if (n > 1) { big = 'J-' + n; small = S(b.label) || 'jours restants'; }
      else if (n === 1) { big = 'Demain'; small = S(b.label); }
      else if (n === 0) { big = 'Aujourd’hui'; small = S(b.label); }
      else { big = 'Terminé'; small = S(b.label); }
      return el('div', { class: 'ma-count', role: 'status' }, [el('b', { text: big }), small ? el('span', { text: small }) : null]);
    },
    separator: function (b) { return b.style === 'space' ? el('div', { class: 'ma-space', 'aria-hidden': 'true' }) : el('hr', { class: 'ma-sep' }); }
  };

  /* ------------------------------------------------------------------ page, onglets, menu, en-tête */
  var menuOpen = false;
  function topPages() { return arr(app.pages).filter(function (p) { return !p.parent; }); }
  /* Barre du bas : 4 pages au plus (l'accueil en fait toujours partie) */
  function barPages() { return topPages().filter(function (p, i) { return i === 0 || p.tab !== false; }).slice(0, 4); }
  /* Menu hamburger : toutes les pages principales, jamais les sous-pages */
  function menuPages() { return topPages().filter(function (p, i) { return i === 0 || p.menu !== false; }); }

  function flip(svg) { svg.setAttribute('class', 'ma-svg ma-flip'); return svg; }

  function burger(size) {
    var s = doc.createElementNS(NS, 'svg');
    s.setAttribute('class', 'ma-svg'); s.setAttribute('width', String(size)); s.setAttribute('height', String(size));
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    [5, 10.8, 16.6].forEach(function (y) {
      var r = doc.createElementNS(NS, 'rect');
      r.setAttribute('x', '3.5'); r.setAttribute('y', String(y)); r.setAttribute('width', '17'); r.setAttribute('height', '2.6'); r.setAttribute('rx', '0.6');
      s.appendChild(r);
    });
    return s;
  }

  function renderHeader() {
    var logo = imgSrc(app.logo);
    var initials = S(app.title).trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() || 'A';
    return el('header', { class: 'ma-head' }, [
      logo ? el('img', { class: 'ma-logo', src: logo, alt: '' }) : el('span', { class: 'ma-logo ma-logo-i', 'aria-hidden': 'true', text: initials }),
      el('div', { class: 'ma-head-t' }, [el('b', { text: S(app.title) || 'Mon appli' }), app.subtitle ? el('small', { text: S(app.subtitle) }) : null])
    ]);
  }

  function setMenu(open, refocus) {
    menuOpen = !!open;
    render();
    var t = doc.querySelector(open ? '.ma-menu a' : '.ma-tab-menu');
    if (t && (open || refocus)) t.focus();
  }

  function render() {
    if (!app || !arr(app.pages).length) { root.textContent = ''; return; }
    var scroll = win.pageYOffset;
    var vars = themeVars(app.theme);
    for (var k in vars) doc.documentElement.style.setProperty(k, vars[k]);
    doc.documentElement.lang = lang();
    doc.documentElement.style.colorScheme = app.theme && app.theme.dark ? 'dark' : 'light';
    if (!pageById(current)) current = app.pages[0].id;
    var page = pageById(current), home = app.pages[0];
    var parent = page.parent ? pageById(page.parent) : null, activeTop = parent || page;
    var bar = barPages(), menu = menuPages(), showBar = menu.length > 1 || bar.length > 1;
    if (!showBar) menuOpen = false;
    doc.body.style.overflow = menuOpen ? 'hidden' : '';
    doc.title = (page === home ? '' : S(page.title) + ' – ') + (S(app.title) || 'Mon appli');

    var main = el('main', { class: 'ma-main' + (showBar ? '' : ' ma-notabs'), id: 'ma-main', tabindex: '-1' });
    if (page !== home && bar.indexOf(page) < 0) {
      var target = parent || home;
      main.appendChild(el('a', {
        class: 'ma-back', href: '#/' + target.id, onclick: function (e) {
          if (navCount > 0) { e.preventDefault(); win.history.back(); }
        }
      }, [flip(ico('arrow-right', 16)), parent ? 'Retour : ' + S(parent.title) : 'Retour']));
    }
    if (page.showTitle !== false && S(page.title)) main.appendChild(el('h1', { class: 'ma-page-h', text: S(page.title) }));
    arr(page.blocks).forEach(function (b) {
      var fn = R[b && b.type], node = null;
      if (!fn) return;
      try { node = fn(b); } catch (e) { node = opts.preview ? el('p', { class: 'ma-warn', text: 'Attention : bloc illisible.' }) : null; }
      if (node) main.appendChild(el('section', { class: 'ma-block ma-b-' + b.type, 'data-block': b.id || null }, node));
    });

    var shell = el('div', { class: 'ma-app' }, [
      el('a', { class: 'ma-skip', href: '#ma-main', onclick: function (e) { e.preventDefault(); main.focus(); } }, 'Aller au contenu'),
      renderHeader(), main
    ]);
    if (showBar) {
      var nav = el('nav', { class: 'ma-tabs', 'aria-label': 'Navigation principale' });
      bar.forEach(function (p) {
        nav.appendChild(el('a', { class: 'ma-tab', href: '#/' + p.id, 'aria-current': p === activeTop && !menuOpen ? 'page' : null }, [
          ico(p.icon || 'file-text', 22), el('div', { text: S(p.title) })
        ]));
      });
      nav.appendChild(el('button', { type: 'button', class: 'ma-tab ma-tab-menu', 'aria-haspopup': 'true', 'aria-expanded': String(menuOpen), 'aria-controls': 'ma-menu', onclick: function () { setMenu(!menuOpen, true); } }, [burger(22), el('div', { text: 'Menu' })]));
      if (menuOpen) {
        shell.appendChild(el('div', { class: 'ma-menu-scrim', onclick: function () { setMenu(false, true); } }));
        shell.appendChild(el('nav', { class: 'ma-menu', id: 'ma-menu', 'aria-label': 'Toutes les pages' }, el('ul', null, menu.map(function (p) {
          return el('li', null, el('a', {
            href: '#/' + p.id, 'aria-current': p === activeTop ? 'page' : null, onclick: function (e) {
              if (win.location.hash === '#/' + p.id || (opts.preview && p === page)) { e.preventDefault(); setMenu(false, true); } else menuOpen = false;
            }
          }, [ico(p.icon || 'file-text', 22), el('span', { text: S(p.title) })]));
        }))));
      }
      shell.appendChild(nav);
    }
    root.textContent = '';
    root.appendChild(shell);
    win.scrollTo(0, scroll);
  }

  function route(first) {
    var m = S(win.location.hash).match(/^#\/([\w-]+)/), id = m && pageById(m[1]) ? m[1] : (app && app.pages[0] ? app.pages[0].id : null);
    var changed = id !== current;
    current = id; menuOpen = false;
    render();
    if (changed && !first) { win.scrollTo(0, 0); }
  }

  /* ------------------------------------------------------------------ démarrage */
  function setApp(a, goto) {
    app = a;
    if (goto && pageById(goto)) current = goto;
    if (goto && pageById(goto)) render(); else route(true);
  }

  if (!opts.preview) {
    win.addEventListener('hashchange', function () { navCount++; route(false); });
  } else {
    win.addEventListener('message', function (e) {
      if (e.source !== win.parent || !e.data) return;
      if (e.data.type === 'app') {
        app = e.data.app;
        if (e.data.goto && pageById(e.data.goto)) current = e.data.goto;
        render();
        if (e.data.focus) {
          var t = doc.querySelector('[data-block="' + String(e.data.focus).replace(/[^\w-]/g, '') + '"]');
          if (t && t.scrollIntoView) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.style.outline = '2px solid var(--c-focus)'; t.style.outlineOffset = '6px'; setTimeout(function () { t.style.outline = ''; t.style.outlineOffset = ''; }, 1400); }
        }
      }
    });
    /* Dans un iframe srcdoc, « #/page » se résoudrait par rapport à la page parente :
       on gère donc la navigation interne nous-mêmes (sans toucher à l'URL). */
    root.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#/"]') : null;
      if (!a) return;
      var m = a.getAttribute('href').match(/^#\/([\w-]+)/);
      e.preventDefault();
      if (m && pageById(m[1])) { current = m[1]; menuOpen = false; render(); win.scrollTo(0, 0); }
    });
    try { win.parent.postMessage({ type: 'preview-ready' }, '*'); } catch (e) { /* ignore */ }
  }
  doc.addEventListener('keydown', function (e) {
    if (!menuOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); setMenu(false, true); return; }
    if (e.key === 'Tab') {
      var f = Array.prototype.slice.call(doc.querySelectorAll('.ma-menu a, .ma-tab-menu'));
      if (!f.length) return;
      var i0 = f.indexOf(doc.activeElement);
      if (e.shiftKey && i0 <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i0 === f.length - 1 || i0 < 0)) { e.preventDefault(); f[0].focus(); }
    }
  });
  if (initial) setApp(initial);
  return { setApp: setApp };
};
