import vinext from "vinext";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";
const CESIUM_CHUNK_MAX_SIZE = 440 * 1024;

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    define: {
      CESIUM_BASE_URL: JSON.stringify("/cesium/"),
    },
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              // Cesium is loaded through a dynamic import; keep that boundary
              // while splitting its ES modules into cacheable sub-500 kB chunks.
              codeSplitting: {
                groups: [
                  {
                    name: "cesium",
                    test:
                      /node_modules[\\/](?:cesium|@cesium[\\/][^\\/]+)[\\/]/,
                    priority: 100,
                    minSize: 400 * 1024,
                    maxSize: CESIUM_CHUNK_MAX_SIZE,
                  },
                ],
              },
            },
          },
        },
      },
    },
    server: {
      // Vite 8's browser-console forwarding can attempt to report an error
      // after its HMR websocket has already disconnected. The preview does not
      // rely on forwarded browser logs, so disabling the channel prevents the
      // resulting `transport.send` / undefined websocket rejection loop.
      forwardConsole: false,
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      sites(),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/cesium/Build/Cesium/Assets/**/*",
            dest: "cesium/Assets",
            rename: { stripBase: 5 },
          },
          {
            src: "node_modules/cesium/Build/Cesium/ThirdParty/**/*",
            dest: "cesium/ThirdParty",
            rename: { stripBase: 5 },
          },
          {
            src: "node_modules/cesium/Build/Cesium/Workers/**/*",
            dest: "cesium/Workers",
            rename: { stripBase: 5 },
          },
          {
            src: "node_modules/cesium/Build/Cesium/Widgets/**/*",
            dest: "cesium/Widgets",
            rename: { stripBase: 5 },
          },
        ],
      }),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
