import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { spawn } from "child_process";
import { join } from "path";

const CLI_PATH = join(import.meta.dir, "cli.ts");

describe("CLI", () => {
  const testDir = join(import.meta.dir, "test-temp");
  const testFile = join(testDir, "test-input.txt");
  const outputFile = join(testDir, "test-output.txt");

  beforeEach(async () => {
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    try {
      if (existsSync(testFile)) await unlink(testFile);
      if (existsSync(outputFile)) await unlink(outputFile);
    } catch {
      // Ignore cleanup errors
    }
  });

  test("should render text from file and output to stdout", async () => {
    const testContent = "Hello\rWorld\nTest";
    await writeFile(testFile, testContent);

    const result = await runCLI([testFile]);

    expect(result.stdout.trim()).toBe("World\nTest");
    expect(result.exitCode).toBe(0);
  });

  test("should render text from file and save to output file", async () => {
    const testContent = "Hello\rWorld\nTest";
    await writeFile(testFile, testContent);

    const result = await runCLI([testFile, "-o", outputFile]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`Rendered output saved to: ${outputFile}`);

    const outputContent = await readFile(outputFile, "utf8");
    expect(outputContent).toBe("World\nTest");
  });

  test("should handle ANSI escape sequences", async () => {
    const testContent = "\x1b[2KHello\x1b[1AWorld";
    await writeFile(testFile, testContent);

    const result = await runCLI([testFile]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("HelloWorld");
  });

  test('should read from stdin when file is "-"', async () => {
    const testInput = "Hello\rWorld";

    const result = await runCLI(["-"], testInput);

    expect(result.stdout.trim()).toBe("World");
    expect(result.exitCode).toBe(0);
  });

  test("should read from stdin by default", async () => {
    const testInput = "Hello\rWorld";

    const result = await runCLI([], testInput);

    expect(result.stdout.trim()).toBe("World");
    expect(result.exitCode).toBe(0);
  });

  test("should display help when --help is used", async () => {
    const result = await runCLI(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Render terminal text from a file or stdin");
    expect(result.stdout).toContain("--output");
    expect(result.stdout).toContain("Examples:");
  });

  test("should handle empty input", async () => {
    await writeFile(testFile, "");

    const result = await runCLI([testFile]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("");
  });

  test("should handle file not found error", async () => {
    const nonExistentFile = join(testDir, "non-existent.txt");

    const result = await runCLI([nonExistentFile]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("ENOENT");
  });

  test("should handle complex terminal control sequences", async () => {
    const testContent = "Line 1\nLine 2\x1b[1A\x1b[KReplaced";
    await writeFile(testFile, testContent);

    const result = await runCLI([testFile]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("Line 1Replaced\nLine 2");
  });
});

// Helper function to run CLI command
function runCLI(
  args: string[],
  input?: string,
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const child = spawn("bun", [CLI_PATH, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });

    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    } else if (child.stdin) {
      child.stdin.end();
    }
  });
}
