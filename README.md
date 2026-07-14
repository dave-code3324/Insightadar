# InsightRadar

MVP Node.js + TypeScript qui collecte, évalue et enrichit des discussions Reddit pour le marché **Financial Advisors**.

- Recherche : Actor Apify [`red_crawler/reddit-search`](https://apify.com/red_crawler/reddit-search)
- Commentaires : Actor Apify [`crawlerbros/reddit-comment-scraper-pro`](https://apify.com/crawlerbros/reddit-comment-scraper-pro)

## Prérequis

- Node.js 20 ou supérieur
- npm
- un token Apify actif et régénéré

## Installation

```bash
npm install
cp .env.example .env
```

Renseigne ton token uniquement dans `.env` :

```dotenv
APIFY_TOKEN=ton_nouveau_token
```

Le fichier `.env` est ignoré par Git. Le token n’est ni stocké dans le code, ni affiché dans les logs.

## Collecte

```bash
npm run collect
```

Le script lance une exécution Apify pour chacune des cinq requêtes, puis écrit les résultats uniques dans `data/discussions.json`.

Il affiche uniquement des statistiques : résultats bruts, résultats uniques, répartition par requête et par subreddit.

## Scoring de pertinence

```bash
npm run score
```

Le scoring est déterministe et sans LLM. Il valorise les signaux métier, douleurs, outils, workflows et besoins produit. Il pénalise la carrière, le recrutement, les examens, l’investissement personnel, les communautés hors sujet et les contenus promotionnels.

Le seuil de pertinence est fixé à `60/100`. La commande produit :

- `data/discussions-scored.json`
- `data/discussions-relevant.json`
- `data/relevance-report.json`

## Collecte des commentaires

Après le scoring :

```bash
npm run collect:comments
npm run pilot:generate
npm run email:generate
npm run email:send
```

Seules les discussions pertinentes sont envoyées à l’Actor de commentaires. La commande normalise, filtre et déduplique les commentaires dans `data/comments.json`.

## Commandes

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run format:check
npm run collect
npm run score
npm run collect:comments
```

## Configuration

| Variable                      | Obligatoire | Valeur par défaut                        |
| ----------------------------- | ----------- | ---------------------------------------- |
| `APIFY_TOKEN`                 | Oui         | —                                        |
| `APIFY_ACTOR_ID`              | Non         | `red_crawler~reddit-search`              |
| `APIFY_RESULTS_PER_QUERY`     | Non         | `50`                                     |
| `APIFY_COMMENTS_ACTOR_ID`     | Non         | `crawlerbros~reddit-comment-scraper-pro` |
| `MAX_RELEVANT_DISCUSSIONS`    | Non         | `100`                                    |
| `MAX_COMMENTS_PER_DISCUSSION` | Non         | `100`                                    |
| `MIN_COMMENT_SCORE`           | Non         | `-10000`                                 |

L’Actor choisi accepte une seule recherche par exécution. InsightRadar effectue donc cinq exécutions séquentielles, conformément aux cinq requêtes du marché.

Pour un premier test maîtrisé :

```dotenv
MAX_RELEVANT_DISCUSSIONS=20
MAX_COMMENTS_PER_DISCUSSION=50
MIN_COMMENT_SCORE=-10000
```

Le premier test conserve tous les scores de commentaires. `MIN_COMMENT_SCORE` est réservé à une future étape d’analyse et n’est pas appliqué pendant la collecte brute. Seuls les doublons et les contenus vides sont retirés.

Le workflow GitHub Actions applique automatiquement ces limites et publie les cinq fichiers JSON comme artefact pendant 7 jours.

## Lot pilote concierge

Le premier lot manuel se trouve dans `validation/pilot/batch-001/`.

1. Ouvre `prospects-input.csv` dans Excel, Numbers ou Google Sheets.
2. Complète une ligne par prospect réel avec : raison sociale, URL Pappers, dirigeant, type et date de l’événement, autre source publique et notes factuelles.
3. Conserve les en-têtes et le format de date `AAAA-MM-JJ`.
4. Exporte ou enregistre le fichier au format CSV UTF-8 au même emplacement.
5. Lance :

```bash
npm run pilot:generate
```

La commande refuse les lignes incomplètes ou les URLs non valides et régénère :

- `prospect-cards.md` ;
- `outreach-messages.md` ;
- `batch-summary.md` ;
- `tracking.csv`.

Le fichier réel contient 15 emplacements vides, répartis par groupes de cinq entre `CGP-1`, `CGP-2` et `CGP-3`. Remplace ces libellés dans le tracking avant l’envoi. Les données fictives utilisées par les tests restent exclusivement dans le code de test et ne sont jamais écrites dans le lot réel.

## E-mails du pilote

Génère un digest professionnel distinct pour chaque groupe de cinq prospects :

```bash
npm run email:generate
```

Les versions HTML et texte sont écrites dans `validation/pilot/batch-001/emails/`. Cette commande n’envoie rien.

Pour automatiser l’envoi, configure les variables `SMTP_*`, `EMAIL_FROM` et `CGP_RECIPIENTS_JSON` dans `.env`. Avec Gmail, `SMTP_PASSWORD` doit être un mot de passe d’application dédié, jamais le mot de passe du compte.

Vérifie d’abord la configuration en simulation :

```bash
npm run email:send
```

Puis autorise explicitement l’envoi réel :

```bash
npm run email:send -- --confirm
```

La commande régénère les fichiers depuis `prospects-input.csv`, envoie un digest par CGP et ne journalise ni mot de passe ni adresse de destinataire. Vérifie manuellement les sources et remplace les libellés `CGP-1` à `CGP-3` avant le premier envoi réel.
