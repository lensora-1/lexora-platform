# LEXORA — English learning platform

Arabic-first, responsive landing page for LEXORA. The visual identity uses navy and mint, with Arabic/English direction switching.

## Deployment
- Repository: `lensora-1/lexora-platform`
- Hosting: Cloudflare Pages (`lexora-platform`)
- Production URL: https://lexora-platform.pages.dev
- GitHub Actions deploys the repository root to Cloudflare Pages on pushes to `main`.

## Backend
- Supabase project: `xozfbhmilefynqipdpvo` (region: `eu-central-1`)
- Email/password sign-up and sign-in are wired through Supabase Auth.
- Password recovery email flow and password update state are included.
- The frontend uses only the Supabase publishable key. Never put a service-role or secret key in browser code.
- Database tables: `profiles`, `learning_progress`, `vocabulary`, `achievements`, `learning_streaks`, and `subscriptions`.
- Row Level Security is enabled on all six tables. Learner-owned records are restricted by `auth.uid()`; subscription rows are read-only to clients.
- A database trigger creates the learner profile when an Auth user is created.

## Required Supabase Auth URL configuration
In Supabase Dashboard → Authentication → URL Configuration:
- Set **Site URL** to `https://lexora-platform.pages.dev`.
- Add `https://lexora-platform.pages.dev/**` to the Redirect URLs allow list.

Google sign-in is displayed in the UI but requires the Google provider and OAuth credentials to be configured in Supabase Dashboard → Authentication → Providers before it can work. Configure the OAuth callback URL shown by Supabase in Google Cloud Console.

## Current scope
Implemented: landing page, responsive Arabic/English direction toggle, email/password account UI, sign-in, sign-up, sign-out, password recovery flow, learner data schema, and row-level access policies.

Still to build: real lesson catalog and media, five-stage lesson player, progress and vocabulary UI, level tests, PRO payment processing and access enforcement, advertising, and the separate admin dashboard. The current lesson visual remains a demonstration and is not a playable course video.

## Product decisions
- Learning path: Foundation, A1, A2, B1, B2, C1.
- PRO plan is displayed at 5 JOD/month.
- Original realistic American-English scenes are planned.
- Dark navy and mint visual identity.

Copyright © 2026 LEXORA.
