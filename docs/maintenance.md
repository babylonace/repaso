# Keeping Repaso healthy

The aim is a site that needs about 30 minutes a month. It's static, it has no dependencies to update, and the only moving parts are the content, GitHub Actions and the free Firebase plan.

## What runs by itself

| What | When | What it does |
|---|---|---|
| `Test and deploy` workflow | Every push to `main`, and every pull request | Unit tests, build, browser tests on mobile and desktop. Deploys only if build and browser tests pass. The account and security-rules tests on the Firebase emulators run too and are reported, but don't block a deploy |
| `Weekly health check` workflow | Mondays | Runs the tests on `main`, checks that the live site, both language files, the sitemap and the pinned Firebase SDK files answer, and says if Firebase has a new major version. If anything is wrong it opens an issue labelled `health` |
| Dependabot | Weekly | Proposes updates for the GitHub Actions, which are pinned by commit SHA |
| Monthly maintenance agent | 1st of the month | Drafts fixes for issues as pull requests and opens a monthly report issue. See [monthly-agent.md](monthly-agent.md) |

Nothing else needs doing for the site to stay up. GitHub e-mails you when a workflow fails or an issue arrives.

## Monthly, about 30 minutes

1. **Issues.** Read the open ones. Corrections (label `correction`) are the most useful. Fix them like this:
   1. Edit the English text in `content/questions/<topic>.json`.
   2. `npm run i18n -- todo` lists the Spanish that is now stale. Translate it, save the result as a patch file and run `npm run i18n -- apply <patch.json>`. For a typo that doesn't change the meaning, `npm run i18n -- restamp <id>` is enough.
   3. `npm test`, then open a pull request. `main` only takes changes through one.
2. **Firebase usage.** Console > Usage. If any number is above 70% of its daily limit, follow the table in [research.md](research.md#limits-and-what-to-do-near-them).
3. **Suggestions sent from the site.** Firestore console, collection `suggestions`. Delete the ones you've handled.
4. **The free plan hasn't changed.** Open the pricing pages linked from [research.md](research.md) and compare them to the numbers there. Update the doc if they moved.

## Yearly, or when the health check says so

- **Firebase SDK.** The version is pinned in `public/assets/js/config.js` (`sdkVersion`) and in the Content-Security-Policy in `public/index.html`. To upgrade: change both, run `npm run e2e:accounts`, then do the live check in [firebase-setup.md](firebase-setup.md) with the browser console open.
- **Node.** CI uses 24. Move up when it becomes the long-term release.
- **Content.** Skim the questions for things that aged: versions (Java LTS, Spring Boot, Python), cloud service names, limits and prices.

## Adding content

1. Add the question to `content/questions/<topic>.json` with a new, never reused `id` (letters, digits, `_` and `-`). Every topic needs questions on all four levels.
2. Add any glossary term it uses to `content/glossary.json` and list its key in the question's `g`.
3. Translate: `npm run i18n -- todo`, translate, `npm run i18n -- apply`.
4. `npm test`. It checks ids, answers, links, and that the Spanish keeps every code span and the same line structure.

### A new topic or category

1. `content/groups.json`: add the category (`k`, `name`, `name_es`) when its first topic arrives. The validator rejects an empty category.
2. `content/topics.json`: add `{ "k", "g", "name", "name_es", "p" }` per topic. Keys are lowercase, up to 32 characters, never reused.
3. `content/questions/<k>.json` with new ids `<PREFIX>-01`... Every level 0 to 3 needs at least one question.
4. `public/assets/js/icons.js`: add a 24x24 stroke icon to `P` and a hue to `HUE` for each topic, or it shows the clock fallback.
5. Glossary terms in English, then the Spanish as above.
6. `npm test` and `npm run e2e`. Update the numbers in README.md and README.es.md, and run `npm run media`.

### Quality bar

- About 40 questions per topic: roughly 6 on level 0, 12 on level 1, 14 on level 2, 8 on level 3. About one in ten is a flashcard (`t: "f"`) for open, whiteboard-style answers.
- Multiple choice: four options, one right, three that a half-prepared candidate would really pick. No "all of the above", no joke options. The explanation says why the right one is right and why the likeliest wrong one is not.
- Every fact is checked against official documentation or a spec, and the source is listed in the pull request description. Anything version-bound names the version.
- Include scenario questions ("a query got slow", "the pod restarts"), not only definitions.
- Plain, direct English. Spanish is a real translation: code spans identical, same line structure. Terms people really say in Spanish stay in English (deploy, commit, pull request).

## The monthly report

A GitHub Actions workflow (`monthly.yml`) runs on the 1st of every month at 07:00 UTC and opens one issue titled `Monthly report yyyy-mm` (label `monthly-report`). It runs the tests, lists stale Spanish, open issues and pull requests, and checks that the documentation links still answer. Details and the manual part: [monthly-agent.md](monthly-agent.md).

Why it is built this way:

- **No AI service and no extra secrets.** It only uses the repository token, so it keeps working whatever happens to any outside service.
- **It never edits files or opens pull requests.** Changing content is a human job, with the checklist in the same doc.
- **Issue text is untrusted input.** Titles are printed as plain text and nothing in an issue is ever run or followed.
- **Where you find out.** The report issue appears in the repo. If GitHub does not e-mail you about it (it may not for activity by your own account), watch the repo for "All activity" or look at the `monthly-report` issue on the 1st.

## When the content changes size

The README and README.es.md state the number of questions and the per-topic table. After adding or removing questions, update those numbers and run `npm run media` so the banner and screenshots match.
