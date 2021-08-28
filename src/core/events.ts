import fs from "fs";
import chokidar from "chokidar";
import AsyncLock from "async-lock";
import debounce from "lodash.debounce";
import spawn from "cross-spawn";
import { Package } from "@manypkg/get-packages";

// import { FILENAME } from "../helpers/consts";
import { LOCK_NAME } from "../helpers/consts";
import Logger, { LoggerType } from "../helpers/logger";
import { convertPath, isAsync } from "src/helpers/utils";
// import { InterpretFile, WriteFile } from "../helpers/file-writer";

import type {
  WatcherConfig,
  LoggerTheme,
  ActionOpts,
  InternalConfig,
} from "../types";

abstract class Events {
  public instance: chokidar.FSWatcher;
  protected root: string;
  protected config: InternalConfig;
  protected logger: LoggerType;
  private packages: Package[];
  private lock: AsyncLock;
  private theme: LoggerTheme;

  constructor(opts: WatcherConfig) {
    this.instance = chokidar.watch(opts.include, {
      ...opts.config.options,
      ignoreInitial: true,
    });
    this.root = opts.root;
    this.config = opts.config;
    this.logger = Logger();
    this.packages = opts.packages;
    this.lock = new AsyncLock();
    this.theme = this.logger.theme;
  }

  protected setup(): void {
    this.onError();
    this.onAdd();
    this.onAddDir();
    this.onChange();
    this.onUnlink();
    this.onUnlinkDir();
  }

  protected onError() {
    this.instance.on("error", (error) => {
      this.logger.LineBreak();
      this.logger.Custom(
        (c) =>
          c`${this.logger.Error("Error")} - ${error.message}.\n Stack - ${
            error.stack
          }`
      );
    });
  }

  protected onAdd(): void {
    this.instance.on("add", (path, stats) => {
      const add = this.config?.actions?.add;
      const currentPkg = this.getPackage(path);

      /* Add file to watch list */
      this.instance.add(path);

      /* Run user function */
      this.runUserFn("Add", { currentPkg, path, stats }, add);
    });
  }

  protected onAddDir(): void {
    this.instance.on("addDir", (path, stats) => {
      const addDir = this.config?.actions?.addDir;
      const currentPkg = this.getPackage(path);

      /* Add dir to watch list */
      this.instance.add(path);

      /* Run user function */
      this.runUserFn("Add Dir", { currentPkg, path, stats }, addDir);
    });
  }

  protected onUnlink(): void {
    this.instance.on("unlink", (path) => {
      const unlink = this.config?.actions?.unlink;
      const currentPkg = this.getPackage(path);

      /* Remove File from watch list */
      this.instance.unwatch(path);

      /* Run user function */
      this.runUserFn("Remove", { currentPkg, path }, unlink);
    });
  }

  protected onUnlinkDir(): void {
    this.instance.on("unlinkDir", (path) => {
      const unlinkDir = this.config?.actions?.unlinkDir;
      const currentPkg = this.getPackage(path);

      /* Remove Dir from watch list */
      this.instance.unwatch(path);

      /* Run user function */
      this.runUserFn("Remove Dir", { currentPkg, path }, unlinkDir);
    });
  }

  protected onChange(): void {
    //prettier-ignored
    this.instance.on(
      "change",
      debounce(
        (path, stats) => {
          const change = this.config?.actions?.change;
          const currentPkg = this.getPackage(path);
          stats = stats ?? fs.statSync(path);

          /* Read and save `fileSize` to temp disk file */
          // if (stats.size === InterpretFile(FILENAME, path)) {
          //     this.logger.ClearScreen();
          //     this.logger.Custom(
          //         (c) =>
          //           c`${this.theme.success("  Change  ")} - ${this.theme.log(
          //               "No file recorded on current save"
          //             )}`
          //         );
          //         return;
          //       }
          //       WriteFile(FILENAME, stats.size, path);

          this.logger.Log({ message: "Performing Action", clr: true });
          this.logger.Custom(
            (c) =>
              c`${this.theme.info("  File Changed  ")} - ${this.theme.log(
                convertPath(this.root, path)
              )}`
          );

          /* Run user function */
          this.lock.acquire(LOCK_NAME, () => {
            this.runUserFn("Change", { currentPkg, path, stats }, change);
          });
        },
        100,
        { maxWait: 100, trailing: true }
      )
    );
  }

  private getPackage(path: string): string {
    let matchedPkg: string = "";
    this.packages.forEach((pkg) => {
      const match = path.includes(pkg.dir);

      if (match) matchedPkg = pkg.dir.split("/").pop() as string;
    });

    return matchedPkg;
  }

  private runUserFn(
    eventName: string,
    options: ActionOpts,
    fn?: (opts: ActionOpts) => Promise<void>
  ): void {
    const relativePath = convertPath(this.root, options.path);
    if (fn && isAsync(fn) === true) {
      fn({ ...options }).then(() => {
        this.EndLogger(eventName, relativePath);
      });
    } else {
      //INFO: Experimental
      process.env.FORCE_COLOR = "true";
      const cp = spawn.sync(
        this.config.runScripts[0],
        this.config.runScripts.slice(1),
        {
          env: process.env,
          cwd: options.path.split("/").slice(0, -1).join("/"), //Hacky way to get it working
          stdio: ["inherit", "pipe", "inherit"],
        }
      );

      if (cp.error) throw cp.error;
      if (cp.stderr) throw new Error(String(cp.stderr));
      else if (cp.stdout) {
        this.EndLogger(eventName, relativePath);
      }
    }
  }

  private EndLogger(eventName: string, path: string) {
    this.logger.Log({ message: "\nAction Completed", clr: false });
    this.logger.Custom(
      (c) => `${c.bgGreen.black(`  ${eventName}  `)} - ${c.white(path)}\n`
    );
  }
}

export default Events;
