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
- [x] Sidebar global : Dashboard, Schedule, Settings
- [x] Sidebar projet (visible quand projet sélectionné) : Analyze, Keywords, Articles, Channels, Analytics
- [x] URLs en slug (`/dashboard/projects/niches-hunter/articles`) au lieu d'UUID
- [x] Breadcrumbs dans la top bar

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

### Publication (priorité haute)
- [ ] Connexion aux API : Medium, Dev.to
- [ ] Publication manuelle (copy/paste) pour plateformes sans API
- [ ] Statut : draft → ready → scheduled → published
- [ ] Stockage de l'URL publiée et de la date
- [ ] Stockage des credentials / API keys par channel (chiffré ou env)

### Schedule (priorité moyenne)
- [ ] Calendrier de publication
- [ ] Planification des variantes
- [ ] Répartition dans le temps (éviter le burst)
- [ ] Cron ou Vercel Scheduled Functions pour l'exécution

### Enrichissement des articles (priorité basse)
- [ ] Extraction des outils du site à l'analyse (`keyTools`)
- [ ] Injection des outils dans le product context pour les articles
- [ ] Champ `key_tools` dans analyses ou projects

### Analytics (priorité basse)
- [ ] Page Analytics : placeholder → métriques
- [ ] Tracking des articles publiés
- [ ] (Optionnel) Intégration Google Search Console

### Settings (priorité basse)
- [ ] Page Settings : profil, préférences
- [ ] Gestion des API keys (DataForSEO, Anthropic) si multi-tenant

---

## Ordre suggéré

1. ~~**Channels** — config des plateformes~~ ✅
2. ~~**Adaptation** — variantes par plateforme à partir de l'article maître~~ ✅
3. **Publication** — au moins Medium / Dev.to en automatique
4. **Schedule** — planification
5. **Enrichissement** — keyTools dans les articles
6. **Analytics** — métriques

---

*Dernière mise à jour : février 2026*
