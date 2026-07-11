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
| `MIN_COMMENT_SCORE`           | Non         | `1`                                      |

L’Actor choisi accepte une seule recherche par exécution. InsightRadar effectue donc cinq exécutions séquentielles, conformément aux cinq requêtes du marché.

Pour un premier test maîtrisé :

```dotenv
MAX_RELEVANT_DISCUSSIONS=20
MAX_COMMENTS_PER_DISCUSSION=50
MIN_COMMENT_SCORE=1
```

Le workflow GitHub Actions applique automatiquement ces limites et publie les cinq fichiers JSON comme artefact pendant 7 jours.
