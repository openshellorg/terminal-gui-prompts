/**
 * Invoke the TGP core binary (protocol). Used by adapters when the binary is available.
 * Fallback to platform helpers (e.g. PowerShell) when the binary is not found.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BIN_NAME = process.platform === "win32" ? "tgp.exe" : "tgp";

let cachedBin: string | null | undefined = undefined;

function getTgpBin(): string | null {
  if (cachedBin !== undefined) return cachedBin;
  const fromEnv = process.env.TGP_BIN;
  if (fromEnv) {
    cachedBin = fromEnv;
    return fromEnv;
  }
  const pkgRoot = join(__dirname, "..");
  const candidates = [
    join(pkgRoot, "bin", BIN_NAME),
    join(pkgRoot, "core", BIN_NAME),
    join(pkgRoot, "..", "core", BIN_NAME),
  ];
  for (const c of candidates) {
    try {
      if (existsSync(c)) {
        cachedBin = c;
        return c;
      }
    } catch {
      /* ignore */
    }
  }
  cachedBin = null;
  return null;
}

function runTgp(args: string[]): Promise<{ stdout: string; code: number }> {
  const bin = getTgpBin();
  if (!bin) return Promise.reject(new Error("TGP binary not found (set TGP_BIN or build core)"));

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: false,
      env: { ...process.env, TGP_SCRIPTS_DIR: process.env.TGP_SCRIPTS_DIR ?? join(dirname(bin), "..", "scripts") },
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout: stdout.trim(), code: code ?? -1 }));
  });
}

export type ConfirmDefault = "yes" | "no";

export async function runTgpConfirm(options: {
  message: string;
  title?: string;
  default?: ConfirmDefault;
}): Promise<"y" | "n"> {
  const { message, title = "Confirm", default: def = "yes" } = options;
  const { stdout, code } = await runTgp([
    "confirm", "--message", message, "--title", title, "--default", def,
  ]);
  const line = stdout.split(/\r?\n/)[0]?.toLowerCase();
  if (line === "y" || line === "n") return line;
  throw new Error(`tgp confirm failed: ${stdout || code}`);
}

export async function runTgpInput(options: {
  message: string;
  title?: string;
  default?: string;
}): Promise<string> {
  const { message, title = "Input", default: def = "" } = options;
  const { stdout, code } = await runTgp([
    "input", "--message", message, "--title", title, "--default", def,
  ]);
  if (code !== 0) throw new Error("tgp input cancelled or failed");
  return stdout.split(/\r?\n/)[0] ?? "";
}

export function hasTgpBinary(): boolean {
  return getTgpBin() !== null;
}
