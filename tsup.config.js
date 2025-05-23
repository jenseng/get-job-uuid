export default {
  entry: "index.ts",
  noExternal: [/.*/],
  outDir: "dist",
  minify: true,
  treeshake: "smallest",
  format: "esm",
  target: "node20",
};
