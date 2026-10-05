# À confirmer avec la Célia

- Adresse exacte (bannière : « Rua do Sobral 21A ?, Vale de Figueira, 2000-??? Santarém » — illisible) ; le site n'affiche que « Vale de Figueira, Santarém ».
- Le numéro 913 815 229 est-il bien sur WhatsApp ? (bouton WhatsApp)
- Livraison possible ? (le site dit « Entrega a combinar »)
- Textes des spécialités et de « A Célia » = propositions (ex. batizados, comunhões, casamentos ; folhados).
- Nom : le site écrit « Delícias » avec accent (Facebook : « Delicias »).
- Avis cité : Carlos M. (Facebook, 2019). Seuls les avis visibles sans connexion ont été repris.
- Domaine : `site` dans astro.config.mjs.
- Photos : 9 photos publiques de la page Facebook ; en ajouter d'autres dans src/assets/photos.

## Page Criações (/criacoes)

- 132 photos reprises des albums Facebook publics (« Bolos meninas », « Bolos menino », « Bolachas e cupcakes », « batizados », photos de profil) + les photos de l'accueil. Liste, catégories et titres : `src/data/creations.ts`.
- Titres rédigés à partir des photos, sans les prénoms des enfants : à relire avec la Célia.
- Photos écartées : thèmes adultes osés, images trop petites, doublons, gâteau avec la photo d'une personne.
- Ajout (5 octobre) : 93 créations récentes des albums « Photos » et « Téléchargements mobiles » (≈ 110 premières photos), dont le gâteau Stitch, et la catégorie « Sobremesas e tradicionais » avec les cardápios de Natal et de Páscoa. Le reste de « Téléchargements mobiles » (≈ 130 photos plus anciennes) n'a pas été parcouru.
- Titres des doces tradicionais à vérifier en priorité (azevias, coscorões, rosas fritas, sonhos, broas… reconnus sur photo).
- Demander à la Célia si elle est d'accord pour montrer ces anciennes créations (et si les parents des enfants nommés sur les gâteaux n'y voient pas d'inconvénient).

## Formulaire de contact (#contacto, en bas de chaque page)

- Envoi par e-mail via Resend, comme Renov MC (route `src/pages/api/contacto.ts`, hébergement Vercel).
- **À fournir :** l'adresse e-mail de la Célia (destinataire), puis créer un compte Resend et renseigner `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO` (voir `.env.example`), en local dans `.env` et dans Vercel.
- Sans nom de domaine vérifié, Resend n'envoie qu'à l'adresse du compte : créer le compte Resend avec l'adresse de la Célia.
- Tant que la clé n'est pas renseignée : en développement, le formulaire affiche le remerciement avec la mention « versão de demonstração » ; en ligne, il invite à appeler ou à écrire par WhatsApp.
