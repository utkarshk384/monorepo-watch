import { Package } from "@manypkg/get-packages";
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
export type EventAction = {
  add?: (path: string, stats?: Stats) => any;
  addDir?: (path: string, stats?: Stats) => any;
  unlink?: (path: string) => any;
  unlinkDir?: (path: string) => any;
  change: (path: string, stats?: Stats) => any;
};

/* Logger Types */
export type LoggerActions = {
  message: string;
  clr?: boolean;
  br?: boolean;
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
