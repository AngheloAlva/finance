import { execSync } from "node:child_process"
import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.test" })

const TEST_HOST_HINT = "ep-patient-frog-am93ezxs"

export default async function globalSetup() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set. Did .env.test load?")
  }
  if (!url.includes(TEST_HOST_HINT)) {
    throw new Error(
      `Refusing to run tests against a non-test database. URL host must contain "${TEST_HOST_HINT}". Got: ${url.replace(/:[^:@]+@/, ":***@")}`,
    )
  }

  const migrationUrl = process.env.DIRECT_URL ?? url
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: migrationUrl,
      PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
    },
  })
}
