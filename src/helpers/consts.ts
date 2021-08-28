import { tmpdir } from "os";

import type { ArgsOptions, IConfig } from "src/types";

export const FILENAME = "tempsizes.json";
export const ROOT = tmpdir();
export const LOCK_NAME = "Lock";

export const defaultConfig: (argv: ArgsOptions) => IConfig = (
  argv: ArgsOptions
) =>
  ({
    packageRoot: process.cwd(),
    options: {},
    runScripts: [],
    prefix: "",
    include: argv.include,
  } as IConfig);
