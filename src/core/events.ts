import fs from "fs";
import chokidar from "chokidar";
import debounce from "lodash.debounce";

import Logger, { LoggerType } from "../helpers/logger";
import { FILENAME } from "../helpers/consts";
import { InterpretFile, WriteFile } from "../helpers/file-writer";

import type { EventAction, EventConfig } from "../types";
import { Package } from "@manypkg/get-packages";

type Functions = (...args: any[]) => any | ((...args: any[]) => Promise<any>);
abstract class Events {
  public instance: chokidar.FSWatcher;
  protected root: string;
  protected actions: EventAction;
  protected logger: LoggerType;
  private packages: Package[];

  constructor(config: EventConfig) {
    this.instance = chokidar.watch(config.include, config.options);
    this.root = config.root;
    this.actions = config.actions;
    this.logger = Logger();
    this.packages = config.packages;
  }

  protected setup(): void {
    this.onAdd();
    this.onAddDir();
    this.onChange();
    this.onUnlink();
    this.onUnlinkDir();
  }

  protected onAdd(): void {
    this.instance.on("add", (path, stats) => {
      const { add } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Add file to watch list */
      this.instance.add(path);

      /* Run user function */
      if (add) {
        if (this.isAsync(add) === false) {
          add?.(path, currentPkg, stats);
          this.finalLogger("Add", path);
          return;
        }
        add?.(path, currentPkg, stats).then(() => {
          this.finalLogger("Add", path);
        });
      }
    });
  }

  protected onAddDir(): void {
    this.instance.on("addDir", (path, stats) => {
      const { addDir } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Add dir to watch list */
      this.instance.add(path);

      /* Run user function */
      if (addDir) {
        if (this.isAsync(addDir) === false) {
          addDir?.(path, currentPkg, stats);
          this.finalLogger("Add Dir", path);
          return;
        }
        addDir?.(path, currentPkg, stats).then(() => {
          this.finalLogger("Add Dir", path);
        });
      }
    });
  }

  protected onUnlink(): void {
    this.instance.on("unlink", (path) => {
      const { unlink } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Remove File from watch list */
      this.instance.unwatch(path);

      /* Run user function */
      if (unlink) {
        if (this.isAsync(unlink) === false) {
          unlink?.(path, currentPkg);
          this.finalLogger("Remove", path);
          return;
        }
        unlink?.(path, currentPkg).then(() => {
          this.finalLogger("Remove", path);
        });
      }
    });
  }

  protected onUnlinkDir(): void {
    this.instance.on("unlinkDir", (path) => {
      const { unlinkDir } = this.actions;
      const currentPkg = this.getPackage(path);

      /* Remove Dir from watch list */
      this.instance.unwatch(path);

      /* Run user function */
      if (unlinkDir) {
        if (this.isAsync(unlinkDir) === false) {
          unlinkDir?.(path, currentPkg);
          this.finalLogger("Remove Dir", path);
          return;
        }
        unlinkDir?.(path, currentPkg).then(() => {
          this.finalLogger("Remove Dir", path);
        });
      }
      this.finalLogger("Remove Dir", path);
    });
  }

  protected onChange(): void {
    //prettier-ignore
    this.instance.on("change", debounce((path, stats) => {
      const {change} = this.actions;
      const currentPkg = this.getPackage(path);
      stats = stats ?? fs.statSync(path);

      /* Read and save `fileSize` to temp disk file */
      if (stats.size === InterpretFile(FILENAME, path)) {
        this.logger.Sucessful({
          message: "No changes in file recorded",
          clr: false,
        });
        return;
      }
      WriteFile(FILENAME, stats.size, path);

      this.logger.Log({ message: "Performing Action", clr: false });
      this.logger.Info(`File changed ${this.convertPath(path)}`);

      /* Run user function */
      if (change) {
        console.log(this.isAsync(change))
        if (this.isAsync(change) === false) {
          change?.(path, currentPkg, stats);
          this.finalLogger("Change", path);
          return;
        }
        change?.(path, currentPkg, stats).then(() => {
          this.finalLogger("Change", path);
        });
      }
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
    this.logger.Log({
      custom: (chalk) =>
        `${chalk.bgGreen.black(`  ${event}  `)} - ${chalk.white(
          this.convertPath(path)
        )}`,
    });
  }
}

export default Events;
