import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import type { Dict, ArgsOptions, InternalConfig } from "../types";
import { getConfigFile } from "./utils";

/* Args options */

const options: Dict<yargs.Options> = {
  config: {
    type: "string",
    alias: "c",
    default: "./watcher.config.js",
    normalize: true,
    description: "Path to config file",
    defaultDescription: "./watcher.config.js",
    requiresArg: true,
  },
  include: {
    type: "array",
    alias: "i",
    default: ["src"],
    defaultDescription: "['src']",
    description: "Directories to watch(Globbing supported)",
  },
  run: {
    type: "array",
    alias: "r",
    default: [],
    defaultDescription: "[]",
    description: "Commands to run on file change",
  },
};

export const argv = yargs(hideBin(process.argv))
  .options(options)
  .help()
  .parseSync() as unknown as ArgsOptions;

if (argv.config === "")
  throw new Error("A config file must be provided using the --config flag"); //Enforces config file to alaways be given

const configPath = argv.config;

let Config: InternalConfig = await getConfigFile(configPath).catch((err) => {
  throw new Error(err);
});

if (!Config) throw new Error("Couldn't find the config file");

export { Config };
