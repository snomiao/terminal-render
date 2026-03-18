import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "index.ts",
    cli: "cli.ts",
  },
  format: "esm",
  fixedExtension: false,
  hash: false,
  dts: true,
  sourcemap: true,
  clean: true,
});
