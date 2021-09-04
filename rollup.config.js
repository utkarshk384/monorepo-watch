import path from "path";

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { preserveShebangs } from "rollup-plugin-preserve-shebangs";

const output = [
  {
    dir: "dist/main",
    name: "monorepo-watch",
    format: "esm",
    exports: "named",
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: "src",
  },
];

const plugins = [
  preserveShebangs(),
  typescript({ tsconfig: "./tsconfig.json" }),
  nodeResolve({
    mainFields: ["module", "main"],
    exportConditions: ["require", "node"],
    moduleDirectories: ["node_modules"],
    extensions: [".ts"],
  }),
  commonjs({ requireReturnsDefault: true }),
];

const external = [
  "tslib",
  "yargs",
  "chokidar",
  "fs",
  "lodash.debounce",
  "lodash.mergewith",
  "path",
  "glob",
  "is-glob",
  "yargs/helpers",
  "@manypkg/get-packages",
  "os",
  "chalk",
  "graceful-fs",
  "cross-spawn",
  "async-lock",
  "ora"
];

const config = {
  input: path.join("./src/index.ts"),
  output,
  plugins,
  external,
};

export default config;
