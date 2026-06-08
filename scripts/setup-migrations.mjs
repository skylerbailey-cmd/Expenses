// One-time script: marks the initial migration as already applied on an
// existing database so that `prisma migrate deploy` won't re-run it.
// Run via: node scripts/setup-migrations.mjs

import { execSync } from "child_process";

try {
  console.log("Marking 0001_init as applied...");
  execSync("npx prisma migrate resolve --applied 0001_init", {
    stdio: "inherit",
  });
  console.log("Done.");
} catch (e) {
  // If it's already marked, that's fine.
  console.log("Migration may already be marked as applied:", e.message);
}
