import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:3100";
const paths = ["/", "/features", "/pricing", "/characters", "/events", "/characters?page=2", "/characters?search=test", "/login", "/payment/success", "/staff", "/seo-missing-page-check", "/robots.txt", "/sitemap.xml", "/opengraph-image", "/manifest.webmanifest", "/favicon.ico", "/icon.png", "/apple-icon.png"];
let failures = 0;
await Promise.all(paths.map(async (path) => {
  try {
    const response = await fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(60000), headers: { "User-Agent": "Googlebot" } });
    if (["/favicon.ico", "/icon.png", "/apple-icon.png"].includes(path)) {
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") || "", /image\//);
      await response.arrayBuffer();
      console.log("PASS", path, response.status); return;
    }
    if (path === "/opengraph-image") {
      const png = Buffer.from(await response.arrayBuffer());
      assert.equal(response.status, 200);
      assert.equal(png.readUInt32BE(16), 1200);
      assert.equal(png.readUInt32BE(20), 630);
      console.log("PASS", path, "1200x630"); return;
    }
    const html = await response.text();
    if (path === "/staff") {
      assert.equal(response.status, 307);
      assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    } else if (path === "/seo-missing-page-check") {
      assert.equal(response.status, 404);
    } else {
      assert.equal(response.status, 200);
      if (path === "/sitemap.xml") {
        assert.equal((html.match(/<loc>/g) || []).length, 5);
        assert.doesNotMatch(html, /\/(login|register|about|library|home)<\/loc>/);
      } else if (path === "/robots.txt") {
        assert.match(html, /Sitemap: https:\/\//);
        assert.doesNotMatch(html, /Disallow: \/_next/);
      } else if (path === "/manifest.webmanifest") {
        assert.equal(JSON.parse(html).lang, "vi");
      } else if (["/login", "/payment/success", "/characters?search=test"].includes(path)) {
        assert.match(html, /<meta name="robots" content="[^"]*noindex/);
      } else {
        const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
        assert.ok(canonical, "missing canonical");
        const canonicalUrl = new URL(canonical[1]);
        assert.equal(canonicalUrl.pathname + canonicalUrl.search, path, "incorrect canonical");
        assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/);
        assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, "expected one SSR H1");
        assert.doesNotMatch(html, /class="welcome-screen /);
        assert.match(html, /property="og:locale" content="vi_VN"/);
        for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
      }
    }
    console.log("PASS", path, response.status);
  } catch (error) {
    failures++;
    // Assertion messages can contain entire HTML responses; keep production logs concise.
    console.error("FAIL", path, error.message.split("\n")[0], error.cause?.code || "");
  }
}));
if (failures) process.exitCode = 1;
