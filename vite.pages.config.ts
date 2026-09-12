import { readFile, writeFile, cp } from "node:fs/promises";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = "/chrono-earth/";

// The original localhost app uses root-relative public assets. Only this
// static build relocates those literals into the GitHub project subdirectory.
function relocatePublicPaths(source: string) {
  return source.replace(
    /(["'])\/(?!\/)(?=(?:images\/|icons\/|cesium\/|assets\/|_next\/|api\/|sw\.js|manifest\.webmanifest|favicon\.svg|og\.png|["']))/g,
    `$1${base}`,
  );
}

export default defineConfig({
  base,
  define: { CESIUM_BASE_URL: JSON.stringify(`${base}cesium/`) },
  build: {
    outDir: "dist-pages",
    // Keep Cesium's dynamic-import boundary. Forcing size-based splits breaks
    // initialization order in its circular module graph (constructor errors).
  },
  plugins: [
    {
      name: "pages-public-paths",
      enforce: "pre",
      transform(code, id) {
        if (id.includes("/app/") && /\.[jt]sx?$/.test(id)) {
          return { code: relocatePublicPaths(code), map: null };
        }
      },
      async closeBundle() {
        await cp("node_modules/cesium/Build/Cesium", "dist-pages/cesium", { recursive: true });
        for (const file of ["sw.js", "manifest.webmanifest"]) {
          const source = await readFile(`public/${file}`, "utf8");
          await writeFile(`dist-pages/${file}`, relocatePublicPaths(source));
        }
        await writeFile("dist-pages/.nojekyll", "");
      },
    },
    react(),
  ],
});
