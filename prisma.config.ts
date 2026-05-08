import "dotenv/config";
import { defineConfig } from "prisma/config";

const DATABASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : process.env.DATABASE_URL_DEV;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
