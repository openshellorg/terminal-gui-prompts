/**
 * Terminal GUI Prompts: enhanced terminal UI that promotes to native Windows
 * dialogs when a TTY has GUI. Always echoes prompt text to stdout for piping/AI.
 */

export {
  confirm,
  confirmBoolean,
  type ConfirmOptions,
  type ConfirmDefault,
} from "./confirm.js";

export { prompt, type PromptOptions } from "./prompt.js";

export {
  showWindowsConfirm,
  showWindowsInput,
  canUseWindowsGui,
  type WindowsConfirmOptions,
  type WindowsInputOptions,
} from "./windows-dialog.js";

export {
  runTgpConfirm,
  runTgpInput,
  hasTgpBinary,
} from "./tgp-binary.js";
