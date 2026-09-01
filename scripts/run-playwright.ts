import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

const workspace = process.cwd();
const childEnvironment = { ...process.env };
delete childEnvironment.NO_COLOR;

function waitForExit(child: ChildProcess) {
  return new Promise<number>((resolve) => {
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

async function waitForHealth(server: ChildProcess, readError: () => string) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`El servidor de pruebas se ha detenido.\n${readError()}`);
    try {
      const response = await fetch("http://127.0.0.1:3000/api/health", { signal: AbortSignal.timeout(2_000) });
      if (response.status < 500) return;
    } catch {
      // El servidor todavía está arrancando.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`El servidor de pruebas no ha arrancado a tiempo.\n${readError()}`);
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return;
  server.kill();
  await Promise.race([
    waitForExit(server),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

async function main() {
  let serverError = "";
  const server = spawn(process.execPath, [path.join(workspace, "node_modules/next/dist/bin/next"), "start"], {
    cwd: workspace,
    env: childEnvironment,
    stdio: ["ignore", "ignore", "pipe"],
  });
  server.stderr?.on("data", (chunk: Buffer) => {
    serverError = `${serverError}${chunk.toString()}`.slice(-8_000);
  });

  try {
    await waitForHealth(server, () => serverError);
    const runner = spawn(process.execPath, [path.join(workspace, "node_modules/@playwright/test/cli.js"), "test"], {
      cwd: workspace,
      env: childEnvironment,
      stdio: "inherit",
    });
    process.exitCode = await waitForExit(runner);
  } finally {
    await stopServer(server);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "No se han podido ejecutar las pruebas E2E.");
  process.exitCode = 1;
});
