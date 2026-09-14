import vinext from "vinext";
import { defineConfig } from "vite";

const placeholderDatabaseId = "00000000-0000-4000-8000-000000000000";

export default defineConfig(async () => {
  process.env.WRANGLER_SEND_METRICS ??= "false";
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          main: "vinext/server/fetch-handler",
          compatibility_flags: ["nodejs_compat"],
          d1_databases: [
            {
              binding: "DB",
              database_name: "closekey-crm-db",
              database_id: placeholderDatabaseId
            }
          ]
        }
      })
    ]
  };
});
