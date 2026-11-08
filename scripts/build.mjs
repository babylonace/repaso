// Builds the static site into dist/. No dependencies: Node 20+ only.
// content/ is the source of truth; public/ holds the app shell.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadContent, validate } from "./content.mjs";
import { writeSeo, homeBlock, SITE } from "./seo.mjs";

const content = loadContent();
const problems = validate(content);
if (problems.length) {
  console.error(problems.slice(0, 40).join("\n"));
  console.error(`\n${problems.length} content problem(s).`);
  process.exit(1);
}

fs.rmSync("dist", { recursive: true, force: true, maxRetries: 20, retryDelay: 500 }); // OneDrive and antivirus can hold files for a moment
fs.cpSync("public", "dist", { recursive: true });
fs.mkdirSync("dist/data", { recursive: true });
fs.writeFileSync("dist/index.html", fs.readFileSync("dist/index.html", "utf8").replaceAll("__COUNT__", String(content.questions.length)).replaceAll("__HOME__", homeBlock(content, "en")).replaceAll("__SITE__", SITE));

const en = { groups: content.groups, topics: content.topics, questions: content.questions, glossary: content.glossary };
const es = { q: content.esQ, gl: content.esGl };
fs.writeFileSync("dist/data/bank.en.json", JSON.stringify(en));
fs.writeFileSync("dist/data/bank.es.json", JSON.stringify(es));

const pages = writeSeo(content);

// Stamp the service worker so every deploy refreshes the offline copy.
const hash = crypto.createHash("sha256");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const files = walk("dist").sort();
for (const f of files) hash.update(fs.readFileSync(f));
const version = hash.digest("hex").slice(0, 10);
// The offline copy holds the app only. The static pages for search engines are not precached.
const rel = (f) => path.relative("dist", f).replaceAll("\\", "/");
// The Spanish home is the app too, so it goes in as "es/", the address people open.
const list = files.map(rel).filter((f) => !/^(sw\.js|_headers|robots\.txt|sitemap\.xml|og\.png)$/.test(f) && !/^(es\/)?(q|t|glossary)\//.test(f)).map((f) => (f === "es/index.html" ? "es/" : f));
const sw = fs.readFileSync("dist/sw.js", "utf8").replace("__VERSION__", version).replace('"__FILES__"', JSON.stringify(list).slice(1, -1));
fs.writeFileSync("dist/sw.js", sw);
// A last look: nothing half-stamped, and everything the offline copy lists really exists.
for (const f of ["dist/sw.js", "dist/index.html", "dist/es/index.html"]) if (/__[A-Z]+__/.test(fs.readFileSync(f, "utf8"))) throw new Error(`${f} still has a placeholder`);
for (const f of list) if (!fs.existsSync(path.join("dist", f))) throw new Error(`sw.js lists ${f}, which is not in dist`);

const kb = (f) => Math.round(fs.statSync(f).size / 1024);
console.log(`Built dist/ (${version}): ${content.questions.length} questions, ${Object.keys(content.glossary).length} terms, ${Object.keys(content.esQ).length} translated, ${pages} static pages.`);
console.log(`bank.en.json ${kb("dist/data/bank.en.json")} KB, bank.es.json ${kb("dist/data/bank.es.json")} KB`);
