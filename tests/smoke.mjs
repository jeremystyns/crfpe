// Test de bout en bout : node tests/smoke.mjs   (nécessite Playwright + Chromium)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.OUT || path.join(root, 'tests', 'out');
fs.mkdirSync(out, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((q, r) => {
  const f = path.join(root, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
}).listen(0);
const port = server.address().port;

let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✔ ' : '  ✘ ') + m); if (!c) fails++; };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => { if (!/https:\/\//.test(e.stack || '')) errors.push('pageerror: ' + e.message); });
page.on('console', (m) => { if (m.type() === 'error' && !/^https:/.test(m.location().url || '')) errors.push('console: ' + m.text()); });
const external = [];
// On ne compte que ce que le constructeur et son aperçu demandent eux-mêmes (pas le contenu des formulaires tiers intégrés)
page.on('request', (r) => { const f = r.frame(); if (f !== page.mainFrame() && (r.isNavigationRequest() || f.url().startsWith('https://'))) return; const u = r.url(); if (!u.startsWith('http://localhost') && !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith('about:')) external.push(u); });

console.log('1. Démarrage');
await page.goto(`http://localhost:${port}/`);
await page.waitForSelector('#dlg-home[open]');
ok(await page.locator('.tpl').count() === 4, '4 modèles proposés au premier lancement');
await page.click('.tpl:has-text("Centre de formation")');
await page.waitForSelector('.blk');
ok(await page.locator('#pages-list li').count() === 5, '5 pages dans le modèle « Centre de formation »');

console.log('2. Aperçu');
const fr = page.frameLocator('#preview');
await fr.locator('.ma-hero h2').waitFor();
ok((await fr.locator('.ma-hero h2').textContent()).includes('Bienvenue'), 'le bandeau s’affiche dans l’aperçu');
await fr.locator('.ma-tab', { hasText: 'Agenda' }).click();
await fr.locator('.ma-ev').first().waitFor();
ok(await fr.locator('.ma-ev').count() === 3, 'navigation par onglets + agenda (3 dates)');
await page.screenshot({ path: path.join(out, '1-constructeur.png') });

console.log('3. Édition');
await page.click('#pages-list .page-btn >> nth=0');
await page.click('.blk >> nth=0 >> .blk-toggle');
await page.fill('.blk.open input[type=text] >> nth=0', 'Bienvenue au centre TEST');
await page.waitForTimeout(400);
ok((await fr.locator('.ma-hero h2').textContent()) === 'Bienvenue au centre TEST', 'l’aperçu se met à jour en direct');
// ajouter un bloc embed (formulaire Tally)
await page.click('#btn-add-block');
await page.click('.add-card:has-text("Formulaire")');
await page.fill('.blk.open textarea >> nth=0', 'https://tally.so/r/wMzXyz');
await page.waitForTimeout(400);
ok((await page.locator('.blk.open .status.ok').textContent()).includes('Tally'), 'lien Tally reconnu');
await page.fill('.blk.open textarea >> nth=0', '<iframe src="https://forms.office.com/Pages/ResponsePage.aspx?id=ABC&amp;x=1" width="640" height="480"></iframe>');
await page.waitForTimeout(400);
ok((await page.locator('.blk.open .status.ok').textContent()).includes('Microsoft Forms'), 'code <iframe> Microsoft Forms reconnu');
const src = await fr.locator('iframe').last().getAttribute('src');
ok(src.includes('forms.office.com') && src.includes('embed=true') && !src.includes('&amp;'), 'URL extraite et nettoyée : ' + src);
// annuler / rétablir
await page.click('#btn-undo'); await page.waitForTimeout(300);
await page.click('#btn-redo'); await page.waitForTimeout(300);
ok(await page.locator('.blk').count() >= 5, 'annuler/rétablir fonctionne');

console.log('4. Export');
await page.click('#btn-export');
await page.waitForSelector('#dlg-export[open]');
ok((await page.textContent('#exp-summary')).includes('5 pages'), 'résumé d’export : ' + (await page.textContent('#exp-summary')));
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exp-go')]);
const file = path.join(out, dl.suggestedFilename()); await dl.saveAs(file);
ok(dl.suggestedFilename() === 'index.html', 'fichier téléchargé : index.html');
const html = fs.readFileSync(file, 'utf8');
ok(!/<script[^>]+src=/.test(html) && !/<link[^>]+stylesheet/.test(html), 'aucune ressource externe (script/css)');
ok(/Content-Security-Policy/.test(html) && /frame-src https:\/\/forms\.office\.com/.test(html), 'CSP avec frame-src limité à forms.office.com');
ok(/script-src 'sha256-/.test(html), 'CSP : script protégé par empreinte sha256 (pas de unsafe-inline)');
console.log('   taille :', (html.length / 1024).toFixed(1), 'Ko');

console.log('5. Appli exportée (ouverte seule, hors constructeur)');
const p2 = await ctx.newPage();
const errs2 = [];
p2.on('pageerror', (e) => errs2.push(e.message));
p2.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|frame/.test(m.text())) errs2.push(m.text()); });
await p2.setViewportSize({ width: 390, height: 800 });
await p2.goto('file://' + file);
await p2.locator('.ma-hero h2').waitFor();
ok((await p2.locator('.ma-hero h2').textContent()) === 'Bienvenue au centre TEST', 'contenu modifié présent dans l’export');
ok(await p2.locator('.ma-tab').count() === 5, '5 onglets');
await p2.locator('.ma-tab', { hasText: 'Formations' }).click();
await p2.locator('.ma-cards-grille .ma-card').first().waitFor();
ok(p2.url().endsWith('#/formations') && await p2.locator('.ma-cards-grille .ma-card').count() === 4, 'navigation hash + cartes en grille');
await p2.screenshot({ path: path.join(out, '2-export-mobile.png') });
await p2.locator('.ma-tab', { hasText: 'Ressources' }).click();
await p2.locator('.ma-faq summary').first().waitFor();
await p2.locator('.ma-faq summary').first().click();
ok(await p2.locator('.ma-faq details[open]').count() === 1, 'FAQ dépliable');
await p2.screenshot({ path: path.join(out, '3-export-ressources.png') });
await p2.goBack(); await p2.locator('.ma-cards-grille').waitFor();
ok(p2.url().endsWith('#/formations'), 'bouton Retour du navigateur');
ok(errs2.length === 0, 'aucune erreur JS dans l’export' + (errs2.length ? ' : ' + errs2.join(' | ') : ''));

console.log('6. Sécurité du moteur');
const evil = {
  title: 'x', pages: [{ id: 'a', title: 'A', blocks: [
    { type: 'text', text: '[clic](javascript:alert(1)) <img src=x onerror=alert(2)> **ok**' },
    { type: 'button', label: 'b', kind: 'url', url: 'javascript:alert(3)' },
    { type: 'image', src: 'javascript:alert(4)', alt: '' },
    { type: 'embed', url: 'http://pas-https.example/', mode: 'inline' },
    { type: 'cards', items: [{ title: '<b>t</b>', url: 'data:text/html,<script>alert(5)</script>' }] }
  ] }]
};
const p3 = await ctx.newPage();
await p3.goto(`http://localhost:${port}/`);
await p3.waitForFunction(() => window.__atelier && window.__atelier.app);
const evilHtml = await p3.evaluate(async (e) => { const a = window.__atelier; return a.buildHTML(a.normalizeApp(e)); }, evil);
fs.writeFileSync(path.join(out, 'evil.html'), evilHtml);
const p4 = await ctx.newPage(); let alerted = false;
p4.on('dialog', (d) => { alerted = true; d.dismiss(); });
await p4.goto('file://' + path.join(out, 'evil.html'));
await p4.waitForTimeout(500);
ok(!alerted, 'aucune alerte JS déclenchée par du contenu hostile');
ok(await p4.locator('a[href^="javascript"]').count() === 0, 'aucun lien javascript:');
ok(await p4.locator('img[onerror]').count() === 0 && await p4.locator('.ma-b-text img').count() === 0, 'le HTML dans le texte reste du texte');
ok(await p4.locator('iframe').count() === 0, 'iframe http:// refusée');
ok(await p4.locator('a[href^="data:"]').count() === 0, 'lien data: refusé');

console.log('7. Réimport du HTML exporté');
await p3.setInputFiles('#file-import', file);
await p3.waitForFunction(() => window.__atelier.app.title === 'Centre de formation Horizon');
ok((await p3.evaluate(() => window.__atelier.app.title)) === 'Centre de formation Horizon', 'projet rouvert depuis le .html exporté');

console.log('8. Persistance (rechargement)');
await page.waitForTimeout(900);
await page.reload();
await page.waitForSelector('.blk', { timeout: 5000 }).catch(() => {});
const title = await page.evaluate(() => window.__atelier && window.__atelier.app && window.__atelier.app.pages[0].blocks[0].title);
ok(title === 'Bienvenue au centre TEST', 'l’appli est restaurée après rechargement');

console.log('8b. Les 4 modèles + mode sombre s’exportent et s’affichent sans erreur');
for (const [i, key] of ['centre', 'portes-ouvertes', 'parcours', 'vierge'].entries()) {
  const h = await p3.evaluate(async ([k, dark]) => {
    const a = window.__atelier; const t = window.MONAPP_TEMPLATES.find((x) => x.key === k).make();
    if (dark) t.theme = { preset: 'night', primary: '#60a5fa', accent: '#fbbf24', dark: true, radius: 'doux', font: 'moderne' };
    return a.buildHTML(a.normalizeApp(t));
  }, [key, key === 'portes-ouvertes']);
  const f = path.join(out, 'tpl-' + key + '.html'); fs.writeFileSync(f, h);
  const pp = await ctx.newPage(); const e = [];
  pp.on('pageerror', (x) => e.push(x.message));
  await pp.setViewportSize({ width: 390, height: 780 });
  await pp.goto('file://' + f); await pp.locator('.ma-main').waitFor();
  if (key === 'parcours') { await pp.locator('.ma-btn').first().click(); await pp.locator('.ma-callout').waitFor(); ok(await pp.locator('.ma-back').count() === 1 && await pp.locator('.ma-tab').count() === 1 || await pp.locator('.ma-tabs').count() === 0, 'parcours : page cachée avec bouton Retour, sans barre d’onglets'); }
  await pp.screenshot({ path: path.join(out, 'tpl-' + key + '.png') });
  ok(e.length === 0, 'modèle « ' + key + ' » sans erreur JS');
  await pp.close();
}

console.log('9. Requêtes externes du constructeur');
ok(external.length === 0, 'aucune requête externe' + (external.length ? ' : ' + external.join(', ') : ''));
const relevant = errors.filter((e) => !/Failed to load resource|ERR_/.test(e));
ok(relevant.length === 0, 'aucune erreur console dans le constructeur' + (relevant.length ? ' : ' + relevant.join(' | ') : ''));

await browser.close(); server.close();
console.log(fails ? `\n${fails} échec(s)` : '\nTout est OK');
process.exit(fails ? 1 : 0);
