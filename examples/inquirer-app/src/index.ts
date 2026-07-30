#!/usr/bin/env node
/**
 * Example app using the Inquirer adapter (same API as @inquirer/prompts).
 * confirm() returns boolean, input() returns string.
 *
 * Run from repo root: pnpm --filter example-inquirer-app build && pnpm --filter example-inquirer-app start
 * Or from this folder: pnpm build && pnpm start
 */

import { confirm, input } from "terminal-gui-prompts/inquirer";

async function main() {
  console.log("Inquirer-adapter example — drop-in confirm/input.\n");

  const shouldContinue = await confirm({
    message: "Continue with installation?",
    default: true,
    title: "Confirm",
  });

  if (!shouldContinue) {
    console.log("Cancelled.");
    return;
  }

  const projectName = await input({
    message: "Project name",
    default: "my-app",
    title: "Input",
  });

  console.log(`Project: ${projectName}`);

  const overwrite = await confirm({
    message: `Directory "${projectName}" may exist. Overwrite?`,
    default: false,
  });

  if (overwrite) {
    console.log("Would overwrite (demo).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
