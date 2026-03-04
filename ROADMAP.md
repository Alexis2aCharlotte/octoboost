# OctoBoost — Roadmap

Automated SEO article publishing SaaS for promoting SaaS products on blogs and community platforms.

---

## Done

### Infrastructure & Auth
- [x] Next.js 16 (App Router) + React 19 + TypeScript
- [x] Tailwind CSS v4 + typography
- [x] Supabase: auth (email/password), PostgreSQL, RLS
- [x] Middleware route protection for dashboard
- [x] Environment variables (.env.local, .env.example)
- [x] Vercel deployment (fix Turbopack root, TypeScript errors, Suspense boundary)
- [x] Vercel Analytics integration

### Landing & Onboarding
- [x] Landing page with CTA "Get Started" (hidden URL input for public)
- [x] Login / Signup via Supabase Auth

### Design & UI
- [x] Full design overhaul — blink.new / pro SaaS style
- [x] Inter + JetBrains Mono fonts (replaced Geist)
- [x] Ocean navy blue palette (bg `#080c18`, cards `#0d1225`, accent `#3b82f6`) → updated to neon blue (`#030712`, `#0077FF`)
- [x] CSS grid background with radial halo
- [x] Ocean gradient on landing page
- [x] Clean sidebar with subtle hovers (bg `#0a0f1e`)
- [x] Compact topbar with breadcrumbs
- [x] Opaque cards (no transparency through grid)
- [x] Larger fonts (inspired by Niches Hunter): h1 text-8xl, h2 text-5xl, font-bold, tracking-tighter
- [x] Neon glow effects: gradient-text with text-shadow, CTA buttons with multi-layer box-shadow
- [x] Blue-tinted grid background + ambient radial gradients
- [x] Glow cards with stronger hover effects (border glow, translateY, multi-layer shadows)
- [x] Pipeline progress as accordion (compact when all done)
- [x] All UI text in English (no French)

### Dashboard & Navigation
- [x] Project-centric navigation
- [x] Global sidebar: Dashboard, Settings
- [x] Project sidebar: Overview, Research, Articles, Publish, Analytics
- [x] Slug-based URLs (`/dashboard/projects/niches-hunter/articles`) instead of UUIDs
- [x] Breadcrumbs in top bar
- [x] Overview page with pipeline, stats, quick actions, recent articles/publications

### Page Research (ex-Analyze)
- [x] Project hub with site summary, last analysis date, Re-analyze button
- [x] Quick actions (Keywords, Articles, Channels) grid
- [x] Visual onboarding when no analysis (3 steps: Crawl → AI → Keywords)
- [x] Results view: stats, tabs keywords/competitors/ideas
- [x] Tooltip explanations on hover for all badges (category, intent, source, opportunity, SERP, competition)
- [x] Monthly re-analysis limit (max 1 re-analyze per month) with confirmation modal
- [x] "Monthly Searches" stat box (total volume across keywords)

### SEO Engine
- [x] Site crawl (cheerio): title, meta, structured text
- [x] LLM analysis (GPT-4o): 50–80 seed keywords, 15–25 article ideas, 5–10 competitors
- [x] DataForSEO: volumes, CPC, competition, suggestions
- [x] Keyword classification (GPT-4o-mini): intent, relevance, category
- [x] Competitor spy: crawl competitors + keyword inference
- [x] SERP difficulty: organic competition score
- [x] Keyword clustering (GPT-4o): topic clusters → articles to write
- [x] Opportunity score with volume, competition, CPC, SERP
- [x] Persistence: projects, analyses, keywords, competitors, keyword_clusters

### Articles
- [x] Master article generation (Claude Sonnet 4.6)
- [x] 2-step process: structured outline → full article (target 2000–2500 words)
- [x] Em dash ban in generation
- [x] Dynamic product context (name, url, summary, targetAudience)
- [x] Internal links: site page injection in prompt for internal linking
- [x] `articles` table with RLS
- [x] API: generate, list, get, update, delete
- [x] Articles page: separate "Generated" / "To Generate" lists
- [x] Article preview with clean typography (prose)
- [x] Copy Markdown
- [x] In-place article editing (title + content) with save to Supabase
- [x] "Published on your website" badge for published articles
- [x] Publish / Schedule buttons for website publishing

### Channels & Adaptation
- [x] `channels` table with RLS, CRUD API
- [x] 11 platforms: Dev.to, Hashnode, Medium, Reddit, WordPress, Telegraph, Blogger, Indie Hackers, Hacker News, Quora, Substack
- [x] Icons and colors per platform
- [x] `article_variants` table with RLS, unique constraint article × channel
- [x] Adaptation engine (Claude Sonnet 4.6): tone, length, format per platform
- [x] Per-platform specs/prompts with detailed guidelines
- [x] UI: channel selection from article preview → variant generation
- [x] Variant preview with platform badge
- [x] Separate Auto-publish vs Copy/Paste sections

### Publication
- [x] API `/api/publish`: Dev.to, Hashnode, Telegraph, Blogger
- [x] Extracted publish logic into reusable `publisher.ts`
- [x] OAuth Reddit complete + `submitRedditPost` ready in `reddit.ts`
- [x] OAuth Blogger + API publication
- [x] WordPress self-hosted connector (REST API + Application Passwords + tag resolution)
- [x] canonical_url on articles (used for Dev.to, Hashnode)
- [x] Publish dialog: "Publish Now" / "Keep Scheduled" / "Reschedule" with date picker
- [x] Variant publish buttons wired with PublishDialog
- [x] "Publish All" button for bulk variant publishing
- [x] Real-time slot validation (max 2/day, 2 blog articles/week, 1/platform/day)

### Site Connection
- [x] API key per project (auto-generated, regeneratable)
- [x] Public API `/api/public/articles` and `/api/public/articles/[slug]`
- [x] Auto-generated integration snippets (lib + usage)
- [x] "My Site" UI in Publish: connection status, API key, accordion for details
- [x] GitHub connector: OAuth, repo/folder selection, .md/.mdx push
- [x] "Push to GitHub" accordion for static blogs (Astro, Hugo, Jekyll)

### Schedule & Automation
- [x] `scheduler.ts`: `computeNextSlot` with constraints (max 2/day, 2 blog articles/week, 1/platform/day)
- [x] `validateSlot()` function for reschedule validation
- [x] Auto-scheduling on variant generation
- [x] API `/api/schedule`: scheduled variants + articles
- [x] API `/api/variants/[id]/schedule`: reschedule with constraint validation
- [x] Schedule page: heatmap calendar, day popup, platform badges
- [x] Schedule page: main articles shown in calendar (Blog badge)
- [x] Schedule page: "Publish Now" and "Move" buttons per publication
- [x] Reschedule modal with date picker and real-time validation
- [x] Cron endpoint `/api/cron/publish-scheduled` secured by CRON_SECRET
- [x] pg_cron + pg_net: auto-publish every 10 minutes
- [x] `scheduled_at` column on `articles` table + `scheduled` status
- [x] Article scheduling: "Now" / "Schedule" options for website publishing

### DB Schema
- [x] projects (id, user_id, name, slug, url, api_key, site_connection)
- [x] analyses (project_id, product_summary, target_audience, content_angles…)
- [x] keywords (analysis_id, keyword, volumes, competition, serp_difficulty, category, source)
- [x] keyword_clusters (analysis_id, topic, article_title, pillar_keyword, supporting_keywords…)
- [x] competitors (analysis_id, name, url, reason)
- [x] articles (cluster_id, project_id, title, content, outline, word_count, meta_description, canonical_url, scheduled_at…)
- [x] channels (project_id, platform_type, name, config, constraints)
- [x] article_variants (article_id, channel_id, title, content, format, word_count, status, scheduled_at, published_url…)

### Other
- [x] COST.md: cost tracking (DataForSEO, GPT, Anthropic)
- [x] Fix Supabase joined relation types on publish, variants, generate
- [x] Settings page: profile + password change

### Publication — Remaining Connectors
- [x] WordPress self-hosted connector (REST API + Application Passwords)
- [x] Medium moved to manual/copy-paste (API deprecated since 2023)

### Clean Syndication
- [x] Reddit moved to manual/copy-paste (like Indie Hackers, Hacker News)
- [x] Systematic canonical_url on all variants (Dev.to, Hashnode native; Telegraph, Blogger via footer)
- [x] Hashnode: fixed GraphQL mutation to pass `originalArticleURL`
- [x] Per-platform syndication type: `full_canonical` vs `summary_link`
- [x] Variant adapter prompt adapts based on syndication type

### Article Enrichment
- [x] Extract site tools/features at analysis time (`keyTools`)
- [x] Store `key_tools` in analyses table (JSONB)
- [x] Inject tools in product context for article generation prompts
- [x] JSON-LD schema (Article + FAQPage structured data)

### GEO — Generative Engine Optimization
- [x] GEO content angles (comparison, listicle, FAQ-style, "best X for Y")
- [x] FAQ section auto-generation (3-5 Q&A per article)
- [x] Em dash ban enforced across all prompts
- [x] FAQ schema JSON-LD for AI engine parsing
- [x] Listicle/comparison/how-to article templates
- [x] Reinforced product mentions in variant adapter
- [x] Article schema JSON-LD with author, datePublished

### Analytics
- [x] Analytics API: live stats from Dev.to and Hashnode
- [x] Analytics page: real performance data per platform
- [x] Engagement rate calculation

### Demo Mode
- [x] Supabase seed with demo user and Niches Hunter data
- [x] Demo constants, API route bypass, demo layout
- [x] Demo pages with shared components via DemoContext
- [x] Block destructive actions in demo
- [x] "Try the Demo" link on landing page

### Billing & Payments
- [x] Stripe integration (subscriptions, webhooks, customer portal)
- [x] Pricing page: monthly ($19/$39) and yearly ($15/$31) toggle
- [x] Checkout flow via `/api/checkout`
- [x] Stripe webhook handling (`/api/webhooks/stripe`)
- [x] Subscription status tracking in Supabase

### Windows & Cross-browser Fixes
- [x] Fix Windows nav interaction and harden login fallback
- [x] Windows safe mode for nav and overlay effects
- [x] Make navbar dropdowns work without client JS
- [x] Close navbar dropdowns on leave and make login JS-independent

### Mobile Responsive
- [x] Mobile-friendly dashboard layout
- [x] Mobile-friendly landing page

### ICP & Strategy
- [x] ICP definition document (Ideal Customer Profile: vibe coder positioning)
- [x] Ad distribution strategy (Google Search + Reddit + Meta retargeting)
- [x] Business model & unit economics
- [x] Messaging & positioning guidelines

### Forgot Password
- [x] Password reset API route (`/api/auth/password`)

---

## To Do

### P0 — Critical (from ICP)
- [ ] Rewrite landing page messaging (vibe coder-centric, result-oriented)
- [ ] Free tier: 1 analysis + 1 article free (wow moment for funnel)
- [ ] Email infrastructure (hello@/newsletter@/support@ via Resend — plan ready, code not implemented)

### Billing — Usage Limits
- [ ] Plan-based article generation quotas tied to Stripe subscription
- [ ] Monthly generation counter per project (reset on billing cycle via Stripe webhook)
- [ ] Block generation when quota reached (UI warning + API guard)
- [ ] Schedule window limit — publications only within current billing period

### Demo Mode — Polish
- [ ] Test full flow, verify all pages load, refine CTA placement

### Optional / Later
- [ ] AI citation monitoring — track if ChatGPT/Perplexity/Claude cite the product
- [ ] Google Search Console integration for client site impressions
- [ ] OctoBoost octopus logo
- [ ] Tracking pixels (Meta + Reddit Conversion Pixel)

---

## Suggested Order (updated)

1. ~~**Channels** — platform config~~ ✅
2. ~~**Adaptation** — per-platform variants from master article~~ ✅
3. ~~**Custom API connector** — publish to client site~~ ✅
4. ~~**GitHub connector** — push .md/.mdx for static blogs~~ ✅
5. ~~**Design overhaul** — Inter, navy blue, grid, clean pages, larger fonts~~ ✅
6. ~~**Schedule automation** — cron jobs for auto-publish~~ ✅
7. ~~**Clean syndication** — systematic canonical URLs + per-platform logic~~ ✅
8. ~~**WordPress connector** — largest market~~ ✅
9. ~~**Analytics** — live stats from Dev.to + Hashnode~~ ✅
10. ~~**Demo Mode** — interactive demo with real Niches Hunter data~~ ✅
11. ~~**Billing & Stripe** — subscriptions, webhooks, pricing~~ ✅
12. ~~**Mobile responsive**~~ ✅
13. ~~**ICP & Strategy document**~~ ✅
14. **Landing page rewrite** — vibe coder messaging ← **NEXT**
15. **Free tier** — wow moment for ad funnel
16. **Email infrastructure** — transactional + newsletter separation
17. **Usage limits** — quotas per plan
18. **Tracking pixels** — Meta + Reddit for ad campaigns

---

*Last updated: March 4, 2026*
