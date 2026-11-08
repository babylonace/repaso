import {
  blankProgress, validProgress, shuffle, pct, esc, inline, richText, highlight,
  gradeItem, gradeStats, interviewTier, levelStats, refreshLevels, boxCounts, mergeProgress, sanitizeProgress, searchDocs, search,
} from "./core.js";
import { STRINGS, PAGES } from "./i18n.js";
import { CONFIG } from "./config.js";
import { topicIcon, topicHue } from "./icons.js";
import { initFx, scan } from "./fx.js";

const $ = (id) => document.getElementById(id);
const main = $("main");
const KEYS = { progress: "repaso-progress-v1", prefs: "repaso-prefs-v1", signed: "repaso-signed-in", theme: "repaso-theme" };
const SIZES = [10, 20, 40], TIMERS = [30, 60, 90], MODES = ["smart", "all", "weak", "exam"];

const lsGet = (k) => { try { const s = localStorage.getItem(k); return s === null ? null : JSON.parse(s); } catch { return null; } };
let storageWarned = false;
const lsSet = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch { if (!storageWarned) { storageWarned = true; queueMicrotask(() => toast(t("err.storage"))); } } // full or blocked: keep working in memory
};
const lsDel = (k) => { try { localStorage.removeItem(k); } catch { /* same */ } };

const bare = (o = {}) => Object.assign(Object.create(null), o);
let GROUPS = [], GROUP = bare(), TOPICS = [], TOPIC = bare(), BANK = [], BYID = bare(), GL = bare(), ES = null, esLoading = null, DOCS = null;
let P = lsGet(KEYS.progress);
if (!validProgress(P)) P = blankProgress();
if (!P.studied) P.studied = {};
if (!P.levels) P.levels = {};

/** First visit: the first language in the browser's list that we have. English when none. */
function detectLang() {
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language || ""]) {
    if (/^es(-|$)/i.test(l)) return "es";
    if (/^en(-|$)/i.test(l)) return "en";
  }
  return "en";
}
/** The site root, worked out from this file, so the app runs the same at / and at /es/. */
const ROOT = new URL("../../", import.meta.url);
const at = (p) => new URL(p, ROOT).href;

/** The Spanish home (/es/) opens in Spanish. A link from a static page carries ?lang=es or ?lang=en: the page you came from picks the language. It is remembered, and the ?lang is removed from the address so a reload doesn't repeat it. */
function langFromLink() {
  try {
    if (/\/es\/(index\.html)?$/.test(location.pathname)) return "es";
    const l = new URLSearchParams(location.search).get("lang");
    if (l !== "es" && l !== "en") return null;
    history.replaceState(null, "", location.pathname + location.hash);
    return l;
  } catch { return null; }
}
const saved = lsGet(KEYS.prefs) || {};
const fromLink = langFromLink();
if (fromLink) lsSet(KEYS.prefs, { ...saved, lang: fromLink });
const ui = {
  lang: fromLink || (saved.lang === "es" || saved.lang === "en" ? saved.lang : detectLang()),
  mode: MODES.includes(saved.mode) ? saved.mode : "smart",
  size: SIZES.includes(saved.size) ? saved.size : 10,
  timer: TIMERS.includes(saved.timer) ? saved.timer : 60,
  // Replaces the old "levels" setting on purpose: that one was saved as "auto" for everyone, chosen or not.
  order: saved.order === "basics" ? "basics" : "interview",
  cats: Array.isArray(saved.cats) ? new Set(saved.cats) : null,
};
// "All" is saved as an empty list, so a topic added later is part of it.
const savePrefs = () => lsSet(KEYS.prefs, { ...ui, cats: ui.cats && !allPicked() ? [...ui.cats] : [] });

const t = (key, vars) => {
  let s = STRINGS[ui.lang][key] ?? STRINGS.en[key] ?? key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, () => vars[k]);
  return s;
};
const groupName = (k) => (ui.lang === "es" ? GROUP[k].name_es : GROUP[k].name);
const inGroup = (g) => TOPICS.filter((c) => c.g === g);
const allPicked = () => ui.cats.size === TOPICS.length;
/** "true" when every topic of the group is picked, "mixed" when only some are. With everything on, only All lights up. */
const groupState = (g) => { const ks = inGroup(g).map((c) => c.k), n = ks.filter((k) => ui.cats.has(k)).length; return allPicked() ? "false" : n && n === ks.length ? "true" : n ? "mixed" : "false"; };
/** With everything on, a tap narrows to that choice. Clearing the last choice goes back to everything, so a session is never empty. */
function pickTopics(keys) {
  if (allPicked()) ui.cats = new Set(keys);
  else { const on = keys.every((k) => ui.cats.has(k)); keys.forEach((k) => (on ? ui.cats.delete(k) : ui.cats.add(k))); }
  if (!ui.cats.size) TOPICS.forEach((c) => ui.cats.add(c.k));
  homeQ = null; savePrefs(); render();
}
const topicName = (k) => (ui.lang === "es" ? TOPIC[k].name_es : TOPIC[k].name);
const lv = (n) => t(`lv.${n}`);

/** The text of a question in the current language. Falls back to English field by field. */
function qx(q) {
  const e = ui.lang === "es" ? ES?.q?.[q.id] : null;
  const ans = q.t === "m" ? (e?.fa ?? e?.o?.[q.a] ?? q.fa ?? q.o[q.a]) : (e?.a ?? q.a);
  return { q: e?.q ?? q.q, o: e?.o ?? q.o, ans, hasFull: q.t === "m" ? !!q.fa && q.fa !== q.o[q.a] : false, e: e?.e ?? q.e, r: e?.r ?? q.r };
}
function gx(key) {
  const g = GL[key], e = ui.lang === "es" ? ES?.gl?.[key] : null;
  return { name: e?.[0] || g[0], def: e?.[1] || g[1] };
}
/** The question, plus the first line of its code when it has one, so look-alike questions can be told apart in lists. */
const stem = (q) => inline(qx(q).q) + (q.c ? ` <code class="hint">${esc((q.c.split("\n").find((l) => l.trim()) || "").trim().slice(0, 60))}</code>` : "");
const code = (c) => `<pre class="code" tabindex="0"><code>${highlight(c)}</code></pre>`;

/* ---------- saving ---------- */
let sync = null, pushTimer = null, dirty = false, deleting = false, overwrite = false;
const acct = { user: null, status: "idle", note: "", noteErr: false };

function save() {
  P.updatedAt = Date.now();
  lsSet(KEYS.progress, P);
  dirty = true;
  if (acct.user) { clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 60000); }
}
/** One document, written at most once a minute and at the end of a session, to stay well inside free quotas. */
async function pushNow() {
  clearTimeout(pushTimer);
  if (!acct.user || !sync || !dirty || deleting) return;
  dirty = false;
  try {
    // Another device may have saved since we last looked: merge it in before writing, so nothing is lost.
    // After "erase progress" the next write replaces the cloud copy instead.
    if (!overwrite) {
      const remote = await sync.pull();
      if (remote) { P = mergeProgress(P, sanitizeProgress(remote, BYID)); refreshLevels(P, BANK, TOPICS); lsSet(KEYS.progress, P); }
    }
    await sync.push(P);
    overwrite = false;
    acct.status = "synced";
  } catch { dirty = true; acct.status = "error"; }
  paintAcct();
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") pushNow(); });

async function connect() {
  if (!CONFIG.firebase) return;
  sync = await import("./sync.js");
  await sync.watchUser(onUser);
}
async function onUser(user) {
  acct.user = user ? { name: user.displayName || user.email || "", email: user.email || "" } : null;
  if (!user) { lsDel(KEYS.signed); acct.status = "idle"; paintAcct(); return; }
  lsSet(KEYS.signed, 1);
  if (P.owner && P.owner !== user.uid) { P = blankProgress(); refreshLevels(P, BANK, TOPICS); }
  P.owner = user.uid; lsSet(KEYS.progress, P);
  acct.status = "syncing"; paintAcct();
  try {
    const remote = await sync.pull();
    let changed = true;
    if (remote) {
      const before = JSON.stringify(sanitizeProgress(remote, BYID));
      P = mergeProgress(P, sanitizeProgress(remote, BYID)); refreshLevels(P, BANK, TOPICS); lsSet(KEYS.progress, P);
      changed = JSON.stringify(sanitizeProgress(P, BYID)) !== before; // nothing new locally: skip the write
    }
    if (changed) { dirty = true; await pushNow(); }
    acct.status = "synced";
  } catch { acct.status = "error"; }
  paintAcct();
  if (route().name === "home" && !S) render();
}
function paintAcct() {
  $("acct-dot").hidden = !acct.user || acct.status === "error";
  if (route().name === "account") render();
}

/* ---------- selection ---------- */
const basics = () => ui.order === "basics";
const unlocked = (q) => !basics() || q.l <= (P.levels[q.cat] ?? 0);
/** What Random and Exam draw from. Foundations only come up in those when the person asked to start from the basics. */
const drawable = (q) => (basics() ? unlocked(q) : q.l > 0);
const newRank = (q) => (basics() ? q.l : interviewTier(q));
const it = (q) => P.items[q.id];
const statusOf = (q) => { const x = it(q); return !x ? "new" : x.b >= 4 ? "mastered" : x.b === 1 ? "missed" : "learning"; };
const countStatus = (list, s) => list.filter((q) => statusOf(q) === s).length;
const inCats = (cats) => BANK.filter((q) => cats.has(q.cat));
const due = (list) => { const now = Date.now(); return list.filter((q) => { const x = it(q); return x && x.d <= now; }); };
const unseen = (list) => list.filter((q) => !it(q));
const newInOrder = (list) => shuffle(list).sort((a, b) => newRank(a) - newRank(b));

function smartList(cats, n) {
  const pool = inCats(cats).filter(unlocked);
  const d = due(pool).sort((a, b) => it(a).b - it(b).b || it(a).d - it(b).d);
  return shuffle(d.concat(newInOrder(unseen(pool))).slice(0, n));
}
function modeList(mode) {
  const pool = inCats(ui.cats).filter(drawable);
  if (mode === "smart") return smartList(ui.cats, ui.size);
  if (mode === "weak") return shuffle(inCats(ui.cats).filter((q) => it(q)?.b === 1)).slice(0, ui.size);
  if (mode === "exam") return shuffle(pool.filter((q) => q.t === "m")).slice(0, ui.size);
  return shuffle(pool).slice(0, ui.size);
}
function modeAvailable(mode) {
  const pool = inCats(ui.cats).filter(drawable);
  if (mode === "smart") { const all = inCats(ui.cats).filter(unlocked); return due(all).length + unseen(all).length; }
  if (mode === "weak") return inCats(ui.cats).filter((q) => it(q)?.b === 1).length;
  if (mode === "exam") return pool.filter((q) => q.t === "m").length;
  return pool.length;
}

/* ---------- pieces ---------- */
function termsHTML(q) {
  const keys = (q.g || []).filter((k) => GL[k]);
  if (!keys.length) return "";
  return `<div class="terms"><h3>${t("q.terms")}</h3>${keys.map((k) => {
    const g = gx(k);
    return `<details><summary>${esc(g.name)}</summary><p>${inline(g.def)}</p><p><a href="#/term/${k}">${t("q.termqs")}</a></p></details>`;
  }).join("")}</div>`;
}
function explanationHTML(q) {
  const x = qx(q);
  let h = "";
  if (q.t === "m") {
    if (x.hasFull) h += `<div class="answer"><h3>${t("q.answer")}</h3>${richText(x.ans)}</div>`;
    h += `<div class="answer"><h3>${t("q.why")}</h3>${richText(x.e)}${q.ec ? code(q.ec) : ""}</div>`;
  } else h += `<div class="answer"><h3>${t("q.model")}</h3>${richText(x.ans)}${q.ac ? code(q.ac) : ""}</div>`;
  if (x.r) h += `<p class="remember">${inline(x.r)}</p>`;
  return h + termsHTML(q);
}
function metaHTML(q) {
  const x = it(q);
  return `<div class="qmeta"><a href="#/topics/${q.cat}">${esc(topicName(q.cat))}</a><span>${lv(q.l)}</span>${q.t === "f" ? `<span>${t("q.flash")}</span>` : ""}<span>${x ? t("q.box", { n: x.b }) : t("q.new")}</span></div>`;
}
function optionsHTML(q, order, state) {
  const x = qx(q);
  return `<div class="opts">${order.map((oi, k) => {
    let cls = "";
    if (state) cls = oi === q.a ? "ok" : k === state.picked ? "bad" : "dim";
    return `<button type="button" class="opt ${cls}" data-k="${k}"${state ? " disabled" : ""}><span class="k">${k + 1}</span><span>${inline(x.o[oi])}</span></button>`;
  }).join("")}</div>`;
}
function boxesHTML(list = BANK) {
  const c = boxCounts(P, list), top = Math.max(1, ...c.slice(1));
  const dueN = due(list).length;
  return `<div class="boxes" role="img" aria-label="${[1, 2, 3, 4, 5].map((b) => `${t("q.box", { n: b })}: ${c[b]}`).join(", ")}">${[1, 2, 3, 4, 5].map((b) => `
    <div class="box b${b}"><div class="fill" style="height:${c[b] ? Math.max(4, Math.round(70 * Math.sqrt(c[b] / top))) : 0}%"></div><div class="front"><b>${c[b]}</b>${b}</div></div>`).join("")}</div>
  <p class="boxes-cap"><span>${t("home.boxes.hint")}</span>${dueN ? `<span>${t("home.due", { n: dueN })}</span>` : ""}</p>`;
}
const SEARCH_ICON = `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M9 15.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm4.8-1.7L18 18"/></svg>`;
const searchBox = (v = "") => `<div class="search" role="search">${SEARCH_ICON}<input id="q" type="search" enterkeyhint="search" autocomplete="off" aria-label="${t("home.search")}" placeholder="${t("home.search")}" value="${esc(v)}"><kbd aria-hidden="true">/</kbd></div>`;
const STEP_ICONS = [
  '<path d="M5 12.500 10 17.500 19 7"/>',
  '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2V16h5v-.1c0-.8.400-1.500 1-2A6 6 0 0 0 12 3Z"/>',
  '<path d="M4 12a8 8 0 0 1 14-5.300L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.300L4 15M4 20v-5h5"/>',
].map((p) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`);
/** Two rows of well-known names that scroll sideways. Decorative, so hidden from screen readers. */
const MARQUEE = [
  ["Python", "Java", "Spring Boot", "JPA", "SQL", "REST", "Docker", "Kubernetes", "Git", "JWT", "CI/CD", "Redis", "Big-O"],
  ["Microservices", "OAuth", "Maven", "JUnit", "React", "HTTP", "Indexes", "Transactions", "Caching", "OWASP", "Linux", "Concurrency", "STAR method"],
];
const marqueeHTML = () => `<div class="marquee rv" aria-hidden="true">${MARQUEE.map((row, i) => {
  const set = `<div class="mq-set">${row.map((w) => `<span>${w}</span>`).join("")}</div>`;
  return `<div class="mq-row${i ? " rev" : ""}">${set}${set}</div>`;
}).join("")}</div>`;

function resultsHTML(hits) {
  return `<ul class="results">${hits.map((h) => {
    if (h.kind === "topic") return `<li><a href="#/topics/${h.key}"><b>${esc(topicName(h.key))}</b><small>${t("search.topic")}</small></a></li>`;
    if (h.kind === "term") { const g = gx(h.key); return `<li><a href="#/term/${h.key}"><b>${esc(g.name)}</b><small>${t("search.term")}: ${inline(g.def.slice(0, 110))}${g.def.length > 110 ? "..." : ""}</small></a></li>`; }
    const q = BYID[h.key];
    return `<li><a href="#/q/${h.key}"><b>${stem(q)}</b><small>${t("search.q")}, ${esc(topicName(q.cat))}, ${lv(q.l)}</small></a></li>`;
  }).join("")}</ul>`;
}
function runSearch(query, limit) {
  if (!DOCS) DOCS = searchDocs({ bank: BANK, glossary: GL, topics: TOPICS, groups: GROUPS, es: ES });
  return search(DOCS, query, limit);
}
function loadEs() {
  if (ES) return Promise.resolve(ES);
  esLoading ||= fetch(at("data/bank.es.json")).then((r) => { if (!r.ok) throw 0; return r.json(); })
    .then((j) => { ES = { q: bare(j.q), gl: bare(j.gl) }; DOCS = null; return j; })
    .catch((e) => { esLoading = null; throw e; });
  return esLoading;
}

/* ---------- views ---------- */
let homeQ = null, homeGroup = "all";
function pickHome() {
  const pool = inCats(ui.cats).filter((q) => q.t === "m" && !q.c && unlocked(q));
  const d = due(pool), n = unseen(pool);
  const list = d.length ? d : n.length ? n.filter((q) => newRank(q) === Math.min(...n.map(newRank))) : pool;
  const q = list[Math.floor(Math.random() * list.length)] || shuffle(inCats(ui.cats).filter((x) => x.t === "m" && !x.c))[0] || BANK[0];
  return { q, order: shuffle(q.o.map((_, i) => i)) };
}
function viewHome() {
  document.title = t("title.home");
  if (!homeQ) homeQ = pickHome();
  const q = homeQ.q, x = qx(q), showBoxes = P.stats.answered > 0;
  const nTerms = Object.keys(GL).length;
  const stat = (n, label, i) => `<div class="stat rv" style="--i:${i}"><b data-count="${n}">${n}</b><span>${label}</span></div>`;
  main.innerHTML = `
  <section class="hero-grid">
    <div class="hero-copy">
      <p class="badge"><i class="dot" aria-hidden="true"></i>${t("home.badge", { n: BANK.length })}</p>
      <h1>${t("home.h1").replace("<mark>", '<mark class="grad">')}</h1>
      <p class="lead">${t("home.lead")}</p>
      ${searchBox()}
      <div class="quickrow">
        <button type="button" class="btn pri" data-go="quick">${t("home.start", { n: ui.size })}</button>
        <a class="btn" href="#/practice">${t("home.custom")}</a>
      </div>
    </div>
    <div class="deck" id="hero-q">
      <article class="card beam spot tilt">
        ${metaHTML(q)}
        <p class="qtext">${inline(x.q)}</p>
        ${optionsHTML(q, homeQ.order)}
      </article>
    </div>
    <div id="found" hidden></div>
  </section>
  ${marqueeHTML()}
  <div class="stats-grid">${stat(BANK.length, t("stat.q"), 0)}${stat(nTerms, t("stat.t"), 1)}${stat(TOPICS.length, t("stat.c"), 2)}${stat(2, t("stat.l"), 3)}</div>
  ${showBoxes ? `<section class="section"><h2>${t("home.boxes")}</h2>${boxesHTML()}</section>` : ""}
  <section class="section">
    <div class="sec-head rv"><h2>${t("home.topics")}</h2></div>
    ${GROUPS.length > 1 ? `<div class="chips gfilter" role="group" aria-label="${t("home.groups")}"><button type="button" class="chip" data-hg="all" aria-pressed="${homeGroup === "all"}">${t("home.allgroups")} <small>${TOPICS.length}</small></button>${GROUPS.map((g) => `<button type="button" class="chip" data-hg="${g.k}" aria-pressed="${homeGroup === g.k}">${esc(groupName(g.k))} <small>${inGroup(g.k).length}</small></button>`).join("")}</div>` : ""}
    ${(() => { let i = 0; return GROUPS.filter((g) => homeGroup === "all" || g.k === homeGroup).map((g) => `<div class="grp"><h3 class="grp-h">${esc(groupName(g.k))}</h3><div class="topics">${inGroup(g.k).map((c) => {
      const qs = BANK.filter((q) => q.cat === c.k), seen = qs.filter((q) => it(q)?.b >= 4).length;
      return `<a class="tcard spot rv" style="--h:${topicHue(c.k)};--i:${i++ % 3}" href="#/topics/${c.k}"><span class="ti">${topicIcon(c.k)}</span><b>${esc(topicName(c.k))}</b><small>${seen ? `${seen} / ` : ""}${t("home.nq", { n: qs.length })}</small>${seen ? `<span class="bar" aria-hidden="true"><i style="width:${pct(seen, qs.length)}%"></i></span>` : ""}</a>`;
    }).join("")}</div></div>`).join(""); })()}
    <p><a href="#/terms">${t("home.glossary", { n: nTerms })}</a></p>
  </section>
  <section class="section">
    <div class="sec-head rv"><span class="eyebrow">${t("how.eyebrow")}</span><h2>${t("how.h")}</h2></div>
    <div class="steps">${[1, 2, 3].map((n) => `<div class="step rv" style="--i:${n - 1}"><span class="si">${STEP_ICONS[n - 1]}</span><b>${t(`how.${n}`)}</b><p>${t(`how.${n}d`)}</p></div>`).join("")}</div>
  </section>`;
}
function viewSearch(query) {
  document.title = t("title.search");
  main.innerHTML = `<div class="stack"><h1>${t("title.search")}</h1>${searchBox(query)}<div id="found"></div></div>`;
  paintSearch(query, 100, false);
}
function paintSearch(query, limit, compact) {
  const box = $("found");
  if (!box) return;
  const q = query.trim();
  if (compact) { box.hidden = !q; box.closest(".hero-grid")?.classList.toggle("searching", !!q); }
  if (!q) { box.innerHTML = ""; if (compact) $("hero-q")?.removeAttribute("hidden"); return; }
  if (compact) $("hero-q")?.setAttribute("hidden", "");
  const all = runSearch(q, 400), hits = all.slice(0, limit);
  box.innerHTML = !all.length ? `<p class="muted">${t("search.empty")}</p>`
    : `<p class="muted small" role="status">${t("search.results", { n: all.length })}</p>${resultsHTML(hits)}${all.length > limit ? `<p><a href="#/search/${encodeURIComponent(q)}">${t("search.all", { n: all.length })}</a></p>` : ""}`;
}

const panels = new Set();
const panelOpen = (name) => (panels.has(name) ? " open" : "");
function viewPractice() {
  document.title = t("title.practice");
  const avail = modeAvailable(ui.mode), empty = ui.mode === "weak" ? "setup.empty.weak" : "setup.empty.smart";
  const pool = inCats(ui.cats).filter(unlocked), dueN = Math.min(due(pool).length, ui.size), newN = Math.min(unseen(pool).length, ui.size - dueN);
  const weak = TOPICS.map((c) => [c.k, countStatus(BANK.filter((q) => q.cat === c.k), "missed")]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).slice(0, 3);
  main.innerHTML = `<div class="stack">
  <h1>${t("title.practice")}</h1>
  <p class="muted">${ui.mode === "smart" ? t("setup.today", { d: dueN, n: newN }) : t(`mode.${ui.mode}.d`)}</p>
  <div class="chips" role="group" aria-label="${t("setup.topics")}">
    <button type="button" class="chip gchip" data-allcats aria-pressed="${allPicked()}">${t("setup.all")}</button>
    ${GROUPS.map((g) => `<button type="button" class="chip gchip" data-grp="${g.k}" aria-pressed="${groupState(g.k)}">${esc(groupName(g.k))}</button>`).join("")}
  </div>
  <details class="more" data-panel="topics"${panelOpen("topics")}><summary>${t("setup.one")}</summary>
    <div class="chips">${TOPICS.map((c) => `<button type="button" class="chip" data-cat="${c.k}" aria-pressed="${!allPicked() && ui.cats.has(c.k)}">${esc(topicName(c.k))}</button>`).join("")}</div>
  </details>
  <button type="button" class="btn pri block" data-go="mode"${avail ? "" : " disabled"}>${avail ? t("setup.go", { n: Math.min(avail, ui.size) }) : t(empty)}</button>
  ${weak.length ? `<section class="section"><h2>${t("setup.weak")}</h2><div>${weak.map(([k, n]) => `<a class="topic-row" href="#/topics/${k}/missed"><b>${esc(topicName(k))}</b><small>${t("setup.missed", { n })}</small></a>`).join("")}</div></section>` : ""}
  <details class="more" data-panel="options"${panelOpen("options")}><summary>${t("setup.options")}</summary>
    <h2>${t("setup.mode")}</h2>
    <div class="chips">${MODES.map((m) => `<button type="button" class="chip" data-mode="${m}" aria-pressed="${ui.mode === m}">${t(`mode.${m}`)}</button>`).join("")}</div>
    <p class="muted small">${t(`mode.${ui.mode}.d`)}</p>
    <h2>${t("setup.level")}</h2>
    <div class="chips">${["interview", "basics"].map((o) => `<button type="button" class="chip" data-order="${o}" aria-pressed="${ui.order === o}">${t(`setup.${o}`)}</button>`).join("")}</div>
    <p class="muted small">${t(`setup.${ui.order}.hint`)}</p>
    <h2>${t("setup.size")}</h2>
    <div class="chips">${SIZES.map((s) => `<button type="button" class="chip" data-size="${s}" aria-pressed="${ui.size === s}">${s}</button>`).join("")}</div>
    ${ui.mode === "exam" ? `<h2>${t("setup.time")}</h2><div class="chips">${TIMERS.map((s) => `<button type="button" class="chip" data-timer="${s}" aria-pressed="${ui.timer === s}">${s}</button>`).join("")}</div>` : ""}
  </details></div>`;
}

/* session */
let S = null;
function startSession(list, opts = {}) {
  if (!list.length) { toast(t("setup.empty.smart")); return; }
  stopTimer();
  refreshLevels(P, BANK, TOPICS);
  S = { list, idx: 0, right: 0, missed: [], unknown: [], exam: !!opts.exam, timeouts: 0, tick: null, ups: [], done: false };
  enterQuestion(opts.order);
  if (location.hash !== "#/quiz") location.hash = "#/quiz"; else render();
}
function enterQuestion(order) {
  const q = S.list[S.idx];
  S.order = order || (q.t === "m" ? shuffle(q.o.map((_, i) => i)) : null);
  S.state = null; S.revealed = false; S.ends = null;
}
function stopTimer() { if (S?.tick) { clearInterval(S.tick); S.tick = null; } }
function startTimer() {
  stopTimer();
  const total = ui.timer * 1000;
  S.ends ||= Date.now() + total;
  const upd = () => {
    const left = Math.max(0, S.ends - Date.now()), box = $("timer");
    if (box) {
      box.classList.toggle("low", left <= 10000);
      box.firstElementChild.textContent = `${Math.ceil(left / 1000)} s`;
      box.querySelector("i").style.width = `${(100 * left) / total}%`;
    }
    if (left <= 0) { stopTimer(); answer(-1); }
  };
  upd();
  S.tick = setInterval(upd, 250);
}
function setBar(buttons) {
  const on = !!buttons;
  $("bar").hidden = !on;
  main.classList.toggle("has-bar", on);
  $("bar-in").innerHTML = on ? buttons.map(([l, c, a]) => `<button type="button" class="btn ${c}" data-act="${a}">${l}</button>`).join("") : "";
}
function viewQuiz() {
  if (!S) { location.hash = "#/practice"; return; }
  if (S.done) return viewDone();
  document.title = t("title.quiz");
  document.body.classList.add("in-quiz");
  const q = S.list[S.idx], n = S.list.length, x = qx(q), last = S.idx + 1 >= n;
  let after = "";
  if (S.state) {
    const letter = S.order.indexOf(q.a) + 1;
    const label = S.state.dunno ? t("q.dunno.a", { k: letter }) : S.state.timedOut ? t("q.timeup", { k: letter }) : S.state.ok ? t("q.correct") : t("q.wrong", { k: letter });
    after = `<p class="fb ${S.state.dunno ? "dunno" : S.state.ok ? "ok" : "bad"}" role="status">${label}</p>${explanationHTML(q)}<a class="small" href="#/suggest?ref=${q.id}">${t("q.fix")}</a>`;
  } else if (S.revealed) after = `${explanationHTML(q)}<a class="small" href="#/suggest?ref=${q.id}">${t("q.fix")}</a>`;
  main.innerHTML = `<div class="stack">
  <div class="qtop"><div class="grow"><span>${t("q.of", { i: S.idx + 1, n })}</span><div class="progress-line"><i style="width:${(100 * (S.idx + (S.state ? 1 : 0))) / n}%"></i></div></div>
    <button type="button" class="linkbtn" data-act="end">${t("q.end")}</button></div>
  ${S.exam ? `<div class="timer" id="timer"><span></span><div class="progress-line"><i></i></div></div>` : ""}
  <article class="card">
    ${metaHTML(q)}
    <p class="qtext">${inline(x.q)}</p>
    ${q.c ? code(q.c) : ""}
    ${q.t === "m" ? optionsHTML(q, S.order, S.state) : ""}
    ${q.t === "m" && !S.state && !S.exam ? `<button type="button" class="btn dunno" data-act="dunno">${t("q.dunno")}</button>` : ""}
    ${after}
  </article></div>`;
  if (S.state) { setBar([[last ? t("q.results") : t("q.next"), "pri", "next"]]); if (S.exam) { $("timer").hidden = true; } }
  else if (q.t === "f") setBar(S.revealed ? [[t("q.missed"), "bad", "miss"], [t("q.got"), "good", "got"]] : [[t("q.show"), "pri", "reveal"]]);
  else setBar(null);
  if (S.exam && !S.state && q.t === "m") startTimer();
}
function grade(q, ok) {
  P.items[q.id] = gradeItem(P.items[q.id], ok);
  P.stats = gradeStats(P.stats, ok);
  if (ok) S.right++; else S.missed.push(q);
  const ups = refreshLevels(P, BANK, TOPICS);
  S.ups.push(...ups);
  save();
  if (ups.length && basics()) toast(ups.map((u) => t("q.levelup", { topic: topicName(u.cat), level: lv(u.level) })).join(" "));
}
function answer(k) {
  if (S.state) return;
  stopTimer();
  const q = S.list[S.idx], timedOut = k < 0, ok = !timedOut && S.order[k] === q.a;
  S.state = { picked: k, ok, timedOut };
  if (timedOut) S.timeouts++;
  grade(q, ok);
  viewQuiz();
  document.querySelector('#bar-in [data-act="next"]')?.focus({ preventScroll: true });
  document.querySelector(".fb")?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
function next() {
  S.idx++;
  if (S.idx >= S.list.length) return finish();
  enterQuestion();
  viewQuiz();
  scrollTo(0, 0);
}
function finish() {
  stopTimer();
  S.total = S.right + S.missed.length;
  S.done = true;
  pushNow();
  viewDone();
  scrollTo(0, 0);
}
/** A short burst of paper bits for a good session. Pure CSS, hidden under reduced motion. */
function confettiHTML() {
  const cols = ["#ffd93d", "#ff4f6a", "#7a5cff", "#2a5cf0", "#52e0a2"];
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) =>
    `<i style="--x:${Math.round(Math.random() * 100)}%;--c:${cols[i % cols.length]};--t:${(2.2 + Math.random() * 1.6).toFixed(2)}s;--w:${(Math.random() * 0.5).toFixed(2)}s;--s:${Math.round(Math.random() * 160 - 80)}px;--r:${Math.round(Math.random() * 720 - 360)}deg"></i>`).join("")}</div>`;
}
function viewDone() {
  document.title = t("title.done");
  document.body.classList.remove("in-quiz");
  main.innerHTML = `<div class="stack">
  <h1>${t("done.title")}</h1>
  ${S.total ? `<div class="done-top"><div class="ring" style="--p:${pct(S.right, S.total)}"><p class="score">${S.right} / ${S.total}</p></div>
  <p class="muted">${t("done.correct", { p: pct(S.right, S.total) })}${S.exam ? `, ${t("done.timeouts", { n: S.timeouts })}` : ""}</p></div>` : ""}
  ${pct(S.right, S.total) >= 80 && S.total >= 3 ? confettiHTML() : ""}
  <section class="section"><h2>${t("home.boxes")}</h2>${boxesHTML()}</section>
  ${S.missed.length || !S.unknown.length ? `<section class="section"><h2>${t("done.missed")}</h2>
  ${S.missed.length ? `<ul class="results">${S.missed.map((q) => `<li><a href="#/q/${q.id}"><b>${stem(q)}</b></a></li>`).join("")}</ul>` : `<p class="muted">${t("done.clean")}</p>`}</section>` : ""}
  ${S.unknown.length ? `<section class="section"><h2>${t("done.unknown")}</h2><ul class="results">${S.unknown.map((q) => `<li><a href="#/q/${q.id}"><b>${stem(q)}</b></a></li>`).join("")}</ul></section>` : ""}
  ${CONFIG.firebase && !acct.user ? `<p><a href="#/account">${t("done.save")}</a></p>` : ""}
  </div>`;
  const b = [[t("done.home"), "", "home"]], again = S.missed.length + S.unknown.length;
  if (again) b.push([t("done.retry", { n: again }), "pri", "retry"]);
  else b.push([t("done.again"), "pri", "again"]);
  setBar(b);
}

/* topics */
const FILTERS = ["all", "missed", "new", "mastered"];
const studyOpen = new Set();
const topicList = (k, f) => BANK.filter((q) => q.cat === k && (f === "all" || statusOf(q) === f)).sort((a, b) => newRank(a) - newRank(b));
const studyBody = (q) => `${q.c ? code(q.c) : ""}${explanationHTML(q)}<p><a class="small" href="#/suggest?ref=${q.id}">${t("q.fix")}</a></p>`;
function topicSummary(qs) {
  const missed = countStatus(qs, "missed");
  return t("setup.mastered", { m: countStatus(qs, "mastered"), t: qs.length }) + (missed ? ` · ${t("setup.missed", { n: missed })}` : "");
}
function viewTopics() {
  document.title = t("title.topics");
  main.innerHTML = `<div class="stack">
  <h1>${t("title.topics")}</h1>
  ${P.stats.answered ? `<section class="section" style="margin-top:0">${boxesHTML()}
    <div class="stats"><span>${t("stat.accuracy")}: <b>${pct(P.stats.correct, P.stats.answered)}%</b></span><span>${t("stat.answered")}: <b>${P.stats.answered}</b></span><span>${t("stat.streak")}: <b>${P.stats.best}</b></span></div></section>` : ""}
  <div>${GROUPS.map((g) => `<h2 class="grp-h">${esc(groupName(g.k))}</h2>${inGroup(g.k).map((c) => {
    const l = P.levels[c.k] ?? 0, s = l < 3 ? levelStats(P, BANK, c.k, l) : null;
    return `<a class="topic-row" href="#/topics/${c.k}"><b>${esc(topicName(c.k))}</b>${basics() ? `<small>${lv(l)}</small><small>${s ? t("setup.goal", { ok: s.ok, need: s.need, level: lv(l + 1) }) : t("setup.top")}</small>` : ""}<small>${topicSummary(BANK.filter((q) => q.cat === c.k))}</small></a>`;
  }).join("")}`).join("")}</div>
  <p><a href="#/terms">${t("home.glossary", { n: Object.keys(GL).length })}</a></p></div>`;
}
function viewTopic(cat, arg) {
  if (!TOPIC[cat]) return viewTopics();
  document.title = `${topicName(cat)}: Repaso`;
  const f = FILTERS.includes(arg) ? arg : "all", list = topicList(cat, f), allOpen = list.length && list.every((q) => studyOpen.has(q.id));
  main.innerHTML = `<div class="stack">
  <p class="crumb"><a href="#/topics">${t("title.topics")}</a></p>
  <h1>${esc(topicName(cat))}</h1>
  <p class="muted">${topicSummary(topicList(cat, "all"))}</p>
  <button type="button" class="btn pri" data-go="topic" data-cat-go="${cat}">${t("study.practice")}</button>
  <div class="chips">${FILTERS.map((x) => `<a class="chip" href="#/topics/${cat}/${x}"${f === x ? ' aria-current="true"' : ""} style="text-decoration:none">${t(`st.${x}.pl`)} <small>${topicList(cat, x).length}</small></a>`).join("")}</div>
  <section class="section" style="margin-top:0"><div class="row between"><p class="muted small">${t("study.lead")}</p>${list.length ? `<button type="button" class="linkbtn" data-expand>${allOpen ? t("study.collapse") : t("study.expand")}</button>` : ""}</div>
  ${list.length ? `<div id="st-list">${list.map((q) => { const s = statusOf(q); return `<details class="sitem" data-id="${q.id}"${studyOpen.has(q.id) ? " open" : ""}><summary><span>${stem(q)}</span><span class="st st-${s}">${t(`st.${s}`)}</span></summary><div class="sbody">${studyOpen.has(q.id) ? studyBody(q) : ""}</div></details>`; }).join("")}</div>` : `<p class="muted">${t("study.none")}</p>`}</section></div>`;
}
function viewQuestion(id) {
  const q = BYID[id];
  if (!q) { main.innerHTML = `<p>${t("q.missing")}</p>`; return; }
  document.title = `${id}: Repaso`;
  main.innerHTML = `<article class="card">${metaHTML(q)}<h1 class="qtext">${inline(qx(q).q)}</h1>${studyBody(q)}
  <button type="button" class="btn pri" data-go="one" data-id="${id}">${t("q.practice")}</button></article>`;
}
function viewTerm(key) {
  if (!GL[key]) return viewTerms();
  const g = gx(key), qs = BANK.filter((q) => q.g?.includes(key));
  document.title = `${g.name}: Repaso`;
  main.innerHTML = `<div class="stack"><h1>${esc(g.name)}</h1><p>${inline(g.def)}</p>
  <section class="section"><h2>${t("q.termqs")}</h2>${qs.length ? `<ul class="results">${qs.map((q) => `<li><a href="#/q/${q.id}"><b>${stem(q)}</b><small>${esc(topicName(q.cat))}, ${lv(q.l)}</small></a></li>`).join("")}</ul>` : `<p class="muted">${t("term.none")}</p>`}</section>
  <p><a href="#/terms">${t("term.back")}</a></p></div>`;
}
function viewTerms() {
  document.title = t("title.terms");
  const list = Object.keys(GL).map((k) => [k, gx(k)]).sort((a, b) => a[1].name.localeCompare(b[1].name, ui.lang));
  main.innerHTML = `<div class="stack"><h1>${t("title.terms")}</h1>${searchBox()}<div id="found"></div>
  <ul class="results" id="allterms">${list.map(([k, g]) => `<li><a href="#/term/${k}"><b>${esc(g.name)}</b></a></li>`).join("")}</ul></div>`;
}
function viewPage(name) {
  document.title = t(`title.${name}`);
  main.innerHTML = `<div class="prose">${PAGES[ui.lang][name]}</div>`;
}
function viewAccount() {
  document.title = t("title.account");
  let auth;
  if (!CONFIG.firebase) auth = `<p class="notice">${t("acct.off")}</p>`;
  else if (acct.user) auth = `<p>${t("acct.in", { name: esc(acct.user.name) })}</p>
    ${acct.status === "error" ? `<p class="notice err">${t("acct.fail")}</p>` : `<p class="muted">${acct.status === "syncing" ? t("acct.syncing") : t("acct.synced")}</p>`}
    <div class="row"><button type="button" class="btn" data-acct="out">${t("acct.out")}</button></div>`;
  else auth = `<p>${t("acct.lead")}</p><div class="stack">${CONFIG.providers.map((p) => `<button type="button" class="btn block" data-signin="${p}">${t(`acct.${p}`)}</button>`).join("")}</div>`;
  main.innerHTML = `<div class="stack">
  <h1>${t("title.account")}</h1>
  ${acct.note ? `<p class="notice${acct.noteErr ? " err" : ""}" role="status">${esc(acct.note)}</p>` : ""}
  ${auth}
  ${P.stats.answered ? `<section class="section">${boxesHTML()}</section>` : ""}
  <section class="section"><h2>${t("acct.data")}</h2>
    <div class="stack" style="align-items:flex-start">
      <button type="button" class="btn" data-acct="export">${t("acct.export")}</button>
      <label class="btn">${t("acct.import")}<input id="import" type="file" accept="application/json,.json" hidden></label>
      <button type="button" class="linkbtn" data-arm="reset">${armed.reset ? t("acct.reset2") : t("acct.reset")}</button>
      ${acct.user ? `<button type="button" class="linkbtn" data-arm="delete">${armed.delete ? t("acct.delete2") : t("acct.delete")}</button>` : ""}
    </div>
    <p class="small"><a href="#/privacy">${t("foot.privacy")}</a></p>
  </section></div>`;
}
function viewSuggest(params) {
  document.title = t("title.suggest");
  const ref = (params.get("ref") || "").slice(0, 12);
  const canSend = !!(CONFIG.firebase && acct.user);
  main.innerHTML = `<form class="stack" id="sug">
  <h1>${t("title.suggest")}</h1><p>${t("sug.lead")}</p>
  <label class="field">${t("sug.kind")}<select id="sug-kind"><option value="fix">${t("sug.fix")}</option><option value="new"${ref ? "" : " selected"}>${t("sug.new")}</option></select></label>
  <label class="field">${t("sug.ref")}<input id="sug-ref" style="padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--card)" maxlength="12" value="${esc(ref)}"></label>
  <label class="field">${t("sug.text")}<textarea id="sug-text" maxlength="2000" required></textarea></label>
  <p class="notice" id="sug-msg" role="status" hidden></p>
  <div class="row"><button type="button" class="btn${canSend ? "" : " pri"}" data-sug="github">${t("sug.github")}</button>${canSend ? `<button type="submit" class="btn pri">${t("sug.send")}</button>` : ""}</div>
  <p class="muted small">${t("sug.hint")}</p></form>`;
  if (ref) $("sug-kind").value = "fix";
}

/* ---------- router ---------- */
const ROUTES = new Set(["home", "practice", "quiz", "topics", "q", "term", "terms", "search", "about", "privacy", "account", "suggest"]);
function route() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  const parts = path.split("/").map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  if (parts[0] === "study") parts[0] = "topics"; // links saved before Study became Topics
  return { name: ROUTES.has(parts[0]) ? parts[0] : "home", a: parts[1], b: parts[2], params: new URLSearchParams(qs || "") };
}
let lastHash = null;
function focusKey() {
  const a = document.activeElement;
  if (!a || a === document.body || !main.contains(a)) return null;
  for (const [k, v] of Object.entries(a.dataset)) return `[data-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}="${CSS.escape(v)}"]`;
  return a.id ? `#${CSS.escape(a.id)}` : null;
}
function render() {
  const keep = lastHash === location.hash ? focusKey() : null;
  lastHash = location.hash;
  const r = route();
  document.documentElement.lang = ui.lang;
  if (r.name !== "quiz") { stopTimer(); setBar(null); document.body.classList.remove("in-quiz"); }
  const views = {
    home: viewHome, practice: viewPractice, quiz: viewQuiz, topics: () => (r.a ? viewTopic(r.a, r.b) : viewTopics()), q: () => viewQuestion(r.a),
    term: () => viewTerm(r.a), terms: viewTerms, search: () => viewSearch(r.a || ""), about: () => viewPage("about"),
    privacy: () => viewPage("privacy"), account: viewAccount, suggest: () => viewSuggest(r.params),
  };
  main.dataset.view = r.name;
  views[r.name]();
  scan(main);
  if (keep) main.querySelector(keep)?.focus({ preventScroll: true });
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const on = a.dataset.nav === r.name || (a.dataset.nav === "practice" && r.name === "quiz");
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}
function paintChrome() {
  document.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
  const langBtn = $("lang");
  langBtn.textContent = t("lang.other"); langBtn.setAttribute("aria-label", t("bar.lang"));
  $("theme").setAttribute("aria-label", t("aria.theme"));
  $("acct").setAttribute("aria-label", t("aria.account"));
  document.querySelector(".brand").setAttribute("aria-label", t("aria.home"));
  document.querySelector(".skip").textContent = t("skip");
  $("foot-browse").setAttribute("href", at(ui.lang === "es" ? "es/t/" : "t/"));
}
let wantSearch = false;
window.addEventListener("hashchange", () => {
  render(); scrollTo(0, 0);
  if (wantSearch && $("q")) $("q").focus(); else main.focus({ preventScroll: true });
  wantSearch = false;
});

/* ---------- events ---------- */
let toastT;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, 4000);
}
const armed = {};
function arm(btn, name, label, run) {
  if (armed[name]) { clearTimeout(armed[name]); armed[name] = null; run(); return; }
  btn.textContent = label;
  armed[name] = setTimeout(() => { armed[name] = null; if (route().name === "account") render(); }, 5000);
}
function note(msg, err = false) { acct.note = msg; acct.noteErr = err; if (route().name === "account") render(); }

async function doSignIn(p) {
  try {
    if (!sync) await connect();
    await sync.signIn(p);
    note("");
  } catch (e) {
    if (e?.code === "repaso/link-needed") note(t("acct.linkneeded"));
    else if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") { console.warn("Sign-in failed:", e?.code || e); note(t("acct.signfail"), true); }
  }
}
function exportProgress() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(P, null, 1)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = "repaso-progress.json"; a.click();
  URL.revokeObjectURL(url);
}
function issueUrl(kind, ref, text) {
  const title = (kind === "fix" ? `Fix ${ref || "question"}: ` : "New question: ") + text.slice(0, 60).replace(/\s+/g, " ");
  const body = `${ref ? `Question: ${ref}\n\n` : ""}${text.slice(0, 1500)}`;
  return `https://github.com/${CONFIG.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

document.addEventListener("click", async (e) => {
  const el = e.target.closest("button, [data-act], summary");
  if (!el) return;
  const d = el.dataset;
  if (el.id === "lang") return switchLang();
  if (el.id === "theme") return switchTheme();
  if (el.classList.contains("opt") && !el.disabled) {
    const k = +d.k;
    if (route().name === "home" || !route().name) {
      const first = homeQ; homeQ = null;
      const rest = smartList(ui.cats, ui.size).filter((q) => q.id !== first.q.id).slice(0, ui.size - 1);
      startSession([first.q, ...rest], { order: first.order });
      answer(k);
    } else answer(k);
    return;
  }
  if (d.act) {
    const q = S?.list[S.idx];
    if (d.act === "reload") location.reload();
    else if (d.act === "reveal") { S.revealed = true; viewQuiz(); }
    else if (d.act === "next") next();
    else if (d.act === "got" || d.act === "miss") { grade(q, d.act === "got"); next(); }
    else if (d.act === "end") finish();
    else if (d.act === "home") { S = null; homeQ = null; location.hash = "#/"; }
    else if (d.act === "retry") startSession(shuffle([...S.missed, ...S.unknown]), { exam: S.exam });
    else if (d.act === "dunno") { // shows the answer and changes nothing: not a miss, no box, no stats
      if (S.state) return;
      S.state = { picked: -1, ok: false, dunno: true };
      S.unknown.push(q);
      viewQuiz();
      document.querySelector('#bar-in [data-act="next"]')?.focus({ preventScroll: true });
    }
    else if (d.act === "again") { const list = smartList(ui.cats, ui.size); if (!list.length) return toast(t("setup.empty.smart")); S = null; startSession(list); }
    return;
  }
  if (d.go) {
    if (d.go === "quick") startSession(smartList(ui.cats, ui.size));
    else if (d.go === "mode") startSession(modeList(ui.mode), { exam: ui.mode === "exam" });
    else if (d.go === "topic") startSession(smartList(new Set([d.catGo]), ui.size));
    else if (d.go === "one") startSession([BYID[d.id]]);
    return;
  }
  if (d.mode) { ui.mode = d.mode; savePrefs(); render(); }
  else if (d.cat) pickTopics([d.cat]);
  else if (d.grp) pickTopics(inGroup(d.grp).map((c) => c.k));
  else if (d.hg) { homeGroup = d.hg; render(); }
  else if ("allcats" in d) { TOPICS.forEach((c) => ui.cats.add(c.k)); homeQ = null; savePrefs(); render(); }
  else if (d.order) { ui.order = d.order; homeQ = null; savePrefs(); render(); }
  else if (d.size) { ui.size = +d.size; savePrefs(); render(); }
  else if (d.timer) { ui.timer = +d.timer; savePrefs(); render(); }
  else if ("expand" in d) {
    const r = route(), list = topicList(r.a, FILTERS.includes(r.b) ? r.b : "all");
    const all = list.every((q) => studyOpen.has(q.id));
    list.forEach((q) => (all ? studyOpen.delete(q.id) : studyOpen.add(q.id)));
    render();
  } else if (d.signin) doSignIn(d.signin);
  else if (d.acct === "out") { await pushNow(); await sync.signOutUser(); note(t("acct.signedout")); }
  else if (d.acct === "export") exportProgress();
  else if (d.arm === "reset") arm(el, "reset", t("acct.reset2"), () => { P = blankProgress(); overwrite = !!acct.user; save(); homeQ = null; note(t("acct.erased")); render(); });
  else if (d.arm === "delete") arm(el, "delete", t("acct.delete2"), async () => {
    deleting = true; clearTimeout(pushTimer);
    try { await sync.deleteAccount(); dirty = false; lsDel(KEYS.signed); note(t("acct.deleted")); }
    catch { note(t("acct.deletefail"), true); }
    finally { deleting = false; }
  });
  else if (d.sug === "github") {
    const text = $("sug-text").value.trim();
    if (text.length < 10) return sugMsg(t("sug.short"), true);
    window.open(issueUrl($("sug-kind").value, $("sug-ref").value.trim(), text), "_blank", "noopener");
  }
});
document.addEventListener("toggle", (e) => {
  const item = e.target;
  if (item.dataset?.panel) { if (item.open) panels.add(item.dataset.panel); else panels.delete(item.dataset.panel); return; }
  if (!item.classList?.contains("sitem")) return;
  const id = item.dataset.id;
  if (item.open) { studyOpen.add(id); const b = item.querySelector(".sbody"); if (!b.innerHTML) b.innerHTML = studyBody(BYID[id]); }
  else studyOpen.delete(id);
}, true);
function sugMsg(text, err) { const m = $("sug-msg"); m.textContent = text; m.hidden = false; m.classList.toggle("err", !!err); }
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "sug") return;
  e.preventDefault();
  const text = $("sug-text").value.trim();
  if (text.length < 10) return sugMsg(t("sug.short"), true);
  try {
    await sync.suggest({ kind: $("sug-kind").value, ref: $("sug-ref").value.trim(), text, lang: ui.lang });
    $("sug-text").value = ""; sugMsg(t("sug.sent"));
  } catch { sugMsg(t("sug.fail"), true); }
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "import" || !e.target.files[0]) return;
  try {
    const data = JSON.parse(await e.target.files[0].text());
    if (!validProgress(data)) throw 0;
    P = mergeProgress(P, sanitizeProgress(data, BYID)); refreshLevels(P, BANK, TOPICS); save(); homeQ = null; note(t("acct.imported")); render();
  } catch { note(t("acct.badfile"), true); }
});
document.addEventListener("focusin", (e) => { if (e.target.id === "q") loadEs().catch(() => {}); });
document.addEventListener("input", (e) => {
  if (e.target.id !== "q") return;
  const name = route().name, q = e.target.value;
  if (name === "terms") { $("allterms").hidden = !!q.trim(); paintSearch(q, 40, false); }
  else if (name === "search") paintSearch(q, 100, false);
  else paintSearch(q, 8, true);
});
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey) {
    const box = $("q");
    e.preventDefault();
    if (box) box.focus(); else { wantSearch = true; location.hash = "#/search"; }
    return;
  }
  if (e.key === "Enter" && e.target.id === "q" && e.target.value.trim()) { location.hash = `#/search/${encodeURIComponent(e.target.value.trim())}`; return; }
  if (e.key === "Escape" && e.target.id === "q") { e.target.value = ""; e.target.dispatchEvent(new Event("input", { bubbles: true })); return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  const name = route().name;
  if (/^[1-4]$/.test(e.key) && (name === "quiz" || name === "home")) {
    const b = [...document.querySelectorAll(`.opt[data-k="${+e.key - 1}"]:not(:disabled)`)].find((x) => !x.closest("[hidden]"));
    if (b) { e.preventDefault(); b.click(); }
  } else if (e.key === "Enter" && name === "quiz" && !/^(BUTTON|A|SUMMARY|DETAILS)$/.test(e.target.tagName) && !e.target.closest?.("details")) {
    document.querySelector('#bar-in [data-act="next"], #bar-in [data-act="reveal"]')?.click();
  }
});

async function switchLang() {
  const next = ui.lang === "en" ? "es" : "en";
  if (next === "es") {
    try { await loadEs(); } catch { toast(t("offline.es")); }
  }
  ui.lang = next; savePrefs(); DOCS = null; paintChrome(); render();
}
function switchTheme() {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const v = dark ? "light" : "dark";
  document.documentElement.dataset.theme = v;
  try { localStorage.setItem(KEYS.theme, v); } catch { /* keep it for this visit */ }
}

/* ---------- start ---------- */
async function boot() {
  initFx();
  $("foot-repo").href = `https://github.com/${CONFIG.repo}`;
  if (CONFIG.linkedin) { const l = $("foot-li"); l.href = CONFIG.linkedin; l.hidden = false; }
  paintChrome();
  try {
    const r = await fetch(at("data/bank.en.json"));
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    GROUPS = d.groups; GROUPS.forEach((g) => { GROUP[g.k] = g; });
    TOPICS = d.topics; BANK = d.questions; GL = bare(d.glossary);
    TOPICS.forEach((c) => { TOPIC[c.k] = c; });
    BANK.forEach((q) => { BYID[q.id] = q; });
  } catch {
    main.innerHTML = `<p class="notice err">${t("err.load")}</p><p><button type="button" class="btn" data-act="reload">${t("err.retry")}</button></p>`;
    return;
  }
  ui.cats = new Set([...(ui.cats?.size ? ui.cats : TOPICS.map((c) => c.k))].filter((k) => TOPIC[k]));
  if (!ui.cats.size) TOPICS.forEach((c) => ui.cats.add(c.k));
  if (allPicked() && saved.cats?.length) savePrefs(); // moves "All" saved as a full list to the empty form
  P = sanitizeProgress(P, BYID);
  refreshLevels(P, BANK, TOPICS);
  if (ui.lang === "es") await loadEs().catch(() => toast(t("offline.es")));
  paintChrome();
  render();
  if (CONFIG.firebase && lsGet(KEYS.signed)) connect().catch(() => { acct.status = "error"; });
  if ("serviceWorker" in navigator && window.isSecureContext) navigator.serviceWorker.register(at("sw.js")).catch(() => {});
}
boot();
