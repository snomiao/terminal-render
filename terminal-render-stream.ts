import { TerminalTextRender } from "./terminal-render";

/**
 * A stream-like class with `readable`/`writable` sides that eagerly consumes all terminal
 * input (never exerts backpressure) and buffers data for downstream consumption.
 *
 * Note: this is NOT a native `TransformStream` instance; it exposes `readable` and `writable`
 * as separate `ReadableStream`/`WritableStream` properties.
 *
 * - `.writable` — feed raw PTY data here; writes resolve immediately
 * - `.readable` — read output when downstream pulls
 *
 * Two output modes:
 * - `"raw"` (default) — passes through raw PTY data, coalesced when downstream is slow.
 *   The renderer is updated eagerly as a side effect for querying via `getRenderer()`.
 * - `"diff"` — emits rendered text diffs since the last pull. For pure line appends,
 *   only the new content is emitted; for in-place edits (cursor movement, CR overwrites),
 *   the changed lines from the first modification point are emitted.
 *   Useful when downstream only needs to see what changed on screen.
 *
 * This decouples fast producers (PTY) from slow consumers (pattern matching, file I/O)
 * so the child process never blocks on a full pipe buffer.
 */
export class TerminalRenderStream {
  readonly readable: ReadableStream<string>;
  readonly writable: WritableStream<string>;
  private renderer: TerminalTextRender;
  private mode: "raw" | "diff";
  private lastSnapshot = "";
  private pendingRaw: string[] = [];
  private pullResolve: (() => void) | null = null;
  private closed = false;

  constructor(opts?: { renderer?: TerminalTextRender; mode?: "raw" | "diff" }) {
    this.renderer = opts?.renderer ?? new TerminalTextRender();
    this.mode = opts?.mode ?? "raw";
    // Initialize snapshot from existing renderer state so diff-pulls only emit changes
    this.lastSnapshot = this.renderer.render();

    this.readable = new ReadableStream<string>({
      pull: (controller) => {
        const output = this.drainOutput();

        if (output) {
          controller.enqueue(output);
          return;
        }

        if (this.closed) {
          controller.close();
          return;
        }

        // No new content yet — wait until data arrives
        return new Promise<void>((resolve) => {
          this.pullResolve = resolve;
        });
      },
      cancel: () => {
        this.closed = true;
        this.pullResolve?.();
        this.pullResolve = null;
      },
    });

    this.writable = new WritableStream<string>({
      write: (chunk) => {
        // Always feed renderer eagerly so it's always up-to-date
        this.renderer.write(chunk);
        this.pendingRaw.push(chunk);
        // Wake up any pending pull
        if (this.pullResolve) {
          const resolve = this.pullResolve;
          this.pullResolve = null;
          resolve();
        }
      },
      close: () => {
        this.closed = true;
        if (this.pullResolve) {
          const resolve = this.pullResolve;
          this.pullResolve = null;
          resolve();
        }
      },
      abort: () => {
        this.closed = true;
        if (this.pullResolve) {
          const resolve = this.pullResolve;
          this.pullResolve = null;
          resolve();
        }
      },
    });
  }

  /** Access the underlying renderer for tail(), getCursorPosition(), etc. */
  getRenderer(): TerminalTextRender {
    return this.renderer;
  }

  /** Drain buffered output based on mode. Returns null if nothing to emit. */
  private drainOutput(): string | null {
    if (this.mode === "raw") {
      if (this.pendingRaw.length === 0) return null;
      const data = this.pendingRaw.join("");
      this.pendingRaw.length = 0;
      return data;
    }

    // diff mode: emit rendered text diff
    this.pendingRaw.length = 0; // discard raw, we only emit diffs
    const current = this.renderer.render();
    if (current === this.lastSnapshot) return null;
    const diff = this.computeDiff(this.lastSnapshot, current);
    this.lastSnapshot = current;
    return diff || null;
  }

  /**
   * Compute the diff between old and new rendered output.
   * Returns only the new/changed content.
   *
   * Strategy:
   * 1. Pure text append (newText starts with oldText) — emit only the appended suffix.
   *    This handles mid-line PTY chunks arriving across multiple writes without re-emitting.
   * 2. Pure line append (all old lines are a prefix of new lines) — emit only the new lines.
   * 3. In-place edit (cursor movement, CR overwrite) — emit from the first changed line.
   */
  private computeDiff(oldText: string, newText: string): string {
    if (!oldText) return newText;

    // Fast path: pure text append within the same line — emit only the new suffix.
    // If the suffix starts with \n, the line boundary was already captured in the snapshot,
    // so fall through to line-based diff which strips the leading separator correctly.
    if (newText.startsWith(oldText)) {
      const suffix = newText.slice(oldText.length);
      if (!suffix.startsWith("\n")) return suffix;
    }

    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");

    // Find how many lines from the start are identical
    let commonPrefix = 0;
    const minLen = Math.min(oldLines.length, newLines.length);
    while (commonPrefix < minLen && oldLines[commonPrefix] === newLines[commonPrefix]) {
      commonPrefix++;
    }

    // Emit from the first changed line (covers both pure line-append and in-place edits)
    return newLines.slice(commonPrefix).join("\n");
  }
}
