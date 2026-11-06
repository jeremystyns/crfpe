# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Site statique en HTML, CSS et JavaScript sans framework ni étape de construction (déjà en place). Aucune dépendance, aucun CDN, aucun appel réseau depuis le constructeur.

## Users

- **Auteurs** : formateurs et personnels du CRFPE (centre régional de formation des professionnels de l'enfance, Lille) qui ne codent pas et fabriquent une petite appli pour une équipe, une formation ou un événement. Ils travaillent sur ordinateur, au bureau, en préparant une session ou une journée portes ouvertes.
- **Visiteurs des applis** : stagiaires, étudiants, familles, partenaires. Ils ouvrent l'appli sur téléphone, souvent depuis un QR code ou un lien, sans compte.

## Product Purpose

Permettre de créer en quelques minutes une appli web simple (livret d'accueil, programme, documents, contacts, formulaires intégrés) et de la télécharger sous la forme d'un unique fichier HTML autonome, hébergé par le CRFPE lui-même. Réussite : un collègue non technicien publie une appli propre, lisible et conforme à la charte sans aide.

## Positioning

Alternative locale à MonApp (Éducation nationale) : pas de cloud, pas d'IA, pas de compte, pas de base de données ; le résultat est un fichier que l'on possède et héberge soi-même. Les formulaires ne sont pas fabriqués : on intègre ceux existants (Tally, Microsoft Forms, Google Forms…).

## Operating Context

Usage professionnel interne au CRFPE, proposé aux collègues. Le constructeur est un site statique ouvert dans le navigateur ou hébergé sur un serveur statique. Les projets sont enregistrés dans le navigateur (IndexedDB) et exportables en .json ou .html. L'export HTML contient aussi le projet, donc il est rouvrable.

## Capabilities and Constraints

- Éditeur par blocs (16 types dont l'activité H5P intégrée), pages avec sous-pages (un seul niveau), barre du bas limitée à 4 pages et menu hamburger, éditeur de texte visuel, thèmes, aperçu en direct, export HTML autonome avec CSP stricte.
- Contraintes : aucune requête réseau, aucune bibliothèque externe, polices et icônes embarquées localement, aucun `innerHTML` avec donnée variable, contenu entièrement en français.
- Décidé avec l'auteur : couleurs = les 4 équipes du design system CRFPE (Institutionnel, EJE, Formation Continue, Espace Sésame) plus une couleur libre ; mode sombre conservé comme variante assumée (non issue de la charte) ; aucun emoji, pictogrammes du jeu d'icônes CRFPE.

## Brand Commitments

Le design system « CRFPE » de l'auteur (artefact « CRFPE Design System ») fait foi : bleu #004C8E et cyan #41C8F4, police Mulish (substitut libre de Bliss Pro), sigle en Barlow minuscule, rayon 3 px (6 px pour les cartes), pas d'ombre lourde, pas de dégradé, pas d'emoji, icônes pleines du jeu CRFPE, filet d'accent en haut des cartes, onglet actif souligné de cyan, focus cyan #00B0F0. Registre institutionnel, sobre, factuel ; guillemets à l'anglaise. Le logo CRFPE apparaît par défaut dans l'en-tête des applis (modifiable) avec son filet blanc de protection sur fond coloré.

## Evidence on Hand

Design system CRFPE (tokens, README, composants, 78 icônes nommées, logos). Aucune photo d'établissement fournie pour les modèles ; les contenus des modèles sont fictifs.

## Product Principles

1. Simplicité d'abord : chaque écran se comprend sans formation.
2. Rien ne quitte l'ordinateur : local, sans compte, sans IA.
3. Le résultat appartient à l'auteur : un fichier autonome qu'il héberge où il veut.
4. La charte est le défaut : une appli créée sans effort est déjà conforme à l'identité du CRFPE.

## Accessibility & Inclusion

Contraste de texte d'au moins 4,5:1 quelle que soit la couleur choisie, navigation clavier complète, focus visible, `prefers-reduced-motion` respecté, interface et contenus en français.
