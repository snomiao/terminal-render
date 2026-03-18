import { TerminalRenderStream, TerminalTextRender } from "./index";

describe("TerminalRenderStream (raw mode — default)", () => {
  test("should pass through raw data on pull", async () => {
    const stream = new TerminalRenderStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("Hello World");
    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBe("Hello World");

    await writer.close();
    reader.releaseLock();
  });

  test("should coalesce multiple writes into one pull", async () => {
    const stream = new TerminalRenderStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("A\n");
    await writer.write("B\n");
    await writer.write("C");

    const { value } = await reader.read();
    expect(value).toBe("A\nB\nC");

    await writer.close();
    reader.releaseLock();
  });

  test("should preserve raw escape sequences in output", async () => {
    const stream = new TerminalRenderStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    const raw = "\x1b[32mgreen\x1b[0m \x1b[1mbold\x1b[0m";
    await writer.write(raw);
    const { value } = await reader.read();
    // Raw mode preserves escape sequences
    expect(value).toBe(raw);

    await writer.close();
    reader.releaseLock();
  });

  test("should close readable when writable closes", async () => {
    const stream = new TerminalRenderStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("final");
    await reader.read();

    await writer.close();
    const r2 = await reader.read();
    expect(r2.done).toBe(true);

    reader.releaseLock();
  });

  test("writable should never block even without reader", async () => {
    const stream = new TerminalRenderStream();
    const writer = stream.writable.getWriter();

    const writes: Promise<void>[] = [];
    for (let i = 0; i < 1000; i++) {
      writes.push(writer.write(`Line ${i}\n`));
    }

    // All writes should resolve immediately (no backpressure)
    await Promise.all(writes);

    // Now read — should get all raw data coalesced
    const reader = stream.readable.getReader();
    const { value } = await reader.read();
    expect(value).toContain("Line 0");
    expect(value).toContain("Line 999");

    await writer.close();
    reader.releaseLock();
  });

  test("renderer is always up-to-date after write", async () => {
    const stream = new TerminalRenderStream();
    const writer = stream.writable.getWriter();

    await writer.write("Line 1\nLine 2\nLine 3\n");

    // Renderer should be up-to-date even without reading
    const renderer = stream.getRenderer();
    expect(renderer.tail(2)).toBe("Line 2\nLine 3");
    expect(renderer.getCursorPosition().row).toBe(3);

    await writer.close();
  });
});

describe("TerminalRenderStream (diff mode)", () => {
  test("should emit rendered diff on pull", async () => {
    const stream = new TerminalRenderStream({ mode: "diff" });
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("Hello World");
    const { value } = await reader.read();
    expect(value).toBe("Hello World");

    await writer.close();
    reader.releaseLock();
  });

  test("should emit only the diff between pulls", async () => {
    const stream = new TerminalRenderStream({ mode: "diff" });
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("Line 1\n");
    const r1 = await reader.read();
    expect(r1.value).toBe("Line 1");

    await writer.write("Line 2\n");
    const r2 = await reader.read();
    expect(r2.value).toBe("Line 2");

    await writer.close();
    reader.releaseLock();
  });

  test("should handle in-place overwrites via carriage return", async () => {
    const stream = new TerminalRenderStream({ mode: "diff" });
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("Progress: 0%");
    const r1 = await reader.read();
    expect(r1.value).toBe("Progress: 0%");

    await writer.write("\rProgress: 100%");
    const r2 = await reader.read();
    expect(r2.value).toBe("Progress: 100%");

    await writer.close();
    reader.releaseLock();
  });

  test("should handle ANSI clear screen", async () => {
    const stream = new TerminalRenderStream({ mode: "diff" });
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("Line 1\nLine 2\nLine 3");
    await reader.read();

    await writer.write("\x1b[2JNew Content");
    const r2 = await reader.read();
    expect(r2.value).toBe("New Content");

    await writer.close();
    reader.releaseLock();
  });

  test("should coalesce rapid overwrites in diff mode", async () => {
    const stream = new TerminalRenderStream({ mode: "diff" });
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    for (let i = 0; i < 100; i++) {
      await writer.write(`update ${i}\r`);
    }
    await writer.write("\nDone");

    const { value } = await reader.read();
    expect(value).toContain("update 99");
    expect(value).toContain("Done");
    expect(value).not.toContain("update 0\n");

    await writer.close();
    reader.releaseLock();
  });

  test("should accept an existing renderer", async () => {
    const renderer = new TerminalTextRender();
    renderer.write("pre-existing ");
    const stream = new TerminalRenderStream({ renderer, mode: "diff" });
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    await writer.write("content");
    const { value } = await reader.read();
    // The changed line is emitted (pre-existing line was modified by appending "content")
    expect(value).toBe("pre-existing content");

    expect(stream.getRenderer()).toBe(renderer);
    expect(renderer.render()).toBe("pre-existing content");

    await writer.close();
    reader.releaseLock();
  });
});
