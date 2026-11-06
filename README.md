# Atelier Appli

Créez une petite appli web pour votre équipe, votre formation ou votre centre **sans coder**, puis téléchargez-la en **un seul fichier HTML autonome** à héberger où vous voulez.

- **Pas de cloud** : tout se passe dans votre navigateur. Aucune requête réseau (le constructeur l'interdit via sa politique de sécurité `connect-src 'none'`).
- **Pas d'IA**, pas de compte, pas de base de données, pas de bibliothèque externe, pas de CDN.
- **Formulaires** : on intègre ceux que vous utilisez déjà (Tally, Microsoft Forms, Google Forms, Framaforms…). Il n'y a volontairement pas de constructeur de formulaire.
- **Sauvegarde automatique** dans le navigateur, plus export `.json` / `.html` pour archiver ou partager avec un collègue.
- **Aux couleurs du CRFPE** : l'interface et les applis exportées suivent le design system « CRFPE » (bleu #004C8E, cyan #41C8F4, police Mulish, pictogrammes pleins du jeu CRFPE, aucun emoji, logo détaché par un filet blanc). Voir [DESIGN.md](DESIGN.md).

## Utiliser

Le constructeur est un site statique. Deux façons de l'ouvrir :

```bash
python3 -m http.server 8000      # puis ouvrir http://localhost:8000/
```

…ou simplement **double-cliquer sur `index.html`**. Pour le proposer à vos collègues, déposez tout le dossier sur n'importe quel hébergement statique (intranet, OVH, GitHub Pages, Netlify…).

1. Choisissez un **modèle** (livret d'accueil, portes ouvertes, jeu de piste, vierge).
2. Dans la colonne de gauche, gérez les **pages**, puis cliquez sur **Ajouter un bloc** (juste dessous) pour composer la page sélectionnée ; réordonnez par glisser-déposer ou avec les flèches. L'**aperçu** à droite est celui du fichier final.
3. Ouvrez **Configuration** (bandeau supérieur) : fenêtre flottante qui laisse l'aperçu visible. Onglet **Apparence** : équipe CRFPE (Institutionnel, EJE, Formation Continue, Espace Sésame) ou couleur libre, mode sombre. Onglet **Informations générales** : nom, sous-titre, logo (celui du CRFPE par défaut), langue.
4. **Télécharger l'appli (.html)** puis déposez `index.html` sur votre serveur.

### Les blocs

| Famille | Blocs |
|---|---|
| Mise en avant | Bandeau d'accueil |
| Texte et médias | Titre, Texte (éditeur visuel : gras, italique, souligné, taille, couleur, stabilo, trait de couleur, alignement, listes, liens, point médian), Image (compressée automatiquement), Vidéo (YouTube, Vimeo, Dailymotion, PeerTube, .mp4), Encadré |
| Navigation | Bouton (page de l'appli, site, mail, téléphone), Liens et documents, Séparateur |
| Listes | Cartes (liste, grille, portraits), Agenda (« Ajouter à mon agenda » .ics), Questions fréquentes, Compte à rebours |
| Infos pratiques | Contact, Plan d'accès (OpenStreetMap, sans clé) |
| Formulaires et contenus | Formulaire / contenu intégré et **Activité H5P** : collez l'adresse **ou** le code `<iframe>` |

### Pages, barre du bas, menu et sous-pages

- **Barre du bas** : 4 pages au plus (l'accueil en fait partie), à choisir parmi les pages créées (case « Afficher dans la barre du bas » dans les réglages de la page).
- **Menu hamburger** (bouton « Menu », à droite de la barre) : montre toutes les pages principales.
- **Sous-pages** : une page peut avoir des sous-pages, mais pas plus (un seul niveau). Bouton « + » à côté d'une page dans la liste (seul endroit pour en ajouter une), ou « Créer une sous-page » dans une carte : la sous-page est créée et reliée à la carte en un clic. Les sous-pages n'apparaissent ni dans la barre ni dans le menu ; elles s'ouvrent par une carte, un bouton ou un lien, avec un bouton « Retour ».
- **Pages cachées** : décochez la barre et le menu ; on y accède par un bouton, une carte ou un lien (utile pour un jeu de piste).

### Texte

L'éditeur est **visuel** : on voit le texte tel qu'il sera, sans code. Le collage ne garde que le texte brut (pas de styles venus de Word). Les textes sont enregistrés sous forme de document structuré (jamais de HTML brut). Les anciens projets (Markdown) sont convertis automatiquement à l'ouverture.

### Activité H5P

Collez l'adresse ou le code « Embed » d'une activité créée ailleurs (H5P.org, Moodle, Éléa, WordPress…). L'activité doit s'ouvrir sans connexion. Son cadre se redimensionne tout seul (protocole H5P, sans script externe). Les résultats restent chez l'hébergeur : l'appli n'enregistre rien. L'import d'un fichier `.h5p` pour un usage hors ligne n'est pas inclus.

### Intégrer un formulaire

Dans le bloc « Formulaire / contenu intégré », collez l'adresse de partage ou le code d'intégration :

| Service | Où le trouver |
|---|---|
| Tally | Partager › lien (`https://tally.so/r/…`) |
| Microsoft Forms | Collecter les réponses › **Intégrer** (code `<iframe>`) |
| Google Forms | Envoyer › onglet `< >` |
| Framaforms, LearningApps, Genially, Padlet… | Adresse ou code « intégrer » |

Si un service refuse d'être affiché dans un cadre (c'est le cas de certains liens courts), choisissez le mode **« Bouton »** : il ouvre le formulaire dans un nouvel onglet. L'Atelier signale le problème au moment de la saisie.

> Les réponses restent chez le service de formulaire : l'appli exportée n'enregistre rien.

## Héberger l'appli exportée

Le fichier est autonome. Il suffit de le déposer sur un serveur web, de préférence en `https://` (nécessaire pour les vidéos YouTube et certains formulaires). Les PDF peuvent être placés à côté (`documents/reglement.pdf`) et référencés par ce chemin relatif.

## Structure

```
index.html            le constructeur
css/builder.css       son apparence (charte CRFPE)
js/runtime.js         moteur d'affichage : utilisé par l'aperçu ET recopié dans le fichier exporté
js/runtime-css.js     styles de l'appli exportée (dans une chaîne, pour l'injecter dans l'export)
js/builder.js         éditeur : blocs, pages et sous-pages, configuration, sauvegarde (IndexedDB), import/export
js/rte.js             éditeur de texte visuel (barre de mise en forme, conversion vers le document structuré)
js/templates.js       modèles d'appli (contenus fictifs)
js/icons.js           58 pictogrammes du design system CRFPE (données, rendus en DOM)
js/logo-data.js       logo CRFPE (RVB, 192 px) embarqué
js/font-data.js       Mulish (latin) encodée, intégrée aux fichiers exportés
fonts/                Mulish et Barlow (SIL OFL), voir fonts/LICENCES.md
img/                  logo et favicon CRFPE
PRODUCT.md, DESIGN.md contexte produit et système visuel (référence pour tout futur travail de design)
tests/smoke.mjs       test de bout en bout (Playwright)
tests/features.mjs    barre du bas, sous-pages, éditeur visuel, H5P
```

**Pourquoi `runtime.js` est une fonction autonome ?** Elle est copiée telle quelle (`Function.prototype.toString`) dans le HTML exporté : l'aperçu et le résultat final utilisent donc exactement le même code. Elle ne doit dépendre de rien d'extérieur.

**Une appli = un document JSON** (pages, blocs, images en base64, pictogrammes utilisés) embarqué dans le HTML exporté (`<script type="application/json" id="monapp-data">`). Ce même fichier peut être rouvert dans l'Atelier pour être modifié.

### Ajouter un type de bloc

1. `js/builder.js` : ajoutez une entrée dans `BLOCKS` (libellé, valeurs par défaut `make`, champs de formulaire `fields`, résumé).
2. `js/runtime.js` : ajoutez la fonction de rendu dans `R` (construire le DOM avec `el()`, jamais de `innerHTML`).
3. `js/runtime-css.js` : ajoutez les styles.

## Sécurité

- Le moteur construit le DOM par `createElement` / `textContent` : **aucun `innerHTML`, aucun `eval`**. Le HTML saisi dans un texte reste du texte.
- Chaque lien passe par `safeUrl()` : seuls `http(s)`, `mailto`, `tel` et les chemins relatifs sont acceptés (`javascript:` et `data:` refusés). Les images doivent être `png/jpeg/webp/gif` (SVG refusé).
- Les cadres intégrés sont en `https` uniquement et « sandboxés ».
- Le fichier exporté contient une **Content-Security-Policy** stricte : script et style protégés par empreinte SHA-256 (pas de `unsafe-inline`), police embarquée (`font-src data:`), `frame-src` limité aux seuls services réellement utilisés dans l'appli, `connect-src 'none'`.
- Les pictogrammes sont des données (chemins SVG validés), construites nœud par nœud : aucun SVG n'est injecté en HTML.
- Le test `tests/smoke.mjs` vérifie ces points avec un contenu volontairement hostile.

⚠️ Une appli publiée est lisible par toute personne qui connaît son adresse : n'y mettez **aucune donnée personnelle**.

## Accessibilité

Navigation clavier complète (tout se fait aussi avec les boutons ↑ ↓ en plus du glisser-déposer), lien d'évitement, titres structurés, `aria-current` sur l'onglet actif, descriptions d'images, contraste du texte sur la couleur principale, des liens et des boutons recalculé automatiquement (≥ 4,5:1 quelle que soit la couleur choisie), `prefers-reduced-motion` respecté.

## Tests

```bash
npm install          # Playwright (une seule dépendance de développement)
npm test             # smoke.mjs ; puis : node tests/features.mjs
```

## Notes sur le design system CRFPE

- Dans les fichiers sources du design system, `chevron-down.svg` dessine un pouce levé et `chevron-up.svg` une chevron vers le bas : les noms sont corrigés dans `js/icons.js` (`thumbs-up`, `chevron-down`).
- La couleur de texte atténué du design system (#58889E) ne passe pas le contraste 4,5:1 sur fond blanc ; l'Atelier utilise #566074 pour le texte secondaire.
- Le mode sombre est une variante ajoutée par l'Atelier : elle ne vient pas de la charte.

## Inspiration et licence

Ce projet s'inspire du **concept** de [MonApp](https://forge.apps.education.fr/monapp/monapp.forge.apps.education.fr) (assembler des blocs, pages, thèmes, publier). MonApp est sous licence **AGPL v3** : **aucun de son code n'a été repris ici**, tout est écrit de zéro, avec une architecture volontairement plus simple (pas de serveur, pas de service tiers).

Choisissez la licence de votre choix avant de diffuser ce dépôt à des collègues (par exemple MIT ou AGPL v3).

## Pistes d'évolution

- Génération d'un QR code et d'une affiche A4 à partir de l'adresse finale.
- Polices sous licence (Bliss Pro, DIN) à la place de Mulish et Barlow, si le CRFPE les fournit.
- Installation sur l'écran d'accueil du téléphone (manifeste + service worker, nécessite un fichier d'icône à côté).
- Recadrage des images.
- Blocs supplémentaires : tableau, accordéon de documents, galerie.
