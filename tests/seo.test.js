import test from "node:test";
import assert from "node:assert/strict";
import { loadContent } from "../scripts/content.mjs";
import { questionPage, topicPage, glossaryPage, topicsIndex, homeBlock, homePageEs, view, SITE } from "../scripts/seo.mjs";

const c = loadContent();

test("every question page is complete, canonical and linked to its Spanish twin", () => {
  for (const q of c.questions) for (const lang of ["en", "es"]) {
    const p = questionPage(q, c, lang);
    assert.ok(p.html.includes(`<link rel="canonical" href="${SITE}${lang === "es" ? "es/" : ""}q/${q.id.toLowerCase()}/">`), q.id);
    assert.ok(p.html.includes('hreflang="en"') && p.html.includes('hreflang="es"'), q.id);
    assert.ok(/<h1 class="qtext">.+<\/h1>/.test(p.html), q.id);
    assert.ok(p.html.includes("<h3>"), q.id);
    const v = view(q, lang === "es" ? { q: c.esQ, gl: c.esGl } : null);
    assert.ok(typeof v.q === "string" && v.q && typeof v.ans === "string" && v.ans, `${q.id} ${lang} has an empty question or answer`);
  }
});
test("text from the bank is escaped on the static pages", () => {
  const q = { ...c.questions[0], q: `<img src=x onerror=alert(1)> and \`<b>\``, e: "<script>alert(1)</script>", r: "<svg onload=1>" };
  const html = questionPage(q, c, "en").html;
  assert.ok(!/<img src=x|<script>alert|<svg onload/.test(html));
});
test("topic, topics index and glossary pages list everything", () => {
  const t = c.topics[0];
  const html = topicPage(t, c, "es").html;
  for (const q of c.questions.filter((x) => x.cat === t.k)) assert.ok(html.includes(`q/${q.id.toLowerCase()}/`), q.id);
  assert.equal((topicsIndex(c, "en").html.match(/<li>/g) || []).length, c.topics.length);
  assert.equal((glossaryPage(c, "en").html.match(/<section id=/g) || []).length, Object.keys(c.glossary).length);
});
test("static pages load no script except the theme file", () => {
  const html = questionPage(c.questions[0], c, "en").html;
  assert.deepEqual([...html.matchAll(/<script[^>]*>/g)].map((m) => m[0]), ['<script src="../../assets/js/theme.js">']);
});
test("the home pages hold real text and links, in both languages, and point at each other", () => {
  for (const lang of ["en", "es"]) {
    const html = homeBlock(c, lang, lang === "es" ? "../" : "");
    assert.ok(/<h1>.+<\/h1>/.test(html), lang);
    for (const t of c.topics) assert.ok(html.includes(`t/${t.k}/`), `${lang} ${t.k}`);
  }
  const es = homePageEs(c).html;
  assert.ok(es.includes(`<link rel="canonical" href="${SITE}es/">`));
  assert.ok(es.includes(`hreflang="en" href="${SITE}"`) && es.includes(`hreflang="es" href="${SITE}es/"`));
  assert.ok(es.includes("<html lang=\"es\">"));
});

test("the Spanish home is the app, one folder down, with the Spanish text for search engines inside", () => {
  const es = homePageEs(c).html;
  assert.ok(es.includes('<script type="module" src="../assets/js/app.js"></script>'), "it runs the app");
  assert.ok(es.includes('href="../assets/css/app.css"') && es.includes('href="../data/bank.en.json"') && es.includes('href="../manifest.webmanifest"'), "files load from one level up");
  assert.ok(!/ (href|src)="(assets|data|icon|manifest|apple-touch)/.test(es), "no file path was left pointing inside /es/");
  assert.ok(es.includes('href="#/practice"'), "the app's own links stay on /es/");
  assert.ok(es.includes(`<h1>${"Practica para tu entrevista de software."}</h1>`), "the Spanish text is there for search engines");
  assert.ok(es.includes(`<meta property="og:url" content="${SITE}es/">`) && es.includes("<title>Repaso: preguntas de entrevista de software para practicar</title>"), "Spanish title and address");
  assert.ok(!/__[A-Z]+__/.test(es), "no placeholder left");
});

test('links into the app from a Spanish page carry ?lang=es, English pages do not', () => {
  const q = c.questions[0], topic = c.topics[0];
  const esQ = questionPage(q, c, 'es').html, enQ = questionPage(q, c, 'en').html;
  assert.ok(esQ.includes('?lang=es#/q/'), 'Spanish question page practice link');
  assert.ok(!enQ.includes('?lang=es') && enQ.includes('#/q/'), 'English question page stays as it was');
  assert.ok(topicPage(topic, c, 'es').html.includes('?lang=es#/study/'), 'Spanish topic page study link');
  assert.ok(!topicPage(topic, c, 'en').html.includes('?lang=es'), 'English topic page');
  const es = homePageEs(c).html;
  assert.ok(es.includes('?lang=es#/practice'), 'Spanish home start button');
  assert.ok(es.includes('href="../?lang=en" hreflang="en"'), 'the English link in the Spanish home text picks English');
  assert.ok(!questionPage(c.questions[0], c, "es").html.includes('?lang=en'), 'a Spanish question page links to its English twin, not to the app');
  assert.ok(!homeBlock(c, 'en', '').includes('?lang=es'), 'English home');
});
