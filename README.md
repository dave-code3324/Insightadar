# InsightRadar

MVP Node.js + TypeScript qui collecte, normalise et déduplique des discussions Reddit pour le marché **Financial Advisors**. La collecte passe par l’Actor Apify [`red_crawler/reddit-search`](https://apify.com/red_crawler/reddit-search).

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

## Commandes

```bash
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run collect
```

## Configuration

| Variable                  | Obligatoire | Valeur par défaut           |
| ------------------------- | ----------- | --------------------------- |
| `APIFY_TOKEN`             | Oui         | —                           |
| `APIFY_ACTOR_ID`          | Non         | `red_crawler~reddit-search` |
| `APIFY_RESULTS_PER_QUERY` | Non         | `50`                        |

L’Actor choisi accepte une seule recherche par exécution. InsightRadar effectue donc cinq exécutions séquentielles, conformément aux cinq requêtes du marché.
