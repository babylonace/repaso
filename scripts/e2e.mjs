// Browser tests with no account service at all. Run: npm run e2e
// Needs Playwright, which is not a project dependency: npm i --no-save playwright && npx playwright install chromium
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";

const PORT = 4179, URL_ = `http://127.0.0.1:${PORT}/`;
const server = spawn(process.execPath, ["scripts/serve.mjs", String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 700));

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(["ok", name]); }
  catch (e) { results.push(["FAIL", `${name}: ${e.message.split("\n")[0]}`]); }
}
const ok = (v, msg) => { if (!v) throw new Error(msg || "assertion failed"); };
const answerOne = async (p) => { await p.locator(".opt").first().click(); };

const browser = await chromium.launch();

// The tests must not depend on whether the shipped config has accounts on. Every context gets the config
// with accounts off, unless a test asks for the real one with rawContext().
const FB = /firebase: (?:null|\{[\s\S]*?\n  \}),/;
const rawContext = browser.newContext.bind(browser);
browser.newContext = async (opts) => {
  const c = await rawContext(opts);
  c.setDefaultTimeout(6000);
  await c.route("**/assets/js/config.js", async (r) => {
    try {
      const res = await r.fetch();
      await r.fulfill({ response: res, body: (await res.text()).replace(FB, "firebase: null,") });
    } catch { /* the page closed while the request was in flight */ }
  });
  return c;
};

for (const [label, viewport, touch] of [["mobile", { width: 390, height: 844 }, true], ["desktop", { width: 1280, height: 800 }, false]]) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, locale: "en-US" });
  const p = await ctx.newPage();
  p.setDefaultTimeout(6000);
  const errors = [], foreign = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  p.on("request", (r) => { if (!r.url().startsWith(URL_) && !r.url().startsWith("data:")) foreign.push(r.url()); });

  await check(`${label}: a question is on screen in under 10 seconds, no signup`, async () => {
    const t0 = Date.now();
    await p.goto(URL_);
    await p.locator(".opt").first().waitFor();
    ok(Date.now() - t0 < 10000);
  });
  await check(`${label}: no horizontal scroll`, async () => {
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  });
  await check(`${label}: answering shows the explanation and saves progress locally`, async () => {
    await answerOne(p);
    await p.locator("[data-act=next]").waitFor();
    const saved = await p.evaluate(() => Object.keys(localStorage).some((k) => (localStorage.getItem(k) || "").includes('"items":{"')));
    ok(saved, "nothing in localStorage");
  });
  await check(`${label}: a full session ends with a score`, async () => {
    for (let i = 0; i < 40; i++) {
      if (await p.locator("[data-act=again], [data-act=retry]").count()) break;
      if (await p.locator("[data-act=reveal]").count()) { await p.locator("[data-act=reveal]").click(); await p.locator("[data-act=got]").click(); continue; }
      if (await p.locator("[data-act=next]").count()) { await p.locator("[data-act=next]").click(); continue; }
      if (await p.locator(".opt:not([disabled])").count()) { await answerOne(p); continue; }
      await p.waitForTimeout(50);
    }
    ok(await p.locator("[data-act=again], [data-act=retry]").count(), "no end screen");
  });
  await check(`${label}: categories filter the home topics and pick topics together in Practice`, async () => {
    await p.goto(URL_);
    await p.locator(".tcard").first().waitFor();
    const all = await p.locator(".tcard").count();
    await p.locator("[data-hg=data]").click();
    const some = await p.locator(".tcard").count();
    ok(some > 0 && some < all, `${some} of ${all} cards after filtering`);
    await p.locator("[data-hg=all]").click();
    ok((await p.locator(".tcard").count()) === all, "All brings every topic back");
    await p.goto(URL_ + "#/practice");
    const allChip = p.locator("[data-allcats]"), web = p.locator("[data-grp=web]"), data = p.locator("[data-grp=data]");
    const on = async (l) => l.getAttribute("aria-pressed");
    await allChip.waitFor();
    ok((await on(allChip)) === "true", "everything starts on");
    await web.click();
    ok((await on(web)) === "true" && (await on(allChip)) === "false", "a tap narrows to that category");
    await data.click();
    ok((await on(web)) === "true" && (await on(data)) === "true", "a second tap adds to the choice");
    await web.click();
    ok((await on(web)) === "false", "a tap removes it again");
    await data.click();
    ok((await on(allChip)) === "true", "clearing the last one goes back to All");
    await p.locator("[data-panel=topics] summary").click();
    await p.locator("[data-cat=api]").click();
    ok((await on(web)) === "mixed", "one topic makes the category mixed");
    await p.locator("[data-panel=topics][open]").waitFor();
    await allChip.click();
    ok((await p.evaluate(() => JSON.parse(localStorage.getItem("repaso-prefs-v1")).cats.length)) === 0, "All is saved as an open list, so new topics join it");
  });
  await check(`${label}: search finds a term and a question`, async () => {
    await p.goto(`${URL_}#/`);
    await p.locator("#q").fill("deadlock");
    await p.locator("#q").press("Enter");
    await p.locator("a[href^='#/term/deadlock']").first().waitFor();
    ok(await p.locator("a[href^='#/q/']").count(), "no question hit");
  });
  await check(`${label}: Spanish button translates the page and keeps code in English`, async () => {
    await p.goto(`${URL_}#/term/deadlock`);
    await p.locator("#lang").click();
    await p.getByText("Dos o más transacciones").first().waitFor();
    await p.goto(`${URL_}#/q/DB-07`);
    await p.waitForFunction(() => document.documentElement.lang === "es");
    await p.locator("#lang").click();
    await p.waitForFunction(() => document.documentElement.lang === "en");
  });
  await check(`${label}: theme button switches and is remembered`, async () => {
    const before = await p.evaluate(() => document.documentElement.dataset.theme || "");
    await p.locator("#theme").click();
    const after = await p.evaluate(() => document.documentElement.dataset.theme || "");
    ok(before !== after, "theme did not change");
    await p.reload();
    ok((await p.evaluate(() => document.documentElement.dataset.theme || "")) === after, "theme forgotten");
  });
  await check(`${label}: Study, glossary, about and privacy open`, async () => {
    for (const r of ["topics", "topics/py", "study", "study/py", "terms", "about", "privacy", "practice"]) {
      await p.goto(`${URL_}#/${r}`);
      await p.locator("main h1, main h2").first().waitFor();
    }
  });
  await check(`${label}: suggestions open a prefilled GitHub issue`, async () => {
    await p.goto(`${URL_}#/suggest?ref=DB-07`);
    await p.locator("#sug-text").fill("The explanation of this question could be clearer.");
    const [tab] = await Promise.all([ctx.waitForEvent("page"), p.locator("[data-sug=github]").click()]);
    await tab.waitForLoadState("commit").catch(() => {});
    // Signed out, GitHub redirects to its login page and keeps the issue address in return_to (encoded again).
    let u = tab.url();
    for (let i = 0; i < 2; i++) { try { u = decodeURIComponent(u); } catch { break; } }
    ok(/github\.com\/babylonace\/repaso\/issues\/new\?title=Fix DB-07/.test(u), tab.url());
    await tab.close();
    foreign.length = 0; // the issue tab is the one allowed exit
  });
  await check(`${label}: export, erase and import bring progress back`, async () => {
    await p.goto(`${URL_}#/account`);
    await p.locator("[data-acct=export]").waitFor();
    const [dl] = await Promise.all([p.waitForEvent("download"), p.locator("[data-acct=export]").click()]);
    const file = await dl.path();
    const before = JSON.parse(fs.readFileSync(file, "utf8"));
    ok(Object.keys(before.items).length > 0, "empty export");
    await p.locator("[data-arm=reset]").click();
    await p.locator("[data-arm=reset]").click();
    await p.setInputFiles("#import", file);
    await p.waitForTimeout(100);
    const n = await p.evaluate(() => {
      for (const k of Object.keys(localStorage)) { try { const v = JSON.parse(localStorage.getItem(k)); if (v?.items) return Object.keys(v.items).length; } catch {} }
      return 0;
    });
    ok(n === Object.keys(before.items).length, `got ${n} items back`);
  });
  await check(`${label}: accounts off shows a clear note and no sign-in button`, async () => {
    await p.goto(`${URL_}#/account`);
    ok(!(await p.locator("[data-signin]").count()), "sign-in shown with accounts off");
  });
  await check(`${label}: works offline after the first visit`, async () => {
    await p.goto(URL_);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload();
    await p.waitForFunction(() => !!navigator.serviceWorker.controller);
    await p.waitForTimeout(400);
    await ctx.setOffline(true);
    await p.reload();
    await p.locator(".opt").first().waitFor({ timeout: 5000 });
    await ctx.setOffline(false);
  });
  await check(`${label}: nothing contacted a third party, no console errors`, async () => {
    ok(!foreign.length, `third party: ${foreign[0]}`);
    ok(!errors.length, errors[0]);
  });
  await ctx.close();
}

await check("a 320 px phone: no sideways scroll on the main pages, in both languages", async () => {
  for (const locale of ["en-US", "es-ES"]) {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, locale });
    const p = await ctx.newPage();
    await p.goto(URL_);
    await p.locator(".opt").first().waitFor();
    for (const r of ["", "practice", "topics", "topics/py", "terms", "about", "account", "suggest"]) {
      await p.evaluate((h) => { location.hash = "#/" + h; }, r);
      await p.waitForTimeout(120);
      const wide = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(wide <= 0, `${locale} #/${r} is ${wide}px too wide`);
    }
    await ctx.close();
  }
});
await check("first visit follows the browser language, and a saved choice wins", async () => {
  for (const [locale, langs, want] of [["es-ES", ["es-ES", "es"], "es"], ["en-US", ["en-US", "en"], "en"], ["fr-FR", ["fr-FR", "es"], "es"], ["fr-FR", ["fr-FR"], "en"], ["es-ES", ["en-GB", "es-ES"], "en"]]) {
    const ctx = await browser.newContext({ locale });
    await ctx.addInitScript((l) => Object.defineProperty(navigator, "languages", { get: () => l }), langs);
    const p = await ctx.newPage();
    await p.goto(URL_);
    await p.locator(".opt").first().waitFor();
    ok((await p.evaluate(() => document.documentElement.lang)) === want, `${langs} gave ${await p.evaluate(() => document.documentElement.lang)}`);
    await ctx.close();
  }
});
await check("from the Spanish home the app opens in Spanish, even with the browser in English, and it sticks", async () => {
  const ctx = await browser.newContext({ locale: "en-US" });
  const p = await ctx.newPage();
  await p.goto(`${URL_}es/`);
  await p.locator("a.btn.pri").click();
  await p.waitForFunction(() => document.documentElement.lang === "es" && location.hash === "#/practice");
  ok(!p.url().includes("lang="), `the address should not keep ?lang, got ${p.url()}`);
  await p.reload();
  await p.waitForFunction(() => document.documentElement.lang === "es" && !!document.querySelector("#lang"));
  await p.goto(`${URL_}es/`);
  await p.locator("a.tool.lang").click();
  await p.locator(".opt").first().waitFor();
  ok((await p.evaluate(() => document.documentElement.lang)) === "en", "the English link on the Spanish home opens English");
  await ctx.close();
});
const levelOnScreen = (p) => p.locator(".qmeta span").first().innerText();
const walkSession = async (p, onQuestion) => {
  for (let i = 0; i < 80; i++) {
    if (await p.locator("[data-act=again], [data-act=retry]").count()) return;
    if (await p.locator("[data-act=next]").count()) { await p.locator("[data-act=next]").click(); continue; }
    if (await p.locator(".qmeta").count()) await onQuestion();
    if (await p.locator("[data-act=reveal]").count()) { await p.locator("[data-act=reveal]").click(); await p.locator("[data-act=got]").click(); continue; }
    if (await p.locator(".opt:not([disabled])").count()) { await p.locator(".opt").first().click(); continue; }
    await p.waitForTimeout(50);
  }
  throw new Error("no end screen");
};
await check("a new visitor gets interview questions, never Foundations, in the first session", async () => {
  for (let i = 0; i < 4; i++) {
    const ctx = await browser.newContext({ locale: "en-US" });
    const p = await ctx.newPage();
    await p.goto(URL_);
    await p.locator(".opt").first().waitFor();
    const hero = await levelOnScreen(p);
    ok(hero === "Basic" || hero === "Intermediate", `home question is ${hero}`);
    await p.locator("[data-go=quick]").click();
    await p.locator(".qtop").waitFor();
    await walkSession(p, async () => { const l = await levelOnScreen(p); ok(l !== "Foundations", "a Foundations question in the first session"); });
    await ctx.close();
  }
});
await check("someone who already uses the app keeps all their progress and settings", async () => {
  const ctx = await browser.newContext({ locale: "en-US" });
  const p = await ctx.newPage();
  const items = { "PY-62": { b: 1, d: 1000, n: 3, c: 1, w: 2, l: 0, t: 900 }, "PY-01": { b: 4, d: 8.6e15, n: 5, c: 5, w: 0, l: 1, t: 900 } };
  const old = { v: 1, items, stats: { answered: 8, correct: 6, streak: 2, best: 5 }, updatedAt: 900, studied: { "PY-02": 1 }, levels: { py: 1 } };
  await p.addInitScript(([a, b]) => {
    if (localStorage.getItem("seeded")) return;
    localStorage.setItem("seeded", "1");
    localStorage.setItem("repaso-progress-v1", a); localStorage.setItem("repaso-prefs-v1", b);
  }, [JSON.stringify(old), JSON.stringify({ lang: "en", mode: "smart", size: 10, timer: 90, levels: "auto", cats: ["py"], stLv: 0 })]);
  await p.goto(`${URL_}#/practice`);
  await p.locator("[data-order=interview]").waitFor({ state: "attached" });
  ok((await p.locator("[data-order=interview]").getAttribute("aria-pressed")) === "true", "the old setting kept the lock on");
  ok((await p.locator("[data-cat=py]").getAttribute("aria-pressed")) === "true", "topics forgotten");
  ok((await p.locator("[data-cat=db]").getAttribute("aria-pressed")) === "false", "topics changed");
  await p.goto(`${URL_}#/topics/py/missed`);
  await p.locator(".sitem").first().waitFor();
  ok((await p.locator(".sitem").count()) === 1 && (await p.locator(".sitem .st").innerText()) === "Missed", "the missed filter");
  await p.goto(`${URL_}#/study/py/mastered`);
  await p.locator(".sitem .st-mastered").first().waitFor();
  await p.goto(URL_);
  await p.locator("[data-go=quick]").click();
  await p.locator(".qtop").waitFor();
  ok((await p.locator(".qmeta a").innerText()) === "Python", "the home button ignored the chosen topics");
  await p.locator("[data-act=end]").click();
  await p.goto(`${URL_}#/practice`);
  await p.locator("[data-go=mode]").click();
  await p.locator(".qmeta").first().waitFor();
  const seen = [];
  await walkSession(p, async () => { seen.push(await p.locator(".qtext").innerText()); });
  ok(seen.some((q) => q.includes("age = 30")), "the question that was due did not come back");
  const after = await p.evaluate(() => JSON.parse(localStorage.getItem("repaso-progress-v1")));
  ok(after.items["PY-01"].n === 5 && after.items["PY-01"].b === 4, "a saved answer was lost");
  ok(after.studied["PY-02"] === 1, "read marks lost");
  ok(after.levels.py >= 1, "unlocked level lost");
  ok(after.stats.best >= 5 && after.stats.answered >= 18, "stats lost");
  await ctx.close();
});
await check("From the basics brings back level by level, and is remembered", async () => {
  const ctx = await browser.newContext({ locale: "en-US" });
  const p = await ctx.newPage();
  await p.goto(`${URL_}#/practice`);
  await p.locator("[data-panel=options] summary").click();
  await p.locator("[data-order=basics]").click();
  await p.reload();
  await p.locator("[data-order=basics][aria-pressed=true]").waitFor({ state: "attached" });
  await p.locator("[data-go=mode]").click();
  await p.locator(".qmeta").first().waitFor();
  await walkSession(p, async () => { ok((await levelOnScreen(p)) === "Foundations", "above Foundations before unlocking"); });
  await ctx.close();
});
await check("Practice fits on one phone screen: categories and Start, in Spanish", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" });
  const p = await ctx.newPage();
  await p.goto(`${URL_}#/practice`);
  await p.locator("[data-go=mode]").waitFor();
  const box = await p.locator("[data-go=mode]").boundingBox();
  ok(box.y + box.height <= 844, `Start ends at ${Math.round(box.y + box.height)} px`);
  await ctx.close();
});
await check("I don't know shows the answer and changes nothing", async () => {
  const ctx = await browser.newContext({ locale: "en-US" });
  const p = await ctx.newPage();
  await p.goto(`${URL_}#/practice`);
  await p.locator("[data-grp=lang]").click();
  await p.locator("[data-go=mode]").click();
  await p.locator(".qtop").waitFor();
  let cards = 0; // the session is shuffled, so flash cards may come before the first question with choices
  for (let i = 0; i < 12 && !(await p.locator("[data-act=dunno]").count()); i++) {
    await p.locator("[data-act=reveal]").click(); await p.locator("[data-act=got]").click(); cards++;
  }
  const before = await p.evaluate(() => localStorage.getItem("repaso-progress-v1"));
  await p.locator("[data-act=dunno]").click();
  await p.locator(".fb.dunno").waitFor();
  await p.locator(".opt.ok").waitFor();
  ok(await p.locator(".answer").count(), "no explanation");
  ok((await p.evaluate(() => localStorage.getItem("repaso-progress-v1"))) === before, "progress changed");
  await p.locator("[data-act=next]").click();
  await p.locator("[data-act=end]").click();
  await p.getByText("The ones you didn't know").waitFor();
  ok(!(await p.getByText("Clean run").count()), "a session of I don't know is not a clean run");
  ok((await p.locator(".ring").count()) === (cards ? 1 : 0), cards ? "no score after answering cards" : "a score with nothing answered");
  await p.locator("[data-act=retry]").click();
  await p.locator(".qtop").waitFor();
  await ctx.close();
});
await check("odd links never break the app: unknown and prototype-like ids", async () => {
  const ctx = await browser.newContext({ locale: "en-US" });
  const p = await ctx.newPage();
  const crashes = [];
  p.on("pageerror", (e) => crashes.push(e.message));
  await p.goto(URL_);
  await p.locator(".opt").first().waitFor();
  for (const h of ["#/q/constructor", "#/q/__proto__", "#/term/__proto__", "#/term/toString", "#/study/constructor/9", "#/topics/__proto__", "#/topics/py/constructor", "#/search/%E0%A4%A", "#/nope/1/2", "#/suggest?ref=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E"]) {
    await p.evaluate((x) => { location.hash = x; }, h);
    await p.waitForTimeout(80);
    ok(await p.locator("main").innerText(), `empty page for ${h}`);
  }
  ok(!(await p.locator("main img").count()), "injected markup");
  ok(!crashes.length, crashes[0]);
  await ctx.close();
});
await check("static pages for search engines open, read without script and link into the app", async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, locale: "en-US" });
  const p = await ctx.newPage();
  for (const [u, h1] of [["q/db-07/", /second highest/i], ["es/q/db-07/", /segundo/i], ["t/db/", /SQL/], ["es/t/", /tema/i], ["glossary/", /glossary/i]]) {
    await p.goto(URL_ + u);
    ok(h1.test(await p.locator("h1").first().innerText()), `${u} heading`);
  }
  await p.goto(URL_ + "q/db-07/");
  ok((await p.locator("a.btn.pri").getAttribute("href")) === "../../#/q/DB-07", "practice link");
  const sm = await (await fetch(URL_ + "sitemap.xml")).text();
  ok((sm.match(/<url>/g) || []).length > 1500, "sitemap too small");
  ok(/Sitemap: https:\/\//.test(await (await fetch(URL_ + "robots.txt")).text()), "robots.txt without sitemap");
  await ctx.close();
});

// The real config, as shipped: accounts are on, and still nothing talks to Google until someone signs in.
await check("shipped config: accounts offered, and no request leaves the site before sign-in", async () => {
  const ctx = await rawContext({ viewport: { width: 390, height: 844 }, locale: "en-US", serviceWorkers: "block" });
  const p = await ctx.newPage();
  p.setDefaultTimeout(6000);
  const foreign = [];
  p.on("request", (r) => { if (!r.url().startsWith(URL_) && !r.url().startsWith("data:")) foreign.push(r.url()); });
  await p.goto(URL_);
  await p.locator(".opt").first().waitFor();
  for (const h of ["#/practice", "#/topics", "#/terms", "#/about", "#/privacy", "#/suggest", "#/account"]) {
    await p.evaluate((x) => { location.hash = x; }, h);
    await p.waitForTimeout(150);
  }
  await p.locator("[data-signin=google]").waitFor();
  await p.waitForTimeout(500);
  ok(!foreign.length, `left the site: ${foreign[0]}`);
  await ctx.close();
});

// Accounts turned on, but the service is unreachable: practice must not notice.
await check("accounts on but Firebase unreachable: practice still works", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" });
  const p = await ctx.newPage();
  p.setDefaultTimeout(6000);
  const crashes = [];
  p.on("pageerror", (e) => crashes.push(e.message));
  await p.route("**/assets/js/config.js", async (r) => {
    try {
    const res = await r.fetch();
    const body = (await res.text()).replace(FB, `firebase: { apiKey: "x", authDomain: "x.firebaseapp.com", projectId: "x", appId: "x" },`);
    await r.fulfill({ response: res, body });
    } catch { /* closed while in flight */ }
  });
  await p.route(/gstatic\.com|googleapis\.com/, (r) => r.abort());
  await p.addInitScript(() => { localStorage.setItem("repaso-signed-in", "1"); });
  await p.goto(URL_);
  await p.locator(".opt").first().click();
  await p.locator("[data-act=next]").waitFor();
  await p.goto(`${URL_}#/account`);
  await p.locator("[data-signin=google]").waitFor();
  await p.locator("[data-signin=google]").click();
  await p.locator(".notice.err, .err").first().waitFor({ timeout: 5000 });
  ok(!crashes.length, crashes[0]);
  await ctx.close();
});

await browser.close();
server.kill();
let failed = 0;
for (const [s, n] of results) { if (s !== "ok") failed++; console.log(`${s === "ok" ? "  ok  " : " FAIL "} ${n}`); }
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
