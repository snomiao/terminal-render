#!/usr/bin/env bun --watch test
import { readFile, writeFile } from 'fs/promises';
import { TerminalTextRender } from '../index';

it('works on codex', async () => {
  const input = await readFile('./e2e/codex-out.txt', 'utf8');

  const out = new TerminalTextRender().write(input).render();

  await writeFile('e2e/codex-actual.log', out); // for debugging

  expect(out).toEqual(await readFile('e2e/codex-expect.txt', 'utf8'));
});

it('works on codex', async () => {
  const input = await readFile('./e2e/codex-2-out.txt', 'utf8');

  const out = new TerminalTextRender().write(input).render();

  await writeFile('e2e/codex-2-actual.log', out); // for debugging

  expect(out).toEqual(await readFile('e2e/codex-2-expect.txt', 'utf8'));
});
