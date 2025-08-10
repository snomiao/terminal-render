#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFile, writeFile } from 'fs/promises';
import { TerminalTextRender } from './index';
import { fromReadable } from 'from-node-stream';

// Run if this file is executed directly
await main();

async function readStdin(): Promise<string> {
  return await fromReadable(process.stdin).text();
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command(
      '$0 [file]',
      'Render terminal text from a file or stdin, removes ansi control characters.',
      (yargs) => {
        return yargs.positional('file', {
          describe: 'Path to the file to render, or "-" to read from stdin',
          type: 'string',
          default: '-',
        });
      }
    )
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output file path (optional, defaults to stdout)',
    })
    .help()
    .alias('help', 'h')
    .example('$0 example-log.txt', 'Render text from example-log.txt')
    .example('$0 input.txt -o output.txt', 'Render text and save to output.txt')
    .example('$0 - < input.txt', 'Render text from stdin')
    .example('echo -e "Hello\\rWorld" | $0 -', 'Render piped text from stdin')
    .example(
      'echo -e "Hello\\rWorld" | $0',
      'Render piped text from stdin (defaults to stdin)'
    )
    .strict()
    .parseAsync();

  const filePath = argv.file as string;
  const outputPath = argv.output as string | undefined;

  // Read the input content (either from file or stdin)
  const content: string =
    filePath === '-' ? await readStdin() : await readFile(filePath, 'utf8');

  // Create renderer and process content
  const renderer = new TerminalTextRender();
  renderer.write(content);

  // Get the rendered result
  const result = renderer.render();

  // Output the result
  if (outputPath) {
    await writeFile(outputPath, result, 'utf8');
    console.log(`Rendered output saved to: ${outputPath}`);
  } else {
    console.log(result);
  }
}
