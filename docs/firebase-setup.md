# Turning accounts on

The site works without any of this. Accounts only add sync between devices and a suggestion form that doesn't need GitHub. About 15 minutes, no card.

**Stay on the Spark plan.** Never upgrade to Blaze: Spark has no payment method, so it refuses work past the limits instead of charging. If the console offers an upgrade, say no.

## 1. Create the project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and add a project. Skip Google Analytics.
2. **Build > Firestore Database > Create database.** Pick a region in the EU, such as `eur3` (it can't be changed later). Start in production mode.
3. **Build > Authentication > Get started.**

## 2. Sign-in methods

**Google:** enable it and choose a support e-mail. That e-mail is visible on the consent screen, so use one you don't mind showing.

**GitHub:**

1. On GitHub: Settings > Developer settings > OAuth Apps > New OAuth App.
2. Homepage URL: `https://repaso.babylonace.dev/`
3. Authorization callback URL: copy it from the GitHub provider panel in Firebase (it looks like `https://<project>.firebaseapp.com/__/auth/handler`).
4. Paste the client ID and client secret back into Firebase. The secret stays in Firebase and never goes in this repo.

**Authorized domains** (Authentication > Settings): add `repaso.babylonace.dev`.

Leave e-mail link sign-in off: Spark allows 5 of those e-mails a day.

## 3. Publish the rules

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <your-project-id>
```

Without this step Firestore refuses everything, so nothing leaks, but sync won't work.

## 4. Connect the site

Project settings > General > Your apps > Web app. Copy the config into `public/assets/js/config.js`:

```js
firebase: {
  apiKey: "...",
  authDomain: "<project>.firebaseapp.com",
  projectId: "<project>",
  appId: "...",
},
```

These values are public by design. What protects the data is `firebase/firestore.rules`, not the key. Restrict the API key to your domain anyway in Google Cloud Console > APIs & Services > Credentials: add an HTTP referrer limit for `babylonace.github.io/*`.

Then tighten the Content-Security-Policy in `public/index.html`: replace `https://*.firebaseapp.com` in `frame-src` with exactly `https://<project>.firebaseapp.com`, so the site can't frame another Firebase project.

Push to `main` and it deploys.

## 5. Check it

The Content-Security-Policy already allows what the Google sign-in needs (found out the hard way: `https://apis.google.com/js/` and `https://apis.google.com/_/scs/abc-static/`, the Firebase SDK path and the project's own `firebaseapp.com` frame). If a Firebase upgrade changes what loads, look for blocked requests: open the browser console first, since the Content-Security-Policy has only been tried with the emulators (they run with it switched off). Sign in with both providers on the live site, and look for blocked requests, then loosen the policy only for what you see blocked. Sign in with both providers, answer a question, then sign in on your phone and check the progress is there. The emulator tests cover the logic, but only the live site can prove the real Google and GitHub logins and the browser security policy.

Suggestions show up in the Firestore console, in the `suggestions` collection.

## Turning accounts off again

Set `firebase: null` in `config.js` and push. Local progress isn't affected.
