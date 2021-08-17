import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Package } from "@manypkg/get-packages";
import mergeWith from "lodash.mergewith";

import type { Dict, IConfig, InternalConfig, ArgsOptions } from "../types";

type DynamicLoad = {
  default: InternalConfig;
};

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
};

const argv = yargs(hideBin(process.argv))
  .options(options)
  .help()
  .parseSync() as unknown as ArgsOptions;

if (argv.config === "")
  throw new Error("A config file must be provided using the --config flag"); //Enforces config file to alaways be given

const configPath = argv.config;

const { default: Config }: DynamicLoad = await import(
  path.join(process.cwd(), configPath)
); //Assuming that the cli is ran from a sub package
if (!Config) throw new Error("Couldn't find the config file");

const defaultConfig: InternalConfig = {
  packageRoot: process.cwd(),
  options: {},
  prefix: "",
  /* 
    Dummy actions to avoid errors
  */
  actions: {
    add: async () => {},
    addDir: async () => {},
    unlink: async () => {},
    unlinkDir: async () => {},
    change: async () => {},
  },
  include: argv.include,
};

export const MergeConfig = (
  config: IConfig,
  packages: Package[]
): InternalConfig => {
  if (!config.actions || !config.actions.change)
    throw new Error(`config.actions.change should be defined`); // Makes `config.actions.change` a required parameter

  /* Acquiring prefix from package.json */
  if (!config.prefix) {
    const name = packages[0].packageJson.name.split("/");
    if (name.length === 0)
      throw new Error(
        "Couldn't get package name. Please specfiy one in the config file"
      );
    config.prefix = name[0];
  }

  /* Fixing string bug with includes */
  if (!config.include) config.include = ["src"];

  config = mergeWith(defaultConfig, config); // Overriding default config with user config

  return config as InternalConfig;
};

export { Config };
