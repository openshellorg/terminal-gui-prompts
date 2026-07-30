/**
 * Text prompt: echo the question to stdout (for piping/AI), then use
 * a native Windows input dialog when possible; otherwise terminal readline.
 */
import { createInterface } from "node:readline";
import { runTgpInput, hasTgpBinary } from "./tgp-binary.js";
import { showWindowsInput, canUseWindowsGui } from "./windows-dialog.js";

export interface PromptOptions {
  /** Prompt text (always written to stdout). */
  message: string;
  /** Dialog/window title (GUI only). */
  title?: string;
  /** Default value (prefill). */
  default?: string;
  /** Force terminal input even on Windows. */
  forceTerminal?: boolean;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

/**
 * Prompt for a single line of text. Always writes the prompt to stdout.
 * On Windows with TTY and GUI, shows a native input dialog; otherwise readline.
 *
 * @returns Promise<string> entered text, or rejects if cancelled (GUI) / EOF.
 */
export async function prompt(options: PromptOptions): Promise<string> {
  const {
    message,
    title = "Input",
    default: def = "",
    forceTerminal = false,
    input = process.stdin,
    output = process.stdout,
  } = options;

  const isTty = Boolean((output as NodeJS.WriteStream & { isTTY?: boolean }).isTTY);
  const useGui = isTty && !forceTerminal && (hasTgpBinary() || canUseWindowsGui());

  const msg = message.trimEnd();
  output.write(msg + "\n");

  if (useGui) {
    try {
      return await runTgpInput({ message: msg, title, default: def });
    } catch {
      if (canUseWindowsGui())
        return showWindowsInput({ message: msg, title, default: def });
    }
  }

  const rl = createInterface({ input, output, terminal: true });
  return new Promise((resolve, reject) => {
    let settled = false;
    const suffix = def ? ` (default: ${def}) ` : " ";
    rl.question(suffix, (answer) => {
      if (!settled) {
        settled = true;
        resolve(answer.trim() || def);
      }
      rl.close();
    });
    rl.on("close", () => {
      if (!settled) {
        settled = true;
        reject(new Error("Prompt cancelled"));
      }
    });
  });
}
