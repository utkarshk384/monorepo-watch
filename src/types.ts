import { Package } from "@manypkg/get-packages";
import chalk from "chalk";
import chokidar from "chokidar";
import { Stats } from "fs";

/* General Types */
export type Dict<T = string, K extends string | number = string> = Record<K, T>;
export type EventType = "add" | "addDir" | "change" | "unlink" | "unlinkDir";
export type Functions = (
  ...args: any[]
) => any | ((...args: any[]) => Promise<any>);

export type DynamicLoad = {
  default: InternalConfig;
};

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
  config: InternalConfig;
  packages: Package[];
};

/* Event Types */

export type ActionOpts = {
  path: string;
  currentPkg: string;
  stats?: Stats;
};

export type EventAction = {
  add?: (opts: ActionOpts) => Promise<any>;
  addDir?: (opts: ActionOpts) => Promise<any>;
  unlink?: (opts: ActionOpts) => Promise<any>;
  unlinkDir?: (opts: ActionOpts) => Promise<any>;
  change: (opts: ActionOpts) => Promise<any>;
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

export type ArgsOptions = {
  config: string;
  c: string;
  include: string[];
  i: string;
  run: string[];
  r: string[];
};

export interface IConfig {
  options?: chokidar.WatchOptions;
  packageRoot: string;
  prefix?: string;
  include?: string[];
  actions?: EventAction;
  runScripts?: string[];
}

export type InternalConfig = Required<IConfig>;
