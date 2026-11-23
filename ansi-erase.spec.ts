import { expect, test } from "bun:test";
import { TerminalTextRender } from "./terminal-render";

for (const command of ["J", "K"]) {
  test(`erase ${command} mode 1 includes the cursor and preserves following columns`, () => {
    const renderer = new TerminalTextRender().write(`abcdef\x1b[4G\x1b[1${command}`);
    expect(renderer.render()).toBe("    ef");
    expect(renderer.getCursorPosition()).toEqual({ row: 0, col: 3 });
    renderer.write("X");
    expect(renderer.render()).toBe("   Xef");
  });
  test(`erase ${command} mode 1 includes column zero`, () => {
    expect(new TerminalTextRender().write(`abc\r\x1b[1${command}`).render()).toBe(" bc");
  });
  test(`erase ${command} mode 0 includes the cursor without moving it`, () => {
    const renderer = new TerminalTextRender().write(`abcdef\x1b[4G\x1b[${command}X`);
    expect(renderer.render()).toBe("abcX");
  });
}

test("erase display before the cursor clears preceding rows without shifting the current row", () => {
  expect(new TerminalTextRender().write("first\nabcdef\nlast\x1b[2;4H\x1b[1JX").render()).toBe(
    "\n   Xef\nlast",
  );
});

test("character-set designation does not print control bytes or surrounding spaces", () => {
  expect(new TerminalTextRender().write("bold\x1b(B\x1b[m text").render()).toBe("bold text");
});

for (const [save, restore] of [
  ["\x1b7", "\x1b8"],
  ["\x1b[s", "\x1b[u"],
]) {
  test(`saved cursor ${JSON.stringify(save)} restores overwrite semantics`, () => {
    expect(new TerminalTextRender().write(`ab${save}\ncd${restore}XY`).render()).toBe("abXY\ncd");
    expect(new TerminalTextRender().write(`abcd\x1b[2G${save}\x1b[4GZ${restore}XY`).render()).toBe(
      "aXYZ",
    );
  });
}
