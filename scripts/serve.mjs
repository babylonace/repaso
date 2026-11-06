// Tiny static server for local checks: node scripts/serve.mjs [port]
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const port = +process.argv[2] || 4173;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
http.createServer((req, res) => {
  const root = path.resolve("dist");
  let p;
  try { p = path.resolve(root, "." + decodeURIComponent(req.url.split("?")[0])); } catch { res.writeHead(400); return res.end("Bad request"); }
  if (p !== root && !p.startsWith(root + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  if (req.url.split("?")[0].endsWith("/") || p === root) p = path.join(p, "index.html");
  // Check again on the final path, right before reading it.
  if (!p.startsWith(root + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, "127.0.0.1", () => console.log(`http://localhost:${port}`));
