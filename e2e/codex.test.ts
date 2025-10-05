#!/usr/bin/env bun --watch test
import { readFile, writeFile } from 'fs/promises';
import { TerminalTextRender } from '../index';

it.skip('works on codex', async () => {
  const input = await readFile('./e2e/codex-out.txt', 'utf8');

  const out = new TerminalTextRender().write(input).render();

  // save for debugging
  await writeFile('e2e/codex-actual.log', out); // Note: stage it before
  // TODO: Fix this test by diff with expected output

  expect(out).toEqual(await readFile('e2e/codex-expect.txt', 'utf8'));
});
