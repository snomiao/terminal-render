# terminal-render

A TypeScript library for rendering terminal text that handles ANSI escape sequences and control characters. This library simulates terminal behavior by processing terminal control codes and ANSI escape sequences to produce clean text output.

Developed for [snomiao/claude-yes](https://github.com/snomiao/claude-yes) - an interactive CLI tool for Claude AI.

## Features

- **ANSI Escape Sequence Support**: Handles cursor movement, positioning, and screen clearing commands
- **Control Character Processing**: Supports carriage returns, line feeds, tabs, backspace
- **Progress Indicator Rendering**: Perfect for processing terminal output with progress bars and dynamic updates
- **Cursor State Management**: Maintains cursor position and supports save/restore operations
- **Line Management**: Automatically handles line creation, clearing, and manipulation
- **Real Terminal Output Simulation**: Processes complex terminal output with colors and formatting

## Installation

```bash
bun install
```

## Usage

### Basic Usage

```typescript
import { TerminalTextRender, createTerminalLogManager } from "terminal-render";

// Write text with ANSI codes
const renderer = new TerminalTextRender();
renderer.write("Hello\x1b[1;5HWorld"); // Position cursor and write
console.log(renderer.render()); // Output: "World"

// Handle progress indicators
const renderer2 = new TerminalTextRender();
renderer2.write("Progress: 0%\rProgress: 50%\rProgress: 100%");
console.log(renderer2.render()); // Output: "Progress: 100%"
```

### Factory Function

```typescript
const manager = createTerminalLogManager();
manager.write("Terminal output with\nANSI codes\x1b[2J");
console.log(manager.render());
```

## API Reference

### TerminalTextRender

#### Methods

- **`write(data: string): TerminalTextRender`** - Process and write terminal data
- **`render(): string`** - Get the current rendered text output
- **`clear(): void`** - Clear all content and reset cursor position

#### Supported ANSI Escape Sequences

| Sequence    | Description                |
| ----------- | -------------------------- |
| `\x1b[nA`   | Cursor up n lines          |
| `\x1b[nB`   | Cursor down n lines        |
| `\x1b[nC`   | Cursor forward n columns   |
| `\x1b[nD`   | Cursor backward n columns  |
| `\x1b[nE`   | Cursor next line           |
| `\x1b[nF`   | Cursor previous line       |
| `\x1b[nG`   | Cursor horizontal absolute |
| `\x1b[n;mH` | Cursor position            |
| `\x1b[nJ`   | Erase display              |
| `\x1b[nK`   | Erase line                 |
| `\x1b[s`    | Save cursor position       |
| `\x1b[u`    | Restore cursor position    |

#### Control Characters

- `\r` - Carriage return (move cursor to line beginning)
- `\n` - Line feed (move to next line)
- `\b` - Backspace (move cursor back one position)
- `\t` - Tab (move to next 8-character tab stop)

## Development

### Run Tests

```bash
bun test
```

### Run Development Server

```bash
bun dev
```

### Build

```bash
bun run build
```

### Linting & Formatting

```bash
bun run lint
bun run format
```

## Use Cases

- Processing terminal/CLI application output
- Converting ANSI-formatted logs to clean text
- Simulating terminal behavior in web applications
- Testing terminal applications by capturing their output
- Building terminal emulators or terminal-like interfaces

## Live Demos

### Interactive CLI Demo

Try the CLI tool with the included demo files:

```bash
# Process a progress bar demo
bun cli.ts demo-progress.log

# Process complex terminal output with status updates
bun cli.ts demo-complex.log

# Process ANSI cursor movement sequences
bun cli.ts demo-ansi.log

# Use with any file containing terminal output
bun cli.ts your-log-file.txt
```

### Generate Demo Output

Create your own demo files by running terminal commands and redirecting output:

```bash
# Capture npm install output
npm install > demo-npm.log 2>&1
bun cli.ts demo-npm.log

# Capture build process output
bun run build > demo-build.log 2>&1
bun cli.ts demo-build.log

# Capture test output with progress
bun test > demo-test.log 2>&1
bun cli.ts demo-test.log
```

### Real-world Usage

Process output from common tools:

```bash
# Docker build output
docker build . > docker.log 2>&1
bun cli.ts docker.log

# Git operations with progress
git clone https://github.com/user/repo.git > git.log 2>&1
bun cli.ts git.log

# Package manager operations
yarn install > yarn.log 2>&1
bun cli.ts yarn.log
```

## Examples

### Progress Bar Processing

```typescript
const renderer = new TerminalTextRender();
const terminalOutput =
  "Installing packages...\nProgress: [          ] 0%\rProgress: [#####     ] 50%\rProgress: [##########] 100%\rComplete!\n";

renderer.write(terminalOutput);
console.log(renderer.render());
// Output:
// Installing packages...
// Progress: [##########] 100%
// Complete!
```

### Complex ANSI Sequence Handling

```typescript
const renderer = new TerminalTextRender();
renderer.write("Line 1\nLine 2\nLine 3");
renderer.write("\x1b[2A"); // Move up 2 lines
renderer.write("Modified"); // Overwrite content
console.log(renderer.render());
// Output:
// Line 1Modified
// Line 2
// Line 3
```

### Processing Real Terminal Output

```typescript
import { readFile } from "fs/promises";
import { TerminalTextRender } from "terminal-render";

// Read raw terminal output from a file
const rawOutput = await readFile("build-output.log", "utf8");

// Clean and render it
const renderer = new TerminalTextRender();
renderer.write(rawOutput);

const cleanOutput = renderer.render();
console.log(cleanOutput); // Clean, formatted output without ANSI codes
```

## License

MIT

## Related Projects

- [soloterm/screen](https://github.com/soloterm/screen) - A terminal renderer written in pure PHP. Unlike a full terminal emulator, Screen focuses specifically on correctly interpreting and rendering text content with formatting rather than handling input, interactive sessions, or process management.
- [ansi-to-react](https://www.npmjs.com/package/ansi-to-react) - Convert ANSI escape codes to React components
- [ansi-parser](https://www.npmjs.com/package/ansi-parser) - Parse ANSI escape sequences
