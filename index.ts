export { TerminalTextRender } from "./terminal-render";
export { TerminalRenderStream } from "./terminal-render-stream";

import { TerminalTextRender } from "./terminal-render";
export function createTerminalLogManager(): TerminalTextRender {
  return new TerminalTextRender();
}
