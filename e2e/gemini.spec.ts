#!/usr/bin/env bun --watch test
import { readFile, writeFile } from 'fs/promises';
import { TerminalTextRender } from '../index';

it('works on gemini', async () => {
  const input = await readFile('./e2e/gemini-out.txt', 'utf8');

  const out = new TerminalTextRender().write(input).render();

  await writeFile('./e2e/gemini-actual.log', out); // for debugging

  expect(out).toEqual(await readFile('./e2e/gemini-expect.txt', 'utf8'));
});
