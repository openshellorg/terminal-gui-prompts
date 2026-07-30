#!/usr/bin/env node
/**
 * Example app using the Enquirer adapter (named-question shape).
 * promptConfirm / promptInput return { [name]: value } so you destructure.
 *
 * Run from repo root: pnpm --filter example-enquirer-app build && pnpm --filter example-enquirer-app start
 * Or from this folder: pnpm build && pnpm start
 */

import { promptConfirm, promptInput } from "terminal-gui-prompts/enquirer";

async function main() {
  console.log("Enquirer-adapter example — named answers.\n");

  const { proceed } = await promptConfirm({
    name: "proceed",
    message: "Run the wizard?",
    default: true,
    title: "Confirm",
  });

  if (!proceed) {
    console.log("Exiting.");
    return;
  }

  const { username } = await promptInput({
    name: "username",
    message: "Username",
    default: "admin",
    title: "Input",
  });

  const { confirmDelete } = await promptConfirm({
    name: "confirmDelete",
    message: `Really create user "${username}"?`,
    default: false,
  });

  if (confirmDelete) {
    console.log(`User "${username}" created (demo).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
