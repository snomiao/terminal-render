#!/usr/bin/env bun --watch test
import { readFile, writeFile } from "fs/promises";
import { TerminalTextRender } from "../index";

it("still works on claude", async () => {
  const input = await readFile("./e2e/claude-out.txt", "utf8");

  const out = new TerminalTextRender().write(input).render();

  await writeFile("e2e/claude-actual.log", out); // for debugging

  expect(out).toEqual(await readFile("e2e/claude-expect.txt", "utf8"));
});
