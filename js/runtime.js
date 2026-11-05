/* ============================================================================
   MOTEUR D'AFFICHAGE de l'appli.

   Cette fonction est utilisée à deux endroits :
     1. dans l'aperçu du constructeur (iframe) ;
     2. recopiée telle quelle (Function.prototype.toString) dans le fichier HTML exporté.

   Elle doit donc rester AUTONOME : aucune variable externe, aucune dépendance.
   Règles de sécurité : jamais de innerHTML / eval ; tout passe par createElement
   + textContent ; chaque URL passe par safeUrl() ; chaque iframe est « sandboxée ».
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

  /* ------------------------------------------------------------------ couleurs */
  function rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function hex(a) { return '#' + a.map(function (x) { x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] * (1 - t) + y[i] * t; })); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  /* Rapproche une couleur du noir (ou du blanc) jusqu'à un contraste lisible (4,5:1). */
  function readable(color, bg, dark) {
    var c = color, i = 0;
    while (contrast(c, bg) < 4.5 && i < 12) { c = mix(c, dark ? '#ffffff' : '#000000', 0.12); i++; }
    return c;
  }

  var FONTS = {
    moderne: 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
    classique: 'Georgia,"Iowan Old Style","Palatino Linotype",Palatino,serif',
    arrondi: 'ui-rounded,"SF Pro Rounded","Hiragino Maru Gothic ProN",Quicksand,"Segoe UI",system-ui,sans-serif'
  };
  var RADII = { carre: '4px', doux: '14px', rond: '24px' };

  function themeVars(t) {
    t = t || {};
    var primary = isHex(t.primary) ? t.primary : '#2563eb';
    var accent = isHex(t.accent) ? t.accent : '#f59e0b';
    var dark = !!t.dark;
    var bg = dark ? '#0f1420' : mix(primary, '#ffffff', 0.955);
    var surface = dark ? '#182032' : '#ffffff';
    var text = dark ? '#e8ecf5' : '#1c2333';
    var muted = dark ? '#a3aec6' : '#566074';
    return {
      '--c-primary': primary,
      '--c-on-primary': contrast(primary, '#ffffff') >= contrast(primary, '#111827') ? '#ffffff' : '#111827',
      '--c-accent': dark ? mix(accent, '#ffffff', 0.15) : readable(accent, '#ffffff', false) === accent ? accent : mix(accent, '#000000', 0.25),
      '--c-bg': bg, '--c-surface': surface, '--c-text': text, '--c-muted': muted,
      '--c-border': dark ? '#2b3753' : mix(primary, '#ffffff', 0.86),
      '--c-link': readable(primary, surface, dark),
      '--c-soft': dark ? mix(primary, '#182032', 0.78) : mix(primary, '#ffffff', 0.9),
      '--c-grad2': mix(primary, dark ? '#000000' : accent, dark ? 0.45 : 0.55),
      '--radius': RADII[t.radius] || RADII.doux,
      '--font': FONTS[t.font] || FONTS.moderne
    };
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
        else if (b.type === 'video') i = videoInfo(b.url);
        else if (b.type === 'map') i = mapInfo(b.where);
        if (i && i.origin) out[i.origin] = 1;
      });
    });
    return Object.keys(out);
  }

  if (opts.helpersOnly) {
    return { safeUrl: safeUrl, embedInfo: embedInfo, videoInfo: videoInfo, mapInfo: mapInfo, parseIframe: parseIframe, frameOrigins: frameOrigins, themeVars: themeVars, contrast: contrast };
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
  function rich(text) {
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

  function frame(src, title, height, ratio) {
    var f = el('iframe', {
      src: src, title: title || 'Contenu intégré', loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin',
      allow: 'fullscreen', allowfullscreen: true,
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads',
      height: ratio ? null : String(height || 600)
    });
    return el('div', { class: 'ma-frame' + (ratio ? ' ma-ratio' : '') }, f);
  }
  function warn(msg) { return opts.preview ? el('p', { class: 'ma-warn', text: '⚠ ' + msg }) : null; }

  var R = {
    hero: function (b) {
      var img = imgSrc(b.image);
      var s = el('div', { class: 'ma-hero ' + (img ? 'ma-has-img' : 'ma-no-img') });
      if (img) s.style.backgroundImage = 'linear-gradient(0deg,rgba(0,0,0,0),rgba(0,0,0,0)),url("' + img.replace(/["\\\n]/g, encodeURIComponent) + '")';
      add(s, [el('h2', { text: S(b.title) }), b.text ? el('p', { text: S(b.text) }) : null]);
      return s;
    },
    title: function (b) {
      return el(b.level === 3 ? 'h3' : 'h2', { class: b.level === 3 ? 'ma-h3' : 'ma-h2', text: S(b.text) });
    },
    text: function (b) { return rich(b.text); },
    image: function (b) {
      var src = imgSrc(b.src);
      if (!src) return warn('Image manquante.');
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
      if (!href) return warn('Bouton « ' + S(b.label) + ' » : destination manquante.');
      var cls = 'ma-btn' + (b.style === 'outline' ? ' ma-outline' : '') + (b.width === 'auto' ? '' : ' ma-full');
      var a = link(href, S(b.label) || 'Bouton', cls);
      return a;
    },
    callout: function (b) {
      var icons = { info: 'ℹ️', warn: '⚠️', ok: '✅', alert: '🚨' };
      var tone = icons[b.tone] ? b.tone : 'info';
      var d = el('div', { class: 'ma-callout ma-tone-' + tone, role: tone === 'alert' ? 'alert' : null });
      add(d, [el('span', { class: 'ma-ico', 'aria-hidden': 'true', text: icons[tone] }),
        el('div', null, [b.title ? el('strong', { text: S(b.title) }) : null, rich(b.text)])]);
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
        var add1 = b.calendar !== false ? el('button', { type: 'button', class: 'ma-ev-add', text: '📅 Ajouter à mon agenda', onclick: function () { downloadIcs(x.e); } }) : null;
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
      function row(label, content) { if (!content) return; rows++; dl.appendChild(el('dt', { text: label })); dl.appendChild(el('dd', null, content)); }
      row('📍', b.address ? S(b.address) : null);
      row('📞', b.phone ? link('tel:' + S(b.phone).replace(/[^\d+]/g, ''), S(b.phone)) : null);
      row('✉️', b.email ? link('mailto:' + S(b.email).trim(), S(b.email)) : null);
      row('🕒', b.hours ? S(b.hours) : null);
      var w = safeUrl(b.website);
      row('🌐', w ? link(w, S(b.website).replace(/^https?:\/\//, '')) : null);
      return el('section', { class: 'ma-contact' }, [b.org ? el('h3', { text: S(b.org) }) : null, rows ? dl : null]);
    },
    map: function (b) {
      var m = mapInfo(b.where);
      if (!m) return warn('Carte : collez un lien OpenStreetMap, un lien Google Maps ou des coordonnées (ex. 48.8584, 2.2945).');
      var wrap = el('div');
      add(wrap, [frame(m.src, b.label || 'Plan d’accès', 300, false), el('p', { class: 'ma-sub' }, [link(m.open, '🗺️ ' + (S(b.label) || 'Ouvrir la carte') + ' (grande carte)')])]);
      return wrap;
    },
    video: function (b) {
      var v = videoInfo(b.url);
      if (!v) return warn('Vidéo : adresse non reconnue (YouTube, Vimeo, Dailymotion, PeerTube ou fichier .mp4).');
      if (v.file) return el('div', { class: 'ma-frame' }, el('video', { src: v.file, controls: true, preload: 'metadata', 'aria-label': S(b.title) || 'Vidéo' }));
      return frame(v.src, b.title || 'Vidéo', 0, true);
    },
    embed: function (b) {
      var i = embedInfo(b.url);
      if (!i) return warn('Contenu intégré : collez une adresse https:// ou le code « <iframe …> » fourni par le service.');
      if (b.mode === 'button') return link(i.open, S(b.label) || 'Ouvrir', 'ma-btn ma-full');
      var wrap = el('div');
      add(wrap, [frame(i.src, b.title || i.service, parseInt(b.height, 10) || i.height || 700, false),
        el('p', { class: 'ma-sub' }, [link(i.open, 'Ouvrir dans un nouvel onglet')])]);
      return wrap;
    },
    links: function (b) {
      var ul = el('ul', { class: 'ma-links' });
      arr(b.items).forEach(function (it) {
        var href = it.page ? pageHref(it.page) : safeUrl(it.url);
        if (!href) return;
        var file = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|zip)(\?|#|$)/i.test(href);
        var a = link(href, [
          el('span', { class: 'ma-ico', 'aria-hidden': 'true', text: file ? '📄' : (/^mailto:/i.test(href) ? '✉️' : (/^tel:/i.test(href) ? '📞' : '🔗')) }),
          el('span', null, [el('b', { text: S(it.label) || href }), it.desc ? el('small', { text: S(it.desc) }) : null]),
          el('span', { class: 'ma-go', 'aria-hidden': 'true', text: '›' })
        ]);
        ul.appendChild(el('li', null, a));
      });
      return ul;
    },
    countdown: function (b) {
      var d = parseDate(b.date);
      if (!d) return warn('Compte à rebours : choisissez une date.');
      var n = Math.round((d - today()) / 864e5), big, small;
      if (n > 1) { big = 'J-' + n; small = S(b.label) || 'jours restants'; }
      else if (n === 1) { big = 'Demain'; small = S(b.label); }
      else if (n === 0) { big = 'Aujourd’hui'; small = S(b.label); }
      else { big = 'Terminé'; small = S(b.label); }
      return el('div', { class: 'ma-count', role: 'status' }, [el('b', { text: big }), small ? el('span', { text: small }) : null]);
    },
    separator: function (b) { return b.style === 'space' ? el('div', { class: 'ma-space', 'aria-hidden': 'true' }) : el('hr', { class: 'ma-sep' }); }
  };

  /* ------------------------------------------------------------------ page, onglets, en-tête */
  function tabbed() { return arr(app.pages).filter(function (p, i) { return i === 0 || p.tab !== false; }); }

  function renderHeader() {
    var logo = imgSrc(app.logo);
    var initials = S(app.title).trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() || 'A';
    return el('header', { class: 'ma-head' }, [
      logo ? el('img', { class: 'ma-logo', src: logo, alt: '' }) : el('span', { class: 'ma-logo', 'aria-hidden': 'true', text: initials }),
      el('div', { class: 'ma-head-t' }, [el('b', { text: S(app.title) || 'Mon appli' }), app.subtitle ? el('small', { text: S(app.subtitle) }) : null])
    ]);
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
    var tabs = tabbed(), inTabs = tabs.indexOf(page) > -1, showTabs = tabs.length > 1;
    doc.title = (page === home ? '' : S(page.title) + ' – ') + (S(app.title) || 'Mon appli');

    var main = el('main', { class: 'ma-main' + (showTabs ? '' : ' ma-notabs'), id: 'ma-main', tabindex: '-1' });
    if (!inTabs && page !== home) {
      main.appendChild(el('a', {
        class: 'ma-back', href: '#/' + home.id, onclick: function (e) {
          if (navCount > 0) { e.preventDefault(); win.history.back(); }
        }
      }, '← Retour'));
    }
    if (page.showTitle !== false && S(page.title)) main.appendChild(el('h1', { class: 'ma-page-h', text: S(page.title) }));
    arr(page.blocks).forEach(function (b) {
      var fn = R[b && b.type], node = null;
      if (!fn) return;
      try { node = fn(b); } catch (e) { node = opts.preview ? el('p', { class: 'ma-warn', text: '⚠ Bloc illisible.' }) : null; }
      if (node) main.appendChild(el('section', { class: 'ma-block ma-b-' + b.type, 'data-block': b.id || null }, node));
    });

    var shell = el('div', { class: 'ma-app' }, [
      el('a', { class: 'ma-skip', href: '#ma-main', onclick: function (e) { e.preventDefault(); main.focus(); } }, 'Aller au contenu'),
      renderHeader(), main
    ]);
    if (showTabs) {
      var nav = el('nav', { class: 'ma-tabs', 'aria-label': 'Navigation principale' });
      tabs.forEach(function (p) {
        nav.appendChild(el('a', { class: 'ma-tab', href: '#/' + p.id, 'aria-current': p === page ? 'page' : null }, [
          el('span', { 'aria-hidden': 'true', text: S(p.icon) || '•' }), el('div', { text: S(p.title) })
        ]));
      });
      shell.appendChild(nav);
    }
    root.textContent = '';
    root.appendChild(shell);
    win.scrollTo(0, scroll);
  }

  function route(first) {
    var m = S(win.location.hash).match(/^#\/([\w-]+)/), id = m && pageById(m[1]) ? m[1] : (app && app.pages[0] ? app.pages[0].id : null);
    var changed = id !== current;
    current = id;
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
          if (t && t.scrollIntoView) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.style.outline = '3px solid var(--c-accent)'; t.style.outlineOffset = '4px'; setTimeout(function () { t.style.outline = ''; t.style.outlineOffset = ''; }, 1400); }
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
      if (m && pageById(m[1])) { current = m[1]; render(); win.scrollTo(0, 0); }
    });
    try { win.parent.postMessage({ type: 'preview-ready' }, '*'); } catch (e) { /* ignore */ }
  }
  if (initial) setApp(initial);
  return { setApp: setApp };
};
