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
