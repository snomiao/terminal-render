import { readFile } from "fs/promises"
import { TerminalTextRender } from "."

it('works', async () => {
    const input = await readFile('./claude-code-execute-log.txt', 'utf8')
    const out = new TerminalTextRender().write(input).render()
    expect(out).toMatchSnapshot()
})