# À confirmer avec la Célia

- Adresse exacte (bannière : « Rua do Sobral 21A ?, Vale de Figueira, 2000-??? Santarém » — illisible) ; le site n'affiche que « Vale de Figueira, Santarém ».
- Le numéro 913 815 229 est-il bien sur WhatsApp ? (bouton WhatsApp)
- Livraison possible ? (le site dit « Entrega a combinar »)
- Textes des spécialités et de « A Célia » = propositions (ex. batizados, comunhões, casamentos ; folhados).
- Nom : le site écrit « Delícias » avec accent (Facebook : « Delicias »).
- Avis cité : Carlos M. (Facebook, 2019). Seuls les avis visibles sans connexion ont été repris.
- Domaine : https://asdelicias-dacelia.com (`site` dans astro.config.mjs) ; l'ancien asdeliciasdacelia.jstrunz.me peut rediriger vers lui.
- Photos : 9 photos publiques de la page Facebook ; en ajouter d'autres dans src/assets/photos.

## Informação legal (/informacao-legal)

- **À fournir :** NIF, statut (ENI ou société) et nom légal. Adresse : Rua do Sobral 21A, 2000-740 Vale de Figueira. E-mail public : contacto@asdelicias-dacelia.com (Cloudflare Email Routing, renvoie vers asdelicias.dacelia@gmail.com, qui est aussi le destinataire du formulaire, `EMAIL_TO`). Les champs « A COMPLETAR » sont dans `src/data/legal.json`, modifiables dans Pages CMS (« Informação legal »).
- Confirmer l'organisme de médiation (CNIACC par défaut pour le district de Santarém) et la durée de conservation des demandes (12 mois).
- Livro de Reclamações : lien texte dans le pied de page (choix délibéré, le logo officiel blanc ne va pas avec le site).

## Page Criações (/criacoes)

- 132 photos reprises des albums Facebook publics (« Bolos meninas », « Bolos menino », « Bolachas e cupcakes », « batizados », photos de profil) + les photos de l'accueil. Liste, catégories et titres : `src/data/creations.ts`.
- Titres rédigés à partir des photos, sans les prénoms des enfants : à relire avec la Célia.
- Photos écartées : thèmes adultes osés, images trop petites, doublons, gâteau avec la photo d'une personne.
- Ajout (5 octobre) : 93 créations récentes des albums « Photos » et « Téléchargements mobiles » (≈ 110 premières photos), dont le gâteau Stitch, et la catégorie « Sobremesas e tradicionais » avec les cardápios de Natal et de Páscoa. Le reste de « Téléchargements mobiles » (≈ 130 photos plus anciennes) n'a pas été parcouru.
- Titres des doces tradicionais à vérifier en priorité (azevias, coscorões, rosas fritas, sonhos, broas… reconnus sur photo).
- Demander à la Célia si elle est d'accord pour montrer ces anciennes créations (et si les parents des enfants nommés sur les gâteaux n'y voient pas d'inconvénient).

## Formulaire de contact (#contacto, en bas de chaque page)

- Envoi par e-mail via Cloudflare Email Service (route `src/pages/api/contact.ts`, hébergement Vercel).
- Envoi par Cloudflare Email Service (API REST). Variables `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `EMAIL_FROM`, `EMAIL_TO` (voir `.env.example`), en local dans `.env` et dans Vercel.
- `EMAIL_TO` (asdelicias.dacelia@gmail.com) doit rester une adresse de destination vérifiée dans Email Routing : l'envoi est alors gratuit. Envoyer à d'autres adresses demanderait l'offre Workers Paid.
- Le domaine doit être déclaré dans Email Sending (Compute → Email Service → Email Sending → Onboard Domain) pour que `EMAIL_FROM` soit accepté.
- Tant que la clé n'est pas renseignée : en développement, le formulaire affiche le remerciement avec la mention « versão de demonstração » ; en ligne, il invite à appeler ou à écrire par WhatsApp.

## Preçário (/precario) et Instagram

- Prix recopiés des 4 PDF du Linktree (linktr.ee/Asdeliciasdacelia) : `src/data/pricing.json`. À mettre à jour à chaque nouveau preçário.
- Corrigé « Albarroba » en « Alfarroba » (faute probable du PDF) : à confirmer.
- Salgados : prix lus comme « par dúzia, petit / normal » : à confirmer.
- Le preçário de Natal 2026 est annoncé « brevemente » : l'ajouter quand il sort.
- Instagram : https://www.instagram.com/_as_delicias_da_celia_/ (menu mobile, bloc contact, pied de page).
