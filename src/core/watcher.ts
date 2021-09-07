import Events from "./events"
import { FILENAME, CreateFile, RemoveFile } from "src/helpers"

import type { WatcherConfig } from "../types"

/**
 * @extends Events
 * Class representing the watcher base
 */
export class WatcherBase extends Events {
	constructor(opts: WatcherConfig) {
		super(opts)
		this.setupExtend()
	}

	/**
	 * @private
	 * A method that runs the @method setup from @class Events and adds more setup code
	 */
	private setupExtend(): void {
		this.handleSigint()
		this.handleError()

		CreateFile(FILENAME)
		this.instance.once("ready", () => {
			this.ReadyLog()
		})

		super
			.setup()
			.then(() => this.logger.WithBackground("Debug", "Sucessfully added event listeners", "debug"))

		//Set Input mode and encoding for stdin
		process.stdin.setRawMode(true)
		process.stdin.setEncoding("utf8")

		const baseKeyPressEvent = (data: Buffer): void => {
			const key = String(data)

			this.logger.WithBackground("Debug", `The Key pressed is ${key}`, "debug")

			switch (key) {
				case "o":
					if (!this.optionToggler.getValue()) {
						this.logger.clearLastLines(2)

						this.optionToggler.setValue(true)
						this.logger.OptionsLogger()
						break
					} else break

				case "\u0003":
					this.close()
					return

				case "q":
					this.close()
					break
			}
		}

		const activeKeypressEvent = (data: Buffer): void => {
			const key = String(data)

			baseKeyPressEvent(data)

			switch (key) {
				case "a": {
					const message = JSON.stringify(this.formatWatchedFiles(true), null, 2)
					this.logger.WithBackground(
						{ message: "Watched Files Verbose", br: "before" },
						message,
						"log"
					)
					break
				}

				case "w": {
					const message = JSON.stringify(this.formatWatchedFiles(), null, 2)
					this.logger.WithBackground({ message: "Watched Files", br: "before" }, message, "log")
					break
				}

				case "c":
					this.logger.ClearScreen()
					this.ReadyLog()
					break

				case "r":
					this.instance.emit("change", this.runChangeEvent.file)
					this.runChangeEvent.isActive = true
					break
			}
		}

		this.optionToggler.onChange((val) => {
			if (val) {
				if (process.stdin.listeners("data").length > 0) process.stdin.off("data", baseKeyPressEvent)
				process.stdin.on("data", activeKeypressEvent)
			} else {
				if (process.stdin.listeners("data").length > 0)
					process.stdin.off("data", activeKeypressEvent)
				process.stdin.on("data", baseKeyPressEvent)
			}
		})
		this.optionToggler.setValue(true)
	}

	/**
	 * @private
	 * A method that formats the watched files
	 */
	private formatWatchedFiles(detailed?: boolean): string[] {
		const watchFiles: string[] = []

		const watched = this.instance.getWatched()
		Object.keys(watched).forEach((_key) => {
			const key = _key.replace(this.root, "") // To `__dirname` up until `this.root`

			if (detailed && Array.isArray(watched[_key]))
				watched[_key].forEach((item) => {
					watchFiles.push(`${key}/${item}`)
				})
			else watchFiles.push(key)
		})

		return watchFiles
	}

	/**
	 * @private
	 * A method that closes the watcher
	 */
	private close(): void {
		this.instance.close().then(() => {
			this.logger.LineBreak()
			this.logger.WithBackground("Closed", "Sucessfully stopped watching files", "error")

			RemoveFile(FILENAME)
			process.exit(0)
		})
	}

	/**
	 * @private
	 * A method that handles the SIGINT event
	 */
	private handleSigint(): void {
		process.on("SIGINT", () => {
			this.close()
		})
	}

	/**
	 * @private
	 * A method that handles the error event
	 */
	private handleError(): void {
		process.on("uncaughtException", (err: Error, origin: string) => {
			this.logger.LineBreak()

			this.logger.WithBackground("Error", `${err.message}. ${origin}`, "error")

			this.close()
			process.exit(1)
		})
	}

	/**
	 * @private
	 * A method that adds logs Ready when watcher is ready to perform actions
	 */
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
