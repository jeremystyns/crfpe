/* Feuille de style de l'appli exportée (et de l'aperçu).
   Stockée dans une chaîne pour pouvoir être injectée telle quelle dans le fichier HTML exporté. */
window.MONAPP_CSS = `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--c-bg);color:var(--c-text);font:16px/1.55 var(--font);-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto}
a{color:var(--c-link)}
:focus-visible{outline:3px solid var(--c-accent);outline-offset:2px;border-radius:4px}
.ma-skip{position:absolute;left:-999px;top:0;background:#fff;color:#000;padding:8px 12px;z-index:20}
.ma-skip:focus{left:8px;top:8px}
.ma-app{max-width:760px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column}
.ma-head{position:sticky;top:0;z-index:5;background:var(--c-primary);color:var(--c-on-primary);padding:10px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 8px rgba(0,0,0,.15)}
.ma-logo{width:40px;height:40px;border-radius:calc(var(--radius)*.6);object-fit:cover;background:rgba(255,255,255,.22);display:grid;place-items:center;font-weight:700;font-size:1rem;flex:none}
.ma-head-t{min-width:0}
.ma-head-t b{display:block;font-size:1.05rem;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ma-head-t small{display:block;opacity:.88;font-size:.8rem;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ma-main{flex:1;padding:18px 16px 110px;outline:0}
.ma-main.ma-notabs{padding-bottom:40px}
.ma-page-h{font-size:1.6rem;line-height:1.2;margin:2px 0 16px}
.ma-back{display:inline-flex;align-items:center;gap:6px;margin:0 0 12px;padding:6px 12px 6px 8px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:99px;color:var(--c-text);font:inherit;font-size:.9rem;cursor:pointer;text-decoration:none}
.ma-block{margin:0 0 18px}
.ma-block>:first-child{margin-top:0}
.ma-block>:last-child{margin-bottom:0}
.ma-tabs{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(100%,760px);background:var(--c-surface);border-top:1px solid var(--c-border);display:flex;overflow-x:auto;z-index:6;padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -2px 12px rgba(0,0,0,.06)}
.ma-tab{flex:1 0 62px;min-width:62px;max-width:160px;display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 4px 7px;text-decoration:none;color:var(--c-muted);font-size:.72rem;line-height:1.2;text-align:center;border-top:3px solid transparent}
.ma-tab span{font-size:1.35rem;line-height:1.2}
.ma-tab[aria-current=page]{color:var(--c-link);border-top-color:var(--c-primary);font-weight:700}
.ma-rich p{margin:0 0 .75em}
.ma-rich ul,.ma-rich ol{margin:0 0 .75em;padding-left:1.4em}
.ma-rich li{margin:.15em 0}
.ma-rich>:last-child{margin-bottom:0}
.ma-h2{font-size:1.3rem;line-height:1.25;margin:.4em 0 .3em}
.ma-h3{font-size:1.1rem;line-height:1.3;margin:.3em 0 .2em;color:var(--c-text)}
.ma-hero{position:relative;border-radius:var(--radius);overflow:hidden;color:#fff;padding:34px 22px;min-height:170px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(135deg,var(--c-primary),var(--c-grad2));background-size:cover;background-position:center;isolation:isolate}
.ma-hero.ma-has-img::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.68));z-index:-1}
.ma-hero.ma-no-img{color:var(--c-on-primary)}
.ma-hero h2{margin:0 0 6px;font-size:1.7rem;line-height:1.15}
.ma-hero p{margin:0;font-size:1.02rem;opacity:.95}
.ma-fig{margin:0}
.ma-fig img{display:block;width:100%;border-radius:var(--radius)}
.ma-fig.ma-medium img{max-width:420px;margin:0 auto}
.ma-fig figcaption{margin-top:6px;font-size:.88rem;color:var(--c-muted);text-align:center}
.ma-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 20px;border-radius:calc(var(--radius)*.75);font:inherit;font-weight:700;text-decoration:none;border:2px solid var(--c-primary);background:var(--c-primary);color:var(--c-on-primary);cursor:pointer;text-align:center}
.ma-btn:hover{filter:brightness(1.08)}
.ma-btn.ma-outline{background:transparent;color:var(--c-link)}
.ma-btn.ma-full{display:flex;width:100%}
.ma-btn.ma-center-wrap{display:flex;justify-content:center}
.ma-callout{display:flex;gap:12px;padding:14px 16px;border-radius:var(--radius);border:1px solid var(--tone-b);background:var(--tone-bg);color:var(--c-text)}
.ma-callout .ma-ico{font-size:1.4rem;line-height:1.3;flex:none}
.ma-callout strong{display:block;margin-bottom:2px}
.ma-tone-info{--tone-bg:rgba(37,99,235,.09);--tone-b:rgba(37,99,235,.4)}
.ma-tone-warn{--tone-bg:rgba(245,158,11,.14);--tone-b:rgba(217,119,6,.55)}
.ma-tone-ok{--tone-bg:rgba(22,163,74,.11);--tone-b:rgba(22,163,74,.45)}
.ma-tone-alert{--tone-bg:rgba(220,38,38,.1);--tone-b:rgba(220,38,38,.5)}
.ma-cards{display:grid;gap:12px;margin:0;padding:0;list-style:none}
.ma-card{position:relative;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius);overflow:hidden;display:flex;gap:12px;align-items:flex-start;padding:12px}
.ma-card img{width:84px;height:84px;object-fit:cover;border-radius:calc(var(--radius)*.7);flex:none}
.ma-card h3{margin:0;font-size:1.02rem;line-height:1.3}
.ma-card p{margin:.2em 0 0;color:var(--c-muted);font-size:.93rem}
.ma-card h3 a{color:var(--c-text);text-decoration:none}
.ma-card h3 a::after{content:"";position:absolute;inset:0}
.ma-card:has(h3 a):hover{border-color:var(--c-primary)}
.ma-tag{display:inline-block;margin-bottom:4px;padding:1px 9px;border-radius:99px;background:var(--c-soft);color:var(--c-link);font-size:.75rem;font-weight:700}
.ma-cards-grille{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.ma-cards-grille .ma-card{flex-direction:column;padding:0;gap:0}
.ma-cards-grille .ma-card img{width:100%;height:130px;border-radius:0}
.ma-cards-grille .ma-card .ma-card-t{padding:12px}
.ma-cards-portraits{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.ma-cards-portraits .ma-card{flex-direction:column;align-items:center;text-align:center;padding:16px 10px}
.ma-cards-portraits .ma-card img,.ma-cards-portraits .ma-avatar{width:92px;height:92px;border-radius:50%}
.ma-avatar{display:grid;place-items:center;background:var(--c-soft);color:var(--c-link);font-weight:700;font-size:1.5rem;flex:none;width:84px;height:84px;border-radius:calc(var(--radius)*.7)}
.ma-events{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.ma-ev{display:flex;gap:14px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius);padding:12px;align-items:flex-start}
.ma-date{flex:none;width:56px;text-align:center;border-radius:calc(var(--radius)*.6);background:var(--c-primary);color:var(--c-on-primary);padding:6px 0 5px;line-height:1.1}
.ma-date b{display:block;font-size:1.45rem}
.ma-date span{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em}
.ma-ev h3{margin:0;font-size:1.02rem;line-height:1.3}
.ma-ev-m{margin:2px 0 0;color:var(--c-muted);font-size:.9rem}
.ma-ev p.ma-ev-x{margin:.3em 0 0;font-size:.93rem}
.ma-ev-add{margin-top:6px;background:none;border:0;padding:0;color:var(--c-link);font:inherit;font-size:.86rem;text-decoration:underline;cursor:pointer}
.ma-empty{color:var(--c-muted);font-style:italic}
.ma-faq details{background:var(--c-surface);border:1px solid var(--c-border);border-radius:calc(var(--radius)*.8);margin:0 0 8px}
.ma-faq summary{cursor:pointer;padding:12px 14px;font-weight:700;list-style:none;display:flex;justify-content:space-between;gap:10px}
.ma-faq summary::-webkit-details-marker{display:none}
.ma-faq summary::after{content:"+";font-size:1.3rem;line-height:1;color:var(--c-link)}
.ma-faq details[open] summary::after{content:"\\2212"}
.ma-faq .ma-rich{padding:0 14px 12px}
.ma-contact{background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius);padding:14px 16px;margin:0}
.ma-contact h3{margin:0 0 8px;font-size:1.1rem}
.ma-contact dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 12px}
.ma-contact dt{color:var(--c-muted)}
.ma-contact dd{margin:0;white-space:pre-line}
.ma-frame{position:relative;border-radius:var(--radius);overflow:hidden;border:1px solid var(--c-border);background:var(--c-surface)}
.ma-frame iframe{display:block;width:100%;border:0}
.ma-frame.ma-ratio{aspect-ratio:16/9}
.ma-frame.ma-ratio iframe,.ma-frame.ma-ratio video{position:absolute;inset:0;height:100%}
.ma-frame video{display:block;width:100%}
.ma-sub{margin:6px 2px 0;font-size:.88rem}
.ma-links{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.ma-links a{display:flex;gap:12px;align-items:center;padding:12px 14px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:calc(var(--radius)*.8);text-decoration:none;color:var(--c-text)}
.ma-links a:hover{border-color:var(--c-primary)}
.ma-links .ma-ico{font-size:1.4rem;flex:none}
.ma-links b{display:block;line-height:1.3}
.ma-links small{display:block;color:var(--c-muted);line-height:1.35}
.ma-links .ma-go{margin-left:auto;color:var(--c-link);font-weight:700}
.ma-count{text-align:center;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius);padding:18px 12px}
.ma-count b{display:block;font-size:2.6rem;line-height:1.1;color:var(--c-link)}
.ma-count span{color:var(--c-muted)}
.ma-sep{border:0;border-top:1px solid var(--c-border);margin:6px 0}
.ma-space{height:28px}
.ma-warn{padding:10px 12px;border:2px dashed var(--c-border);border-radius:var(--radius);color:var(--c-muted);font-size:.9rem}
@media (min-width:600px){.ma-main{padding-left:24px;padding-right:24px}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@media print{.ma-tabs,.ma-back,.ma-head{display:none}.ma-main{padding:0}}
`;
