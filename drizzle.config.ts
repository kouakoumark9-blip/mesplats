import { defineConfig } from "drizzle-kit";

import { chargerEnvLocal } from "./scripts/charger-env";

chargerEnvLocal();

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
