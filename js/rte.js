/* ============================================================================
   Éditeur de texte VISUEL (WYSIWYG) de l'Atelier Appli.
   On écrit directement le texte mis en forme, sans code. En coulisses, le contenu est converti
   en un petit document structuré (blocs + passages), jamais en HTML brut :
     doc = { b: [ { k:'p'|'ul'|'ol', al:'center'|'right'|'justify', r:[run…] | i:[[run…],…] } ] }
     run = { t:'texte', b:1, i:1, u:1, uc:'cyan', c:'bleu', h:'jaune', s:'s'|'l'|'xl', a:'https://…' } ou { br:1 }
   Le moteur d'affichage (runtime.js) sait lire ce format sans innerHTML.
   ============================================================================ */
(function () {
  'use strict';
  const ICONS = window.CRFPE_ICONS || {};
  const NS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------------ petits outils */
  function icon(name, size) {
    const def = ICONS[name], s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'ic'); s.setAttribute('width', String(size || 16)); s.setAttribute('height', String(size || 16));
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    if (!def) return s;
    s.setAttribute('viewBox', '0 0 ' + def.v + ' ' + def.v);
    def.p.forEach((p) => {
      const g = document.createElementNS(NS, 'g'); g.setAttribute('transform', p[0]);
      const path = document.createElementNS(NS, 'path'); path.setAttribute('d', p[1]);
      g.appendChild(path); s.appendChild(g);
    });
    return s;
  }
  /* Alignements : pictogrammes dessinés (le jeu CRFPE n'en contient pas), traits pleins de même épaisseur */
  function alignIcon(kind) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'ic'); s.setAttribute('width', '16'); s.setAttribute('height', '16'); s.setAttribute('viewBox', '0 0 16 16');
    s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const widths = { left: [14, 9, 14, 7], center: [14, 8, 14, 8], right: [14, 9, 14, 7], justify: [14, 14, 14, 14] };
    widths[kind].forEach((w, i) => {
      const r = document.createElementNS(NS, 'rect');
      const x = kind === 'center' ? (16 - w) / 2 : kind === 'right' ? 16 - w - 1 : 1;
      r.setAttribute('x', String(x)); r.setAttribute('y', String(2 + i * 3.6)); r.setAttribute('width', String(w)); r.setAttribute('height', '2'); r.setAttribute('fill', 'currentColor');
      s.appendChild(r);
    });
    return s;
  }
  function el(tag, props, kids) {
    const n = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
      else if (k === 'hidden') n.hidden = !!v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    (Array.isArray(kids) ? kids : [kids]).forEach((c) => { if (c != null && c !== false) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  /* ------------------------------------------------------------------ palettes (clés stables ; couleurs lisibles sur fond clair) */
  const TEXT = [['noir', 'Noir (par défaut)', '#2f3342'], ['bleu', 'Bleu', '#004c8e'], ['cyan', 'Cyan', '#00799f'], ['rouge', 'Rouge', '#c00000'], ['orange', 'Orange', '#9a5700'], ['vert', 'Vert', '#2b6e27'], ['gris', 'Gris', '#566074']];
  const HILITE = [['jaune', 'Jaune', '#ffeb7a'], ['vert', 'Vert', '#c0e1bf'], ['rose', 'Rose', '#f3a59f'], ['bleu', 'Bleu', '#b7ddff']];
  const TRAIT = [['cyan', 'Cyan', '#41c8f4'], ['orange', 'Orange', '#f99d1d'], ['rose', 'Rouge', '#e75145'], ['vert', 'Vert', '#6cc067'], ['bleu', 'Bleu', '#004c8e']];
  const SIZES = [['s', 'Petit', 2, '.875em'], ['n', 'Normal', 3, ''], ['l', 'Grand', 4, '1.25em'], ['xl', 'Très grand', 5, '1.7em']];
  const EM = { s: '.875em', l: '1.25em', xl: '1.7em' };

  function rgbHex(c) {
    c = String(c || '').trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(c)) return c;
    if (/^#[0-9a-f]{3}$/.test(c)) return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    const m = c.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/);
    if (!m) return null;
    if (m[4] !== undefined && +m[4] === 0) return 'transparent';
    return '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('');
  }
  const keyOf = (list, c) => { const h = rgbHex(c); if (!h) return null; const f = list.find((x) => x[2] === h); return f ? f[0] : null; };
  const hexOf = (list, key) => { const f = list.find((x) => x[0] === key); return f ? f[2] : null; };
  const isClear = (c) => { const h = rgbHex(c); return h === 'transparent' || String(c).trim() === 'transparent' || String(c).trim() === 'initial' || String(c).trim() === 'inherit'; };
  function sizeKey(v) {
    v = String(v || '').trim();
    if (v === 'x-small' || v === 'small') return 's';
    if (v === 'medium') return 'n';
    if (v === 'large') return 'l';
    if (v === 'x-large' || v === 'xx-large' || v === '-webkit-xxx-large' || v === 'xxx-large') return 'xl';
    if (v === '.875em' || v === '0.875em') return 's';
    if (v === '1.25em') return 'l';
    if (v === '1.7em') return 'xl';
    const m = v.match(/^([\d.]+)px$/); if (m) { const n = +m[1]; return n <= 13.5 ? 's' : n <= 17 ? 'n' : n <= 22 ? 'l' : 'xl'; }
    return null;
  }

  /* ------------------------------------------------------------------ document <-> éditeur */
  const emptyDoc = () => ({ b: [] });
  function docToPlain(doc) {
    if (typeof doc === 'string') return doc.replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
    const out = [];
    ((doc && doc.b) || []).forEach((b) => {
      if (b.k === 'p') out.push((b.r || []).map((r) => (r.br ? ' ' : r.t || '')).join(''));
      else (b.i || []).forEach((it) => out.push(it.map((r) => r.t || '').join('')));
    });
    return out.join(' ').replace(/\s+/g, ' ').trim();
  }

  /* Ancien format (mini-Markdown) -> document : pour rouvrir les applis créées avant l'éditeur visuel */
  function mdToDoc(md) {
    const doc = emptyDoc();
    String(md || '').replace(/\r/g, '').split(/\n{2,}/).forEach((blk) => {
      const lines = blk.split('\n').filter((l) => l.trim() !== '');
      if (!lines.length) return;
      const ul = lines.every((l) => /^\s*[-*•]\s+/.test(l)), ol = lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
      if (ul || ol) {
        doc.b.push({ k: ul ? 'ul' : 'ol', i: lines.map((l) => mdInline(l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ''))) });
      } else {
        const r = [];
        lines.forEach((l, i) => { if (i) r.push({ br: 1 }); mdInline(l).forEach((x) => r.push(x)); });
        doc.b.push({ k: 'p', r });
      }
    });
    return doc;
  }
  function mdInline(text) {
    const re = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]+[^\s<.,;:!?)\]]))/g;
    const out = []; let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ t: text.slice(last, m.index) });
      if (m[2] != null) out.push({ t: m[2], b: 1 });
      else if (m[3] != null) out.push({ t: m[3], i: 1 });
      else if (m[4] != null) out.push({ t: m[4], a: m[5] });
      else out.push({ t: m[6], a: m[6] });
      last = re.lastIndex;
    }
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  }

  /* Éditeur (DOM) -> document */
  const BLOCK_TAGS = /^(P|DIV|H[1-6]|BLOCKQUOTE|PRE|SECTION|ARTICLE)$/;
  function sameMarks(a, b) { return ['b', 'i', 'u', 'uc', 'c', 'h', 's', 'a'].every((k) => a[k] === b[k]); }
  function compact(runs) {
    const out = [];
    runs.forEach((r) => {
      if (r.t !== undefined) r.t = r.t.replace(/ /g, ' ').replace(/[​﻿]/g, '');
      if (r.t === '') return;
      const p = out[out.length - 1];
      if (p && r.t !== undefined && p.t !== undefined && sameMarks(p, r)) p.t += r.t; else out.push(r);
    });
    while (out.length && out[out.length - 1].br) out.pop();
    while (out.length && out[0].br) out.shift();
    return out;
  }
  function stateOf(node, st) {
    st = Object.assign({}, st);
    const tag = node.tagName, s = node.style || {};
    if (tag === 'B' || tag === 'STRONG') st.b = 1;
    if (tag === 'I' || tag === 'EM') st.i = 1;
    if (tag === 'U') st.u = 1;
    if (tag === 'A') { const h = node.getAttribute('href'); if (h) st.a = h; }
    if (s.fontWeight && (s.fontWeight === 'bold' || +s.fontWeight >= 600)) st.b = 1;
    if (s.fontStyle === 'italic') st.i = 1;
    const td = s.textDecorationLine || s.textDecoration || '';
    if (td.indexOf('underline') > -1) st.u = 1;
    if (s.textDecorationColor) { const k = keyOf(TRAIT, s.textDecorationColor); if (k) st.uc = k; }
    if (s.color) { const k = keyOf(TEXT, s.color); if (k === 'noir') delete st.c; else if (k) st.c = k; }
    if (s.backgroundColor) { const k = keyOf(HILITE, s.backgroundColor); if (k) st.h = k; else if (isClear(s.backgroundColor)) delete st.h; }
    if (s.fontSize) { const k = sizeKey(s.fontSize); if (k === 'n') delete st.s; else if (k) st.s = k; }
    if (tag === 'FONT') {
      const c = node.getAttribute('color'); if (c) { const k = keyOf(TEXT, c); if (k === 'noir') delete st.c; else if (k) st.c = k; }
      const z = node.getAttribute('size'); if (z) { const k = { 1: 's', 2: 's', 3: 'n', 4: 'l', 5: 'xl', 6: 'xl', 7: 'xl' }[z]; if (k === 'n') delete st.s; else if (k) st.s = k; }
    }
    return st;
  }
  function inlineWalk(node, st, out) {
    if (node.nodeType === 3) { if (node.nodeValue) out.push(Object.assign({ t: node.nodeValue }, st)); return; }
    if (node.nodeType !== 1) return;
    if (node.tagName === 'BR') { out.push({ br: 1 }); return; }
    const ns = stateOf(node, st);
    node.childNodes.forEach((c) => inlineWalk(c, ns, out));
  }
  function alignOf(node) {
    const a = (node.style && node.style.textAlign) || node.getAttribute('align') || '';
    return a === 'center' || a === 'right' || a === 'justify' ? a : '';
  }
  function editorToDoc(root) {
    const blocks = []; let cur = null;
    function flush() { if (cur) { cur.r = compact(cur.r); if (cur.r.length) blocks.push(cur); cur = null; } }
    function walk(parent, al) {
      parent.childNodes.forEach((n) => {
        if (n.nodeType === 3 || (n.nodeType === 1 && !BLOCK_TAGS.test(n.tagName) && n.tagName !== 'UL' && n.tagName !== 'OL')) {
          if (!cur) cur = { k: 'p', r: [] };
          if (al && !cur.al) cur.al = al;
          inlineWalk(n, {}, cur.r);
          return;
        }
        if (n.nodeType !== 1) return;
        flush();
        if (n.tagName === 'UL' || n.tagName === 'OL') {
          const items = [];
          n.querySelectorAll(':scope > li').forEach((li) => {
            const r = []; li.childNodes.forEach((c) => { if (c.tagName === 'UL' || c.tagName === 'OL') return; inlineWalk(c, {}, r); });
            const cr = compact(r); if (cr.length) items.push(cr);
          });
          if (items.length) { const b = { k: n.tagName === 'UL' ? 'ul' : 'ol', i: items }; const a = alignOf(n); if (a) b.al = a; blocks.push(b); }
          return;
        }
        const a = alignOf(n) || al;
        if (Array.from(n.children).some((c) => BLOCK_TAGS.test(c.tagName) || c.tagName === 'UL' || c.tagName === 'OL')) { walk(n, a); flush(); }
        else { cur = { k: 'p', r: [] }; if (a) cur.al = a; inlineWalk(n, {}, cur.r); flush(); }
      });
      flush();
    }
    walk(root, '');
    return { b: blocks };
  }

  /* Document -> éditeur (mêmes styles que le moteur d'affichage, pour que l'écran ressemble au résultat) */
  function runNode(r) {
    if (r.br) return document.createElement('br');
    let node = document.createTextNode(r.t || '');
    if (r.c || r.h || r.s || (r.u && r.uc)) {
      const sp = document.createElement('span');
      const c = hexOf(TEXT, r.c), h = hexOf(HILITE, r.h);
      if (c) sp.style.color = c;
      if (h) sp.style.backgroundColor = h;
      if (EM[r.s]) sp.style.fontSize = EM[r.s];
      sp.appendChild(node); node = sp;
    }
    if (r.u) {
      const u = document.createElement('u');
      const t = hexOf(TRAIT, r.uc);
      if (t) { u.style.textDecorationColor = t; u.style.textDecorationThickness = '.18em'; u.style.textUnderlineOffset = '.2em'; }
      u.appendChild(node); node = u;
    }
    if (r.i) { const i = document.createElement('i'); i.appendChild(node); node = i; }
    if (r.b) { const b = document.createElement('b'); b.appendChild(node); node = b; }
    if (r.a) { const a = document.createElement('a'); a.setAttribute('href', r.a); a.appendChild(node); node = a; }
    return node;
  }
  function docToEditor(doc, root) {
    root.replaceChildren();
    ((doc && doc.b) || []).forEach((b) => {
      const tag = b.k === 'ul' ? 'ul' : b.k === 'ol' ? 'ol' : 'p';
      const n = document.createElement(tag);
      if (b.al) n.style.textAlign = b.al;
      if (tag === 'p') (b.r || []).forEach((r) => n.appendChild(runNode(r)));
      else (b.i || []).forEach((it) => { const li = document.createElement('li'); it.forEach((r) => li.appendChild(runNode(r))); n.appendChild(li); });
      root.appendChild(n);
    });
    if (!root.firstChild) { const p = document.createElement('p'); p.appendChild(document.createElement('br')); root.appendChild(p); }
  }

  /* ------------------------------------------------------------------ l'éditeur visuel */
  let seq = 0;
  function create(opts) {
    const id = 'rte' + (++seq);
    const root = el('div', { class: 'rte' });
    const area = el('div', { class: 'rte-area', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': opts.label || 'Texte', 'data-ph': opts.placeholder || 'Écrivez votre texte ici…', spellcheck: 'true', lang: 'fr' });
    const pop = el('div', { class: 'rte-pop', hidden: true });
    const bar = el('div', { class: 'rte-bar', role: 'toolbar', 'aria-label': 'Mise en forme du texte' });
    let saved = null, openBtn = null;

    docToEditor(typeof opts.value === 'string' ? mdToDoc(opts.value) : opts.value, area);
    const refreshEmpty = () => area.classList.toggle('is-empty', !area.textContent.trim() && !area.querySelector('li'));
    refreshEmpty();

    /* sélection mémorisée : les menus et le champ de lien font perdre le focus à la zone */
    const onSel = () => {
      if (!root.isConnected) { document.removeEventListener('selectionchange', onSel); return; }
      const s = window.getSelection();
      if (s.rangeCount && area.contains(s.anchorNode)) { saved = s.getRangeAt(0).cloneRange(); refreshState(); }
    };
    document.addEventListener('selectionchange', onSel);
    function restore() {
      area.focus();
      // le focus replace le curseur au début : on remet toujours la dernière sélection mémorisée
      if (saved) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(saved); }
    }

    /* normalise ce que le navigateur produit (mots-clés de taille -> même échelle que l'appli) */
    function normalize() {
      area.querySelectorAll('[style*="font-size"]').forEach((n) => {
        const k = sizeKey(n.style.fontSize);
        if (k === 'n') n.style.removeProperty('font-size'); else if (k && EM[k]) n.style.fontSize = EM[k];
      });
      area.querySelectorAll('font').forEach((f) => {
        const sp = document.createElement('span');
        const c = f.getAttribute('color'); if (c) sp.style.color = c;
        const z = f.getAttribute('size'); const k = { 1: 's', 2: 's', 3: 'n', 4: 'l', 5: 'xl', 6: 'xl', 7: 'xl' }[z]; if (EM[k]) sp.style.fontSize = EM[k];
        while (f.firstChild) sp.appendChild(f.firstChild);
        f.replaceWith(sp);
      });
    }
    function changed() { normalize(); refreshEmpty(); opts.onChange(editorToDoc(area)); }
    area.addEventListener('input', changed);

    function run(cmd, val, css) {
      restore();
      document.execCommand('styleWithCSS', false, !!css);
      document.execCommand(cmd, false, val);
      changed(); refreshState();
    }
    document.execCommand('defaultParagraphSeparator', false, 'p');
    area.addEventListener('focus', () => { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* ignore */ } });

    /* le collage ne garde que le texte : pas de styles venus de Word ou d'un site */
    area.addEventListener('paste', (e) => {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\r/g, '');
      t.split('\n').forEach((line, i) => { if (i) document.execCommand('insertParagraph'); if (line) document.execCommand('insertText', false, line); });
      changed();
    });
    area.addEventListener('drop', (e) => e.preventDefault());

    /* ---- barre d'outils */
    const btns = {};
    function tbtn(key, label, content, onclick, extra) {
      const b = el('button', Object.assign({ type: 'button', class: 'rb', id: id + '-' + key, title: label, 'aria-label': label, onclick }, extra || {}), content);
      b.addEventListener('mousedown', (e) => e.preventDefault());   // garde la sélection dans le texte
      btns[key] = b; return b;
    }
    const group = (...k) => el('span', { class: 'rg', role: 'group' }, k);
    const txt = (t, cls) => el('span', { class: 'rl ' + (cls || ''), text: t });

    function closePop() { pop.hidden = true; if (openBtn) openBtn.setAttribute('aria-expanded', 'false'); openBtn = null; }
    function openPop(btn, build) {
      if (openBtn === btn) { closePop(); return; }
      closePop(); pop.replaceChildren(); build(pop);
      pop.style.left = Math.max(0, Math.min(btn.offsetLeft, bar.clientWidth - 232)) + 'px';
      pop.style.top = (btn.offsetTop + btn.offsetHeight + 4) + 'px';
      pop.hidden = false; openBtn = btn; btn.setAttribute('aria-expanded', 'true');
    }
    const outside = (e) => { if (!root.isConnected) { document.removeEventListener('mousedown', outside); return; } if (!root.contains(e.target)) closePop(); };
    document.addEventListener('mousedown', outside);
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { e.stopPropagation(); const b = openBtn; closePop(); if (b) b.focus(); } });

    function swatchPop(list, label, sample, apply, noneLabel) {
      return (p) => {
        p.appendChild(el('p', { class: 'rp-t', text: label }));
        const grid = el('div', { class: 'rp-grid' });
        list.forEach((c) => {
          const b = el('button', { type: 'button', class: 'sw', title: c[1], 'aria-label': c[1], onclick: () => { apply(c); closePop(); } }, sample(c));
          b.addEventListener('mousedown', (e) => e.preventDefault()); grid.appendChild(b);
        });
        p.appendChild(grid);
        if (noneLabel) {
          const n = el('button', { type: 'button', class: 'rp-none', text: noneLabel, onclick: () => { apply(null); closePop(); } });
          n.addEventListener('mousedown', (e) => e.preventDefault()); p.appendChild(n);
        }
      };
    }

    const bold = tbtn('b', 'Gras (Ctrl+B)', txt('G', 'b'), () => run('bold', null, false));
    const ital = tbtn('i', 'Italique (Ctrl+I)', txt('I', 'i'), () => run('italic', null, false));
    const und = tbtn('u', 'Souligné (Ctrl+U)', txt('S', 'u'), () => run('underline', null, false));

    const sizeB = tbtn('size', 'Taille du texte', [txt('Taille'), icon('chevron-down', 10)], () => openPop(sizeB, swatchPop(SIZES, 'Taille du texte', (s) => el('span', { class: 'sz', style: s[3] ? 'font-size:' + s[3] : '', text: s[1] }), (s) => run('fontSize', String(s[2]), true)).bind(null)), { 'aria-haspopup': 'true', 'aria-expanded': 'false' });
    const colB = tbtn('color', 'Couleur du texte', [txt('A', 'colA'), icon('chevron-down', 10)], () => openPop(colB, swatchPop(TEXT, 'Couleur du texte', (c) => el('span', { class: 'sw-a', style: 'color:' + c[2], text: 'A' }), (c) => run('foreColor', c[2], true))), { 'aria-haspopup': 'true', 'aria-expanded': 'false' });
    const hilB = tbtn('hilite', 'Surligner comme un stabilo', [txt('Stabilo', 'hl'), icon('chevron-down', 10)], () => openPop(hilB, swatchPop(HILITE, 'Surligner (stabilo)', (c) => el('span', { class: 'sw-h', style: 'background:' + c[2], text: 'ab' }), (c) => run('hiliteColor', c ? c[2] : 'transparent', true), 'Retirer le surlignage')), { 'aria-haspopup': 'true', 'aria-expanded': 'false' });

    function applyTrait(c) {
      restore();
      const s = window.getSelection();
      if (!s.rangeCount || s.isCollapsed) { opts.toast && opts.toast('Sélectionnez d’abord le texte à souligner.'); return; }
      document.execCommand('styleWithCSS', false, false);
      const on = document.queryCommandState('underline');
      if (!c) { if (on) document.execCommand('underline'); changed(); return; }
      if (!on) document.execCommand('underline');
      const r = window.getSelection().getRangeAt(0);
      area.querySelectorAll('u').forEach((u) => {
        if (r.intersectsNode(u)) { u.style.textDecorationColor = c[2]; u.style.textDecorationThickness = '.18em'; u.style.textUnderlineOffset = '.2em'; }
      });
      changed();
    }
    const trB = tbtn('trait', 'Souligner d’un trait de couleur', [txt('Trait', 'tr'), icon('chevron-down', 10)], () => openPop(trB, swatchPop(TRAIT, 'Trait de couleur sous le texte', (c) => el('span', { class: 'sw-t', style: 'text-decoration-color:' + c[2], text: 'ab' }), applyTrait, 'Retirer le trait')), { 'aria-haspopup': 'true', 'aria-expanded': 'false' });

    const al = {
      left: tbtn('al-l', 'Aligner à gauche', alignIcon('left'), () => run('justifyLeft', null, true)),
      center: tbtn('al-c', 'Centrer', alignIcon('center'), () => run('justifyCenter', null, true)),
      right: tbtn('al-r', 'Aligner à droite', alignIcon('right'), () => run('justifyRight', null, true)),
      justify: tbtn('al-j', 'Justifier', alignIcon('justify'), () => run('justifyFull', null, true))
    };
    const ulB = tbtn('ul', 'Liste à puces', icon('list-ul', 16), () => run('insertUnorderedList', null, false));
    const olB = tbtn('ol', 'Liste numérotée', txt('1.', 'ol'), () => run('insertOrderedList', null, false));

    function linkPop(p) {
      p.appendChild(el('p', { class: 'rp-t', text: 'Adresse du lien' }));
      const inp = el('input', { type: 'text', class: 'rp-in', placeholder: 'https://… ou nom@exemple.org', 'aria-label': 'Adresse du lien', autocomplete: 'off' });
      const msg = el('p', { class: 'rp-msg', role: 'status' });
      const anchor = (() => { const s = window.getSelection(); let n = s.anchorNode; while (n && n !== area) { if (n.tagName === 'A') return n; n = n.parentNode; } return null; })();
      if (anchor) inp.value = anchor.getAttribute('href') || '';
      const apply = () => {
        let v = inp.value.trim();
        if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(v)) v = 'mailto:' + v;
        else if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) v = 'https://' + v;
        if (!/^(https?:|mailto:|tel:)/i.test(v)) { msg.textContent = 'Saisissez une adresse complète, par exemple https://www.crfpe.fr'; return; }
        restore();
        const s = window.getSelection();
        if (s.isCollapsed && !anchor) { msg.textContent = 'Sélectionnez d’abord le texte qui servira de lien.'; return; }
        document.execCommand('styleWithCSS', false, false);
        document.execCommand('createLink', false, v);
        changed(); closePop();
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
      p.appendChild(inp);
      p.appendChild(el('div', { class: 'rp-row' }, [
        el('button', { type: 'button', class: 'btn small primary', text: 'Appliquer', onclick: apply }),
        anchor ? el('button', { type: 'button', class: 'btn small', text: 'Retirer le lien', onclick: () => { restore(); document.execCommand('unlink'); changed(); closePop(); } }) : null
      ]));
      p.appendChild(msg);
      setTimeout(() => inp.focus(), 0);
    }
    const lnB = tbtn('link', 'Insérer un lien (sélectionnez d’abord le texte)', [icon('link', 15), txt('Lien')], () => { restore(); openPop(lnB, linkPop); }, { 'aria-haspopup': 'true', 'aria-expanded': 'false' });
    const midB = tbtn('mid', 'Point médian pour l’écriture inclusive (étudiant·e·s)', [txt('·', 'mid'), txt('Point médian')], () => run('insertText', '·', false));
    const clrB = tbtn('clear', 'Effacer la mise en forme du texte sélectionné', txt('Effacer'), () => { run('removeFormat', null, false); run('justifyLeft', null, true); });

    bar.append(group(bold, ital, und), group(sizeB, colB, hilB, trB), group(al.left, al.center, al.right, al.justify), group(ulB, olB), group(lnB, midB, clrB), pop);

    function refreshState() {
      const q = (c) => { try { return document.queryCommandState(c); } catch (e) { return false; } };
      bold.setAttribute('aria-pressed', String(q('bold'))); ital.setAttribute('aria-pressed', String(q('italic'))); und.setAttribute('aria-pressed', String(q('underline')));
      ulB.setAttribute('aria-pressed', String(q('insertUnorderedList'))); olB.setAttribute('aria-pressed', String(q('insertOrderedList')));
      al.left.setAttribute('aria-pressed', String(q('justifyLeft'))); al.center.setAttribute('aria-pressed', String(q('justifyCenter')));
      al.right.setAttribute('aria-pressed', String(q('justifyRight'))); al.justify.setAttribute('aria-pressed', String(q('justifyFull')));
    }

    root.append(bar, area);
    return root;
  }

  window.AtelierRTE = { create, mdToDoc, docToPlain, emptyDoc, editorToDoc, docToEditor };
})();
