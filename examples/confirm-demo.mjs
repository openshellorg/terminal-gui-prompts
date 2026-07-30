#!/usr/bin/env node
/**
 * Demo: confirm() — in a Windows TTY you get a native dialog; prompt still echoed.
 * Run: node examples/confirm-demo.mjs
 */

import { confirm, confirmBoolean } from "terminal-gui-prompts";

const answer = await confirm({
  message: "Do you want to continue?",
  title: "Demo",
  default: "yes",
});

console.log("You chose:", answer);

const ok = await confirmBoolean({
  message: "Second question: allow access?",
  default: "no",
});

console.log("Second answer:", ok ? "yes" : "no");
