/**
 * Adapter for Enquirer-style usage. Enquirer uses a single prompt() with
 * { type, name, message, default }. We provide confirm and input with
 * the same question shape and return value shape so you can replace
 * only those prompt types with GUI-promoted ones.
 *
 * Usage:
 *   import { promptConfirm, promptInput } from 'terminal-gui-prompts/enquirer';
 *   const { proceed } = await promptConfirm({ name: 'proceed', message: 'Continue?', default: true });
 *   const { name } = await promptInput({ name: 'name', message: 'Your name?', default: 'Guest' });
 */

import { confirmBoolean } from "../confirm.js";
import { prompt as basePrompt } from "../prompt.js";

export interface EnquirerConfirmQuestion {
  type?: "confirm";
  name: string;
  message: string;
  default?: boolean;
  /** Extension: force terminal */
  forceTerminal?: boolean;
  /** Extension: dialog title (GUI only) */
  title?: string;
}

export interface EnquirerInputQuestion {
  type?: "input";
  name: string;
  message: string;
  default?: string;
  /** Extension: force terminal */
  forceTerminal?: boolean;
  /** Extension: dialog title (GUI only) */
  title?: string;
}

/**
 * Enquirer-style confirm. Takes { name, message, default } and returns
 * an object { [name]: boolean } so you can destructure like Enquirer.
 */
export async function promptConfirm(
  question: EnquirerConfirmQuestion
): Promise<Record<string, boolean>> {
  const { name, message, default: def = true, forceTerminal, title } = question;
  const value = await confirmBoolean({
    message,
    default: def ? "yes" : "no",
    forceTerminal,
    title,
  });
  return { [name]: value };
}

/**
 * Enquirer-style input. Takes { name, message, default } and returns
 * an object { [name]: string } so you can destructure like Enquirer.
 */
export async function promptInput(
  question: EnquirerInputQuestion
): Promise<Record<string, string>> {
  const { name, message, default: def = "", forceTerminal, title } = question;
  const value = await basePrompt({
    message,
    default: def,
    forceTerminal,
    title,
  });
  return { [name]: value };
}
