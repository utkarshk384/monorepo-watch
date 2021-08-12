import chokidar from "chokidar";

import Events from "./events";
import { RemoveFile } from "../helpers/file-writer";

import type { WatcherConfig } from "../types";

class WatcherBase extends Events {
  constructor(config: WatcherConfig) {
    super(config);
    this.instance = chokidar.watch(config.watchFiles, config.options);
    this.setupExtend();
  }

  private setupExtend() {
    this.onReady();
    super.setup();
    this.handleSigint();
  }

  private close() {
    this.instance.close().then(() => {
      RemoveFile(this.root);
      this.logger.Log({
        message: "Sucessfully stopped watching files",
        clr: true,
      });
    });
  }

  private handleSigint() {
    process.on("SIGINT", () => {
      this.close();
    });
  }

  protected onReady() {
    this.instance.on("ready", () => {
      this.logger.Sucessful({ message: "Ready", clr: true });
    });
  }
}

const Watcher = (config: WatcherConfig) => {
  return new WatcherBase(config);
};

export default Watcher;
