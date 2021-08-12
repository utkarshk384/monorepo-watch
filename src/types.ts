import chokidar from "chokidar";
import { Stats } from "fs";

export type Dict<T = string, K extends string | number = string> = Record<K, T>;

export interface IBaseResolver {
  ExtractDependencies: () => string[];
}

export type ResolverConfig = {
  root: string;
  packageJSON: Dict;
  regex: RegExp;
  extensions: string[];
};

export type ResolverType = (config: ResolverConfig) => IBaseResolver;

export type ArgsOptions = {
  root: string;
  r: string;
  prefix: string;
  p: string;
  extensions: string[];
  e: string[];
};

export type WatcherConfig = {
  root: string;
  watchFiles: string[];
  options: chokidar.WatchOptions;
  actions: EventAction;
};

export type EventType = "add" | "addDir" | "change" | "unlink" | "unlinkDir";

export type EventAction = {
  add: (path: string, stats?: Stats) => any;
  addDir: (path: string, stats?: Stats) => any;
  unlink: (path: string) => any;
  unlinkDir: (path: string) => any;
  change: (path: string, stats?: Stats) => any;
};

export type LoggerActions = {
  message: string;
  clr?: boolean;
  br?: boolean;
};
