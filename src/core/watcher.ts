import Events from "./events"

import type { WatcherConfig } from "../types"

export class WatcherBase extends Events {
	constructor(opts: WatcherConfig) {
		super(opts)
		this.setupExtend()
	}

	private setupExtend(): void {
		this.handleSigint()
		this.handleError()
		this.onReady()
		super.setup()
	}

	private close(): void {
		this.instance.close().then(() => {
			this.logger.LineBreak()
			this.logger.Custom(
				(chalk) =>
					chalk`${this.logger.raw(
						{ message: "Closed", spaceContent: true },
						"error"
					)} - ${this.logger.raw("Sucessfully stopped watching files", "log")}`
			)
		})
	}

	private handleSigint(): void {
		process.on("SIGINT", () => {
			this.close()
		})
	}

	private handleError(): void {
		process.on("uncaughtException", (err: Error, origin: string) => {
			this.logger.LineBreak()
			//prettier-ignore
			this.logger.Custom(chalk => chalk`${this.logger.raw({message: "Error", spaceContent: true}, "error")} - ${this.logger.raw(`${err.message}. ${origin}`, "log")}`);

			this.close()
			process.exit(0)
		})
	}

	protected onReady(): void {
		//TODO: Add a propery way to listen for inital add event and then handle it accordingly.
		setTimeout(() => {
			this.logger.ClearScreen()
			this.logger.isActive = true
			this.logger.Custom(
				(chalk) =>
					//prettier-ignore
					chalk`${this.logger.raw({message: "Ready", spaceContent: true}, "success")} - ${this.logger.raw("Now watching for changes\n", "log")}`
			)
		}, 1000)
	}
}

const Watcher = (opts: WatcherConfig): WatcherBase => {
	return new WatcherBase(opts)
}

export default Watcher
