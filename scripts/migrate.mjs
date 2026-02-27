import { execSync } from "child_process";

try {
  console.log("Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    timeout: 30000,
  });
  console.log("Migrations applied successfully.");
} catch (error) {
  console.warn("Migration failed or timed out — skipping. Run manually if needed.");
  console.warn(error.message ?? error);
}
