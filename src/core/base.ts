import chokidar from "chokidar"

import { CreateFile, FILENAME, Logger, LoggerType, Observable, RemoveFile } from "src/helpers"

import type { InternalConfig, WatcherConfig } from "../types"

/**
 * Class representing the watcher base
 */
export abstract class WatcherBase {
	public instance: chokidar.FSWatcher // Chokidar Instance
	public logger: LoggerType
	public config: InternalConfig
	public root: string

	// A helper to run change event on previous file for `r` option. It will also be used to aid `this.running`
	protected runChangeEvent: { file: string; isActive: boolean }
	protected ToggleOptions: Observable<boolean>

	constructor(opts: WatcherConfig) {
		this.instance = chokidar.watch(opts.include, { ...opts.config.options, ignoreInitial: true })
		const { exclude } = opts.config
		if ((Array.isArray(exclude) && exclude.length > 0) || typeof exclude === "string")
			this.instance.unwatch(exclude)

		this.logger = Logger.getInstance()
		this.config = opts.config
		this.root = opts.root

		this.runChangeEvent = { file: "", isActive: false }
		this.ToggleOptions = new Observable<boolean>(false)
	}

	/**
	 * @protected
	 * A method that closes the watcher
	 */
	protected close(): void {
		this.instance.close().then(() => {
			this.logger.LineBreak()
			this.logger.WithBackground("Closed", "Sucessfully stopped watching files", "error")

			RemoveFile(FILENAME)
			process.exit(0)
		})
	}

	/**
	 * @protected
	 * A method that adds logs Ready when watcher is ready to perform actions
	 */
	protected ReadyLog(): void {
		this.logger.ClearScreen()
		this.logger.WithBackground("Ready", "Now watching for changes", "success", () => {
			setTimeout(
				() => this.logger.OptionsLogger(this.ToggleOptions.value, this.config.autoShowOptions),
				500
			)
		})
	}

	/**
	 * @protected
	 * A method that runs the @method setup from @class Events and adds more setup code
	 */
	protected setup(): void {
		//Setup listener for errors.
		process.on("uncaughtException", (err: Error, origin: string) => {
			this.logger.LineBreak()

			this.logger.WithBackground("Error", `${err.message}. ${origin}`, "error")

			this.close()
			process.exit(1)
		})

		CreateFile(FILENAME)
		this.instance.once("ready", () => {
			this.ReadyLog()
		})

		//Set Input mode and encoding for stdin
		process.stdin.setRawMode(true)
		process.stdin.setEncoding("utf8")

		const baseKeyPressEvent = (data: Buffer): void => {
			const key = String(data)

			this.logger.WithBackground("Debug", `'${key}' key(s) is pressed`, "debug")

			if (key === "o" && !this.config.autoShowOptions) {
				if (!this.ToggleOptions.value) {
					this.logger.clearLastLines(2)

					this.ToggleOptions.setValue(true)
					this.logger.OptionsLogger(this.ToggleOptions.value, this.config.autoShowOptions)
				}
			}

			switch (key) {
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
					this.runChangeEvent.isActive = true
					this.instance.emit("change", this.runChangeEvent.file)
					break
			}
		}

		this.ToggleOptions.onChange((val) => {
			if (val) {
				if (process.stdin.listeners("data").length > 0) process.stdin.off("data", baseKeyPressEvent)
				process.stdin.on("data", activeKeypressEvent)
			} else {
				if (process.stdin.listeners("data").length > 0)
					process.stdin.off("data", activeKeypressEvent)
				process.stdin.on("data", baseKeyPressEvent)
			}
		})

		this.ToggleOptions.setValue(true)
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
}
