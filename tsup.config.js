export default {
  entry: "index.ts",
  noExternal: [/.*/],
  outDir: "dist",
  minify: true,
  treeshake: "smallest",
  format: "esm",
  target: "node20",
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
};
