import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Chrono Earth experience shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Chrono Earth · 时光地球<\/title>/i);
  assert.match(html, /CHRONO EARTH/);
  assert.match(html, /每一片土地/);
  assert.match(html, /开始探索/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("ships production content and removes the disposable starter", async () => {
  const [page, layout, client, data, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ChronoExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/places.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /ChronoExperience/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(client, /GlobeScene/);
  assert.match(client, /世界历史时间轴/);
  assert.match(data, /吉萨金字塔群/);
  assert.match(data, /马丘比丘/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(
    access(new URL("../app/_sites-preview", projectRoot)),
  );
});
