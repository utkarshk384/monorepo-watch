import { Package } from "@manypkg/get-packages";
import chalk from "chalk";
import chokidar from "chokidar";
import { Stats } from "fs";

/* General Types */
export type Dict<T = string, K extends string | number = string> = Record<K, T>;
export type EventType = "add" | "addDir" | "change" | "unlink" | "unlinkDir";

/* Resolver Types */
interface IBaseResolver {
  ExtractDependencies: () => string[];
}

export type ResolverConfig = {
  packageJSON: Dict;
  regex: RegExp;
  include: string[];
  packages: Package[];
};

export type ResolverType = (config: ResolverConfig) => IBaseResolver;

/* Watcher Types */
export type WatcherConfig = {
  root: string;
  include: string[];
  options: chokidar.WatchOptions;
  actions: EventAction;
};

/* Event Types */
export type EventConfig = WatcherConfig & {
  packages: Package[];
};

export type EventAction = {
  add?: (path: string, currentPkg: string, stats?: Stats) => Promise<any>;
  addDir?: (path: string, currentPkg: string, stats?: Stats) => Promise<any>;
  unlink?: (path: string, currentPkg: string) => Promise<any>;
  unlinkDir?: (path: string, currentPkg: string) => Promise<any>;
  change: (path: string, currentPkg: string, stats?: Stats) => Promise<any>;
};

/* Logger Types */
export type LoggerActions = {
  message: string;
  clr?: boolean;
  br?: boolean;
};

export type LoggerTheme = {
  log: chalk.Chalk;
  success: chalk.Chalk;
  info: chalk.Chalk;
  warning: chalk.Chalk;
  error: chalk.Chalk;
};

/* Config Types */
type Config = Omit<Partial<WatcherConfig>, "include" | "root">;

export type ArgsOptions = {
  config: string;
  c: string;
  include: string[];
  i: string;
};

export interface IConfig extends Config {
  packageRoot: string;
  prefix?: string;
  include?: string[];
}

export type InternalConfig = Required<IConfig>;
