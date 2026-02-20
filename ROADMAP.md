# OctoBoost — Roadmap

SaaS de publication automatique d'articles SEO pour promouvoir des produits SaaS sur des blogs et plateformes communautaires.

---

## ✅ Fait

### Infrastructure & Auth
- [x] Next.js 15 (App Router) + React 19 + TypeScript
- [x] Tailwind CSS v4 + typography
- [x] Supabase : auth (email/password), PostgreSQL, RLS
- [x] Middleware de protection des routes dashboard
- [x] Variables d'environnement (.env.local, .env.example)

### Landing & Onboarding
- [x] Landing page avec input URL + CTA login
- [x] Login / Signup via Supabase Auth

### Dashboard & Navigation
- [x] Navigation project-centric
- [x] Sidebar global : Dashboard, Settings
- [x] Sidebar projet : Overview, Research, Articles, Publish, Analytics
- [x] URLs en slug (`/dashboard/projects/niches-hunter/articles`) au lieu d'UUID
- [x] Breadcrumbs dans la top bar
- [x] Dashboard global avec stats et liste projets
- [x] Page Overview projet (stats, pipeline, quick actions, recent articles/publications)
- [x] Page Research (fusion Analyze + Keywords avec tabs)
- [x] Page Publish (fusion Site Connection + Channels + Schedule avec tabs)

### Publication sur le site client (Custom API)
- [x] Lib `custom-api.ts` : testConnection, publishToSite, generateSecret
- [x] Snippets auto-generés (Next.js, Express) pour l'endpoint du client
- [x] API `/api/site-connection` : CRUD + test connection + regenerate secret
- [x] API `/api/publish/site` : publication de l'article maître sur le site du client
- [x] UI "My Site" dans la page Publish : setup, test, secret management
- [x] Migration DB : `site_connection` jsonb sur projects, `canonical_url` sur articles
- [x] Pipeline status dans Overview (site connected, analysis, keywords, articles, channels, published)

### Moteur SEO
- [x] Crawl de site (cheerio) : title, meta, structured text
- [x] Analyse LLM (GPT-4o) : 50–80 seed keywords, 15–25 article ideas, 5–10 competitors
- [x] DataForSEO : volumes, CPC, competition, suggestions
- [x] Classification des keywords (GPT-4o-mini) : intent, relevance, category
- [x] Competitor spy : crawl des concurrents + inférence de keywords
- [x] SERP difficulty : score de compétition organique
- [x] Clustering des keywords (GPT-4o) : topic clusters → articles à écrire
- [x] Opportunity score avec volume, competition, CPC, SERP
- [x] Persistance : projects, analyses, keywords, competitors, keyword_clusters

### Articles
- [x] Génération d'articles maîtres (Claude Sonnet 4.6)
- [x] 2 étapes : outline structuré → article complet (~2000 mots)
- [x] Product context dynamique (name, url, summary, targetAudience)
- [x] Table `articles` avec RLS
- [x] API : generate, list, get, update, delete
- [x] Page Articles : listes séparées « Generated » / « To Generate »
- [x] Preview article avec typography propre (prose)
- [x] Copy Markdown

### Channels
- [x] Table `channels` (project_id, platform_type, name, config, constraints) avec RLS
- [x] API CRUD : /api/channels (GET list, POST), /api/channels/[id] (GET, PATCH, DELETE)
- [x] Page Channels : ajout/suppression de plateformes (Medium, Dev.to, Reddit, LinkedIn, Hashnode, WordPress)
- [x] Icônes et couleurs par plateforme

### Adaptation des articles par plateforme (sous-articles)
- [x] Table `article_variants` (article_id, channel_id, title, content, format, word_count, status…) avec RLS
- [x] Contrainte unique article × channel
- [x] Engine d'adaptation (Claude Sonnet 4.6) : ton, longueur, format selon la plateforme
- [x] Specs par plateforme : Medium, Dev.to, Reddit, LinkedIn, Hashnode, WordPress
- [x] API : /api/articles/variants (list), /api/articles/variants/generate, /api/articles/variants/[id] (GET, PATCH, DELETE)
- [x] UI : sélection des channels depuis le preview article → génération des variantes
- [x] Preview de chaque variante avec badge plateforme
- [x] Suppression de variantes

### Schéma DB
- [x] projects (id, user_id, name, slug, url)
- [x] analyses (project_id, product_summary, target_audience, content_angles…)
- [x] keywords (analysis_id, keyword, volumes, competition, serp_difficulty, category, source)
- [x] keyword_clusters (analysis_id, topic, article_title, pillar_keyword, supporting_keywords…)
- [x] competitors (analysis_id, name, url, reason)
- [x] articles (cluster_id, project_id, title, content, outline, word_count, meta_description…)
- [x] channels (project_id, platform_type, name, config, constraints)
- [x] article_variants (article_id, channel_id, title, content, format, word_count, status, published_url…)

### Autres
- [x] COST.md : suivi des coûts (DataForSEO, GPT, Anthropic)

---

## 🚧 À faire

### Connecteurs site client (priorité haute)
- [ ] Connecteur WordPress self-hosted (REST API + Application Passwords)
- [ ] Connecteur GitHub-based (push .md/.mdx via GitHub API pour blogs statiques)
- [ ] Connecteur Webflow CMS API
- [ ] Bouton "Publish to my site" dans la preview article

### Syndication propre (priorité haute)
- [ ] canonical_url systématique sur toutes les variantes (pointe vers le site client)
- [ ] Logique de syndication par plateforme (résumé+lien vs full+canonical)

### Schedule automation (priorité moyenne)
- [ ] Cron ou Vercel Scheduled Functions pour auto-publish
- [ ] Répartition dans le temps (éviter le burst)

### Enrichissement des articles (priorité basse)
- [ ] Extraction des outils du site à l'analyse (`keyTools`)
- [ ] Injection des outils dans le product context pour les articles
- [ ] Maillage interne automatique (internal links)
- [ ] Schema JSON-LD (SEO technique)

### Analytics (priorité basse)
- [ ] Page Analytics : métriques réelles
- [ ] Tracking des articles publiés (clicks, impressions)
- [ ] (Optionnel) Intégration Google Search Console

### Nettoyage (priorité basse)
- [ ] Supprimer les anciennes pages standalone (analyze, keywords, channels, schedule)
- [ ] Unifier les redirections des anciennes URLs

---

## Ordre suggéré

1. ~~**Channels** — config des plateformes~~ ✅
2. ~~**Adaptation** — variantes par plateforme à partir de l'article maître~~ ✅
3. ~~**Custom API connector** — publication sur le site client~~ ✅
4. ~~**Refonte navigation** — Overview, Research, Articles, Publish, Analytics~~ ✅
5. **WordPress connector** — plus gros marché
6. **Syndication propre** — canonical URLs systématiques
7. **Schedule automation** — cron jobs
8. **Analytics** — métriques

---

*Dernière mise à jour : février 2026*
