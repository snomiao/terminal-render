import { TerminalTextRender } from "./terminal-render";

export { TerminalTextRender } from "./terminal-render";
export { TerminalRenderStream } from "./terminal-render-stream";

export function createTerminalLogManager(): TerminalTextRender {
  return new TerminalTextRender();
}
