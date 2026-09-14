import vinext from "vinext";
import { defineConfig } from "vite";

const databaseId = "d1861f97-1817-4f65-9b37-0de19c97c400";

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
              database_id: databaseId
            }
          ]
        }
      })
    ]
  };
});
