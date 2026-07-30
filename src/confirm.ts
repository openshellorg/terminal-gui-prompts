/**
 * Confirm prompt: always echo the question to stdout (for piping/AI), then
 * use a native Windows dialog when possible; otherwise fall back to terminal input.
 */
import { createInterface } from "node:readline";
import { runTgpConfirm, hasTgpBinary } from "./tgp-binary.js";
import { showWindowsConfirm, canUseWindowsGui } from "./windows-dialog.js";

export type ConfirmDefault = "yes" | "no";

export interface ConfirmOptions {
  /** Prompt text (always written to stdout). */
  message: string;
  /** Dialog/window title (GUI only). */
  title?: string;
  /** Default when user presses Enter. */
  default?: ConfirmDefault;
  /** Force terminal prompt even on Windows (e.g. for scripting). */
  forceTerminal?: boolean;
  /** Stream to write prompt and read input (default: process.stdin/stdout). */
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

const DEFAULT_OPTIONS: Required<Pick<ConfirmOptions, "default" | "forceTerminal">> = {
  default: "yes",
  forceTerminal: false,
};

/**
 * Resolve canonical "y" or "n" from terminal input (one line).
 */
function parseTerminalConfirm(line: string, def: ConfirmDefault): "y" | "n" {
  const s = line.trim().toLowerCase();
  if (s === "y" || s === "yes") return "y";
  if (s === "n" || s === "no") return "n";
  return def === "yes" ? "y" : "n";
}

/**
 * Show terminal suffix (Y/n) and read one line; message was already written.
 */
function terminalConfirmSuffix(
  def: ConfirmDefault,
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream
): Promise<"y" | "n"> {
  const suffix = def === "yes" ? " (Y/n)" : " (y/N)";
  const rl = createInterface({ input, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(suffix + " ", (answer) => {
      rl.close();
      resolve(parseTerminalConfirm(answer, def));
    });
  });
}

/**
 * Confirm with the user. Always writes the prompt to stdout so that piped
 * output (e.g. to an AI) still shows the question. When on Windows with a
 * TTY and GUI, shows a native dialog and returns the result; otherwise
 * uses a terminal (Y/n) prompt.
 *
 * @returns Promise<"y" | "n"> canonical result
 */
export async function confirm(options: ConfirmOptions): Promise<"y" | "n"> {
  const {
    message,
    title = "Confirm",
    default: def = DEFAULT_OPTIONS.default,
    forceTerminal = DEFAULT_OPTIONS.forceTerminal,
    input = process.stdin,
    output = process.stdout,
  } = options;

  const isTty = Boolean((output as NodeJS.WriteStream & { isTTY?: boolean }).isTTY);
  const useGui = isTty && !forceTerminal && (hasTgpBinary() || canUseWindowsGui());

  // Always echo the prompt text so pipes (e.g. to AI) see the question.
  const msg = message.trimEnd();
  output.write(msg + "\n");

  if (useGui) {
    try {
      return await runTgpConfirm({ message: msg, title, default: def });
    } catch {
      if (canUseWindowsGui())
        return showWindowsConfirm({ message: msg, title, default: def });
    }
  }

  return terminalConfirmSuffix(def, input, output);
}

/**
 * Same as confirm() but returns a boolean (true = yes, false = no).
 */
export async function confirmBoolean(options: ConfirmOptions): Promise<boolean> {
  const result = await confirm(options);
  return result === "y";
}
