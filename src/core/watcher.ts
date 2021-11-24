import fs from "fs"
import { Package } from "@manypkg/get-packages"

import { Spawner } from "./spawn"
import { WatcherBase } from "./base"
import { convertPath, InterpretFile, WriteFile, FILENAME } from "../helpers"

import type { WatcherConfig, ActionOpts } from "../types"

type getPackageType = {
	currentPkg: string
	packagePath: string
}

/**
 * @abstract @class
 * Class representing all events for the watcher. Can't be instantiated directly.
 */
class WatcherEvents extends WatcherBase {
	private spawner: Spawner // Process Spawner
	private running: boolean // Check if change event is active
	private packages: Package[] // All pacakges in the monorepo package

	constructor(opts: WatcherConfig) {
		super(opts)
		this.setupExtend()

		this.spawner = new Spawner(this.config)
		this.running = false
		this.packages = opts.packages
	}

	/**
	 * @public
	 * Run all in a single method watcher events
	 */
	protected async setupExtend(): Promise<void> {
		super.setup()

		this.onAddEvents()
		this.onChange()
		this.onUnlinkEvents()
	}

	/**
	 * @protected
	 * Adds listeners for 'add' and 'addDir' events
	 */
	protected onAddEvents(): void {
		const events = ["addDir", "add"]

		events.forEach((event) => {
			this.instance.on(event, (filePath) => {
				let action, name

				if (event === "add") {
					action = this.config?.actions?.add
					name = "Add"
				} else {
					action = this.config?.actions?.addDir
					name = "Add Dir"
				}

				const { currentPkg, packagePath } = this.getPackage(filePath)

				/* Remove path from watch list */
				this.instance.add(filePath)

				this.logger.PerformAction(convertPath(this.root, filePath))

				/* Run user function */
				this.runUserFn(name, { currentPkg, filePath, packagePath }, action)
			})
		})
	}

	/**
	 * @protected
	 * Adds listeners for 'unlink' and 'unlinkDir' events
	 */
	protected onUnlinkEvents(): void {
		const events = ["unlinkDir", "unlink"]

		events.forEach((event) => {
			this.instance.on(event, (filePath) => {
				let action, name

				if (event === "unlink") {
					action = this.config?.actions?.unlink
					name = "Remove"
				} else {
					action = this.config?.actions?.unlinkDir
					name = "Remove Dir"
				}

				const { currentPkg, packagePath } = this.getPackage(filePath)

				/* Remove path from watch list */
				this.instance.unwatch(filePath)

				this.logger.PerformAction(convertPath(this.root, filePath))

				/* Run user function */
				this.runUserFn(name, { currentPkg, filePath, packagePath }, action)
			})
		})
	}

	/**
	 * @protected
	 * Adds listeners for 'change' event
	 */
	protected onChange(): void {
		/* Debouce to prevent multiple throttle the amount of time the function is ran */

		this.instance.on("change", (filePath, stats) => {
			if (this.running && this.runChangeEvent.file === filePath) return // Return if multiple events are trying to run at once.
			this.running = true

			this.runChangeEvent.file = filePath //Store last file that was changed.

			stats = stats ?? fs.statSync(filePath)

			/* Read and save `fileSize` to temp disk file */
			if (!this.runChangeEvent.isActive && stats.size === InterpretFile(FILENAME, filePath)) {
				this.logger.ClearScreen()
				this.logger.WithBackground("No Change", "No file recorded on current save", "info", () => {
					setTimeout(
						() => this.logger.OptionsLogger(this.ToggleOptions.value, this.config.autoShowOptions),
						250
					)
				})
				WriteFile(FILENAME, stats.size, filePath)
				this.running = false

				return
			}
			WriteFile(FILENAME, stats.size, filePath)

			const change = this.config?.actions?.change
			const { currentPkg, packagePath } = this.getPackage(filePath)

			this.logger.PerformAction(convertPath(this.root, filePath))

			/* Run user function. Using async lock to prevent running the action multiple times for a single file.*/
			this.runUserFn("Change", { currentPkg, filePath, packagePath, stats }, change)

			if (this.runChangeEvent.isActive) this.runChangeEvent.isActive = false
		})
	}

	/**
	 * @private
	 * @returns { currentPkg: string, packagePath: string}
	 * Returns the current package and the path to the package
	 */
	private getPackage(path: string): getPackageType {
		let currentPkg = ""
		let packagePath = ""
		this.packages.forEach((pkg) => {
			const match = path.includes(pkg.dir)

			if (match) {
				currentPkg = pkg.dir.split("/").pop() as string
				packagePath = pkg.dir
			}
		})

		return { currentPkg, packagePath }
	}

	/**
	 * @private
	 * Runs function / cli command provided by the user.
	 */
	private runUserFn(
		eventName: string,
		options: ActionOpts,
		fn?: (opts: ActionOpts) => Promise<void>
	): void {
		const relativePath = convertPath(this.root, options.filePath)
		this.ToggleOptions.setValue(false)

		/* Async check is done in parser */
		if (fn) {
			this.logger.WithBackground("Debug", "Running action given by the user", "debug")
			fn({ ...options })
				.then(() => {
					this.logger.EndLogger(eventName, relativePath, {
						optionToggler: this.ToggleOptions.value,
						autoOptions: this.config.autoShowOptions,
					})
				})
				.catch((err) => {
					this.logger.LogError(`An error occured while running the action. ${err}`)
				})
				.finally(() => {
					this.ToggleOptions.setValue(() => (this.config.autoShowOptions ? true : false))
					this.running = false
				})
		} else if (this.config?.runScripts.length > 0) {
			this.logger.WithBackground("Debug", "Running command given by user", "debug")

			const cp = this.spawner.Spawn(options)
			this.spawner.PipeStream(cp)
			this.spawner.AddListeners(cp)

			cp.once("close", (code) => {
				if (code === 0)
					this.logger.WithBackground(eventName, relativePath, "success", () => {
						this.running = false
						setTimeout(() => {
							this.logger.OptionsLogger(this.ToggleOptions.value, this.config.autoShowOptions)
							this.ToggleOptions.setValue(() => (this.config.autoShowOptions ? true : false))
						}, 250)
					})
				else this.running = false
			})

			this.spawner.CleanUp()
		}
	}
}

const Watcher = (opts: WatcherConfig): WatcherBase => {
	return new WatcherEvents(opts)
}

export default Watcher
