import { execFileSync } from "node:child_process";

const deploymentEnvironments = new Set(["beta", "production"]);
const storeEnvironment = process.env.STORE_ENV ?? "local";

if (!deploymentEnvironments.has(storeEnvironment)) {
  console.log(`[prebuild] STORE_ENV=${storeEnvironment}; se omiten migraciones de despliegue.`);
  process.exit(0);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

function runPrisma(args) {
  console.log(`[prebuild] Ejecutando prisma ${args.join(" ")}...`);
  execFileSync(npxCommand, ["--no-install", "prisma", ...args], {
    stdio: "inherit",
    env: process.env,
  });
}

runPrisma(["migrate", "deploy"]);
runPrisma(["db", "seed"]);
