# Design : Atelier Appli (charte CRFPE)

Source de vérité : le design system « CRFPE » de l'auteur. Ce fichier décrit ce qui est construit.

## Principes
- Bleu #004C8E porte titres, aplats et boutons ; cyan #41C8F4 est un accent (filet, soulignement), jamais un fond de texte long.
- Angles francs : rayon 3 px (contrôles, boutons, logo), 6 px (cartes, panneaux). Aucune pilule, aucun dégradé, aucune ombre lourde, aucun emoji.
- Police Mulish (substitut libre de Bliss Pro) ; sigle « crfpe » en Barlow minuscule. Fichiers locaux (`fonts/`), encodés dans l'export.
- Pictogrammes pleins du jeu CRFPE (`js/icons.js`, 58 icônes), une couleur, rendus en DOM.

## Tokens utilisés
Bleu #004C8E (survol #003A6D) · cyan #41C8F4 (survol #2FB6E2) · focus #00B0F0 + halo `0 0 0 3px rgba(0,176,240,.35)` · texte #2F3342 · gris de fond #EDEFF2 (constructeur), #F2F4F7 (appli) · filet rgba(0,0,0,.10) · ciel #B7DDFF.
Équipes (filet, étiquettes, lentille du bandeau) : Institutionnel #58889E/#B7DDFF · EJE #6CC067/#E6EFC1 · Formation Continue #C00000/#F3A59F · Espace Sésame #DC8319/#FFE4AF.

## Constructeur (Operate)
Bandeau bleu (logo avec filet blanc, sigle, Annuler, Rétablir, Mes applis, Configuration, Enregistrer, Télécharger en cyan). Colonne gauche : panneau Pages puis bouton « Ajouter un bloc » plein bleu. Centre : réglages de page, blocs (filet cyan 4 px en haut du bloc ouvert). Droite : aperçu.
Configuration : fenêtre flottante non modale (Apparence, Informations générales) qui garde l'aperçu visible ; ferme avec Échap ou « Terminer ». Voile des fenêtres modales : bleu 45 % et flou 2 px, ombre `0 16px 40px`, tels que le design system les définit.

## Appli exportée (Read, mobile)
En-tête bleu pleine largeur, contenu centré à 760 px. Bandeau : aplat bleu, cercle pointillé pâle et demi-lentille d'équipe. Cartes, contact, compte à rebours : filet d'accent 4 px en haut. Onglets : barre fixe, trait cyan 3 px **au-dessus** de l'onglet actif (convention des barres mobiles ; la charte prévoit un soulignement pour les onglets locaux, utilisé dans Configuration). Photos en rectangles nets. Mode sombre : variante ajoutée, hors charte.

## Navigation de l'appli
Barre du bas : 4 pages au plus + bouton « Menu » (trois traits dessinés, couleur du texte). Le menu s'ouvre en volet depuis le bas, sur le voile bleu 45 % de la charte, et liste les pages principales (jamais les sous-pages). Sous-page : bouton « Retour : page principale » ; l'onglet de la page principale reste actif.

## Éditeur de texte visuel
Barre de mise en forme sur fond gris #EDEFF2, boutons à angle de 3 px, état actif en bleu plein. Palettes : texte (noir, bleu, cyan, rouge, orange, vert, gris, teintes lisibles à 4,5:1 et adaptées au mode sombre), stabilo (jaune, vert, rose, bleu clair de la charte), trait (cyan, orange, rouge, vert, bleu). Pictogrammes d'alignement dessinés (le jeu CRFPE n'en a pas).

## Écarts assumés
- Texte secondaire #566074 au lieu de #58889E (contraste 4,5:1 sur blanc).
- `chevron-down.svg` / `chevron-up.svg` du design system sont inversés avec un pouce levé : corrigés dans `js/icons.js`.
- Le jeu d'icônes nommées n'a pas de glyphe image ni vidéo : Image = dossier, Vidéo = écran.
- Le jeu d'icônes ne contient ni alignement, ni menu, ni liste numérotée : traits dessinés à la main, même épaisseur, une couleur.
- Détecteur : filets 4 px en haut et soulignement 3 px ignorés, car prescrits par la charte.
