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
    this.onReady();
    super.setup();
    CreateFile(FILENAME);
    this.handleSigint();
  }

  private close() {
    this.instance.close().then(() => {
      this.logger.Log({
        message: "Sucessfully stopped watching files",
        clr: false,
      });
      RemoveFile(FILENAME);
    });
  }

  private handleSigint() {
    process.on("SIGINT", () => {
      this.close();
    });
  }

  protected onReady() {
    this.instance.on("ready", () => {
      this.logger.Sucessful({ message: "Ready", clr: false });
    });
  }
}

const Watcher = (config: EventConfig) => {
  return new WatcherBase(config);
};

export default Watcher;
