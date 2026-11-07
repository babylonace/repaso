# How this repository is developed

One maintainer works on this repository. This page says what happens to a change before it reaches `main`, what machines check, what a person checks, and what is not checked at all. Some changes are AI-assisted; nothing here depends on who or what wrote a change, because every change meets the same checks.

Everything below was read from the repository settings and workflow files on 2026-11-06. If a setting changes, this page changes in the same pull request. Sections marked _(this repository)_ are specific to this repo; the rest is the same across my public project repositories and can be copied.

## What happens to a change

1. The work happens on a branch. A ruleset on `main` requires a pull request and the status checks listed below, blocks force-pushes and deletion. The one bypass is the repository admin role (the maintainer), and only through a pull request, so a single maintainer is never locked out by a stuck check and `main` still never receives a direct push.
2. The pull request follows [the template](../.github/pull_request_template.md): what and why, how it was checked, a risk level (low, medium, high) and a checklist.
3. CI runs on the branch and on the pull request.
4. The maintainer reads the diff and merges once the required checks are green.

## What machines check

_(this repository)_ Required for `main`: `build`, `e2e` and `secrets`.

| Job | What it runs | Blocks the merge |
| --- | --- | --- |
| `build` | `npm test` (unit and content tests, Node's built-in runner), then `npm run build`. Installs nothing from npm. | Yes |
| `e2e` | Builds the site, installs Playwright and runs `scripts/e2e.mjs` in Chromium. | Yes |
| `accounts` | Sign-up, sign-out and the Firestore security rules, on the Firebase emulators. | No. It is reported only, because it downloads the emulators at run time. |
| `secrets` | gitleaks over the whole git history, using the repository's `.gitleaks.toml` (one allowed entry: the Firebase web API key, which is public by design). | Yes |
| `deploy` | Publishes to GitHub Pages. | Not a check: it runs only on `main`, after `build`, `e2e` and `secrets` pass. |

A weekly health check (Mondays, 06:17 UTC) runs the tests, requests the live pages and the Firebase SDK files, and opens or updates an issue if anything fails.

Workflows declare `permissions: contents: read`, and the repository default token is read-only too. A job that needs more asks for it explicitly (the Pages deploy job gets `pages: write` and `id-token: write`, the weekly health check gets `issues: write`). Every action is pinned to a full commit hash with the version in a comment, and a repository setting makes GitHub refuse any action that is not.

GitHub CodeQL (default setup, JavaScript/TypeScript and workflow files) scans the code. Its findings appear in the Security tab; it is not a required check.

## What a person checks

The pull request template asks the author to confirm, before asking for a merge:

- I read the diff to understand what was done, and correct it where needed.
- Tests were added or updated for any behaviour that changed.
- Every new dependency exists on its registry, is maintained and was added on purpose (no invented or look-alike package names).
- No secrets, tokens, personal data or private paths in code, comments, logs or test data.
- README and docs match what the code now does.

A change that touches sign-in, secrets, permissions, deploys or CI configuration is marked high risk and gets a slower, line-by-line read.

This human step is a practice, not a setting. The ruleset requires zero approvals, because a single maintainer cannot approve their own pull request on GitHub. `CODEOWNERS` names the maintainer as owner of every file and requests the review, but "require review from code owners" is off.

## New dependencies

_(this repository)_

- Runtime: none. The site has no dependencies and the `build` job installs nothing from npm.
- The browser tests run in separate jobs (`e2e`, `accounts`) because they run third-party npm code. Playwright 1.64.1 and firebase-tools 15.35.0 are pinned to exact versions, and Playwright is installed with install scripts off (`--ignore-scripts`). `deploy` publishes the artifact built by `build`, not anything from those jobs.
- Dependabot opens a weekly pull request for GitHub Actions. There is no npm manifest to update.

GitHub Dependabot alerts and Dependabot security updates are on.

## Secrets and vulnerabilities

- GitHub secret scanning and push protection are on: a push containing a recognised secret is blocked unless the pusher explicitly overrides it.
- CI also scans the whole git history with gitleaks on every push and pull request (the `secrets` job). The gitleaks archive it downloads must match a SHA-256 hash written in the workflow, taken from the release's checksums file; a mismatch fails the job.
- The repository stores no secrets. There are zero repository secrets and one repository variable (`SITE_URL`, a public address).
- Private vulnerability reporting is on, and [SECURITY.md](../SECURITY.md) says how to use it and what is in scope.

## Evidence _(this repository)_

Numbers below were printed by the linked runs on 2026-11-05 and 2026-11-06. They change as tests are added.

- Pull request that added these controls: [#2](https://github.com/babylonace/repaso/pull/2).
- [Pull request run](https://github.com/babylonace/repaso/actions/runs/42132049338), all required checks green: `build` 11 s (35 of 35 unit tests), `e2e` 50 s (34 of 34 browser checks), `accounts` 79 s (14 of 14). `deploy` was skipped because the run was not on `main`.
- [Run on `main`](https://github.com/babylonace/repaso/actions/runs/42131500188) after the merge: `build` 10 s, `e2e` 60 s, `accounts` 60 s, then `deploy` 16 s.
- [Run on the branch that added the `secrets` job](https://github.com/babylonace/repaso/actions/runs/42139240695): `build` 17 s, `e2e` 36 s, `accounts` 74 s, `secrets` 7 s (archive hash `OK`, 24 commits scanned, no leaks found).

## What is not covered

- The human review above is not enforced (see "What a person checks").
- "Require branches to be up to date before merging" is off, so a pull request is checked on its own branch, not against the latest `main`.
- CodeQL findings do not block a merge, and commit signing is not required.
- CodeQL findings in test files, which parse pages this repository generates itself, were dismissed as "used in tests". The dismissals and their reasons are visible in the Security tab.
- The `accounts` job does not block a merge, and the Firestore security rules are published by hand, not by CI.
- Playwright and firebase-tools are pinned inside workflow commands, so Dependabot does not see them and they are updated by hand.

## Copy this setup

1. Ruleset on the default branch: require a pull request, require status checks, block deletion and force-pushes. In a one-person project allow the admin role to bypass through a pull request only; with a team, leave the bypass list empty. Use the exact job names as they appear on a pull request (for a matrix job that includes the version, for example `test (22)`); a required check that never reports blocks the merge forever.
2. Settings, Code security: secret scanning, push protection, Dependabot alerts and security updates, private vulnerability reporting, CodeQL default setup. Add a `secrets` job that runs gitleaks over the full history and checks the downloaded archive against a SHA-256 hash.
3. `.github/dependabot.yml` with a weekly schedule for each ecosystem in use, including `github-actions`.
4. In each workflow: `permissions: contents: read`, and every action pinned to a full commit hash with the version as a comment. Then turn on the Actions setting that requires full-length commit SHAs, so a later change cannot undo it.
5. `.github/CODEOWNERS`, `.github/pull_request_template.md` and `SECURITY.md`.
6. After the first pull request goes through, link its CI run in the evidence section and write down only numbers a run printed.

## Background reading

- NIST, [SP 800-218, Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- OpenSSF [Scorecard](https://scorecard.dev), a checklist of repository security practices

These are where the ideas come from. This repository does not claim to comply with any of them.
