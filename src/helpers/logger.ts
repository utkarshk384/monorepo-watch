import chalk from "chalk"
import readline from "readline"

import { MODE } from "./consts"

import type {
	ArrowFunc,
	LoggerActions,
	LoggerLevelExtended,
	LoggerTheme,
	LoggerLevel,
} from "../types"

abstract class Primitives {
	public theme: LoggerTheme
	protected stdout: NodeJS.WriteStream
	protected br: string
	protected clr: string

	constructor() {
		this.stdout = process.stdout
		this.br = "\n\n"
		this.clr = "\x1Bc"

		this.theme = {
			text: {
				log: chalk.white,
				success: chalk.green,
				info: chalk.blueBright,
				warning: chalk.yellowBright,
				error: chalk.redBright,
				debug: chalk.magentaBright,
			},
			bg: {
				log: chalk.bgBlack.white,
				success: chalk.bgGreen.black,
				info: chalk.bgBlueBright.black,
				warning: chalk.bgYellowBright.black,
				error: chalk.bgRedBright.black,
				debug: chalk.bgMagentaBright.black,
			},
		}
	}

	public get BR(): string {
		return this.br
	}

	public get CLR(): string {
		return this.clr
	}

	public clearLastLines(count = 1): void {
		readline.moveCursor(process.stdout, 0, -count)
		readline.clearScreenDown(process.stdout)
	}

	public ClearScreen(): void {
		if (MODE !== "debug") this.stdout.write(this.clr)
	}

	public LineBreak(): void {
		this.stdout.write(this.br)
	}

	protected format(params: LoggerActions | string): LoggerActions | string {
		this.setDefaultConfig(params)
		if (typeof params !== "string") {
			/* Bold */

			if (params.pad)
				/* For spacing */
				params.message = `  ${params.message}  `

			/* Clear Screen */
			if (params.clr) this.ClearScreen()

			/* For Line Breaks */
			if (params.br === "before") params.message = this.br + params.message
			else if (params.br === "after") params.message = params.message + this.br
			else if (params.br === "both") params.message = this.br + params.message + this.br
		}
		return params
	}

	protected setDefaultConfig(params: LoggerActions | string): LoggerActions | string {
		if (typeof params !== "string") {
			if (typeof params.pad === "undefined") params.pad = false
			if (typeof params.bg === "undefined") params.bg = false
		}

		return params
	}

	protected resolveStyles(theme: chalk.Chalk, params?: Partial<LoggerActions>): chalk.Chalk {
		if (params?.bold) theme = theme.bold
		else if (params?.italic) theme = theme.italic
		else if (params?.visible) theme = theme.visible
		else if (params?.hidden) theme = theme.hidden
		else if (params?.dim) theme = theme.dim

		return theme
	}

	protected resolveTheme(level: LoggerLevelExtended): chalk.Chalk {
		switch (level) {
			case "log":
				return this.theme.text.log
			case "success":
				return this.theme.text.success
			case "info":
				return this.theme.text.info
			case "warn":
				return this.theme.text.warning
			case "error":
				return this.theme.text.error
			case "debug":
				return this.theme.text.error

			case "log.bg":
				return this.theme.bg.log
			case "success.bg":
				return this.theme.bg.success
			case "info.bg":
				return this.theme.bg.info
			case "warn.bg":
				return this.theme.bg.warning
			case "error.bg":
				return this.theme.bg.error
			case "debug.bg":
				return this.theme.bg.error
		}
	}
}

abstract class LoggerBase extends Primitives {
	constructor() {
		super()
		this.setEnvVar()
	}

	private setEnvVar(): void {
		const env = process.env
		const supportsColor = chalk.supportsColor

		if (!supportsColor) {
			env.FORCE_COLOR = "0"
			this.log("Warning", "warn")
			this.log("- Your terminal doesn't support colors", "log")
		} else if (supportsColor.hasBasic) env.FORCE_COLOR = "1"
		else if (supportsColor.has256) env.FORCE_COLOR = "2"
		else if (supportsColor.has16m) env.FORCE_COLOR = "3"

		this.log({ message: `Color Level- ${env.FORCE_COLOR}`, br: "after" }, "debug")

		process.env = env
	}

	public Raw(params: Omit<LoggerActions, "message">, level: LoggerLevelExtended): chalk.Chalk {
		let theme = this.resolveTheme(level)
		theme = this.resolveStyles(theme, params)

		return theme
	}

	public log(params: LoggerActions | string, level: LoggerLevelExtended): void {
		if (["debug", "debug.bg"].includes(level) && MODE !== "debug") return

		let theme = this.resolveTheme(level)
		params = this.format(params)

		if (typeof params !== "string") {
			theme = this.resolveStyles(theme, params)
			this.stdout.write(theme(params.message))
			return
		}
		this.stdout.write(theme(params))
	}

	public GroupLogs(cb: ArrowFunc): Promise<void> {
		return new Promise((resolve) => {
			resolve(cb())
		})
	}

	public asyncGroupLogs(cb: ArrowFunc): Promise<void> {
		return new Promise((resolve) => {
			resolve(cb())
		})
	}

	public async asyncLog(params: LoggerActions | string, level: LoggerLevelExtended): Promise<void> {
		return new Promise((resolve) => {
			resolve(this.log(params, level))
		})
	}
}

export type LoggerType = LoggerWrapper

class LoggerWrapper extends LoggerBase {
	private static _instance: LoggerWrapper

	private constructor() {
		super()
	}

	public static getInstance(): LoggerWrapper {
		if (!LoggerWrapper._instance) {
			LoggerWrapper._instance = new LoggerWrapper()
		}
		return LoggerWrapper._instance
	}

	public WithBackground(
		primary: string | LoggerActions,
		secondary: string | LoggerActions,
		level: LoggerLevel,
		asyncFunc?: ArrowFunc
	): void | ArrowFunc {
		if (level === "debug" && MODE !== "debug") return

		const execLogs: ArrowFunc = () => {
			const primaryMsg =
				typeof primary === "string" ? { message: primary, pad: true } : { ...primary, pad: true }
			const secondaryMsg =
				typeof secondary === "string"
					? ({ message: ` - ${secondary}`, br: "after" } as LoggerActions)
					: secondary

			this.log(primaryMsg, `${level}.bg`)
			this.log(secondaryMsg, "log")
		}

		if (typeof asyncFunc === "function") {
			this.asyncGroupLogs(() => execLogs()).then(() => {
				asyncFunc()
			})
			return execLogs
		}

		execLogs()
		return execLogs
	}

	public OptionsLogger(optionToggler: boolean, autoOptions?: boolean): void {
		if (!optionToggler && !autoOptions)
			this.log({ message: "o - show options", br: "after", dim: true }, "log")
		else {
			this.log({ message: "Options", pad: true, br: "after" }, "log")
			this.log({ message: "a - Get Verbose watch list\tw - Get watched Files", br: "after" }, "log")
			this.log({ message: "c - Clear the screen\t\tq - Stop and quit", br: "after" }, "log")
			this.log("r - Run change event on last file\n", "log")
		}
	}

	public PerformAction(path: string): void {
		this.log({ message: "Performing Action", clr: true, br: "after" }, "log")
		this.WithBackground("File Changed", `${path}`, "info")
	}

	public LogError(message: string): void {
		this.WithBackground({ message: "Error", br: "before" }, message, "error")
		process.exit(1)
	}

	public EndLogger(
		eventName: string,
		Path: string,
		opts: { optionToggler: boolean; autoOptions: boolean }
	): void {
		this.WithBackground(eventName, `${Path}`, "success", () => {
			setTimeout(() => this.OptionsLogger(opts.optionToggler, opts.autoOptions), 250)
		})
	}
}

export { LoggerWrapper as Logger }
