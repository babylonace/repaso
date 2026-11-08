// Static pages for search engines: one page per question and per topic, in English and Spanish,
// plus a glossary page and sitemap.xml. They are plain HTML with no script, they read fine without
// the app, and each one links into the app to practice. The app itself stays a hash-routed page.
import fs from "node:fs";
import path from "node:path";
import { esc, inline, richText, highlight } from "../public/assets/js/core.js";

export const SITE = (process.env.SITE_URL || "https://repaso.babylonace.dev/").replace(/\/?$/, "/");

const T = {
  en: {
    lang: "en", home: "Repaso", browse: "All topics", glossary: "Glossary", practice: "Practice this question in Repaso", open: "Practice this topic",
    answer: "Answer", why: "Why", remember: "Remember", options: "Options", correct: "Correct option", level: ["Foundations", "Core", "Intermediate", "Advanced"],
    terms: "Key terms", intro: (n, t) => `${n} ${t} interview questions with answers, from junior to mid level.`, topicTitle: (t) => `${t} interview questions`,
    glossaryTitle: "Software engineering glossary", glossaryDesc: (n) => `${n} short definitions of terms that come up in software engineering interviews.`,
    topicsTitle: "Software interview questions by topic", topicsDesc: (n, q) => `${q} free practice questions in ${n} topics, in English and Spanish.`,
    about: "How it works", privacy: "Privacy", other: "Español", free: "Free, no signup, in English and Spanish.", qs: "questions",
    homeTitle: "Repaso: practice software interview questions", homeH1: "Practice for your software interview.",
    homeDesc: (q) => `Free practice for software engineering interviews: ${q} questions in English and Spanish, with spaced repetition. No signup.`,
    homeLead: (q, n) => `${q} interview questions with answers across ${n} topics, from junior to mid level. Practice what interviewers ask, understand every answer and come back to what you missed. Free, no signup, in English and Spanish.`,
    start: "Start practicing", topics: "Interview questions by topic",
  },
  es: {
    lang: "es", home: "Repaso", browse: "Todos los temas", glossary: "Glosario", practice: "Practica esta pregunta en Repaso", open: "Practicar este tema",
    answer: "Respuesta", why: "Por qué", remember: "Recuerda", options: "Opciones", correct: "Opción correcta", level: ["Fundamentos", "Base", "Intermedio", "Avanzado"],
    terms: "Términos clave", intro: (n, t) => `${n} preguntas de entrevista de ${t} con respuestas, de nivel junior a intermedio.`, topicTitle: (t) => `Preguntas de entrevista de ${t}`,
    glossaryTitle: "Glosario de ingeniería de software", glossaryDesc: (n) => `${n} definiciones cortas de términos que salen en entrevistas de ingeniería de software.`,
    topicsTitle: "Preguntas de entrevista de software por tema", topicsDesc: (n, q) => `${q} preguntas de práctica gratis en ${n} temas, en español e inglés.`,
    about: "Cómo funciona", privacy: "Privacidad", other: "English", free: "Gratis, sin registro, en español e inglés.", qs: "preguntas",
    homeTitle: "Repaso: preguntas de entrevista de software para practicar", homeH1: "Practica para tu entrevista de software.",
    homeDesc: (q) => `Practica gratis para entrevistas de ingeniería de software: ${q} preguntas en español e inglés, con repetición espaciada. Sin registro.`,
    homeLead: (q, n) => `${q} preguntas de entrevista con respuestas en ${n} temas, de nivel junior a intermedio. Practica lo que preguntan, entiende cada respuesta y vuelve a lo que fallaste. Gratis, sin registro, en español e inglés.`,
    start: "Empezar a practicar", topics: "Preguntas de entrevista por tema",
  },
};

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
const clip = (s, n) => { const t = String(s).replace(/`/g, "").replace(/\s+/g, " ").trim(); return t.length <= n ? t : t.slice(0, n - 1).replace(/\s\S*$/, "") + "…"; };
const code = (c) => `<pre class="code" tabindex="0"><code>${highlight(c)}</code></pre>`;
const slug = (id) => id.toLowerCase();

/** What a question says in a language, falling back to English field by field (same rule as the app). */
export function view(q, es) {
  const e = es?.q?.[q.id];
  if (!e) return { q: q.q, o: q.o, ans: q.t === "m" ? (q.fa ?? q.o[q.a]) : q.a, e: q.e, r: q.r };
  return { q: e.q ?? q.q, o: e.o ?? q.o, ans: q.t === "m" ? (e.fa ?? e.o?.[q.a] ?? q.fa ?? q.o[q.a]) : (e.a ?? q.a), e: e.e ?? q.e, r: e.r ?? q.r };
}

function page({ lang, depth, title, description, canonical, alternates, body }) {
  const up = "../".repeat(depth), t = T[lang];
  const alts = Object.entries(alternates).map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${u}">`).join("\n");
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<link rel="canonical" href="${canonical}">
${alts}
<link rel="alternate" hreflang="x-default" href="${alternates.en}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${up}icon.svg" type="image/svg+xml">
<link rel="preload" href="${up}assets/fonts/bricolage-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}assets/css/app.css">
<script src="${up}assets/js/theme.js"></script>
</head>
<body>
<header class="top">
  <a class="brand" href="${up}" aria-label="Repaso"><img src="${up}icon.svg" alt="" width="32" height="32"><span>Repaso</span></a>
  <nav class="nav" aria-label="Main"><a href="${up}${lang === "es" ? "es/" : ""}t/">${t.browse}</a><a href="${up}${lang === "es" ? "es/" : ""}glossary/">${t.glossary}</a></nav>
  <div class="tools"><a class="tool lang" href="${alternates[lang === "en" ? "es" : "en"]}" hreflang="${lang === "en" ? "es" : "en"}">${t.other}</a></div>
</header>
<main id="main">${body}</main>
<footer class="foot"><a href="${up}#/about">${t.about}</a><a href="${up}#/privacy">${t.privacy}</a><a href="https://github.com/babylonace/repaso" rel="noopener">GitHub</a></footer>
</body>
</html>
`;
}

const prefix = (lang) => (lang === "es" ? "es/" : "");
const urlOf = (lang, rel) => `${SITE}${prefix(lang)}${rel}`;
const both = (rel) => ({ en: urlOf("en", rel), es: urlOf("es", rel) });

export function questionPage(q, content, lang) {
  const t = T[lang], es = { q: content.esQ, gl: content.esGl }, v = view(q, lang === "es" ? es : null);
  const topic = content.topics.find((x) => x.k === q.cat), tname = lang === "es" ? topic.name_es : topic.name;
  const rel = `q/${slug(q.id)}/`, depth = lang === "es" ? 3 : 2;
  let b = `<article class="card stack"><div class="qmeta"><a href="${"../".repeat(depth)}${prefix(lang)}t/${q.cat}/">${esc(tname)}</a><span>${t.level[q.l]}</span><span>${esc(q.id)}</span></div>
<h1 class="qtext">${inline(v.q)}</h1>${q.c ? code(q.c) : ""}`;
  if (q.t === "m") b += `<section class="answer"><h3>${t.options}</h3><ol>${v.o.map((o, i) => `<li>${inline(o)}${i === q.a ? ` <strong>(${t.correct})</strong>` : ""}</li>`).join("")}</ol></section>`;
  b += `<section class="answer"><h3>${t.answer}</h3>${richText(v.ans)}${q.ac ? code(q.ac) : ""}</section>`;
  if (v.e) b += `<section class="answer"><h3>${t.why}</h3>${richText(v.e)}${q.ec ? code(q.ec) : ""}</section>`;
  if (v.r) b += `<section class="answer"><h3>${t.remember}</h3><p>${inline(v.r)}</p></section>`;
  const terms = (q.g || []).filter((k) => content.glossary[k]);
  if (terms.length) b += `<section class="answer"><h3>${t.terms}</h3><ul>${terms.map((k) => {
    const g = content.glossary[k], e = lang === "es" ? content.esGl[k] : null;
    return `<li><a href="${"../".repeat(depth)}${prefix(lang)}glossary/#${k}">${esc(e?.[0] || g[0])}</a></li>`;
  }).join("")}</ul></section>`;
  b += `<p><a class="btn pri" href="${"../".repeat(depth)}#/q/${esc(q.id)}">${t.practice}</a></p></article>`;
  return {
    path: `${prefix(lang)}${rel}index.html`, rel,
    html: page({ lang, depth, title: `${q.c ? `${clip(v.q, 36)}: ${clip((q.c.split("\n").find((l) => l.trim()) || "").trim(), 34)}` : clip(v.q, 70)} | Repaso`, description: clip(v.r ? `${v.q} ${v.r}` : `${v.q} ${v.ans}`, 155), canonical: urlOf(lang, rel), alternates: both(rel), body: b }),
  };
}

export function topicPage(topic, content, lang) {
  const t = T[lang], es = { q: content.esQ, gl: content.esGl };
  const name = lang === "es" ? topic.name_es : topic.name, rel = `t/${topic.k}/`, depth = lang === "es" ? 3 : 2;
  const qs = content.questions.filter((q) => q.cat === topic.k);
  let b = `<div class="stack"><h1>${t.topicTitle(esc(name))}</h1><p>${t.intro(qs.length, esc(name))}</p><p><a class="btn pri" href="${"../".repeat(depth)}#/study/${topic.k}">${t.open}</a></p>`;
  for (let l = 0; l < 4; l++) {
    const list = qs.filter((q) => q.l === l);
    if (list.length) b += `<section class="section"><h2>${t.level[l]}</h2><ul class="results">${list.map((q) => `<li><a href="${"../".repeat(depth)}${prefix(lang)}q/${slug(q.id)}/"><b>${inline(view(q, lang === "es" ? es : null).q)}</b></a></li>`).join("")}</ul></section>`;
  }
  return {
    path: `${prefix(lang)}${rel}index.html`, rel,
    html: page({ lang, depth, title: `${t.topicTitle(name)} | Repaso`, description: clip(`${t.intro(qs.length, name)} ${t.free}`, 155), canonical: urlOf(lang, rel), alternates: both(rel), body: b + "</div>" }),
  };
}

export function topicsIndex(content, lang) {
  const t = T[lang], rel = "t/", depth = lang === "es" ? 2 : 1;
  const row = (x) => {
    const n = content.questions.filter((q) => q.cat === x.k).length;
    return `<li><a href="${"../".repeat(depth)}${prefix(lang)}t/${x.k}/"><b>${esc(lang === "es" ? x.name_es : x.name)}</b><small>${n} ${t.qs}</small></a></li>`;
  };
  const sections = content.groups.map((g) => `<h2>${esc(lang === "es" ? g.name_es : g.name)}</h2><ul class="results">${content.topics.filter((x) => x.g === g.k).map(row).join("")}</ul>`).join("");
  const b = `<div class="stack"><h1>${t.topicsTitle}</h1><p>${t.free}</p>${sections}</div>`;
  return { path: `${prefix(lang)}${rel}index.html`, rel, html: page({ lang, depth, title: `${t.topicsTitle} | Repaso`, description: t.topicsDesc(content.topics.length, content.questions.length), canonical: urlOf(lang, rel), alternates: both(rel), body: b }) };
}

export function glossaryPage(content, lang) {
  const t = T[lang], rel = "glossary/", depth = lang === "es" ? 2 : 1;
  const items = Object.entries(content.glossary).map(([k, g]) => {
    const e = lang === "es" ? content.esGl[k] : null;
    return { k, name: e?.[0] || g[0], def: e?.[1] || g[1] };
  }).sort((a, b) => a.name.localeCompare(b.name, lang));
  const b = `<div class="stack"><h1>${t.glossaryTitle}</h1><p>${t.glossaryDesc(items.length)}</p>${items.map((i) => `<section id="${i.k}"><h2>${esc(i.name)}</h2><p>${inline(i.def)}</p></section>`).join("")}</div>`;
  return { path: `${prefix(lang)}${rel}index.html`, rel, html: page({ lang, depth, title: `${t.glossaryTitle} | Repaso`, description: t.glossaryDesc(items.length), canonical: urlOf(lang, rel), alternates: both(rel), body: b }) };
}

/** The text of the home page as plain HTML with real links. The app replaces it once it starts; crawlers and people without script read it as it is. */
export function homeBlock(content, lang, up = "") {
  const t = T[lang], p = prefix(lang), n = content.questions.length;
  const row = (x) => `<li><a href="${up}${p}t/${x.k}/"><b>${esc(lang === "es" ? x.name_es : x.name)}</b><small>${content.questions.filter((q) => q.cat === x.k).length} ${t.qs}</small></a></li>`;
  const groups = content.groups.map((g) => `<h3>${esc(lang === "es" ? g.name_es : g.name)}</h3><ul class="results">${content.topics.filter((x) => x.g === g.k).map(row).join("")}</ul>`).join("");
  const other = lang === "en" ? `<a href="${up}es/" hreflang="es" lang="es">${T.en.other}</a>` : `<a href="${up}" hreflang="en" lang="en">${T.es.other}</a>`;
  return `<div class="stack" id="boot"><h1>${t.homeH1}</h1><p class="lead">${t.homeLead(n, content.topics.length)}</p>
<p><a class="btn pri" href="${up}#/practice">${t.start}</a></p>
<h2>${t.topics}</h2>${groups}
<p><a href="${up}${p}t/">${t.browse}</a> · <a href="${up}${p}glossary/">${t.glossary}</a> · ${other}</p></div>`;
}

/** The Spanish home page, at /es/. The English one is public/index.html. */
export function homePageEs(content) {
  const t = T.es, rel = "";
  return { path: "es/index.html", rel, html: page({ lang: "es", depth: 1, title: t.homeTitle, description: t.homeDesc(content.questions.length), canonical: `${SITE}es/`, alternates: { en: SITE, es: `${SITE}es/` }, body: homeBlock(content, "es", "../") }) };
}

/** Writes every page and the sitemap into dist/. Returns the number of pages. */
export function writeSeo(content, dist = "dist") {
  const pages = [], home = homePageEs(content);
  for (const lang of ["en", "es"]) {
    pages.push(topicsIndex(content, lang), glossaryPage(content, lang));
    for (const tp of content.topics) pages.push(topicPage(tp, content, lang));
    for (const q of content.questions) pages.push(questionPage(q, content, lang));
  }
  for (const p of [...pages, home]) {
    const file = path.join(dist, p.path);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, p.html);
  }
  const hl = (en, es) => `<xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="es" href="${es}"/>`;
  const urls = [`<url><loc>${SITE}</loc>${hl(SITE, `${SITE}es/`)}</url>`, `<url><loc>${SITE}es/</loc>${hl(SITE, `${SITE}es/`)}</url>`];
  for (const p of pages) {
    const alt = both(p.rel);
    urls.push(`<url><loc>${alt[p.path.startsWith("es/") ? "es" : "en"]}</loc><xhtml:link rel="alternate" hreflang="en" href="${alt.en}"/><xhtml:link rel="alternate" hreflang="es" href="${alt.es}"/></url>`);
  }
  fs.writeFileSync(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`);
  fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
  return pages.length + 1;
}
