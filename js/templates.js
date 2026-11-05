/* Modèles d'applis proposés au démarrage. Tous les contenus sont FICTIFS. */
(function () {
  function id() { return Math.random().toString(36).slice(2, 8); }
  function B(type, props) { return Object.assign({ id: id(), type: type }, props); }
  function P(slug, title, icon, blocks, extra) { return Object.assign({ id: slug, title: title, icon: icon, tab: true, showTitle: true, blocks: blocks }, extra || {}); }

  function in30(days) {
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  window.MONAPP_TEMPLATES = [
    {
      key: 'centre',
      name: 'Centre de formation',
      icon: '🎓',
      desc: 'Livret d’accueil : actualités, formations, agenda, documents, contact.',
      make: function () {
        return {
          title: 'Centre de formation Horizon', subtitle: 'Livret d’accueil des stagiaires', lang: 'fr',
          theme: { preset: 'ocean', primary: '#2563eb', accent: '#f59e0b', dark: false, radius: 'doux', font: 'moderne' },
          pages: [
            P('accueil', 'Accueil', '🏠', [
              B('hero', { title: 'Bienvenue au centre Horizon', text: 'Tout ce qu’il faut savoir pour bien démarrer votre formation.' }),
              B('callout', { tone: 'info', title: 'Rentrée', text: 'Accueil des nouveaux stagiaires le **lundi à 9 h**, salle 1 (hall d’entrée).\nApportez une pièce d’identité.' }),
              B('button', { label: 'Voir mon planning', kind: 'page', page: 'agenda', url: '', mail: '', tel: '', style: 'solid', width: 'full' }),
              B('title', { text: 'Les actualités', level: 2 }),
              B('cards', { style: 'liste', items: [
                { title: 'Nouvelle salle informatique', text: 'Douze postes neufs sont disponibles depuis lundi.', tag: 'Locaux', image: '', page: '', url: '' },
                { title: 'Forum des métiers', text: 'Rencontrez des entreprises partenaires le mois prochain.', tag: 'Événement', image: '', page: 'agenda', url: '' },
                { title: 'Enquête de satisfaction', text: 'Donnez votre avis en 3 minutes sur votre formation.', tag: 'À faire', image: '', page: 'contact', url: '' }
              ] })
            ]),
            P('formations', 'Formations', '📚', [
              B('text', { text: 'Retrouvez ici nos parcours. Cliquez sur une carte pour en savoir plus.' }),
              B('cards', { style: 'grille', items: [
                { title: 'Secrétariat assistanat', text: 'Titre professionnel · 8 mois', tag: 'Certifiant', image: '', page: '', url: '' },
                { title: 'Aide à domicile', text: 'Titre professionnel · 7 mois', tag: 'Certifiant', image: '', page: '', url: '' },
                { title: 'Remise à niveau numérique', text: 'Modules courts · 40 h', tag: 'Court', image: '', page: '', url: '' },
                { title: 'Français langue étrangère', text: 'Cours collectifs · niveaux A1 à B1', tag: 'Langues', image: '', page: '', url: '' }
              ] })
            ]),
            P('agenda', 'Agenda', '📅', [
              B('events', { hidePast: true, calendar: true, items: [
                { date: in30(7), time: '09:00', title: 'Réunion de rentrée', place: 'Salle 1', text: 'Présentation du parcours et remise des livrets.' },
                { date: in30(21), time: '14:00', title: 'Forum des métiers', place: 'Hall principal', text: '' },
                { date: in30(45), time: '', title: 'Fermeture du centre (jour férié)', place: '', text: '' }
              ] })
            ]),
            P('ressources', 'Ressources', '🗂️', [
              B('title', { text: 'Documents utiles', level: 2 }),
              B('links', { items: [
                { label: 'Règlement intérieur', desc: 'PDF · à lire et signer', url: 'documents/reglement.pdf', page: '' },
                { label: 'Plateforme de cours', desc: 'Connectez-vous avec vos identifiants', url: 'https://exemple.org', page: '' },
                { label: 'Dossier d’inscription', desc: 'Formulaire de réinscription', url: 'https://exemple.org', page: '' }
              ] }),
              B('title', { text: 'Questions fréquentes', level: 2 }),
              B('faq', { items: [
                { q: 'Que faire en cas d’absence ?', a: 'Prévenez le secrétariat **avant 9 h** par téléphone ou par mail, puis envoyez votre justificatif sous 48 h.' },
                { q: 'Où déjeuner sur place ?', a: 'Une salle de pause avec micro-ondes est ouverte de 12 h à 13 h 30.\nLe restaurant d’entreprise est à 5 minutes à pied.' },
                { q: 'Comment obtenir mon attestation ?', a: 'Demandez-la à l’accueil, elle est remise sous 3 jours ouvrés.' }
              ] })
            ]),
            P('contact', 'Contact', '📞', [
              B('contact', { org: 'Centre de formation Horizon', address: '12 rue des Écoles\n75000 Exempleville', phone: '01 23 45 67 89', email: 'contact@exemple.org', hours: 'Du lundi au vendredi\n8 h 30 – 17 h 30', website: 'https://exemple.org' }),
              B('map', { where: '48.8584, 2.2945', label: 'Plan d’accès' }),
              B('title', { text: 'Votre avis nous intéresse', level: 2 }),
              B('embed', { url: '', mode: 'inline', label: 'Répondre au questionnaire', title: 'Questionnaire de satisfaction', height: 700 }),
              B('callout', { tone: 'warn', title: 'À remplacer', text: 'Dans le bloc ci-dessus, collez l’adresse de votre formulaire **Tally**, **Microsoft Forms** ou **Google Forms**.' })
            ])
          ]
        };
      }
    },
    {
      key: 'portes-ouvertes',
      name: 'Portes ouvertes',
      icon: '🚪',
      desc: 'Programme de la journée, stands, plan d’accès et compte à rebours.',
      make: function () {
        return {
          title: 'Portes ouvertes', subtitle: 'Centre de formation Horizon', lang: 'fr',
          theme: { preset: 'sun', primary: '#ea580c', accent: '#0ea5e9', dark: false, radius: 'rond', font: 'arrondi' },
          pages: [
            P('bienvenue', 'Bienvenue', '👋', [
              B('hero', { title: 'Venez nous rencontrer\u00a0!', text: 'Samedi, de 9 h à 13 h · entrée libre' }),
              B('countdown', { date: in30(12), label: 'avant les portes ouvertes' }),
              B('button', { label: 'Voir le programme', kind: 'page', page: 'programme', url: '', mail: '', tel: '', style: 'solid', width: 'full' }),
              B('button', { label: 'Comment venir ?', kind: 'page', page: 'acces', url: '', mail: '', tel: '', style: 'outline', width: 'full' })
            ]),
            P('programme', 'Programme', '🗓️', [
              B('events', { hidePast: false, calendar: false, items: [
                { date: in30(12), time: '09:00', title: 'Accueil et café', place: 'Hall', text: '' },
                { date: in30(12), time: '10:00', title: 'Visite des ateliers', place: 'Bâtiment B', text: 'Départ toutes les 30 minutes.' },
                { date: in30(12), time: '11:30', title: 'Réunion d’information', place: 'Amphithéâtre', text: 'Présentation des parcours et financements.' }
              ] })
            ]),
            P('stands', 'Stands', '🧩', [
              B('cards', { style: 'portraits', items: [
                { title: 'Secrétariat', text: 'Salle 12', tag: '', image: '', page: '', url: '' },
                { title: 'Numérique', text: 'Salle 14', tag: '', image: '', page: '', url: '' },
                { title: 'Santé social', text: 'Salle 20', tag: '', image: '', page: '', url: '' },
                { title: 'Orientation', text: 'Hall', tag: '', image: '', page: '', url: '' }
              ] })
            ]),
            P('acces', 'Accès', '📍', [
              B('map', { where: '48.8584, 2.2945', label: 'Ouvrir le plan' }),
              B('contact', { org: 'Centre de formation Horizon', address: '12 rue des Écoles\n75000 Exempleville', phone: '01 23 45 67 89', email: 'contact@exemple.org', hours: '', website: '' }),
              B('callout', { tone: 'ok', title: 'Parking', text: 'Un parking gratuit est ouvert derrière le bâtiment A.' })
            ])
          ]
        };
      }
    },
    {
      key: 'parcours',
      name: 'Parcours / jeu de piste',
      icon: '🧭',
      desc: 'Pages cachées reliées par des boutons : énigmes, étapes, découverte des locaux.',
      make: function () {
        return {
          title: 'Jeu de piste', subtitle: 'Découvrez le centre en vous amusant', lang: 'fr',
          theme: { preset: 'forest', primary: '#15803d', accent: '#f97316', dark: false, radius: 'doux', font: 'arrondi' },
          pages: [
            P('depart', 'Départ', '🏁', [
              B('hero', { title: 'À la recherche du trésor', text: 'Trois étapes, trois énigmes. Prêt·e ?' }),
              B('text', { text: 'Résolvez chaque énigme pour trouver **le mot de passe** de l’étape suivante, affiché sur place.' }),
              B('button', { label: 'Commencer l’étape 1', kind: 'page', page: 'etape-1', url: '', mail: '', tel: '', style: 'solid', width: 'full' })
            ]),
            P('etape-1', 'Étape 1', '1️⃣', [
              B('callout', { tone: 'info', title: 'Énigme', text: 'Je sonne mais je ne chante pas. Quand je me tais, le couloir se vide. Qui suis-je ?' }),
              B('button', { label: 'J’ai trouvé : étape 2', kind: 'page', page: 'etape-2', url: '', mail: '', tel: '', style: 'solid', width: 'full' })
            ], { tab: false }),
            P('etape-2', 'Étape 2', '2️⃣', [
              B('callout', { tone: 'info', title: 'Énigme', text: 'On m’ouvre pour apprendre, on me ferme pour dormir. Je suis plein de mots sans jamais parler.' }),
              B('button', { label: 'J’ai trouvé : étape 3', kind: 'page', page: 'bravo', url: '', mail: '', tel: '', style: 'solid', width: 'full' })
            ], { tab: false }),
            P('bravo', 'Bravo !', '🏆', [
              B('callout', { tone: 'ok', title: 'Bravo !', text: 'Vous avez terminé le parcours. Présentez cet écran à l’accueil.' })
            ], { tab: false })
          ]
        };
      }
    },
    {
      key: 'vierge',
      name: 'Appli vierge',
      icon: '✨',
      desc: 'Partir de zéro avec une seule page.',
      make: function () {
        return {
          title: 'Mon appli', subtitle: '', lang: 'fr',
          theme: { preset: 'ocean', primary: '#2563eb', accent: '#f59e0b', dark: false, radius: 'doux', font: 'moderne' },
          pages: [P('accueil', 'Accueil', '🏠', [B('title', { text: 'Bienvenue', level: 2 }), B('text', { text: 'Modifiez ce texte ou ajoutez des blocs depuis la colonne centrale.' })])]
        };
      }
    }
  ];
})();
