import vinext from "vinext";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";
const placeholderDatabaseId = "00000000-0000-4000-8000-000000000000";
export default defineConfig(async () => {
  process.env.WRANGLER_SEND_METRICS ??= "false";
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return {
    plugins: [
      vinext(),
      sites({ mockAuth: false }),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          main: "vinext/server/fetch-handler",
          compatibility_flags: ["nodejs_compat"],
          d1_databases: [{ binding: "DB", database_name: "closekey-crm-db", database_id: placeholderDatabaseId }]
        }
      })
    ]
  };
});
