# Concierge Validation Test — Plan 14 jours

## Décision recherchée

Déterminer si des CGP français utilisent réellement une courte liste de prospects associés à des événements patrimoniaux vérifiables, obtiennent des conversations commerciales et acceptent de payer pour continuer.

Le test ne valide pas un logiciel. Il valide la valeur du résultat livré manuellement.

## Participants et volume

- 3 à 5 CGP actifs en prospection.
- 14 jours calendaires, avec deux livraisons hebdomadaires.
- 5 prospects par CGP et par semaine, soit 10 prospects par CGP.
- Volume total cible : 30 à 50 couples CGP–prospect.
- Un même prospect peut être attribué à plusieurs CGP uniquement si cela est consigné ; privilégier l’exclusivité pendant le test.

## Outils autorisés

- Pappers et sources publiques pour identifier et vérifier les événements.
- Google Sheets à partir de `TRACKING_TEMPLATE.csv`.
- Email pour envoyer les fiches et recueillir les retours.
- Aucun enrichissement payant, automatisation ou LLM nécessaire.

## Préparation — Jours 0 à 2

1. Recruter 3 à 5 CGP et réaliser l’entretien de démarrage.
2. Définir pour chacun : zone géographique, profils exclus, spécialités, ticket minimal et canaux de contact autorisés.
3. Créer un onglet Google Sheets par CGP et protéger les colonnes de calcul.
4. Sélectionner manuellement 5 premiers prospects par CGP.
5. Vérifier chaque événement dans au moins une source primaire ou deux sources concordantes.
6. Remplir une `PROSPECT_CARD_TEMPLATE.md` par prospect.

## Sélection manuelle des prospects

Événements possibles : création de holding, cession ou transmission publiée, changement significatif d’actionnariat, entrée d’un fonds, opération de fusion, croissance financière documentée, distribution publiée, nomination ou départ d’un dirigeant pertinent.

Un prospect est éligible seulement si :

- l’identité de l’entreprise et du dirigeant est non ambiguë ;
- l’événement est daté et sourcé ;
- le lien avec un besoin patrimonial est formulé comme une hypothèse, jamais comme un fait personnel ;
- un angle de contact légitime existe ;
- les informations manquantes et risques de faux positif sont visibles.

Ne jamais conclure qu’une cession, un dividende ou une opération d’entreprise a créé des liquidités personnelles pour le dirigeant sans preuve explicite.

## Semaine 1 — Jours 3 à 7

1. Envoyer 5 fiches par CGP par email ou partager le Google Sheet.
2. Demander au CGP de décider sous 48 heures : contacter ou ne pas contacter.
3. Pour chaque non-contact, rendre `raison_non_contact` obligatoire.
4. Pour chaque contact, saisir canal, date, réponse et rendez-vous.
5. Faire un point de 15 minutes en fin de semaine avec le guide d’entretien.
6. Corriger uniquement la sélection et la présentation ; ne pas changer les métriques.

## Semaine 2 — Jours 8 à 13

1. Sélectionner 5 nouveaux prospects par CGP à partir des critères appris en semaine 1.
2. Envoyer les fiches et suivre les mêmes actions sous 48 heures.
3. Relancer les CGP dont les décisions ou résultats ne sont pas consignés.
4. Ne pas compter une intention de contact comme un contact réel.

## Clôture — Jour 14

1. Verrouiller les données de suivi.
2. Réaliser l’entretien final comportemental.
3. Noter l’utilité de chaque prospect sur 5.
4. Présenter le test de prix sans demander un prix ouvert.
5. Demander une action engageante : précommande, acompte, lettre d’intention ou abonnement pilote.
6. Calculer les métriques globales et par CGP.

## Métriques

| Métrique               | Calcul                                             |
| ---------------------- | -------------------------------------------------- |
| Taux de contact        | prospects réellement contactés / prospects envoyés |
| Taux de réponse        | prospects ayant répondu / prospects contactés      |
| Taux de rendez-vous    | rendez-vous obtenus / prospects contactés          |
| Utilité moyenne        | moyenne de `qualité_perçue_1_à_5`                  |
| Intention de continuer | CGP répondant oui / CGP ayant terminé le test      |
| Engagement financier   | CGP ayant signé ou payé / CGP ayant reçu l’offre   |
| Prix accepté           | montant de l’offre effectivement acceptée          |

Une réponse automatique ne compte pas comme réponse obtenue. Un rendez-vous doit avoir une date convenue. Une volonté de payer verbale ne compte pas comme engagement financier.

## Seuils de décision

Appliquer le verdict global le plus prudent. Un seul très bon CGP ne compense pas une absence de signal chez les autres.

### GO

Tous les critères suivants :

- taux de contact ≥ 60 % ;
- taux de réponse ≥ 20 % ;
- au moins 3 rendez-vous au total et au moins 2 CGP en obtiennent un ;
- utilité moyenne ≥ 4/5 ;
- au moins 60 % souhaitent continuer ;
- au moins 2 engagements financiers, dont un à 99 €/mois ou plus.

### GO sous conditions

Au moins quatre des six critères GO sont atteints, avec obligatoirement :

- taux de contact ≥ 40 % ;
- au moins 1 rendez-vous ;
- utilité moyenne ≥ 3/5 ;
- au moins 1 engagement concret, ou 2 lettres d’intention datées.

Documenter la condition dominante à résoudre : qualité des signaux, ciblage, canal, présentation ou prix.

### NO GO

L’un des cas suivants :

- taux de contact < 40 % ;
- aucun rendez-vous malgré au moins 15 contacts ;
- utilité moyenne < 3/5 ;
- aucun engagement concret après présentation des trois offres ;
- majorité des rejets liée à l’inutilité ou au manque de crédibilité des événements.

## Règles d’intégrité

- Ne modifier aucune donnée historique après clôture d’une semaine.
- Conserver les raisons de non-contact, même défavorables.
- Séparer absence de réponse du prospect et absence d’action du CGP.
- Ne pas présenter le test comme un produit automatisé.
- Ne pas utiliser de données personnelles non nécessaires à l’objectif du test.
