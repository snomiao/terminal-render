import { readFile, writeFile } from 'fs/promises';
import { TerminalTextRender } from './index';

it('works', async () => {
  const input = await readFile('./claude-code-execute-log.txt', 'utf8');

  const out = new TerminalTextRender().write(input).render();

  // save for debugging
  await writeFile('./claude-code-execute-rendered.log', out);

  expect(out).toMatchSnapshot();
});
