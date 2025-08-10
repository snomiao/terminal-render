#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFile, writeFile } from 'fs/promises';
import { TerminalTextRender } from './index.js';

// Run if this file is executed directly
await main();

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command('$0 <file>', 'Render terminal text from a file', (yargs) => {
      return yargs.positional('file', {
        describe: 'Path to the file to render',
        type: 'string',
        demandOption: true,
      });
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Output file path (optional, defaults to stdout)',
    })
    .help()
    .alias('help', 'h')
    .example('$0 example-log.txt', 'Render text from example-log.txt')
    .example('$0 input.txt -o output.txt', 'Render text and save to output.txt')
    .strict()
    .parseAsync();

  const filePath = argv.file as string;
  const outputPath = argv.output as string | undefined;

  try {
    // Read the input file
    const content = await readFile(filePath, 'utf8');

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
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}
