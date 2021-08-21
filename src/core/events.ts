import fs from "fs";
import chokidar from "chokidar";
import debounce from "lodash.debounce";
import AsyncLock from "async-lock";

import Logger, { LoggerType } from "../helpers/logger";
import { FILENAME } from "../helpers/consts";
import { InterpretFile, WriteFile } from "../helpers/file-writer";

import type { EventAction, EventConfig, LoggerTheme } from "../types";
import { Package } from "@manypkg/get-packages";

type Functions = (...args: any[]) => any | ((...args: any[]) => Promise<any>);
abstract class Events {
  public instance: chokidar.FSWatcher;
  protected root: string;
  protected actions: EventAction;
  protected logger: LoggerType;
  private packages: Package[];
  private lock: AsyncLock;
  private lockName: string;
  private theme: LoggerTheme;

  constructor(config: EventConfig) {
    this.instance = chokidar.watch(config.include, config.options);
    this.root = config.root;
    this.actions = config.actions;
    this.logger = Logger();
    this.packages = config.packages;
    this.lock = new AsyncLock();
    this.lockName = "locked";
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
      const { add } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Add file to watch list */
      this.instance.add(path);

      /* Run user function */
      if (add && this.isAsync(add) === true) {
        add?.(path, currentPkg, stats).then(() => {
          this.finalLogger("Add", path);
        });
      } else
        throw new Error(
          "Add function is either not defined or is not an async function"
        );
    });
  }

  protected onAddDir(): void {
    this.instance.on("addDir", (path, stats) => {
      const { addDir } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Add dir to watch list */
      this.instance.add(path);

      /* Run user function */
      if (addDir && this.isAsync(addDir) === true) {
        addDir?.(path, currentPkg, stats).then(() => {
          this.finalLogger("Add Dir", path);
        });
      } else
        throw new Error(
          "Add Dir function is either not defined or is not an async function"
        );
    });
  }

  protected onUnlink(): void {
    this.instance.on("unlink", (path) => {
      const { unlink } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Remove File from watch list */
      this.instance.unwatch(path);

      /* Run user function */
      if (unlink && this.isAsync(unlink) === true) {
        unlink?.(path, currentPkg).then(() => {
          this.finalLogger("Remove", path);
        });
      } else
        throw new Error(
          "Unlink function is either not defined or is not an async function"
        );
    });
  }

  protected onUnlinkDir(): void {
    this.instance.on("unlinkDir", (path) => {
      const { unlinkDir } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Remove Dir from watch list */
      this.instance.unwatch(path);

      /* Run user function */
      if (unlinkDir && this.isAsync(unlinkDir) === true) {
        unlinkDir?.(path, currentPkg).then(() => {
          this.finalLogger("Remove Dir", path);
        });
      } else
        throw new Error(
          "UnlinkDir function is either not defined or is not an async function"
        );
    });
  }

  protected onChange(): void {
    //prettier-ignored
    this.instance.on("change", debounce((path, stats) => {
      const {change} = this.actions;
      const currentPkg = this.getPackage(path);
      stats = stats ?? fs.statSync(path);

      /* Read and save `fileSize` to temp disk file */
      if (stats.size === InterpretFile(FILENAME, path)) {
        this.logger.ClearScreen()
        this.logger.Custom(c => c`${this.theme.success("  Change  ")} - ${this.theme.log("No file recorded on current save")}`)
        this.logger.Sucessful({
          message: "No changes in file recorded",
          clr: true,
        });
        return;
      }
      WriteFile(FILENAME, stats.size, path);

      this.logger.Log({ message: "Performing Action", clr: true });
      this.logger.Custom(c => c`${this.theme.info("  File Changed  ")} - ${this.theme.log(this.convertPath(path))}`)

      /* Run user function */
      if (change && this.isAsync(change) === true) {
        this.lock.acquire(this.lockName, () => {
            change?.(path, currentPkg, stats)
        }).then(() => {
            this.finalLogger("Change", path);
        })
      } else throw new Error(`Change function is either not defined or is not an async function`);
    }, 500, { maxWait: 750 }));
  }

  protected convertPath(absPath: string): string {
    const fullPath = absPath.replace(this.root, "");
    return fullPath;
  }

  private isAsync(fn?: Functions): boolean {
    const AsyncFunction = (async () => {}).constructor;

    return fn instanceof AsyncFunction;
  }

  private getPackage(path: string): string {
    let matchedPkg: string = "";
    this.packages.forEach((pkg) => {
      const match = path.includes(pkg.dir);

      if (match) matchedPkg = pkg.dir.split("/").pop() as string;
    });

    return matchedPkg;
  }

  private finalLogger(event: string, path: string): void {
    this.logger.Log({ message: "Action Completed", clr: false });
    this.logger.Custom(
      (c) =>
        `${c.bgGreen.black(`  ${event}  `)} - ${c.white(
          this.convertPath(path)
        )}\n`
    );
  }
}

export default Events;
