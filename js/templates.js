/* Modèles d'applis proposés au démarrage. Les contenus sont FICTIFS (sauf l'adresse publique du CRFPE).
   Les pictogrammes sont des noms du jeu d'icônes CRFPE (js/icons.js) : jamais d'emoji. */
(function () {
  function id() { return Math.random().toString(36).slice(2, 8); }
  function B(type, props) { return Object.assign({ id: id(), type: type }, props); }
  function P(slug, title, icon, blocks, extra) { return Object.assign({ id: slug, title: title, icon: icon, tab: true, showTitle: true, blocks: blocks }, extra || {}); }
  function theme(team, dark) { return { team: team, primary: '#004c8e', accent: '#41c8f4', dark: !!dark }; }
  function inDays(days) {
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function go(label, page, style) { return B('button', { label: label, kind: 'page', page: page, url: '', mail: '', tel: '', style: style || 'solid', width: 'full' }); }
  var CONTACT = { org: 'CRFPE', address: '465 rue Courtois\n59000 Lille', phone: '+33 (0)3 20 14 93 00', email: '', hours: 'Du lundi au vendredi\n8 h 30 – 17 h 30', website: 'https://www.crfpe.fr' };
  var LILLE = '50.6292, 3.0573';

  window.MONAPP_TEMPLATES = [
    {
      key: 'centre', name: 'Livret d’accueil', icon: 'graduation-cap', team: 'instit',
      desc: 'Actualités, formations, agenda, documents et contact d’un centre de formation.',
      make: function () {
        return {
          title: 'CRFPE', subtitle: 'Livret d’accueil des stagiaires', lang: 'fr', logo: window.CRFPE_LOGO, theme: theme('instit'),
          pages: [
            P('accueil', 'Accueil', 'building', [
              B('hero', { title: 'Bienvenue au CRFPE', text: 'Tout ce qu’il faut savoir pour bien démarrer votre formation.', image: '' }),
              B('callout', { tone: 'info', title: 'Rentrée', text: 'Accueil des nouveaux stagiaires le **lundi à 9 h**, salle 1, hall d’entrée.\nMerci de vous munir d’une pièce d’identité.' }),
              go('Consulter l’agenda', 'agenda'),
              B('title', { text: 'Les actualités', level: 2 }),
              B('cards', { style: 'liste', items: [
                { title: 'Nouvelle salle informatique', text: 'Douze postes sont disponibles depuis lundi.', tag: 'Locaux', image: '', page: '', url: '' },
                { title: 'Forum des métiers', text: 'Rencontre avec des structures partenaires le mois prochain.', tag: 'Événement', image: '', page: 'agenda', url: '' },
                { title: 'Enquête de satisfaction', text: 'Votre avis sur la formation, en trois minutes.', tag: 'À renseigner', image: '', page: 'contact', url: '' }
              ] })
            ]),
            P('formations', 'Formations', 'graduation-cap', [
              B('text', { text: 'Les parcours proposés par le centre. Ouvrez une carte pour en savoir plus.' }),
              B('cards', { style: 'grille', items: [
                { title: 'Éducateur de jeunes enfants', text: 'Diplôme d’État · trois ans', tag: 'Initiale', image: '', page: '', url: '' },
                { title: 'Auxiliaire de puériculture', text: 'Diplôme d’État · dix mois', tag: 'Initiale', image: '', page: '', url: '' },
                { title: 'Accompagnement des équipes', text: 'Stages courts · sur mesure', tag: 'Continue', image: '', page: '', url: '' },
                { title: 'Remise à niveau numérique', text: 'Modules de quarante heures', tag: 'Continue', image: '', page: '', url: '' }
              ] })
            ]),
            P('agenda', 'Agenda', 'calendar', [
              B('events', { hidePast: true, calendar: true, items: [
                { date: inDays(7), time: '09:00', title: 'Réunion de rentrée', place: 'Salle 1', text: 'Présentation du parcours et remise des livrets.' },
                { date: inDays(21), time: '14:00', title: 'Forum des métiers', place: 'Hall principal', text: '' },
                { date: inDays(45), time: '', title: 'Fermeture du centre (jour férié)', place: '', text: '' }
              ] })
            ]),
            P('ressources', 'Ressources', 'folder', [
              B('title', { text: 'Documents utiles', level: 2 }),
              B('links', { items: [
                { label: 'Règlement intérieur', desc: 'PDF, à lire et à signer', url: 'documents/reglement.pdf', page: '' },
                { label: 'Plateforme de cours', desc: 'Connexion avec vos identifiants', url: 'https://exemple.org', page: '' },
                { label: 'Dossier d’inscription', desc: 'Formulaire de réinscription', url: 'https://exemple.org', page: '' }
              ] }),
              B('title', { text: 'Questions fréquentes', level: 2 }),
              B('faq', { items: [
                { q: 'Que faire en cas d’absence ?', a: 'Prévenez le secrétariat **avant 9 h** par téléphone ou par courriel, puis transmettez votre justificatif sous 48 heures.' },
                { q: 'Où déjeuner sur place ?', a: 'Une salle de pause équipée de micro-ondes est ouverte de 12 h à 13 h 30.\nUn restaurant se trouve à cinq minutes à pied.' },
                { q: 'Comment obtenir une attestation ?', a: 'Elle se demande à l’accueil et est remise sous trois jours ouvrés.' }
              ] })
            ]),
            P('contact', 'Contact', 'phone', [
              B('contact', CONTACT),
              B('map', { where: LILLE, label: 'Plan d’accès' }),
              B('title', { text: 'Votre avis', level: 2 }),
              B('callout', { tone: 'warn', title: 'À compléter', text: 'Ajoutez ici un bloc « Formulaire / contenu intégré » avec l’adresse de votre questionnaire **Tally**, **Microsoft Forms** ou **Google Forms**.' })
            ])
          ]
        };
      }
    },
    {
      key: 'portes-ouvertes', name: 'Portes ouvertes', icon: 'users', team: 'sesame',
      desc: 'Compte à rebours, programme de la journée, stands et plan d’accès.',
      make: function () {
        return {
          title: 'Portes ouvertes', subtitle: 'CRFPE · Lille', lang: 'fr', logo: window.CRFPE_LOGO, theme: theme('sesame'),
          pages: [
            P('bienvenue', 'Bienvenue', 'star', [
              B('hero', { title: 'Journée portes ouvertes', text: 'Samedi, de 9 h à 13 h. Entrée libre.', image: '' }),
              B('countdown', { date: inDays(12), label: 'avant les portes ouvertes' }),
              go('Voir le programme', 'programme'),
              go('Venir au centre', 'acces', 'outline')
            ]),
            P('programme', 'Programme', 'clock', [
              B('events', { hidePast: false, calendar: false, items: [
                { date: inDays(12), time: '09:00', title: 'Accueil et café', place: 'Hall', text: '' },
                { date: inDays(12), time: '10:00', title: 'Visite des salles de formation', place: 'Bâtiment B', text: 'Départ toutes les trente minutes.' },
                { date: inDays(12), time: '11:30', title: 'Réunion d’information', place: 'Amphithéâtre', text: 'Présentation des parcours et des financements.' }
              ] })
            ]),
            P('stands', 'Stands', 'puzzle-piece', [
              B('cards', { style: 'portraits', items: [
                { title: 'Formation initiale', text: 'Salle 12', tag: '', image: '', page: '', url: '' },
                { title: 'Formation continue', text: 'Salle 14', tag: '', image: '', page: '', url: '' },
                { title: 'Accompagnement', text: 'Salle 20', tag: '', image: '', page: '', url: '' },
                { title: 'Orientation', text: 'Hall', tag: '', image: '', page: '', url: '' }
              ] })
            ]),
            P('acces', 'Accès', 'map-marker', [
              B('map', { where: LILLE, label: 'Ouvrir le plan' }),
              B('contact', CONTACT),
              B('callout', { tone: 'ok', title: 'Stationnement', text: 'Un parking gratuit est ouvert derrière le bâtiment A.' })
            ])
          ]
        };
      }
    },
    {
      key: 'parcours', name: 'Jeu de piste', icon: 'flag', team: 'eje',
      desc: 'Pages cachées reliées par des boutons : énigmes, étapes, découverte des locaux.',
      make: function () {
        return {
          title: 'Jeu de piste', subtitle: 'Découvrir le centre en s’amusant', lang: 'fr', logo: window.CRFPE_LOGO, theme: theme('eje'),
          pages: [
            P('depart', 'Départ', 'flag', [
              B('hero', { title: 'À la recherche du trésor', text: 'Trois étapes, trois énigmes.', image: '' }),
              B('text', { text: 'Résolvez chaque énigme pour trouver **le mot de passe** de l’étape suivante, affiché sur place.' }),
              go('Commencer l’étape 1', 'etape-1')
            ]),
            P('etape-1', 'Étape 1', 'puzzle-piece', [
              B('callout', { tone: 'info', title: 'Énigme', text: 'Je sonne mais je ne chante pas. Quand je me tais, le couloir se vide. Qui suis-je ?' }),
              go('J’ai trouvé : étape 2', 'etape-2')
            ], { tab: false }),
            P('etape-2', 'Étape 2', 'puzzle-piece', [
              B('callout', { tone: 'info', title: 'Énigme', text: 'On m’ouvre pour apprendre et on me ferme pour dormir. Je suis plein de mots sans jamais parler.' }),
              go('J’ai trouvé : dernière étape', 'bravo')
            ], { tab: false }),
            P('bravo', 'Bravo', 'trophy', [
              B('callout', { tone: 'ok', title: 'Parcours terminé', text: 'Présentez cet écran à l’accueil pour recevoir votre récompense.' })
            ], { tab: false })
          ]
        };
      }
    },
    {
      key: 'vierge', name: 'Appli vierge', icon: 'file', team: 'instit',
      desc: 'Partir de zéro avec une seule page.',
      make: function () {
        return {
          title: 'Mon appli', subtitle: '', lang: 'fr', logo: window.CRFPE_LOGO, theme: theme('instit'),
          pages: [P('accueil', 'Accueil', 'building', [B('title', { text: 'Bienvenue', level: 2 }), B('text', { text: 'Modifiez ce texte ou ajoutez des blocs avec le bouton « Ajouter un bloc », à gauche.' })])]
        };
      }
    }
  ];
})();
