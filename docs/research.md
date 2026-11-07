# Research and decisions

Checked in November 2026. Free plans change, so check the linked pages before relying on a number. "Third-party" marks figures that don't come from the provider itself.

The rule for every choice: 0 EUR, no card, no expiring trial, nothing that pauses or bills overage, no server to look after.

## A. Frontend

| Option | Good | Bad | Verdict |
|---|---|---|---|
| Plain HTML, CSS, JS modules | No dependencies to update, fast, the original artifact was already vanilla JS | Hand-written routing and rendering | **Chosen** |
| Astro | Static pages per topic, good for search engines | Dependency tree to keep updated, a build step that can break by itself | Plan B if SEO becomes a goal |
| Vite + React or Svelte | Comfortable for a growing app | Rewrite for no user benefit, more JS to download | No |
| Next.js | Very capable | Built for servers, which this project doesn't want | No |

This one is engineering judgment, so there's nothing to cite. A project meant to run for years with no maintenance gets the most from having nothing to update.

## B. Database and accounts

| Option | Free limits | Inactivity | Over the limit | Verdict |
|---|---|---|---|---|
| [Firebase Spark](https://firebase.google.com/pricing) | Auth 50K monthly users. Firestore 1 GiB, 50K reads, 20K writes and 20K deletes per day, 10 GiB egress per month | No official pause found. One third-party tracker claims one, unverified | Operations refused (third-party), no bill: no card on file | **Chosen** |
| [Supabase](https://supabase.com/pricing.md) | 50K monthly users, 500 MB, 2 projects | Pauses after 1 week inactive | | Rejected: it pauses |
| [Cloudflare D1](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/) + Workers | 5M reads and 100K writes per day, 5 GB | No pause | Queries fail | **Plan B**, but accounts would have to be built by hand |
| No accounts | No limits at all | | | Already the default, and export/import covers moving devices |

Firebase details: [Auth limits](https://firebase.google.com/docs/auth/limits) allow 5 e-mail links per day on Spark and 100 new accounts per hour per IP, so sign-in is Google and GitHub only. [Firestore](https://firebase.google.com/docs/firestore/quotas) allows 1 MiB per document, and a person's full progress is about 47 KB.

## C. Hosting and domain

| Option | Free limits | Catch | Verdict |
|---|---|---|---|
| [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) | 1 GB site, 100 GB per month (soft) | Not for online businesses or for handling passwords. Repaso is non-commercial and has no passwords | **Chosen** |
| [Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits) | 500 builds per month, 20,000 files, 25 MiB per file. Bandwidth unlimited (third-party) | Needs a Cloudflare account | **Plan B**, `public/_headers` is ready and paths are relative |
| Firebase Hosting | [10 GB stored, 360 MB per day](https://firebase.google.com/pricing) | The daily limit is low for a 600 KB first visit | No |
| Vercel Hobby | | Non-commercial only | No |
| Netlify | | Sources disagree on the free limits | No |

**Domain:** `repaso.babylonace.dev`, a subdomain served by GitHub Pages. `babylonace.github.io/repaso/` redirects to it.

## D. Translation

| Option | Limit | Result | Verdict |
|---|---|---|---|
| [DeepL Free](https://developers.deepl.com/docs/resources/usage-limits) | 500,000 characters per month | Below the 632,000 characters this bank needs in one go | No |
| Argos Translate | None, offline | Moderate quality on technical text | No |
| AI-assisted, once, stored as static files | None at runtime | Keeps technical terms in English on purpose | **Chosen** |
| Plan B | | Fix by hand through issues, or leave a question in English: the site falls back to English per field | |

The Spanish is static JSON, so there's no live AI and no running cost. `scripts/content.mjs` rejects a translation that changes a code span, the line structure or the number of options. It can't judge the wording, so mistakes are possible, which is why every question has a correction link.

## E. Similar sites

| Site | Free | Languages | Good idea to take | Gap Repaso fills |
|---|---|---|---|---|
| [Froquiz](https://froquiz.com) | Quizzes yes, system design is premium | English | Topic quizzes | Sign-in needed for history |
| [awesome-interview-questions](https://github.com/DopplerHQ/awesome-interview-questions) | Yes, CC0 | English | Breadth, 85.4k stars | Links only, archived on 2024-07-29 |
| [Front End Interview Handbook](https://www.frontendinterviewhandbook.com/) | Mostly | Several, including Spanish | Translated content | Practice lives on another site, frontend only |
| [roadmap.sh/questions](https://roadmap.sh/questions) | Yes | English | Questions grouped by topic | One topic at a time |

What's different here: practice starts on the home page without signing in, English and Spanish are complete, and progress works with no account.

## Limits, and what to do near them

| Service | Limit | Repaso's use | Warning sign | What to do |
|---|---|---|---|---|
| GitHub Pages bandwidth | 100 GB per month (soft) | First visit about 620 KB, repeat visits come from the offline copy. Roughly 160,000 first visits a month | E-mail from GitHub | Move to Cloudflare Pages: same files, 10 minutes |
| GitHub Pages size | 1 GB | 1.7 MB | Not a concern | |
| Firestore writes | 20K per day | One write per save, merged with a read first, and a save at most once a minute while someone is answering. Estimate of 5 writes per active signed-in person, so about 4,000 such people a day | Firebase console > Usage above 70% | In `app.js`, raise the 60 second save timer to 5 minutes or save only at the end of a session |
| Firestore reads | 50K per day | 1 per sign-in or visit | Same | Same |
| Firestore storage | 1 GiB | About 47 KB per person at most, and the rules cap it at 100 KB, so over 20,000 people | Same | Remove accounts idle for over a year, after updating the privacy page |
| Firebase Auth | 50K monthly users | One per person | Same | Unlikely to matter before Firestore does |

If a Firebase limit is reached, sync stops until the daily reset and the account page says so. Practice, search and local progress keep working, because nothing there depends on Firebase. Nothing is billed, because the plan has no payment method.

The rules can't rate-limit reads and creates, so anyone with a free Google or GitHub account could burn the shared daily quota by calling the API in a loop. The damage is that sync pauses until the daily reset, nothing is billed. Documents are capped at 100 KB and suggestions at 2,000 characters, which limits what can be stored. If it happens, turn on Firebase App Check (it uses reCAPTCHA, a third party, so it would need a line in the privacy page).

## Not tested

Sign-up, sign-out, sign-in again, a second device, deletion and the security rules all run in `scripts/e2e-accounts.mjs`, against the Firebase emulators. Those tests skip the browser security policy, and they don't touch the real Google or GitHub login pages. That part needs the check in [firebase-setup.md](firebase-setup.md), step 5.

## Known limits of this design

- **One origin, shared with nothing else.** Progress, the sign-in token and the offline copy belong to `repaso.babylonace.dev`. On the custom domain no other site shares that origin, so anything published under `babylonace.github.io` cannot read them.
- **No response headers on GitHub Pages.** The Content-Security-Policy is a `<meta>` tag, which can't set `frame-ancestors`, and `_headers` is ignored. A small script hides the page if it is framed. On Cloudflare Pages (plan B) `_headers` does apply.
- **The Firebase SDK comes from Google's CDN** and can't carry an integrity hash when loaded as a module. The version is pinned, it loads only when someone signs in or is already signed in, and the CSP allows only that path. Bundling it into the repo would remove this risk at the cost of a build dependency.

- **The Firebase web API key is in the repository.** It has to be: it ships in the page. GitHub secret scanning flags it as a Google API key; the alert can be closed as "won't fix" with that explanation. What makes it safe: in Google Cloud Console > Credentials it is restricted to HTTP referrers (`babylonace.github.io` and the Firebase auth domain), e-mail and anonymous sign-up are off so nobody can create an account with it, and data access is decided by `firebase/firestore.rules`. A script that fakes the Referer header could still spend the project quota, which is the same risk as the quota abuse above.
