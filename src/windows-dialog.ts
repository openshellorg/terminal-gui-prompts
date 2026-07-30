/**
 * Invokes PowerShell scripts to show native Windows dialogs.
 * Confirm returns "y" or "n"; Input returns the entered text (one line to stdout).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type ConfirmDefault = "yes" | "no";

export interface WindowsConfirmOptions {
  message: string;
  title?: string;
  default?: ConfirmDefault;
}

const POWERSHELL_EXES = ["pwsh", "powershell"] as const;

function runPowerShellScript(
  scriptPath: string,
  args: string[],
  capture: (stdout: string, code: number) => "y" | "n" | string | null
): Promise<"y" | "n" | string> {
  return new Promise((resolve, reject) => {
    const tryExe = (exe: (typeof POWERSHELL_EXES)[number]) => {
      const ps = spawn(exe, [
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", scriptPath,
        ...args,
      ], {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: false,
      });

      let stdout = "";
      let stderr = "";
      ps.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      ps.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

      ps.on("error", () => {
        const i = POWERSHELL_EXES.indexOf(exe) + 1;
        const next = POWERSHELL_EXES[i];
        if (next) tryExe(next);
        else reject(new Error("PowerShell not found (tried pwsh, powershell)"));
      });
      ps.on("close", (code) => {
        const result = capture(stdout.trim(), code ?? -1);
        if (result !== null) resolve(result as "y" | "n" | string);
        else reject(new Error(`Dialog failed: ${stderr || stdout || "no output"}`));
      });
    };
    tryExe(POWERSHELL_EXES[0]);
  });
}

/**
 * Show native Windows MessageBox Yes/No and return "y" or "n".
 * Uses the bundled PowerShell script; requires Windows and System.Windows.Forms.
 */
export function showWindowsConfirm(options: WindowsConfirmOptions): Promise<"y" | "n"> {
  const { message, title = "Confirm", default: def = "yes" } = options;
  const scriptPath = join(__dirname, "..", "scripts", "Show-ConfirmDialog.ps1");

  return runPowerShellScript(scriptPath, [
    "-Message", message,
    "-Title", title,
    "-Default", def === "yes" ? "Yes" : "No",
  ], (stdout) => {
    const line = stdout.split(/\r?\n/)[0]?.toLowerCase();
    if (line === "y" || line === "n") return line;
    return null;
  }) as Promise<"y" | "n">;
}

export interface WindowsInputOptions {
  message: string;
  title?: string;
  default?: string;
}

/**
 * Show native Windows input form and return the entered text (one line).
 * Cancel or close returns exit code 1 and rejects.
 */
export function showWindowsInput(options: WindowsInputOptions): Promise<string> {
  const { message, title = "Input", default: def = "" } = options;
  const scriptPath = join(__dirname, "..", "scripts", "Show-InputDialog.ps1");

  return runPowerShellScript(scriptPath, [
    "-Message", message,
    "-Title", title,
    "-Default", def,
  ], (stdout, code) => {
    if (code === 0) return stdout.split(/\r?\n/)[0] ?? "";
    return null;
  }).catch((err) => {
    throw err instanceof Error ? err : new Error(String(err));
  }) as Promise<string>;
}

/**
 * True if we are on Windows and likely have a GUI (not SSH, not headless).
 */
export function canUseWindowsGui(): boolean {
  if (process.platform !== "win32") return false;
  // Session 0 or no console often means service/headless
  if (process.env.SSH_CONNECTION) return false;
  if (process.env.CI === "true" || process.env.TERM_PROGRAM === "vscode") {
    // Still might have GUI in VS Code terminal on Windows
  }
  return true;
}
