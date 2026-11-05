# Atelier Appli

Créez une petite appli web pour votre établissement ou votre centre de formation **sans coder**, puis téléchargez-la en **un seul fichier HTML autonome** à héberger où vous voulez.

- **Pas de cloud** : tout se passe dans votre navigateur. Aucune requête réseau (le constructeur l'interdit via sa politique de sécurité `connect-src 'none'`).
- **Pas d'IA**, pas de compte, pas de base de données, pas de bibliothèque externe, pas de CDN.
- **Formulaires** : on intègre ceux que vous utilisez déjà (Tally, Microsoft Forms, Google Forms, Framaforms…). Il n'y a volontairement pas de constructeur de formulaire.
- **Sauvegarde automatique** dans le navigateur, plus export `.json` / `.html` pour archiver ou partager avec un collègue.

## Utiliser

Le constructeur est un site statique. Deux façons de l'ouvrir :

```bash
python3 -m http.server 8000      # puis ouvrir http://localhost:8000/
```

…ou simplement **double-cliquer sur `index.html`**. Pour le proposer à vos collègues, déposez tout le dossier sur n'importe quel hébergement statique (intranet, OVH, GitHub Pages, Netlify…).

1. Choisissez un **modèle** (centre de formation, portes ouvertes, jeu de piste, vierge).
2. Ajoutez des **pages** et des **blocs** ; réordonnez-les par glisser-déposer ou avec les flèches. L'**aperçu** à droite est celui du fichier final.
3. Réglez l'**apparence** (6 palettes ou vos couleurs, mode sombre, coins, police).
4. **Télécharger l'appli (.html)** puis déposez `index.html` sur votre serveur.

### Les blocs

| Famille | Blocs |
|---|---|
| Mise en avant | Bandeau d'accueil |
| Texte et médias | Titre, Texte (gras, italique, listes, liens), Image (compressée automatiquement), Vidéo (YouTube, Vimeo, Dailymotion, PeerTube, .mp4), Encadré |
| Navigation | Bouton (page de l'appli, site, mail, téléphone), Liens et documents, Séparateur |
| Listes | Cartes (liste, grille, portraits), Agenda (« Ajouter à mon agenda » .ics), Questions fréquentes, Compte à rebours |
| Infos pratiques | Contact, Plan d'accès (OpenStreetMap, sans clé) |
| Formulaires et contenus | Formulaire / contenu intégré : collez l'adresse **ou** le code `<iframe>` |

Les pages peuvent être **dans la barre d'onglets** ou **cachées** (ouvertes par un bouton ou une carte : utile pour un parcours ou un jeu de piste).

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
css/builder.css       son apparence
js/runtime.js         moteur d'affichage : utilisé par l'aperçu ET recopié dans le fichier exporté
js/runtime-css.js     styles de l'appli exportée (dans une chaîne, pour l'injecter dans l'export)
js/builder.js         éditeur : blocs, pages, thème, sauvegarde (IndexedDB), import/export
js/templates.js       modèles d'appli (contenus fictifs)
tests/smoke.mjs       test de bout en bout (Playwright)
```

**Pourquoi `runtime.js` est une fonction autonome ?** Elle est copiée telle quelle (`Function.prototype.toString`) dans le HTML exporté : l'aperçu et le résultat final utilisent donc exactement le même code. Elle ne doit dépendre de rien d'extérieur.

**Une appli = un document JSON** (pages, blocs, images en base64) embarqué dans le HTML exporté (`<script type="application/json" id="monapp-data">`). Ce même fichier peut être rouvert dans l'Atelier pour être modifié.

### Ajouter un type de bloc

1. `js/builder.js` : ajoutez une entrée dans `BLOCKS` (libellé, valeurs par défaut `make`, champs de formulaire `fields`, résumé).
2. `js/runtime.js` : ajoutez la fonction de rendu dans `R` (construire le DOM avec `el()`, jamais de `innerHTML`).
3. `js/runtime-css.js` : ajoutez les styles.

## Sécurité

- Le moteur construit le DOM par `createElement` / `textContent` : **aucun `innerHTML`, aucun `eval`**. Le HTML saisi dans un texte reste du texte.
- Chaque lien passe par `safeUrl()` : seuls `http(s)`, `mailto`, `tel` et les chemins relatifs sont acceptés (`javascript:` et `data:` refusés). Les images doivent être `png/jpeg/webp/gif` (SVG refusé).
- Les cadres intégrés sont en `https` uniquement et « sandboxés ».
- Le fichier exporté contient une **Content-Security-Policy** stricte : script et style protégés par empreinte SHA-256 (pas de `unsafe-inline`), `frame-src` limité aux seuls services réellement utilisés dans l'appli, `connect-src 'none'`.
- Le test `tests/smoke.mjs` vérifie ces points avec un contenu volontairement hostile.

⚠️ Une appli publiée est lisible par toute personne qui connaît son adresse : n'y mettez **aucune donnée personnelle**.

## Accessibilité

Navigation clavier complète (tout se fait aussi avec les boutons ↑ ↓ en plus du glisser-déposer), lien d'évitement, titres structurés, `aria-current` sur l'onglet actif, descriptions d'images, contraste du texte sur la couleur principale et des liens recalculé automatiquement (≥ 4,5:1 quelle que soit la couleur choisie), `prefers-reduced-motion` respecté.

## Tests

```bash
npm install          # Playwright (une seule dépendance de développement)
npm test
```

## Inspiration et licence

Ce projet s'inspire du **concept** de [MonApp](https://forge.apps.education.fr/monapp/monapp.forge.apps.education.fr) (assembler des blocs, pages, thèmes, publier). MonApp est sous licence **AGPL v3** : **aucun de son code n'a été repris ici**, tout est écrit de zéro, avec une architecture volontairement plus simple (pas de serveur, pas de service tiers).

Choisissez la licence de votre choix avant de diffuser ce dépôt à des collègues (par exemple MIT ou AGPL v3).

## Pistes d'évolution

- Génération d'un QR code et d'une affiche A4 à partir de l'adresse finale.
- Installation sur l'écran d'accueil du téléphone (manifeste + service worker, nécessite un fichier d'icône à côté).
- Recadrage des images.
- Blocs supplémentaires : tableau, accordéon de documents, galerie.
