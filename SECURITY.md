# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private reporting instead: open the **Security** tab of this repository and choose **Report a vulnerability**. Include what you found, the steps to reproduce it and, if you can, what an attacker could do with it.

This is a one-person project, so replies are best effort. You will get an answer in the same private thread, and a fix is published before the details are.

## What is in scope

- The site published from this repository.
- The Firebase security rules in `firebase/` and the account flow that uses them.
- The build and CI configuration in `.github/`.

## What is not

- Problems in Firebase, GitHub or a browser themselves. Report those to their owners.
- Findings that need access to a maintainer's own account or device.

## How changes are checked

Every change goes through a pull request. The tests, the browser tests and the build must pass before it reaches `main`. Third-party CI actions are pinned to commit hashes and Dependabot proposes updates weekly. Secret scanning and push protection are on.
