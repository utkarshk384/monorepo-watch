import fs from "fs";
import chokidar from "chokidar";
import debounce from "lodash.debounce";

import Logger, { LoggerType } from "../helpers/logger";
import { FILENAME } from "../helpers/consts";
import { InterpretFile, WriteFile } from "../helpers/file-writer";

import type { EventAction, WatcherConfig } from "../types";

abstract class Events {
  public instance: chokidar.FSWatcher;
  protected root: string;
  protected actions: EventAction;
  protected logger: LoggerType;

  constructor(config: WatcherConfig) {
    this.instance = chokidar.watch(config.include, config.options);
    this.root = config.root;
    this.actions = config.actions;
    this.logger = Logger();
  }

  protected setup() {
    this.onAdd();
    this.onAddDir();
    this.onChange();
    this.onUnlink();
    this.onUnlinkDir();
  }

  protected onAdd() {
    this.instance.on("add", (path, stats) => {
      this.instance.add(path);
      this.actions.add?.(path, stats);

      this.finalLogger("Add", path);
    });
  }

  protected onAddDir() {
    this.instance.on("addDir", (path, stats) => {
      this.instance.add(path);
      this.actions.addDir?.(path, stats);

      this.finalLogger("Add Dir", path);
    });
  }

  protected onUnlink() {
    this.instance.on("unlink", (path) => {
      this.instance.unwatch(path);
      this.actions.unlink?.(path);

      this.finalLogger("Remove", path);
    });
  }

  protected onUnlinkDir() {
    this.instance.on("unlinkDir", (path) => {
      this.instance.unwatch(path);
      this.actions.unlinkDir?.(path);

      this.finalLogger("Remove Dir", path);
    });
  }

  protected onChange() {
    //prettier-ignore
    this.instance.on("change", debounce((path, stats) => {
          stats = stats ?? fs.statSync(path);
  
          if (!stats) {
            this.logger.Error({
              message: "Your file couldn't be saved please try again.",
              clr: true,
            });
            return;
          }
  
          if (stats.size === InterpretFile(FILENAME, path)) {
            this.logger.Sucessful({
              message: "No changes in file recorded",
              clr: true,
            });
            return;
          }
          WriteFile(FILENAME, stats.size, path);
  
          this.logger.Log({ message: "Performing Action", clr: true });
          this.logger.Info(`File changed ${this.convertPath(path)}`);
  
          this.actions.change(path, stats);
  

          this.finalLogger("Change", path)
        }, 500, { maxWait: 750 }
      ));
  }

  private finalLogger(event: string, path: string) {
    this.logger.Log({ message: "Action Completed", clr: true });
    this.logger.Log({
      custom: (chalk) =>
        `${chalk.bgGreen.black(`  ${event}  `)} - ${chalk.white(
          this.convertPath(path)
        )}`,
      br: true,
    });
  }

  protected convertPath(absPath: string): string {
    const fullPath = absPath.replace(this.root, "");
    return fullPath;
  }
}

export default Events;
