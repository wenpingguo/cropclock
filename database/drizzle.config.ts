import { defineConfig } from "drizzle-kit";

// Paths are relative to the project root, where the npm scripts run.
process.loadEnvFile(".env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./database/migrations",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
