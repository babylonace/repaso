// Guards the promises the site makes: no third parties at rest.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const text = walk("public").filter((f) => /\.(js|html|css|json|webmanifest)$/.test(f));

test("the Firebase SDK is only reachable through sync.js, loaded on demand", () => {
  const app = fs.readFileSync("public/assets/js/app.js", "utf8");
  assert.ok(!/^import .*sync\.js/m.test(app), "sync.js must stay a dynamic import");
  for (const f of text.filter((x) => x.endsWith(".js") && !x.endsWith("sync.js")))
    assert.ok(!/gstatic\.com/.test(fs.readFileSync(f, "utf8")), f);
});
test("the page loads no third-party fonts, scripts or styles at rest", () => {
  const html = fs.readFileSync("public/index.html", "utf8").replace(/<meta http-equiv[^>]*>/, "").replace(/<link rel="canonical"[^>]*>/, "").replace(/<a [^>]*>/g, "");
  assert.ok(!/(src|href)="https?:/.test(html));
  assert.ok(!/@import|url\(http/.test(fs.readFileSync("public/assets/css/app.css", "utf8")));
});
test("the emulator hook never ships switched on", () => {
  assert.ok(!/emulator\s*:/.test(fs.readFileSync("public/assets/js/config.js", "utf8")));
});
