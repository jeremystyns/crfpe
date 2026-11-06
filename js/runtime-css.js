/* Feuille de style de l'appli exportée (et de l'aperçu), fidèle au design system CRFPE :
   bleu #004C8E / cyan #41C8F4, Mulish, angles arrondis (10 / 14 / 18 / 22 px), peu de traits :
   surfaces douces, ombres légères, barre de navigation flottante, aucun dégradé, icônes pleines CRFPE.
   Stockée dans une chaîne pour pouvoir être injectée telle quelle dans le fichier HTML exporté. */
window.MONAPP_CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--c-bg);color:var(--c-text);font:16px/1.55 var(--font);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%;height:auto}
a{color:var(--c-link);text-underline-offset:2px}
a:hover{color:var(--c-link-hover)}
::selection{background:var(--c-accent);color:var(--c-on-accent)}
:focus-visible{outline:2px solid var(--c-focus);outline-offset:2px;border-radius:3px}
.ma-svg{display:inline-block;flex:none;fill:currentColor;vertical-align:middle}
.ma-flip{transform:scaleX(-1)}
.ma-skip{position:absolute;left:-999px;top:0;background:#fff;color:#000;padding:8px 12px;z-index:20}
.ma-skip:focus{left:8px;top:8px}
.ma-app{--ma-shadow:0 1px 2px rgba(0,30,60,.05),0 6px 20px rgba(0,30,60,.08);max-width:760px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--c-bg)}

/* En-tête */
.ma-head{position:sticky;top:10px;z-index:5;margin:10px 12px 0;border-radius:24px;background:var(--c-head);box-shadow:0 8px 24px rgba(0,30,60,.18);color:var(--c-on-head);padding:12px 18px;display:flex;align-items:center;gap:14px}
.ma-logo{width:42px;height:42px;border-radius:13px;object-fit:cover;box-shadow:0 0 0 2px #fff;flex:none;background:#fff}
.ma-logo-i{display:grid;place-items:center;background:var(--c-accent);color:var(--c-on-accent);font-weight:800;font-size:1rem;box-shadow:0 0 0 2px #fff}
.ma-head-t{min-width:0}
.ma-head-t b{display:block;font-size:1.1rem;font-weight:800;line-height:1.2;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ma-head-t small{display:block;font-weight:300;font-size:.86rem;line-height:1.3;opacity:.95;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Contenu */
.ma-main{flex:1;padding:28px 20px 120px;outline:0}
.ma-main.ma-notabs{padding-bottom:48px}
.ma-page-h{font-size:1.85rem;line-height:1.15;font-weight:800;letter-spacing:-.015em;color:var(--c-title);margin:0 0 28px}
.ma-page-h::after{content:"";display:block;width:44px;height:5px;border-radius:5px;background:var(--c-accent);margin-top:12px}
.ma-back{display:inline-flex;align-items:center;gap:8px;margin:0 0 20px;padding:8px 16px 8px 12px;background:var(--c-surface);border:0;box-shadow:var(--ma-shadow);border-radius:14px;color:var(--c-text);font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;text-decoration:none}
.ma-back:hover{color:var(--c-link)}
.ma-block{margin:0 0 28px}
.ma-block>:first-child{margin-top:0}
.ma-block>:last-child{margin-bottom:0}
.ma-b-title{margin-top:40px;margin-bottom:14px}
.ma-b-title:first-child{margin-top:0}

/* Barre d'onglets flottante : îlot arrondi, onglet actif en pastille douce */
.ma-tabs{position:fixed;bottom:calc(12px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(calc(100% - 24px),560px);background:var(--c-surface);border:0;border-radius:28px;box-shadow:0 10px 32px rgba(0,30,60,.20),0 1px 3px rgba(0,30,60,.10);display:flex;gap:2px;padding:6px;z-index:9}
.ma-tab{flex:1 1 0;min-width:0;background:none;border:0;border-radius:22px;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px 7px;text-decoration:none;color:var(--c-muted);font-size:.72rem;font-weight:600;line-height:1.2;text-align:center;transition:background-color .2s cubic-bezier(.4,0,.2,1),color .2s cubic-bezier(.4,0,.2,1)}
.ma-tab:hover{color:var(--c-link);background:var(--c-soft)}
.ma-tab:active{transform:scale(.97)}
.ma-tab div{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ma-tab[aria-current=page],.ma-tab-menu[aria-expanded=true]{color:var(--c-link);font-weight:800;background:var(--c-soft)}
/* Menu : feuille arrondie posée au-dessus de la barre, toutes les pages principales (jamais les sous-pages) */
.ma-menu-scrim{position:fixed;inset:0;background:rgba(0,76,142,.45);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);z-index:7}
.ma-menu{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom));width:min(calc(100% - 24px),560px);max-height:min(68vh,540px);overflow:auto;background:var(--c-surface);border:0;border-radius:26px;box-shadow:0 14px 40px rgba(0,30,60,.28);z-index:8;padding:8px}
.ma-menu ul{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.ma-menu a{display:flex;gap:14px;align-items:center;padding:10px 12px;border-radius:18px;color:var(--c-text);text-decoration:none;font-weight:700;font-size:1.02rem;transition:background-color .15s cubic-bezier(.4,0,.2,1)}
.ma-menu a .ma-svg{color:var(--c-link);box-sizing:content-box;padding:8px;border-radius:13px;background:var(--c-soft)}
.ma-menu a:hover{background:var(--c-soft)}
.ma-menu a[aria-current=page]{color:var(--c-link);background:var(--c-soft);font-weight:800}
.ma-menu a[aria-current=page] .ma-svg{background:var(--c-surface)}

/* Texte */
.ma-rich{font-size:1rem}
.ma-rich p{margin:0 0 .85em}
.ma-rich ul,.ma-rich ol{margin:0 0 .85em;padding-left:1.4em}
.ma-rich li{margin:.2em 0}
.ma-rich>:last-child{margin-bottom:0}
.ma-rich strong{font-weight:800}
.ma-rich a{font-weight:600}
.ma-al-center{text-align:center}.ma-al-right{text-align:right}.ma-al-justify{text-align:justify;hyphens:auto}
.ma-s-s{font-size:.875em}.ma-s-l{font-size:1.25em;line-height:1.4}.ma-s-xl{font-size:1.7em;line-height:1.3}
.ma-c-bleu{color:var(--tx-bleu)}.ma-c-cyan{color:var(--tx-cyan)}.ma-c-rouge{color:var(--tx-rouge)}.ma-c-orange{color:var(--tx-orange)}.ma-c-vert{color:var(--tx-vert)}.ma-c-gris{color:var(--tx-gris)}
.ma-h-jaune,.ma-h-vert,.ma-h-rose,.ma-h-bleu{color:#2f3342;padding:.05em .25em;border-radius:5px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.ma-h-jaune{background:var(--hl-jaune)}.ma-h-vert{background:var(--hl-vert)}.ma-h-rose{background:var(--hl-rose)}.ma-h-bleu{background:var(--hl-bleu)}
.ma-u{text-decoration:underline}
.ma-t-cyan,.ma-t-orange,.ma-t-rose,.ma-t-vert,.ma-t-bleu{text-decoration:underline;text-decoration-thickness:.18em;text-underline-offset:.2em}
.ma-t-cyan{text-decoration-color:var(--tr-cyan)}.ma-t-orange{text-decoration-color:var(--tr-orange)}.ma-t-rose{text-decoration-color:var(--tr-rose)}.ma-t-vert{text-decoration-color:var(--tr-vert)}.ma-t-bleu{text-decoration-color:var(--tr-bleu)}
.ma-h2{font-size:1.4rem;line-height:1.25;font-weight:800;color:var(--c-title);margin:0;letter-spacing:-.01em}
.ma-h3{font-size:1.12rem;line-height:1.3;font-weight:700;color:var(--c-title);margin:0}

/* Bandeau : aplat bleu, cercles pointillés pâles et demi-lentille, comme le modèle de présentation */
.ma-hero{position:relative;border-radius:24px;overflow:hidden;background:var(--c-hero);color:var(--c-on-hero);isolation:isolate}
.ma-hero-img{display:block;width:100%;aspect-ratio:16/9;background-color:var(--c-soft);background-size:cover;background-position:center}
.ma-hero-body{position:relative;padding:36px 92px 32px 24px;min-height:176px;display:flex;flex-direction:column;justify-content:flex-end}
.ma-hero-body::before{content:"";position:absolute;right:-70px;top:-90px;width:300px;height:300px;border:1.5px dotted rgba(255,255,255,.34);border-radius:50%;z-index:-1}
.ma-hero-body::after{content:"";position:absolute;right:-18px;bottom:-18px;width:112px;height:112px;background:var(--c-lens);opacity:var(--c-lens-o,.55);border-radius:100% 0 0 0;z-index:-1}
.ma-hero h2{margin:0 0 8px;font-size:1.9rem;line-height:1.12;font-weight:800;letter-spacing:-.02em;max-width:18ch;text-wrap:balance}
.ma-hero p{margin:0;font-size:1.05rem;font-weight:400;max-width:34ch}

/* Image */
.ma-fig{margin:0}
.ma-fig img{display:block;width:100%;border-radius:18px}
.ma-fig.ma-medium img{max-width:420px;margin:0 auto}
.ma-fig figcaption{margin-top:8px;font-size:.88rem;font-style:italic;color:var(--c-muted)}

/* Bouton */
.ma-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:10px 24px;border-radius:16px;font:inherit;font-weight:700;text-decoration:none;border:1.5px solid var(--c-btn);background:var(--c-btn);color:var(--c-on-btn);cursor:pointer;text-align:center;transition:background-color .18s cubic-bezier(.4,0,.2,1),border-color .18s cubic-bezier(.4,0,.2,1)}
.ma-btn:hover{background:var(--c-btn-hover);border-color:var(--c-btn-hover);color:var(--c-on-btn)}
.ma-btn:active{transform:scale(.98)}
.ma-btn.ma-outline{background:transparent;color:var(--c-link)}
.ma-btn.ma-outline:hover{background:var(--c-soft);color:var(--c-link);border-color:var(--c-btn)}
.ma-btn.ma-accent{background:var(--c-accent);border-color:var(--c-accent);color:var(--c-on-accent)}
.ma-btn.ma-accent:hover{background:var(--c-accent-hover);border-color:var(--c-accent-hover);color:var(--c-on-accent)}
.ma-btn.ma-full{display:flex;width:100%}

/* Encadré */
.ma-callout{display:flex;gap:14px;padding:16px 18px;border-radius:18px;border:0;background:var(--tone-bg);color:var(--c-text)}
.ma-callout .ma-ico{color:var(--tone-i);margin-top:2px}
.ma-callout .ma-callout-t{display:block;margin-bottom:4px;font-weight:800;color:var(--c-title);font-size:1.02rem}
.ma-tone-info{--tone-bg:var(--t-info-bg);--tone-b:var(--t-info-b);--tone-i:var(--t-info-i)}
.ma-tone-warn{--tone-bg:var(--t-warn-bg);--tone-b:var(--t-warn-b);--tone-i:var(--t-warn-i)}
.ma-tone-ok{--tone-bg:var(--t-ok-bg);--tone-b:var(--t-ok-b);--tone-i:var(--t-ok-i)}
.ma-tone-alert{--tone-bg:var(--t-alert-bg);--tone-b:var(--t-alert-b);--tone-i:var(--t-alert-i)}

/* Cartes : îlots arrondis, repère d'équipe en haut (petite languette, pas de trait pleine largeur) */
.ma-cards{display:grid;gap:14px;margin:0;padding:0;list-style:none}
.ma-card,.ma-contact,.ma-count{position:relative}
.ma-card::before,.ma-contact::before,.ma-count::before{content:"";position:absolute;top:0;left:18px;width:34px;height:4px;border-radius:0 0 4px 4px;background:var(--c-team);z-index:1}
.ma-count::before{left:50%;margin-left:-17px;background:var(--c-accent)}
.ma-card{background:var(--c-surface);border:1px solid var(--c-border);border-radius:20px;overflow:hidden;display:flex;gap:16px;align-items:flex-start;padding:18px 16px 16px;box-shadow:var(--ma-shadow);transition:border-color .18s cubic-bezier(.4,0,.2,1),box-shadow .18s cubic-bezier(.4,0,.2,1),transform .18s cubic-bezier(.4,0,.2,1)}
.ma-card img{width:88px;height:88px;object-fit:cover;border-radius:14px;flex:none}
.ma-card h3{margin:0;font-size:1.05rem;line-height:1.3;font-weight:800;color:var(--c-title)}
.ma-card p{margin:.3em 0 0;color:var(--c-muted);font-size:.94rem}
.ma-card h3 a{color:inherit;text-decoration:none}
.ma-card h3 a::after{content:"";position:absolute;inset:0}
.ma-card:has(h3 a):hover{border-color:var(--c-border);box-shadow:0 10px 26px rgba(0,76,142,.16);transform:translateY(-2px)}
.ma-card:has(h3 a:focus-visible){outline:2px solid var(--c-focus);outline-offset:2px}
.ma-card h3 a:focus-visible{outline:0}
.ma-tag{display:inline-block;margin-bottom:8px;padding:2px 10px;border-radius:8px;background:var(--c-team-soft);color:var(--c-on-soft);font-size:.74rem;font-weight:700;letter-spacing:.02em}
.ma-cards-grille{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.ma-cards-grille .ma-card{flex-direction:column;padding:0;gap:0}
.ma-cards-grille .ma-card img{width:100%;height:136px;border-radius:0}
.ma-cards-grille .ma-card .ma-card-t{padding:16px}
.ma-cards-portraits{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.ma-cards-portraits .ma-card{flex-direction:column;align-items:stretch;padding:0;gap:0}
.ma-cards-portraits .ma-card img,.ma-cards-portraits .ma-avatar{width:100%;height:auto;aspect-ratio:1/1;border-radius:0}
.ma-cards-portraits .ma-card .ma-card-t{padding:14px}
.ma-avatar{display:grid;place-items:center;background:var(--c-soft);color:var(--c-link);font-weight:800;font-size:2rem;flex:none;width:88px;height:88px;border-radius:14px}

/* Agenda */
.ma-events{margin:0;padding:0;list-style:none;display:grid;gap:12px}
.ma-ev{display:flex;gap:16px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:20px;padding:14px 16px 14px 14px;align-items:flex-start;box-shadow:var(--ma-shadow)}
.ma-date{flex:none;width:58px;text-align:center;border-radius:14px;background:var(--c-btn);color:var(--c-on-btn);padding:8px 0 7px;line-height:1.05}
.ma-date b{display:block;font-size:1.6rem;font-weight:800}
.ma-date span{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.ma-ev h3{margin:0;font-size:1.05rem;line-height:1.3;font-weight:800;color:var(--c-title)}
.ma-ev-m{margin:3px 0 0;color:var(--c-muted);font-size:.9rem}
.ma-ev p.ma-ev-x{margin:.4em 0 0;font-size:.94rem}
.ma-ev-add{margin-top:8px;display:inline-flex;align-items:center;gap:8px;background:none;border:0;padding:2px 0;color:var(--c-link);font:inherit;font-size:.88rem;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.ma-empty{color:var(--c-muted);font-style:italic}

/* Questions fréquentes */
.ma-faq details{background:var(--c-surface);border:1px solid var(--c-border);border-radius:18px;margin:0 0 10px;box-shadow:var(--ma-shadow)}
.ma-faq details[open]{border-color:var(--c-border)}
.ma-faq summary{cursor:pointer;padding:16px 18px;border-radius:18px;font-weight:800;color:var(--c-title);list-style:none;display:flex;justify-content:space-between;align-items:center;gap:12px}
.ma-faq summary::-webkit-details-marker{display:none}
.ma-faq summary::after{content:"";flex:none;width:9px;height:9px;border-right:2.5px solid var(--c-link);border-bottom:2.5px solid var(--c-link);transform:rotate(45deg) translate(-2px,-2px);transition:transform .18s cubic-bezier(.4,0,.2,1)}
.ma-faq details[open] summary::after{transform:rotate(225deg) translate(-2px,-2px)}
.ma-faq .ma-rich{padding:0 18px 18px}

/* Contact */
.ma-contact{background:var(--c-surface);border:1px solid var(--c-border);border-radius:20px;padding:22px 18px 18px;margin:0;box-shadow:var(--ma-shadow)}
.ma-contact h3{margin:0 0 12px;font-size:1.12rem;font-weight:800;color:var(--c-title)}
.ma-contact dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:10px 14px;align-items:start}
.ma-contact dt{color:var(--c-link);padding-top:2px}
.ma-contact dd{margin:0;white-space:pre-line}

/* Cadres intégrés */
.ma-frame{position:relative;border-radius:20px;overflow:hidden;border:1px solid var(--c-border);background:var(--c-surface);box-shadow:var(--ma-shadow)}
.ma-frame iframe{display:block;width:100%;border:0}
.ma-frame.ma-ratio{aspect-ratio:16/9}
.ma-frame.ma-ratio iframe,.ma-frame.ma-ratio video{position:absolute;inset:0;height:100%}
.ma-frame video{display:block;width:100%}
.ma-sub{margin:10px 2px 0;font-size:.9rem}
.ma-sub a{display:inline-flex;align-items:center;gap:8px;font-weight:600}

/* Liens et documents */
.ma-links{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.ma-links a{display:flex;gap:14px;align-items:center;padding:14px 16px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:18px;text-decoration:none;color:var(--c-text);box-shadow:var(--ma-shadow);transition:box-shadow .18s cubic-bezier(.4,0,.2,1),transform .18s cubic-bezier(.4,0,.2,1)}
.ma-links a:hover{box-shadow:0 10px 26px rgba(0,76,142,.16);transform:translateY(-1px)}
.ma-links .ma-ico{color:var(--c-link)}
.ma-links b{display:block;line-height:1.3;font-weight:800;color:var(--c-title)}
.ma-links small{display:block;color:var(--c-muted);line-height:1.4;margin-top:1px}
.ma-links .ma-go{margin-left:auto;color:var(--c-link)}

/* Compte à rebours */
.ma-count{text-align:center;background:var(--c-surface);border:1px solid var(--c-border);border-radius:22px;padding:28px 16px 22px;box-shadow:var(--ma-shadow)}
.ma-count b{display:block;font-size:2.8rem;line-height:1.05;font-weight:800;color:var(--c-title);letter-spacing:-.02em}
.ma-count span{color:var(--c-muted);font-weight:600}
.ma-sep{border:0;border-top:1px solid var(--c-border);margin:8px 0}
.ma-space{height:32px}
.ma-warn{padding:12px 14px;border:1px dashed var(--c-muted);border-radius:16px;color:var(--c-muted);font-size:.9rem}
@media (min-width:600px){.ma-main{padding-left:32px;padding-right:32px}.ma-head{padding-left:24px;padding-right:24px}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
@media print{.ma-tabs,.ma-back,.ma-head{display:none}.ma-main{padding:0}}
`;
