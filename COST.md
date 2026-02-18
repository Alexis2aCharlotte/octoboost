# OctoBoost — Coûts par batch d'analyse

Coûts mesurés pour un batch typique (~115 keywords).

| Service | Coût / batch | Notes |
|---------|--------------|-------|
| **DataForSEO** | 0,20 € | Volumes, CPC, suggestions, SERP difficulty |
| **GPT-4o (keywords)** | 0,02 € | LLM analysis, classification, clustering |
| **Total analyse** | **~0,22 €** | Par site/projet analysé |

---

## Détail par phase

| Phase | Service | Rôle |
|-------|---------|------|
| Crawl | Cheerio (local) | Gratuit |
| LLM seed analysis | GPT-4o | 50-80 keywords + 15-25 article ideas |
| Keyword volumes | DataForSEO | Google Ads search volume, CPC, competition |
| Keyword expansion | DataForSEO | Suggestions à partir des seeds |
| Classification | GPT-4o-mini | Intent, relevance, category |
| Competitor spy | GPT-4o + crawl | Keywords des concurrents |
| SERP difficulty | DataForSEO | Organic competition score |
| Clustering | GPT-4o | Topic clusters → articles to write |

---

## Génération d'articles

| Service | Coût | Notes |
|---------|------|-------|
| **Article maître** (Claude Sonnet 4.6) | **$0.13** | ~3595 mots, outline + article complet |
| **Variante Reddit** (Claude Sonnet 4.6) | **$0.04** | ~650 mots, adaptation ton conversationnel |

### Coût total par article publié

| Scénario | Coût |
|----------|------|
| Article maître seul | **$0.13** |
| Article + 1 variante Reddit | **$0.17** |
| Article + 3 variantes (Reddit, Medium, Dev.to) | **~$0.25** |
| Article + 6 variantes (toutes plateformes) | **~$0.37** |

---

*Dernière mise à jour : février 2026*
