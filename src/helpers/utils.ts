import path from "path";
import mergeWith from "lodash.mergewith";
import { Package } from "@manypkg/get-packages";

import { defaultConfig } from "./consts";

import type {
  ArgsOptions,
  DynamicLoad,
  Functions,
  IConfig,
  InternalConfig,
} from "src/types";

export const MergeNormalizeConfig = (
  config: IConfig,
  packages: Package[],
  argv: ArgsOptions
): InternalConfig => {
  config = normalizeConfig(config, packages, argv);

  config = mergeWith(defaultConfig(argv), config); // Overriding default config with user config

  return config as InternalConfig;
};

const normalizeConfig = (
  config: IConfig,
  packages: Package[],
  argv: ArgsOptions
): IConfig => {
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

  if (
    argv.run.length === 0 &&
    config.runScripts?.length === 0 &&
    !config.actions
  )
    throw new Error(
      "Please pass a command or a list of actions to the config file"
    );

  /* Merge args to config file */
  if (argv.run.length > 0) config.runScripts = argv.run; // Gives CLI flags more priority

  return config;
};

export function convertPath(root: string, absPath: string): string {
  const fullPath = absPath.replace(root, "");
  return fullPath;
}

export function isAsync(fn?: Functions): boolean {
  const AsyncFunction = (async () => {}).constructor;

  return fn instanceof AsyncFunction;
}

export const getConfigFile = (configPath: string) => {
  return new Promise<DynamicLoad["default"]>(async (resolve, reject) => {
    const filePath = path.join(process.cwd(), configPath);
    let configFile: DynamicLoad | undefined;
    try {
      configFile = await import(filePath);
    } catch (err) {
      reject(`Couldn't find the config file at ${filePath}`);
    }
    resolve((configFile as DynamicLoad).default);
  });
};
