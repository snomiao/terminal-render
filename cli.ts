#!/usr/bin/env node
import { readFile } from 'fs/promises';
import { TerminalTextRender } from './index.js';

// Run if this file is executed directly
await main();

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: bun cli.ts <file>');
    console.error('Example: bun cli.ts example-log.txt');
    process.exit(1);
  }

  const filePath = args[0];

  try {
    // Read the input file
    const content = await readFile(filePath, 'utf8');

    // Create renderer and process content
    const renderer = new TerminalTextRender();
    renderer.write(content);

    // Output the rendered result
    console.log(renderer.render());
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }
    process.exit(1);
  }
}
