import chokidar from "chokidar"
import AsyncLock from "async-lock"
import debounce from "lodash.debounce"
import { performance } from "perf_hooks"
import { Package } from "@manypkg/get-packages"

import { Spawner } from "./spawn"
import { LoggerType, Logger, convertPath, LOCK_NAME, Observable } from "../helpers"

import type { WatcherConfig, ActionOpts, InternalConfig } from "../types"

abstract class Events {
	public instance: chokidar.FSWatcher
	protected root: string
	protected config: InternalConfig
	protected logger: LoggerType
	protected optionToggle: Observable<boolean>
	private spawner: Spawner
	private packages: Package[]
	private lock: AsyncLock

	constructor(opts: WatcherConfig) {
		this.instance = chokidar.watch(opts.include, {
			...opts.config.options,
			ignoreInitial: true,
		})
		this.root = opts.root
		this.config = opts.config
		this.logger = Logger.getInstance()
		this.packages = opts.packages
		this.spawner = new Spawner(this.root, this.config)
		this.lock = new AsyncLock()
		this.optionToggle = new Observable<boolean>(false)
	}

	protected async setup(): Promise<void> {
		this.onAddEvents()
		this.onChange()
		this.onUnlinkEvents()
	}

	protected onAddEvents(): void {
		const events = ["addDir", "add"]

		events.forEach((event) => {
			this.instance.on(event, (filePath) => {
				this.optionToggle.setValue(false)
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
				this.instance.unwatch(filePath)

				this.logger.PerformAction(convertPath(this.root, filePath))

				/* Run user function */
				this.runUserFn(name, { currentPkg, filePath, packagePath }, action)
			})
		})
	}

	protected onUnlinkEvents(): void {
		const events = ["unlinkDir", "unlink"]

		events.forEach((event) => {
			this.instance.on(event, (filePath) => {
				this.optionToggle.setValue(false)

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

	protected onChange(): void {
		const timeout = { min: 2000, max: 3000 }

		/* Debouce to prevent multiple throttle the amount of time the function is ran */
		this.instance.on(
			"change",
			debounce(
				(filePath, stats) => {
					this.optionToggle.setValue(false)

					const change = this.config?.actions?.change
					const { currentPkg, packagePath } = this.getPackage(filePath)

					this.logger.PerformAction(convertPath(this.root, filePath))

					/* Run user function. Using async lock to prevent running the action multiple times for a single file.*/
					this.lock.acquire(LOCK_NAME, () => {
						const timerStart = performance.now()
						this.runUserFn("Change", { currentPkg, filePath, packagePath, stats }, change)
						const timerEnd = performance.now()

						timeout.min = timerEnd - timerStart
						timeout.max = timeout.min + 1000
					})
				},
				timeout.min,
				{ maxWait: timeout.max, leading: true }
			)
		)
	}

	private getPackage(path: string): {
		currentPkg: string
		packagePath: string
	} {
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

	private runUserFn(
		eventName: string,
		options: ActionOpts,
		fn?: (opts: ActionOpts) => Promise<void>
	): void {
		const relativePath = convertPath(this.root, options.filePath)
		/* Async check is done in parser */

		if (fn)
			fn({ ...options })
				.then(() => {
					this.logger.EndLogger(eventName, relativePath)
				})
				.catch((err) => {
					throw err
				})
		else if (this.config?.runScripts.length > 0) {
			const cp = this.spawner.Spawn(options)
			this.spawner.PipeStream(cp)
			this.spawner.AddListeners(cp, eventName, options)
			this.spawner.CleanUp()
		}
	}
}

export default Events
