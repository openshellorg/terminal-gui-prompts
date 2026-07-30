/**
 * Adapter matching @inquirer/prompts API so you can swap:
 *   import { confirm, input } from '@inquirer/prompts'
 * to:
 *   import { confirm, input } from 'terminal-gui-prompts/inquirer'
 *
 * Same options and return types; prompts are echoed to stdout and promoted
 * to Windows dialogs when possible.
 */

import { confirm as baseConfirm, confirmBoolean } from "../confirm.js";
import { prompt as basePrompt } from "../prompt.js";

export interface InquirerConfirmOptions {
  message: string;
  default?: boolean;
  /** @internal ignored when using GUI */
  transformer?: (value: boolean) => string;
  /** @internal not applied to GUI dialogs */
  theme?: unknown;
  /** Extension: force terminal even on Windows */
  forceTerminal?: boolean;
  /** Extension: dialog title (GUI only) */
  title?: string;
}

export interface InquirerInputOptions {
  message: string;
  default?: string;
  /** Extension: force terminal even on Windows */
  forceTerminal?: boolean;
  /** Extension: dialog title (GUI only) */
  title?: string;
}

/**
 * Drop-in replacement for @inquirer/prompts confirm().
 * Returns Promise<boolean>. Uses GUI on Windows when possible.
 */
export async function confirm(options: InquirerConfirmOptions): Promise<boolean> {
  const { message, default: def = true, forceTerminal, title } = options;
  return confirmBoolean({
    message,
    default: def ? "yes" : "no",
    forceTerminal,
    title,
  });
}

/**
 * Drop-in replacement for @inquirer/prompts input().
 * Returns Promise<string>. Uses GUI on Windows when possible.
 */
export async function input(options: InquirerInputOptions): Promise<string> {
  const { message, default: def = "", forceTerminal, title } = options;
  return basePrompt({
    message,
    default: def,
    forceTerminal,
    title,
  });
}
