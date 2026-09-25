import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:3100";
const api = process.argv[3] || "https://historytalk.app/Historical-tell/api/v1";

const visibleText = (html) => html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]*>/g, " ")
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ").trim();

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response;
}

let failures = 0;
for (const [route, endpoint] of [["/characters", "/characters?page=1&limit=10"], ["/events", "/historical-contexts?page=1&limit=100"]]) {
  try {
    const data = (await (await get(api + endpoint)).json()).data;
    assert.ok(data?.content?.length > 0, "API has no records; cannot verify rendered catalog data");
    const html = await (await get(origin + route)).text();
    const text = visibleText(html);
    // Exclude hydration scripts: serialized data alone does not prove visible SSR content.
    const names = data.content.map((item) => item.name || item.title).filter(Boolean);
    assert.ok(names.length, "API records have no display names");
    for (const name of names) assert.ok(text.includes(name.replace(/\s+/g, " ").trim()), `HTML missing API record: ${name}`);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, "expected one SSR H1");
    if (route === "/characters" && data.totalPages > 1) {
      assert.match(html, /href="\/characters\?page=2"/, "missing crawlable page 2 link");
      const pageTwo = (await (await get(api + "/characters?page=2&limit=10")).json()).data;
      const pageTwoText = visibleText(await (await get(origin + "/characters?page=2")).text());
      assert.ok(pageTwo?.content?.length > 0, "API page 2 is unexpectedly empty");
      for (const item of pageTwo.content) {
        const name = item.name || item.title;
        assert.ok(name && pageTwoText.includes(name.replace(/\s+/g, " ").trim()), "page 2 record missing from HTML");
      }
      console.log("PASS", "/characters?page=2", `${pageTwo.content.length} API records in HTML; page 1 links to page 2`);
    }
    console.log("PASS", route, `${names.length} API records in HTML`);
  } catch (error) {
    failures++;
    console.error("FAIL", route, error.cause?.code || error.message.split("\n")[0]);
  }
}
if (failures) process.exitCode = 1;
