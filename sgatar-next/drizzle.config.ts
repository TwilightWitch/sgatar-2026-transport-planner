import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local first (dev), fall back to .env (production)
config({ path: ".env.local", override: false });
config({ path: "../.env", override: false });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
