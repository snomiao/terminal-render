#!/usr/bin/env bun --watch test
import { readFile, writeFile } from 'fs/promises';
import { TerminalTextRender } from '../index';

it('works on codex', async () => {
  const input = await readFile('./e2e/codex-out.txt', 'utf8');

  const out = new TerminalTextRender().write(input).render();

  await writeFile('e2e/codex-actual.log', out); // for debugging

  expect(out).toEqual(await readFile('e2e/codex-expect.txt', 'utf8'));
});

it('works on codex-yes-20260105112604953', async () => {
  const input = await readFile('./e2e/codex-yes-20260105112604953.out.txt', 'utf8');

  const out = new TerminalTextRender().write(input).render();

  await writeFile('e2e/codex-yes-20260105112604953-actual.log', out); // for debugging

  expect(out).toEqual(await readFile('e2e/codex-yes-20260105112604953.expect.txt', 'utf8'));
});
