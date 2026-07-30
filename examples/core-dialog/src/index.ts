#!/usr/bin/env node
/**
 * Example app using the core API: confirm() and prompt().
 * On Windows with a TTY you get native dialogs; prompt text is always echoed.
 *
 * Run from repo root after pnpm install:
 *   pnpm --filter example-core-dialog build && pnpm --filter example-core-dialog start
 * Or from this folder: pnpm build && pnpm start
 */

import { confirm, prompt } from "terminal-gui-prompts";

async function main() {
  console.log("Core dialog example — confirm and text prompt.\n");

  const ok = await confirm({
    message: "Do you want to run the setup wizard?",
    title: "Setup",
    default: "yes",
  });

  if (ok !== "y") {
    console.log("Skipped.");
    return;
  }

  const name = await prompt({
    message: "Enter your display name",
    title: "Profile",
    default: "Guest",
  });

  console.log(`Hello, ${name}.`);

  const overwrite = await confirm({
    message: "Save settings to disk?",
    title: "Save",
    default: "yes",
  });

  if (overwrite === "y") {
    console.log("Settings saved (demo).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
