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

		this.instance.once("ready", () => {
			this.ReadyLog()
		})

		super
			.setup()
			.then(() => this.logger.WithBackground("Debug", "Sucessfully added event listeners", "debug"))

		//Set Input mode and encoding
		process.stdin.setRawMode(true)
		process.stdin.setEncoding("utf8")

		const keyPressEvent = (data: Buffer): void => {
			const key = String(data)
			if (key === "\u0003") {
				this.close()
			} else if (!this.optionToggle.getValue()) {
				this.logger.clearLastLines()
				this.logger.OptionsLogger()
			}

			let payload: string | null = ""

			const onActive = (): void => {
				switch (key) {
					case "a":
						payload = JSON.stringify(this.formatWatchedFiles(true), null, 2)
						this.logger.log(`Watched Files Verbose`, "log")
						break

					case "w":
						payload = JSON.stringify(this.formatWatchedFiles(), null, 2)
						this.logger.log(`Watched Files`, "log")
						break

					case "c":
						payload = null
						this.logger.ClearScreen()
						this.ReadyLog()
						break

					case "t":
						this.logger.clearLastLines(6)
						break
				}
			}

			if (this.optionToggle.getValue()) onActive()

			switch (key) {
				case "q":
					payload = null
					this.close()
					break
			}
			if (payload) this.logger.log({ message: payload, br: "after" }, "log")
		}

		this.optionToggle.onChange(() => {
			if (process.stdin.listeners("data").length !== 0) process.stdin.off("data", keyPressEvent)
			process.stdin.on("data", keyPressEvent)
		})
		this.optionToggle.setValue(true)
	}

	private formatWatchedFiles(detailed?: boolean): string[] {
		const watchFiles: string[] = []

		const watched = this.instance.getWatched()
		Object.keys(watched).forEach((key) => {
			if (detailed && Array.isArray(watched[key]))
				watched[key].forEach((item) => {
					watchFiles.push(`${key}/${item}`)
				})
			else watchFiles.push(key)
		})

		return watchFiles
	}

	private close(): void {
		this.instance.close().then(() => {
			this.logger.LineBreak()
			this.logger.WithBackground("Closed", "Sucessfully stopped watching files", "error")

			process.exit(0)
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

			this.logger.WithBackground("Error", `${err.message}. ${origin}`, "error")

			this.close()
			process.exit(0)
		})
	}

	private ReadyLog(): void {
		this.logger.ClearScreen()
		this.logger.WithBackground("Ready", "Now watching for changes", "success", () => {
			setTimeout(() => this.logger.OptionsLogger(), 500)
		})
	}
}

const Watcher = (opts: WatcherConfig): WatcherBase => {
	return new WatcherBase(opts)
}

export default Watcher
