import chokidar from "chokidar";

import Events from "./events";
import { RemoveFile, CreateFile } from "../helpers/file-writer";
import { FILENAME } from "../helpers/consts";

import type { EventConfig } from "../types";

export class WatcherBase extends Events {
  constructor(config: EventConfig) {
    super(config);
    this.instance = chokidar.watch(config.include, config.options);
    this.setupExtend();
  }

  private setupExtend() {
    super.setup();
    CreateFile(FILENAME);
    this.handleSigint();
    this.handleError();
    this.onReady();
  }

  private close() {
    this.instance.close().then(() => {
      this.logger.LineBreak();
      this.logger.Custom(
        (chalk) =>
          chalk`${this.logger.theme.error(
            "  Closed  "
          )} - ${this.logger.theme.log("Sucessfully stopped watching files")}`
      );
      RemoveFile(FILENAME);
    });
  }

  private handleSigint() {
    process.on("SIGINT", () => {
      this.close();
    });
  }

  private handleError() {
    process.on("uncaughtException", (err: Error, origin: string) => {
      this.logger.LineBreak();
      //prettier-ignore
      this.logger.Custom(chalk => chalk`${this.logger.theme.error("  Error  ")} - ${this.logger.theme.log(`${err.message}. ${origin}`)}`);

      this.close();
      process.exit(0);
    });
  }

  protected onReady() {
    //TODO: Add a propery way to listen for inital add event and then handle it accordingly.
    setTimeout(() => {
      this.logger.ClearScreen();
      this.logger.isActive = true;
      this.logger.Custom(
        (chalk) =>
          //prettier-ignore
          chalk`${this.logger.theme.success("  Ready  ")} - ${this.logger.theme.log("Now watching for changes\n")}`
      );
    }, 1000);
  }
}

const Watcher = (config: EventConfig) => {
  return new WatcherBase(config);
};

export default Watcher;
